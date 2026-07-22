import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  GraduationCap,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { inr } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      return data;
    }
  });

  const { data: feeAdjustments = [] } = useQuery({
    queryKey: ['fee_adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_adjustments').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ['fee_payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*');
      if (error) throw error;
      return data;
    }
  });

  const isLoading = loadingStudents;

  const { pending, totals } = useMemo(() => {
    let netPayableAll = 0, totalPaidAll = 0, balanceAll = 0;
    let studentsWithDues = 0;
    
    const pendingList: any[] = [];

    students.forEach((st) => {
      const stId = st.id;
      const currentSem = st.current_semester || 1;
      
      let stNetPayable = 0;
      let stTotalPaid = 0;
      let stBalance = 0;

      // Only calculate for the current session/semester
      const s = currentSem;
      const charges = feeCharges.filter(c => c.student_id === stId && c.semester === s);
      const adjustments = feeAdjustments.filter(a => a.student_id === stId && a.semester === s);
      const payments = feePayments.filter(p => p.student_id === stId && p.semester === s);
      
      let prescribedFee = 0;
      const structs = feeStructures.filter(fs => fs.program_id === st.program_id && fs.semester === s);
      prescribedFee = structs.reduce((sum, fs) => sum + Number(fs.amount), 0);
      
      const manualCharges = charges.reduce((sum, c) => sum + Number(c.amount), 0);
      const totalCharged = prescribedFee + manualCharges;
      
      const totalConcession = adjustments.filter(a => a.type === "concession").reduce((sum, a) => sum + Number(a.amount), 0);
      const totalScholarship = adjustments.filter(a => a.type === "scholarship").reduce((sum, a) => sum + Number(a.amount), 0);
      const totalAdjustment = totalConcession + totalScholarship;
      
      const netPayable = totalCharged - totalAdjustment;
      const totalPaid = payments.filter(p => !p.voided).reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = netPayable - totalPaid;
      
      stNetPayable = netPayable;
      stTotalPaid = totalPaid;
      stBalance = balance;

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
    });

    pendingList.sort((a, b) => b.balance - a.balance);
    const topPending = pendingList.slice(0, 5);

    return {
      totals: { netPayable: netPayableAll, totalPaid: totalPaidAll, balance: balanceAll, studentsWithDues },
      pending: topPending
    };
  }, [students, feeCharges, feeAdjustments, feePayments, feeStructures]);

  const collectionRate = totals.netPayable
    ? Math.round((totals.totalPaid / totals.netPayable) * 100)
    : 0;

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">
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

      <div className="grid gap-6 lg:grid-cols-3">
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
