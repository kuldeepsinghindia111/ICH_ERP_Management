import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollText, FileSpreadsheet, Trash2, ShieldAlert, Check, X } from "lucide-react";
import { toast } from "sonner";

import { useStore, type AuditEvent } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StudentAutosuggest } from "@/components/student-autosuggest";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — Imperial CMS" },
      { name: "description", content: "Chronological audit trail of payments, user changes, permission grants and payment settings." },
    ],
  }),
  component: AuditPage,
});

const EVENT_LABEL: Record<AuditEvent, string> = {
  "payment.collected": "Payment collected",
  "payment.voided": "Payment voided",
  "payment.unvoided": "Payment reinstated",
  "settings.updated": "Settings updated",
  "user.created": "User created",
  "user.updated": "User updated",
  "user.removed": "User removed",
  "permissions.updated": "Permissions updated",
};

const EVENT_TONE: Record<AuditEvent, string> = {
  "payment.collected": "bg-success/15 text-success",
  "payment.voided": "bg-destructive/15 text-destructive",
  "payment.unvoided": "bg-warning/15 text-warning",
  "settings.updated": "bg-primary/15 text-primary",
  "user.created": "bg-success/15 text-success",
  "user.updated": "bg-primary/15 text-primary",
  "user.removed": "bg-destructive/15 text-destructive",
  "permissions.updated": "bg-warning/15 text-warning",
};

function AuditPage() {
  const { can, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const canView = can("audit", "view");
  const queryClient = useQueryClient();

  const [event, setEvent] = useState<string>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: async () => { const {data} = await supabase.from("user_roles").select("*"); return data || []; } });
  const PAGE_SIZE = 25;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 180);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, event, userId, studentId]);

  const { data: { logs = [], total = 0 } = {}, isLoading } = useQuery({
    queryKey: ['auditLogs', page, debouncedQ, event, userId, studentId],
    queryFn: async () => {
      let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (event !== "all") query = query.eq('event', event);
      if (userId !== "all") query = query.eq('actor_user_id', userId);
      if (studentId) query = query.eq('student_id', studentId);
      if (debouncedQ) {
        query = query.or(`summary.ilike.%${debouncedQ}%,actor_name.ilike.%${debouncedQ}%,actor_code.ilike.%${debouncedQ}%`);
      }
      
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data, total: count || 0 };
    },
    enabled: canView
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = logs;


  const exportCsv = () => {
    if (rows.length === 0) return toast.error("No audit entries to export");
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const header = ["Timestamp", "User ID", "User", "Role", "Event", "Summary"];
    const lines = rows.map((l) =>
      [
        new Date(l.created_at).toISOString(),
        l.actor_code ?? "",
        l.actor_name ?? l.actor_role,
        l.actor_role,
        EVENT_LABEL[l.event as AuditEvent],
        l.summary,
      ].map(escape).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} entries`);
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-warning" />
        <h1 className="mt-3 font-display text-xl">You don't have access to the audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask an admin to grant "audit" view permission for your account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Compliance</p>
            <h1 className="font-display text-2xl font-semibold text-blue-600 dark:text-blue-400">Audit Log</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Export CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" disabled={!isAdmin || total === 0}>
                <Trash2 className="mr-1 h-4 w-4" /> Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear audit log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all audit entries. Payment records themselves are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async (e) => { 
                  e.preventDefault(); 
                  const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  if (error) toast.error(error.message);
                  else {
                    queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
                    toast.success("Audit log cleared");
                    setPage(1);
                  }
                }}>
                  Clear log
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Activity trail</CardTitle>
          <p className="text-xs text-muted-foreground">
            Every action is logged with the user ID and timestamp. Newest first, kept in-browser (up to 500 events).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Search</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search summary or user…" />
            </div>
            <div>
              <Label className="text-xs">Student</Label>
              <StudentAutosuggest value={studentId} onChange={setStudentId} placeholder="All students" />
            </div>
            <div>
              <Label className="text-xs">User</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} · {u.userCode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Event</Label>
              <Select value={event} onValueChange={setEvent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {(Object.keys(EVENT_LABEL) as AuditEvent[]).map((k) => (
                    <SelectItem key={k} value={k}>{EVENT_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(studentId || userId !== "all" || event !== "all" || q) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{total} matching entries</span>
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => { setStudentId(null); setUserId("all"); setEvent("all"); setQ(""); }}>
                <X className="mr-1 h-3 w-3" /> Clear filters
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-blue-600 dark:bg-blue-700 text-white text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      <Check className="mx-auto mb-2 h-5 w-5 opacity-60" />
                      No audit entries match these filters.
                    </td>
                  </tr>
                )}
                {rows.map((l) => (
                  <tr key={l.id}>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {new Date(l.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary uppercase">
                            {((l.actor_name || l.actor_role) as string).substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{l.actor_name || "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{l.actor_code} · {l.actor_role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant="outline" className={`border-0 ${EVENT_TONE[l.event as AuditEvent] || ""}`}>
                          {EVENT_LABEL[l.event as AuditEvent] || l.event}
                        </Badge>
                      </td>
                    <td className="px-3 py-2 text-sm text-foreground">{l.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <span>Page {page} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
