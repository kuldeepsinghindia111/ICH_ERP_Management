import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";

import { useStore, semesterSummary, studentTotals, inr } from "@/lib/store";
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
      { title: "Fees — Northfield CMS" },
      { name: "description", content: "Semester-wise fee ledger, collections, and pending balances." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const students = useStore((s) => s.students);
  const programs = useStore((s) => s.programs);
  const charges = useStore((s) => s.charges);
  const adjustments = useStore((s) => s.adjustments);
  const payments = useStore((s) => s.payments);
  const canEditPayments = useStore((s) => s.can("payments", "edit"));

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
      st: (typeof students)[number];
      semester: number;
      sum: ReturnType<typeof semesterSummary>;
    }[] = [];
    students.forEach((st) => {
      if (pickStudentId && st.id !== pickStudentId) return;
      if (program !== "all" && st.programId !== program) return;
      if (debouncedQ) {
        const t = debouncedQ.toLowerCase();
        const hit =
          st.name.toLowerCase().includes(t) ||
          st.admissionNo.toLowerCase().includes(t);
        if (!hit) return;
      }
      const semesters = sem === "all" ? Array.from({ length: st.currentSemester }, (_, i) => i + 1) : [Number(sem)];
      semesters.forEach((s) => {
        if (s > st.currentSemester) return;
        const sum = semesterSummary(st.id, s, { charges, adjustments, payments });
        if (status === "pending" && sum.balance <= 0) return;
        if (status === "cleared" && sum.balance > 0) return;
        items.push({ st, semester: s, sum });
      });
    });
    return items;
  }, [students, debouncedQ, program, sem, status, pickStudentId, charges, adjustments, payments]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const totals = useMemo(() => {
    let paid = 0, balance = 0, billed = 0;
    students.forEach((st) => {
      const t = studentTotals(st.id, st.currentSemester, { charges, adjustments, payments });
      billed += t.netPayable; paid += t.totalPaid; balance += t.balance;
    });
    return { billed, paid, balance };
  }, [students, charges, adjustments, payments]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Fees management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collect payments and track semester-wise dues across concessions, scholarships and fines.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/pay"><ExternalLink className="mr-1 h-4 w-4" /> Open online payment page</Link>
        </Button>
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
              {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={sem} onValueChange={setSem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sem</SelectItem>
                {[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>)}
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
                  <th className="px-4 py-3 font-medium">Sem</th>
                  <th className="px-4 py-3 text-right font-medium">Charged</th>
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
                {pageRows.map(({ st, semester, sum }) => (
                  <tr key={st.id + "-" + semester} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{st.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {programs.find((p) => p.id === st.programId)?.name} · Roll {st.rolls[semester] || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">Sem {semester}</td>
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
                          <CollectPaymentDialog studentId={st.id} semester={semester} variant="sm" />
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
