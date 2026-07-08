import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  GraduationCap,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";

import { useStore, studentTotals, inr, formatYear } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Imperial CMS" },
      { name: "description", content: "Overview of students, fees collected, and pending dues." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const students = useStore((s) => s.students);
  const programs = useStore((s) => s.programs);
  const faculty = useStore((s) => s.faculty);
  const courses = useStore((s) => s.courses);
  const charges = useStore((s) => s.charges);
  const adjustments = useStore((s) => s.adjustments);
  const payments = useStore((s) => s.payments);

  const totals = useMemo(() => {
    let netPayable = 0, totalPaid = 0, balance = 0;
    let studentsWithDues = 0;
    students.forEach((st) => {
      const t = studentTotals(st.id, st.currentSemester, { charges, adjustments, payments });
      netPayable += t.netPayable;
      totalPaid += t.totalPaid;
      balance += t.balance;
      if (t.balance > 0) studentsWithDues++;
    });
    return { netPayable, totalPaid, balance, studentsWithDues };
  }, [students, charges, adjustments, payments]);

  const collectionRate = totals.netPayable
    ? Math.round((totals.totalPaid / totals.netPayable) * 100)
    : 0;

  const recentPayments = [...payments]
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
    .slice(0, 6);

  const pending = useMemo(() => {
    return students
      .map((st) => ({
        st,
        totals: studentTotals(st.id, st.currentSemester, { charges, adjustments, payments }),
      }))
      .filter((r) => r.totals.balance > 0)
      .sort((a, b) => b.totals.balance - a.totals.balance)
      .slice(0, 5);
  }, [students, charges, adjustments, payments]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Welcome back, Registrar's Office
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A snapshot of enrolment, collections and pending dues across all programs.
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
          hint={`${programs.length} programs`}
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
              {pending.map(({ st, totals: t }) => {
                const program = programs.find((p) => p.id === st.programId);
                return (
                  <Link
                    key={st.id}
                    to="/students/$studentId"
                    params={{ studentId: st.id }}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                        {st.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{st.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {program?.name} · {formatYear(st.currentSemester)} · Roll {st.rollNumber || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-semibold text-destructive">{inr(t.balance)}</p>
                      <p className="text-xs text-muted-foreground">Paid {inr(t.totalPaid)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent payments</CardTitle>
            <p className="text-xs text-muted-foreground">Last transactions recorded</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentPayments.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">No payments yet.</div>
              )}
              {recentPayments.map((p) => {
                const st = students.find((s) => s.id === p.studentId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{st?.name ?? "Unknown"}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {formatYear(p.semester)} · {p.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">{inr(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniCard icon={<Users className="h-4 w-4" />} label="Faculty" value={faculty.length} to="/faculty" />
        <MiniCard icon={<BookOpen className="h-4 w-4" />} label="Courses" value={courses.length} to="/courses" />
        <MiniCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Programs offered"
          value={programs.length}
          to="/students"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs uppercase tracking-widest">{label}</span>
          <span className="rounded-md bg-secondary p-1.5 text-secondary-foreground">{icon}</span>
        </div>
        <p className={`mt-3 font-display text-2xl font-semibold ${toneClass}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function MiniCard({
  icon, label, value, to,
}: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">{icon}</span>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
      <Badge variant="secondary" className="opacity-0 transition-opacity group-hover:opacity-100">
        Open
      </Badge>
    </Link>
  );
}
