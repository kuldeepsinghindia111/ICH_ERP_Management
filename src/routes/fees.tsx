import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Loader2, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
import { CollectPaymentDialog } from "@/components/collect-payment-dialog";
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
  const { user } = useAuth();
  
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
      if (error) throw error;
      return data;
    }
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
  
  const { data: charges = [], isLoading: loadingCharges } = useQuery({
    queryKey: ['fee_charges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_charges').select('*');
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        head: d.head, label: d.label, amount: d.amount, createdAt: d.created_at
      }));
    }
  });

  const { data: feeStructures = [], isLoading: loadingStructures } = useQuery({
    queryKey: ['fee_structures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_structures').select('*');
      if (error) throw error;
      return data;
    }
  });
  
  const { data: adjustments = [], isLoading: loadingAdjustments } = useQuery({
    queryKey: ['fee_adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_adjustments').select('*');
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        type: d.type, label: d.label, amount: d.amount, createdAt: d.created_at
      }));
    }
  });
  
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['fee_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*');
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        amount: d.amount, method: d.method, reference: d.reference,
        note: d.note, paidAt: d.paid_at, voided: d.voided,
        voidedAt: d.voided_at, voidReason: d.void_reason
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 180);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, program, sem, status, pickStudentId]);

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
      
      const sum = studentTotals(st.id, st.current_semester, { charges, adjustments, payments, structures: feeStructures, student: st });
      if (status === "pending" && sum.balance <= 0) return;
      if (status === "cleared" && sum.balance > 0) return;
      items.push({ st, sum });
    });
    return items;
  }, [students, debouncedQ, program, sem, status, pickStudentId, charges, adjustments, payments, feeStructures]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => {
    let paid = 0, balance = 0, billed = 0;
    students.forEach((st: any) => {
      const t = studentTotals(st.id, st.current_semester, { charges, adjustments, payments, structures: feeStructures, student: st });
      billed += t.netPayable; paid += t.totalPaid; balance += t.balance;
    });
    return { billed, paid, balance };
  }, [students, charges, adjustments, payments, feeStructures]);

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
          <h1 className="font-display text-3xl font-semibold text-foreground">Fees Management</h1>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile label="Total billed" value={inr(totals.billed)} />
        <SummaryTile label="Collected" value={inr(totals.paid)} tone="success" />
        <SummaryTile label="Pending" value={inr(totals.balance)} tone={totals.balance > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <div className="grid grid-cols-2 gap-2">
            <Select value={sem} onValueChange={setSem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>)}
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class Year</th>
                  <th className="px-4 py-3 text-right font-medium">Total Fees</th>
                  <th className="px-4 py-3 text-right font-medium">Concession</th>
                  <th className="px-4 py-3 text-right font-medium">Scholarship</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                  <th className="px-4 py-3 text-right font-medium">Paid</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Nothing to show for these filters.</td></tr>
                )}
                {pageRows.map(({ st, sum }) => (
                  <tr key={st.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{st.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {programs.find((p: any) => p.id === st.program_id)?.name} · Roll {(st.rolls && st.rolls[st.current_semester]) || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatYear(st.current_semester)}</td>
                    <td className="px-4 py-3 text-right">{inr(sum.totalCharged)}</td>
                    <td className="px-4 py-3 text-right text-warning">{sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</td>
                    <td className="px-4 py-3 text-right text-warning">{sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(sum.netPayable)}</td>
                    <td className="px-4 py-3 text-right text-success">{inr(sum.totalPaid)}</td>
                    <td className="px-4 py-3 text-right">
                      {sum.balance > 0
                        ? <Badge variant="destructive">{inr(sum.balance)}</Badge>
                        : <Badge className="bg-success text-success-foreground hover:bg-success/90">Cleared</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {sum.balance > 0 && canEditPayments && (
                          <CollectPaymentDialog studentId={st.id} semester={st.current_semester} variant="sm" />
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link to="/students/$studentId" params={{ studentId: st.id }}>Ledger</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
