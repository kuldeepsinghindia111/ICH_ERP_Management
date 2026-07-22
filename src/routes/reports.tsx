import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useState } from "react";
import { CalendarRange, Printer } from "lucide-react";

import {
  useStore, semesterSummary, studentTotals, inr, FEE_HEADS, formatYear,
  type Student, type Program, type FeeCharge, type FeeAdjustment, type FeePayment
} from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Imperial CMS" },
      { name: "description", content: "Filter receipts by date, class, year, month, or session. Export CSV or print." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { can } = useAuth();
  const canExport = can("reports", "edit");
  const paymentInfo = useStore((s) => s.paymentInfo);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*');
      return (data || []).map(s => ({
        ...s,
        programId: s.program_id,
        currentSemester: s.current_semester,
        joinedYear: s.joined_year,
        bloodGroup: s.blood_group,
      })) as Student[];
    }
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('*');
      return (data || []).map(p => ({
        ...p,
        totalSemesters: p.total_semesters,
      })) as Program[];
    }
  });

  const { data: charges = [] } = useQuery({
    queryKey: ['fee_charges'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_charges').select('*');
      return (data || []).map(c => ({
        ...c,
        studentId: c.student_id,
        createdAt: c.created_at,
      })) as FeeCharge[];
    }
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['fee_adjustments'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_adjustments').select('*');
      return (data || []).map(a => ({
        ...a,
        studentId: a.student_id,
        createdAt: a.created_at,
      })) as FeeAdjustment[];
    }
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['fee_payments'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_payments').select('*');
      return (data || []).map(p => ({
        ...p,
        studentId: p.student_id,
        paidAt: p.paid_at,
        voidReason: p.void_reason,
        voidedAt: p.voided_at,
      })) as FeePayment[];
    }
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('sessions').select('*');
      return (data || []).map(s => ({
        ...s,
        startDate: s.start_date,
        endDate: s.end_date,
      }));
    }
  });

  const { data: collegeSettings } = useQuery({
    queryKey: ['collegeSettings'],
    queryFn: async () => {
      const { data } = await supabase.from('college_settings').select('*').single();
      return data;
    }
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee_structures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_structures').select('*');
      if (error) throw error;
      return data;
    }
  });
  
  const activeSessionId = collegeSettings?.active_session_id || "all";

  const [program, setProgram] = useState("all");
  const [sem, setSem] = useState("all");
  const [pendingProgram, setPendingProgram] = useState("all");
  const [pendingSem, setPendingSem] = useState("all");
  const [selectedSessionId, setSessionId] = useState<string | null>(null);
  const sessionId = selectedSessionId !== null ? selectedSessionId : activeSessionId;
  const [month, setMonth] = useState<string>("all"); // 1-12
  const [year, setYear] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const years = useMemo(() => {
    const s = new Set<string>();
    payments.forEach((p) => s.add(String(new Date(p.paidAt).getFullYear())));
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [payments]);

  const filteredReceipts = useMemo(() => {
    const session = sessions.find((s) => s.id === sessionId);
    return payments
      .filter((p) => !p.voided)
      .filter((p) => {
        const st = students.find((s) => s.id === p.studentId);
        if (!st) return false;
        if (program !== "all" && st.programId !== program) return false;
        if (sem !== "all" && p.semester !== Number(sem)) return false;
        const d = new Date(p.paidAt);
        if (session) {
          const dISO = d.toISOString().slice(0, 10);
          if (dISO < session.startDate || dISO > session.endDate) return false;
        }
        if (month !== "all" && (d.getMonth() + 1) !== Number(month)) return false;
        if (year !== "all" && d.getFullYear() !== Number(year)) return false;
        if (from && d.toISOString().slice(0, 10) < from) return false;
        if (to && d.toISOString().slice(0, 10) > to) return false;
        return true;
      })
      .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  }, [payments, students, sessions, sessionId, program, sem, month, year, from, to]);

  const pending = useMemo(() => {
    const rows: { st: (typeof students)[number]; semester: number; balance: number }[] = [];
    students.forEach((st) => {
      if (pendingProgram !== "all" && st.programId !== pendingProgram) return;
      
      const s = st.currentSemester;
      if (pendingSem !== "all" && s !== Number(pendingSem)) return;
      
      const sum = semesterSummary(st.id, s, { charges, adjustments, payments, structures: feeStructures, student: st });
      if (sum.balance > 0) rows.push({ st, semester: s, balance: sum.balance });
    });
    return rows.sort((a, b) => b.balance - a.balance);
  }, [students, charges, adjustments, payments, feeStructures, pendingProgram, pendingSem]);

  const byHead = useMemo(() => {
    const m: Record<string, number> = {};
    charges.forEach((c) => { m[c.head] = (m[c.head] ?? 0) + c.amount; });
    return FEE_HEADS.map((h) => ({ ...h, total: m[h.key] ?? 0 })).filter((x) => x.total > 0);
  }, [charges]);

  const totals = useMemo(() => {
    let billed = 0, paid = 0, balance = 0;
    students.forEach((st) => {
      const t = studentTotals(st.id, st.currentSemester, { charges, adjustments, payments, structures: feeStructures, student: st });
      billed += t.netPayable; paid += t.totalPaid; balance += t.balance;
    });
    return { billed, paid, balance };
  }, [students, charges, adjustments, payments, feeStructures]);

  const receiptsTotal = useMemo(
    () => filteredReceipts.reduce((s, p) => s + p.amount, 0),
    [filteredReceipts],
  );

  const exportCsv = () => {
    const rows = ["Date,Receipt No,Student,Admission,Program,Year,Method,Amount"];
    filteredReceipts.forEach((p) => {
      const st = students.find((s) => s.id === p.studentId);
      const prog = programs.find((pr) => pr.id === st?.programId);
      rows.push([
        new Date(p.paidAt).toLocaleDateString(),
        p.reference ?? "",
        st?.name ?? "",
        st?.admissionNo ?? "",
        prog?.name ?? "",
        formatYear(p.semester),
        p.method,
        p.amount,
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `receipts.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printReceipts = () => {
    const rows = filteredReceipts.map((p) => {
      const st = students.find((s) => s.id === p.studentId);
      const prog = programs.find((pr) => pr.id === st?.programId);
      return `<tr>
        <td>${new Date(p.paidAt).toLocaleDateString()}</td>
        <td style="font-family:monospace">${p.reference ?? ""}</td>
        <td>${st?.name ?? ""}<br/><span style="color:#666;font-size:11px">${st?.admissionNo ?? ""}</span></td>
        <td>${prog?.name ?? ""}</td>
        <td>${formatYear(p.semester)}</td>
        <td style="text-transform:uppercase">${p.method}</td>
        <td style="text-align:right">₹ ${p.amount.toLocaleString("en-IN")}</td>
      </tr>`;
    }).join("");
    const filterLine = [
      program !== "all" && `Program: ${programs.find((pp) => pp.id === program)?.name}`,
      sem !== "all" && `Year: ${formatYear(Number(sem))}`,
      sessions.find((s) => s.id === sessionId) && `Session: ${sessions.find((s) => s.id === sessionId)?.name}`,
      month !== "all" && `Month: ${month}`,
      year !== "all" && `Year: ${year}`,
      from && `From: ${from}`,
      to && `To: ${to}`,
    ].filter(Boolean).join(" · ") || "All receipts";

    const html = `<!doctype html><html><head><title>Receipts report</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}
        .meta{color:#555;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top}
        th{background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555}
        tfoot td{font-weight:600;border-top:2px solid #111;border-bottom:none}
      </style></head><body>
      <h1>${paymentInfo.collegeName} — Receipts report</h1>
      <div class="meta">${filterLine} · Generated ${new Date().toLocaleString()}</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Receipt no</th><th>Student</th><th>Program</th>
          <th>Year</th><th>Method</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;color:#888;padding:24px">No receipts for these filters.</td></tr>`}</tbody>
        <tfoot><tr><td colspan="6" style="text-align:right">Total (${filteredReceipts.length} receipts)</td>
          <td style="text-align:right">₹ ${receiptsTotal.toLocaleString("en-IN")}</td></tr></tfoot>
      </table>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const exportPendingCsv = () => {
    const rows = ["Student,Admission,Program,Class/Program,Balance"];
    pending.forEach((r) => {
      const prog = programs.find((pr) => pr.id === r.st.programId);
      rows.push([
        r.st.name,
        r.st.admissionNo,
        prog?.name ?? "",
        formatYear(r.semester),
        r.balance,
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pending_fees.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printPending = () => {
    const rows = pending.map((r) => {
      const prog = programs.find((pr) => pr.id === r.st.programId);
      return `<tr>
        <td>${r.st.name ?? ""}<br/><span style="color:#666;font-size:11px">${r.st.admissionNo ?? ""}</span></td>
        <td>${prog?.name ?? ""}</td>
        <td>${formatYear(r.semester)}</td>
        <td style="text-align:right">₹ ${r.balance.toLocaleString("en-IN")}</td>
      </tr>`;
    }).join("");
    const filterLine = [
      pendingProgram !== "all" && `Program: ${programs.find((pp) => pp.id === pendingProgram)?.name}`,
      pendingSem !== "all" && `Class/Program: ${formatYear(Number(pendingSem))}`
    ].filter(Boolean).join(" · ") || "All pending fees";

    const totalPendingAmount = pending.reduce((sum, r) => sum + r.balance, 0);

    const html = `<!doctype html><html><head><title>Pending Fees Report</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}
        .meta{color:#555;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top}
        th{background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555}
        tfoot td{font-weight:600;border-top:2px solid #111;border-bottom:none}
      </style></head><body>
      <h1>${paymentInfo.collegeName} — Pending Fees Report</h1>
      <div class="meta">${filterLine} · Generated ${new Date().toLocaleString()}</div>
      <table>
        <thead><tr>
          <th>Student</th><th>Program</th>
          <th>Class/Program</th><th style="text-align:right">Balance</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="4" style="text-align:center;color:#888;padding:24px">No pending dues for these filters.</td></tr>`}</tbody>
        <tfoot><tr><td colspan="3" style="text-align:right">Total (${pending.length} records)</td>
          <td style="text-align:right">₹ ${totalPendingAmount.toLocaleString("en-IN")}</td></tr></tfoot>
      </table>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Reports</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Collections & pending dues</h1>
        <p className="mt-1 text-sm text-muted-foreground">Snapshot of what's been received and what's outstanding. Filter receipts and print.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total billed" value={inr(totals.billed)} />
        <Tile label="Total received" value={inr(totals.paid)} tone="success" />
        <Tile label="Total pending" value={inr(totals.balance)} tone="warning" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <CalendarRange className="h-4 w-4" /> Receipts — filter by date / class / year / month / session
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {filteredReceipts.length} receipts · total {inr(receiptsTotal)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={!canExport || filteredReceipts.length === 0}
                title={!canExport ? "You don't have permission to export reports" : undefined}
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={printReceipts}
                disabled={!canExport || filteredReceipts.length === 0}
                title={!canExport ? "You don't have permission to print receipts" : undefined}
              >
                <Printer className="mr-1 h-4 w-4" /> Print receipts
              </Button>
            </div>
            {!canExport && (
              <p className="text-[11px] text-muted-foreground">Read-only role · export &amp; print disabled</p>
            )}
          </div>

        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Session</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Any (ignore session)</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Class / program</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Year</Label>
              <Select value={sem} onValueChange={setSem}>
                <SelectTrigger className="mt-1 h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {[1,2,3].map((n) => <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">From date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" size="sm"
                onClick={() => { setProgram("all"); setSem("all"); setSessionId(activeSessionId); setMonth("all"); setYear("all"); setFrom(""); setTo(""); }}>
                Reset filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* the actual receipts table (with a switch for sessionId "__none" ignoring session) */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Receipt no</th>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Program</th>
                  <th className="px-4 py-2 font-medium">Sem</th>
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReceipts.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No receipts for these filters.</td></tr>
                )}
                {filteredReceipts.slice(0, 200).map((p) => {
                  const st = students.find((s) => s.id === p.studentId);
                  const prog = programs.find((pr) => pr.id === st?.programId);
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-mono text-xs">{p.reference ?? "—"}</td>
                      <td className="px-4 py-2">
                        <p>{st?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{st?.admissionNo}</p>
                      </td>
                      <td className="px-4 py-2">{prog?.name ?? "—"}</td>
                      <td className="px-4 py-2">{formatYear(p.semester)}</td>
                      <td className="px-4 py-2 uppercase text-xs">{p.method}</td>
                      <td className="px-4 py-2 text-right text-success">{inr(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-lg">Pending fees</CardTitle>
            <p className="text-xs text-muted-foreground">{pending.length} entries with dues.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={pendingProgram} onValueChange={setPendingProgram}>
                <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Class/program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={pendingSem} onValueChange={setPendingSem}>
                <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {[1,2,3].map((n) => <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPendingCsv}
                disabled={!canExport || pending.length === 0}
                title={!canExport ? "You don't have permission to export reports" : undefined}
                className="ml-2"
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={printPending}
                disabled={!canExport || pending.length === 0}
                title={!canExport ? "You don't have permission to print" : undefined}
              >
                <Printer className="mr-1 h-4 w-4" /> Print list
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-4 py-2 font-medium">Class/Program</th>
                  <th className="px-4 py-2 text-right font-medium">Balance</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No pending dues.</td></tr>
                )}
                {pending.map((r) => (
                  <tr key={r.st.id + "-" + r.semester}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{r.st.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {programs.find((p) => p.id === r.st.programId)?.name} · {r.st.admissionNo}
                      </p>
                    </td>
                    <td className="px-4 py-2">{formatYear(r.semester)}</td>
                    <td className="px-4 py-2 text-right"><Badge variant="destructive">{inr(r.balance)}</Badge></td>
                    <td className="px-4 py-2 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/students/$studentId" params={{ studentId: r.st.id }}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Charges by fee head</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byHead.map((h) => (
              <div key={h.key} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <span className="text-sm text-muted-foreground">{h.label}</span>
                <span className="font-display text-lg font-semibold">{inr(h.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
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
