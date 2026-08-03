import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Loader2, Settings, Pencil, Save, X, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useStore, semesterSummary, studentTotals, inr, formatYear } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LedgerSummaryDialog } from "@/components/ledger-summary-dialog";
import { CollectPaymentDialog } from "@/components/collect-payment-dialog";
import { ReceiptViewerDialog } from "@/components/receipt-viewer-dialog";
import { StudentAutosuggest } from "@/components/student-autosuggest";


export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "Fees — Imperial CMS" },
      { name: "description", content: "Year-wise fee ledger, collections, and pending balances." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const { user, can, profile } = useAuth();
  const showSummarySection = profile?.role === 'admin' || !!profile?.permissions?.fees_complete?.view || !!profile?.permissions?.fees?.view;
  
  const { data: canEditPayments } = useQuery({
    queryKey: ['canEditPayments', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from('user_roles').select('role, permissions').eq('id', user.id).single();
      if (error || !data) return false;
      if (data.role === 'admin') return true;
      return !!data.permissions?.payments?.edit;
    },
    enabled: !!user,
  });

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: true });
      if (error) {
        console.error("Error loading programs:", error);
        return [];
      }
      return data || [];
    }
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Error loading students:", error);
        return [];
      }
      return data || [];
    }
  });
  
  const { data: charges = [], isLoading: loadingCharges } = useQuery({
    queryKey: ['fee_charges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_charges').select('*');
      if (error) {
        console.error("Error loading fee_charges:", error);
        return [];
      }
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), head: d.head, label: d.label, amount: Number(d.amount), createdAt: d.created_at
      }));
    }
  });

  const { data: feeStructures = [], isLoading: loadingStructures } = useQuery({
    queryKey: ['fee_structures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_structures').select('*');
      if (error) {
        console.error("Error loading fee_structures:", error);
        return [];
      }
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, programId: d.program_id, program_id: d.program_id,
        semester: Number(d.semester), amount: Number(d.amount), category: d.category
      }));
    }
  });
  
  const { data: adjustments = [], isLoading: loadingAdjustments } = useQuery({
    queryKey: ['fee_adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_adjustments').select('*');
      if (error) {
        console.error("Error loading fee_adjustments:", error);
        return [];
      }
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), type: d.type, label: d.label, amount: Number(d.amount), createdAt: d.created_at
      }));
    }
  });
  
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['fee_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*');
      if (error) {
        console.error("Error loading fee_payments:", error);
        return [];
      }
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), amount: Number(d.amount), method: d.method, reference: d.reference,
        note: d.note, paidAt: d.paid_at, paid_at: d.paid_at, voided: d.voided,
        voidedAt: d.voided_at, void_reason: d.void_reason, voidReason: d.void_reason
      }));
    }
  });


  const isLoading = loadingPrograms || loadingStudents || loadingCharges || loadingAdjustments || loadingPayments || loadingStructures;

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [program, setProgram] = useState("all");
  const [sem, setSem] = useState("all");
  const [status, setStatus] = useState<"all" | "pending" | "cleared">("all");
  const [pickStudentId, setPickStudentId] = useState<string | null>(null);
  const [includePrevious, setIncludePrevious] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 180);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, program, sem, status, pickStudentId, includePrevious]);

  const rows = useMemo(() => {
    const items: {
      st: any;
      sum: ReturnType<typeof studentTotals>;
    }[] = [];
    
    if (!students.length) return items;
    
    students.forEach((st: any) => {
      if (pickStudentId && st.id !== pickStudentId) return;
      if (program !== "all" && st.program_id !== program) return;
      if (sem !== "all" && String(st.current_semester) !== sem) return;
      if (debouncedQ) {
        const t = debouncedQ.toLowerCase();
        const hit =
          (st.name || "").toLowerCase().includes(t) ||
          (st.admission_no || "").toLowerCase().includes(t);
        if (!hit) return;
      }
      
      const sum = studentTotals(st.id, st.current_semester, { charges, adjustments, payments, structures: feeStructures, student: st }, includePrevious);
      if (status === "pending" && sum.balance <= 0) return;
      if (status === "cleared" && sum.balance > 0) return;
      items.push({ st, sum });
    });
    return items;
  }, [students, debouncedQ, program, sem, status, pickStudentId, charges, adjustments, payments, feeStructures, includePrevious]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => {
    let paid = 0, balance = 0, billed = 0;
    students.forEach((st: any) => {
      const t = studentTotals(st.id, st.current_semester, { charges, adjustments, payments, structures: feeStructures, student: st }, includePrevious);
      billed += t.netPayable; paid += t.totalPaid; balance += t.balance;
    });
    return { billed, paid, balance };
  }, [students, charges, adjustments, payments, feeStructures, includePrevious]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Financials</p>
          <h1 className="font-display text-3xl font-semibold text-blue-600 dark:text-blue-400">Fees Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collect payments and track year-wise dues across concessions, scholarships and fines.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/settings"><Settings className="mr-1 h-4 w-4" /> Settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pay"><ExternalLink className="mr-1 h-4 w-4" /> Open online payment page</Link>
          </Button>
        </div>
      </div>

      {showSummarySection && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile label="Total billed" value={inr(totals.billed)} />
          <SummaryTile label="Collected" value={inr(totals.paid)} tone="success" />
          <SummaryTile label="Pending" value={inr(totals.balance)} tone={totals.balance > 0 ? "warning" : "default"} />
        </div>
      )}

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search student…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <StudentAutosuggest value={pickStudentId} onChange={setPickStudentId} placeholder="Pick a student…" />
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={includePrevious ? "all" : "current"} onValueChange={(v) => setIncludePrevious(v === "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Year</SelectItem>
              <SelectItem value="all">All Years</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={sem} onValueChange={setSem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {[1,2,3].map((n) => <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-270px)] relative">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-40 bg-muted border-b shadow-xs">
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3.5 font-medium text-center min-w-16 sticky left-0 top-0 z-50 bg-muted border-r border-border">S.No.</th>
                  <th className="px-4 py-3.5 font-medium min-w-48 sticky left-16 top-0 z-50 bg-muted border-r border-border shadow-sm">Student</th>
                  <th className="px-4 py-3.5 font-medium min-w-36 whitespace-nowrap">Course</th>
                  <th className="px-4 py-3.5 font-medium min-w-28 whitespace-nowrap">Year</th>
                  <th className="px-4 py-3.5 font-medium min-w-36 whitespace-nowrap">Admission No</th>
                  <th className="px-4 py-3.5 font-medium min-w-36 whitespace-nowrap">Roll No</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-40 whitespace-nowrap">Total Payable Fees</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-32 whitespace-nowrap">Late Fees</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-28 whitespace-nowrap">Fine</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-28 whitespace-nowrap">Other</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-32 whitespace-nowrap">Concession</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-32 whitespace-nowrap">Scholarship</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-44 whitespace-nowrap">Amount Net Payable</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-36 whitespace-nowrap">Amount Paid</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-32 whitespace-nowrap">Balance</th>
                  <th className="px-4 py-3.5 text-right font-medium min-w-44 whitespace-nowrap">Amount Paid Date</th>
                  <th className="px-4 py-3.5 text-left font-medium min-w-48 whitespace-nowrap">Remarks</th>
                  <th className="px-4 py-3.5 min-w-48 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr><td colSpan={18} className="p-8 text-center text-muted-foreground">Nothing to show for these filters.</td></tr>
                )}
                {pageRows.map(({ st, sum }, idx: number) => {
                  const serialNo = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={st.id} className="hover:bg-accent/40 group transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-muted-foreground sticky left-0 z-30 bg-card group-hover:bg-secondary border-r border-border">
                        {serialNo}
                      </td>
                      <td className="px-4 py-3 sticky left-16 z-30 bg-card group-hover:bg-secondary border-r border-border shadow-sm">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{st.name}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{programs.find((p: any) => p.id === st.program_id)?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatYear(st.current_semester)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{st.admission_no || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{st.roll_number || "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{inr(sum.totalCharged)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{sum.totalLate > 0 ? inr(sum.totalLate) : "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{sum.totalFine > 0 ? inr(sum.totalFine) : "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{sum.totalOther > 0 ? inr(sum.totalOther) : "—"}</td>
                      <td className="px-4 py-3 text-right text-warning whitespace-nowrap">{sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</td>
                      <td className="px-4 py-3 text-right text-warning whitespace-nowrap">{sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">{inr(sum.netPayable)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-success whitespace-nowrap">{inr(sum.totalPaid)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {sum.balance > 0
                          ? <Badge variant="destructive">{inr(sum.balance)}</Badge>
                          : <Badge className="bg-success text-success-foreground hover:bg-success/90">Cleared</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground whitespace-nowrap">
                        {sum.payments && sum.payments.length > 0
                          ? Array.from(new Set(sum.payments.map((p: any) => new Date(p.paidAt || p.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })))).join(', ')
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        <InlineRemarkEditor 
                          payments={sum.payments} 
                          canEdit={canEditPayments ?? false} 
                        />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          {canEditPayments && (
                            <CollectPaymentDialog studentId={st.id} semester={st.current_semester} variant="sm" />
                          )}
                          <LedgerSummaryDialog student={st} sum={sum} />
                          <ReceiptViewerDialog student={st} payments={sum.payments || []} programs={programs || []} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
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


function SummaryTile({
  label, value, tone = "default",
}: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InlineRemarkEditor({ payments, canEdit }: { payments: any[], canEdit: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState("");
  const queryClient = useQueryClient();

  const activePayments = payments?.filter((p: any) => p.note) || [];
  const displayRemark = activePayments.length > 0 
    ? Array.from(new Set(activePayments.map((p: any) => p.note))).join(', ')
    : "—";

  const updateMutation = useMutation({
    mutationFn: async ({ note }: { note: string | null }) => {
      if (!payments || payments.length === 0) throw new Error("No payments exist to attach a remark to.");
      const ids = payments.map((p: any) => p.id);
      const { error } = await supabase.from('fee_payments').update({ note }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { note }) => {
      toast.success(note ? "Remark saved" : "Remark deleted");
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input 
          className="h-7 text-xs w-35" 
          value={remark} 
          onChange={(e) => setRemark(e.target.value)} 
          autoFocus
          placeholder="Remark..."
          onKeyDown={(e) => {
            if (e.key === "Enter") updateMutation.mutate({ note: remark || null });
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6 text-success shrink-0 hover:bg-success/10 hover:text-success" onClick={() => updateMutation.mutate({ note: remark || null })}>
          <Save className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsEditing(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group gap-2 min-w-30">
      <span className="max-w-50 whitespace-normal wrap-break-word">
        {displayRemark}
      </span>
      {canEdit && payments?.length > 0 && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" 
            onClick={() => {
              setRemark(displayRemark !== "—" ? displayRemark : "");
              setIsEditing(true);
            }}>
            <Pencil className="h-3 w-3" />
          </Button>
          {displayRemark !== "—" && (
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Are you sure you want to delete this remark?")) {
                  updateMutation.mutate({ note: null });
                }
              }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
