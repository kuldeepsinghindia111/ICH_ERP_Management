import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  GraduationCap,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { inr, semesterSummary } from "@/lib/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Imperial CMS" },
      { name: "description", content: "Overview of students, fees collected, and pending dues." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [showYearWise, setShowYearWise] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
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

  const { data: feeCharges = [] } = useQuery({
    queryKey: ['fee_charges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_charges').select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), head: d.head, label: d.label, amount: Number(d.amount), createdAt: d.created_at
      }));
    }
  });

  const { data: feeAdjustments = [] } = useQuery({
    queryKey: ['fee_adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_adjustments').select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), type: d.type, label: d.label, amount: Number(d.amount), createdAt: d.created_at
      }));
    }
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ['fee_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id, studentId: d.student_id, student_id: d.student_id,
        semester: Number(d.semester), amount: Number(d.amount), method: d.method, reference: d.reference,
        note: d.note, paidAt: d.paid_at, paid_at: d.paid_at, voided: d.voided,
        voidedAt: d.voided_at, void_reason: d.void_reason, voidReason: d.void_reason
      }));
    }
  });

  const isLoading = loadingStudents;

  const { pending, totals, year1Totals, year2Totals, year3Totals } = useMemo(() => {
    let netPayableAll = 0, totalPaidAll = 0, balanceAll = 0;
    let studentsWithDues = 0;
    
    let y1NetPayable = 0, y1TotalPaid = 0, y1Balance = 0;
    let y1StudentsWithDues = 0;

    let y2NetPayable = 0, y2TotalPaid = 0, y2Balance = 0;
    let y2StudentsWithDues = 0;

    let y3NetPayable = 0, y3TotalPaid = 0, y3Balance = 0;
    let y3StudentsWithDues = 0;
    
    const pendingList: any[] = [];

    students.forEach((st) => {
      const stId = st.id;
      const currentSem = st.current_semester || 1;
      
      const sum = semesterSummary(stId, currentSem, {
        charges: feeCharges,
        adjustments: feeAdjustments,
        payments: feePayments,
        structures: feeStructures,
        student: st
      });

      const stNetPayable = sum.netPayable;
      const stTotalPaid = sum.totalPaid;
      const stBalance = sum.balance;

      netPayableAll += stNetPayable;
      totalPaidAll += stTotalPaid;
      balanceAll += stBalance;

      if (stBalance > 0) {
        studentsWithDues++;
        pendingList.push({
          student: st,
          balance: stBalance,
          netPayable: stNetPayable
        });
      }

      if (currentSem === 1) {
        y1NetPayable += stNetPayable;
        y1TotalPaid += stTotalPaid;
        y1Balance += stBalance;
        if (stBalance > 0) y1StudentsWithDues++;
      } else if (currentSem === 2) {
        y2NetPayable += stNetPayable;
        y2TotalPaid += stTotalPaid;
        y2Balance += stBalance;
        if (stBalance > 0) y2StudentsWithDues++;
      } else if (currentSem === 3) {
        y3NetPayable += stNetPayable;
        y3TotalPaid += stTotalPaid;
        y3Balance += stBalance;
        if (stBalance > 0) y3StudentsWithDues++;
      }
    });


    pendingList.sort((a, b) => b.balance - a.balance);
    const topPending = pendingList.slice(0, 5);

    return {
      totals: { netPayable: netPayableAll, totalPaid: totalPaidAll, balance: balanceAll, studentsWithDues },
      year1Totals: { netPayable: y1NetPayable, totalPaid: y1TotalPaid, balance: y1Balance, studentsWithDues: y1StudentsWithDues },
      year2Totals: { netPayable: y2NetPayable, totalPaid: y2TotalPaid, balance: y2Balance, studentsWithDues: y2StudentsWithDues },
      year3Totals: { netPayable: y3NetPayable, totalPaid: y3TotalPaid, balance: y3Balance, studentsWithDues: y3StudentsWithDues },
      pending: topPending
    };
  }, [students, feeCharges, feeAdjustments, feePayments, feeStructures]);

  const collectionRate = totals.netPayable
    ? Math.round((totals.totalPaid / totals.netPayable) * 100)
    : 0;

  const y1CollectionRate = year1Totals.netPayable
    ? Math.round((year1Totals.totalPaid / year1Totals.netPayable) * 100)
    : 0;

  const y2CollectionRate = year2Totals.netPayable
    ? Math.round((year2Totals.totalPaid / year2Totals.netPayable) * 100)
    : 0;

  const y3CollectionRate = year3Totals.netPayable
    ? Math.round((year3Totals.totalPaid / year3Totals.netPayable) * 100)
    : 0;

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400">
            Welcome back, Registrar's Office
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A snapshot of enrolment, collections and pending dues across all courses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/students">Manage students</Link></Button>
          <Button asChild><Link to="/fees">Collect fees</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Active students"
          value={students.filter((s) => s.status === "active").length.toString()}
          hint={`${programs.length} courses`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Fees received"
          value={inr(totals.totalPaid)}
          hint={`${collectionRate}% collection rate`}
          tone="success"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Outstanding dues"
          value={inr(totals.balance)}
          hint={`${totals.studentsWithDues} students pending`}
          tone={totals.balance > 0 ? "warning" : "default"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Net billed"
          value={inr(totals.netPayable)}
          hint="After concessions & scholarships"
        />
      </div>

      <div className="mt-8 mb-6 flex items-center justify-between border-t pt-8">
        <div>
          <h2 className="font-display text-xl font-medium">Year-wise Breakdown</h2>
          <p className="text-sm text-muted-foreground mt-1">Toggle to view detailed snapshots for each academic year.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{showYearWise ? 'Hide details' : 'Show details'}</span>
          <Switch checked={showYearWise} onCheckedChange={setShowYearWise} />
        </div>
      </div>

      {showYearWise && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <h3 className="font-display text-sm font-medium mb-3 text-muted-foreground tracking-wider uppercase">1st Year</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStatCard
                icon={<GraduationCap className="h-4 w-4" />}
                label="1st Year Active"
                value={students.filter((s) => s.status === "active" && (s.current_semester === 1)).length.toString()}
                hint="Students in 1st Year"
              />
              <MiniStatCard
                icon={<Wallet className="h-4 w-4" />}
                label="1st Year Received"
                value={inr(year1Totals.totalPaid)}
                hint={`${y1CollectionRate}% collection rate`}
                tone="success"
              />
              <MiniStatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="1st Year Dues"
                value={inr(year1Totals.balance)}
                hint={`${year1Totals.studentsWithDues} students pending`}
                tone={year1Totals.balance > 0 ? "warning" : "default"}
              />
              <MiniStatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="1st Year Billed"
                value={inr(year1Totals.netPayable)}
                hint="After concessions & scholarships"
              />
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-medium mb-3 text-muted-foreground tracking-wider uppercase">2nd Year</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStatCard
                icon={<GraduationCap className="h-4 w-4" />}
                label="2nd Year Active"
                value={students.filter((s) => s.status === "active" && (s.current_semester === 2)).length.toString()}
                hint="Students in 2nd Year"
              />
              <MiniStatCard
                icon={<Wallet className="h-4 w-4" />}
                label="2nd Year Received"
                value={inr(year2Totals.totalPaid)}
                hint={`${y2CollectionRate}% collection rate`}
                tone="success"
              />
              <MiniStatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="2nd Year Dues"
                value={inr(year2Totals.balance)}
                hint={`${year2Totals.studentsWithDues} students pending`}
                tone={year2Totals.balance > 0 ? "warning" : "default"}
              />
              <MiniStatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="2nd Year Billed"
                value={inr(year2Totals.netPayable)}
                hint="After concessions & scholarships"
              />
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-medium mb-3 text-muted-foreground tracking-wider uppercase">3rd Year</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStatCard
                icon={<GraduationCap className="h-4 w-4" />}
                label="3rd Year Active"
                value={students.filter((s) => s.status === "active" && (s.current_semester === 3)).length.toString()}
                hint="Students in 3rd Year"
              />
              <MiniStatCard
                icon={<Wallet className="h-4 w-4" />}
                label="3rd Year Received"
                value={inr(year3Totals.totalPaid)}
                hint={`${y3CollectionRate}% collection rate`}
                tone="success"
              />
              <MiniStatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="3rd Year Dues"
                value={inr(year3Totals.balance)}
                hint={`${year3Totals.studentsWithDues} students pending`}
                tone={year3Totals.balance > 0 ? "warning" : "default"}
              />
              <MiniStatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="3rd Year Billed"
                value={inr(year3Totals.netPayable)}
                hint="After concessions & scholarships"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-display text-lg">Top pending dues</CardTitle>
              <p className="text-xs text-muted-foreground">Students with the highest outstanding balance</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reports" className="gap-1">See all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pending.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">All students are fully paid.</div>
              )}
              {pending.map(({ student, balance }) => {
                const program = programs.find((p) => p.id === student.program_id);
                return (
                  <Link
                    key={student.id}
                    to="/students/$studentId"
                    params={{ studentId: student.id }}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt="" className="h-10 w-10 rounded-full object-cover border" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {student.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {program?.name} • Sem {student.current_semester}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">{inr(balance)}</p>
                      <p className="text-xs text-muted-foreground">due</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const colors = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };
  const iconColors = {
    default: "text-muted-foreground",
    success: "text-emerald-500",
    warning: "text-amber-500",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={iconColors[tone]}>{icon}</div>
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold font-display tracking-tight ${colors[tone]}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const colors = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };
  const iconColors = {
    default: "text-muted-foreground",
    success: "text-emerald-500",
    warning: "text-amber-500",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className={iconColors[tone]}>{icon}</div>
        </div>
        <div className="mt-2">
          <p className={`text-xl font-bold font-display tracking-tight ${colors[tone]}`}>{value}</p>
          {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
