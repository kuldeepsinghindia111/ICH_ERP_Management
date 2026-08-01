import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ScrollText,
  CheckCircle2,
  Wallet,
  CreditCard,
  BarChart3,
  Users,
  FileText,
  ShieldCheck,
  Settings,
  Lock,
  ArrowRight,
  Building2,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — Imperial College ERP/CMS" },
      { name: "description", content: "Welcome to Imperial College Hisar ERP/CMS Portal" },
    ],
  }),
  component: WelcomePage,
});

interface PortalModule {
  title: string;
  description: string;
  url: string;
  section: Section;
  icon: any;
}

const MODULES: PortalModule[] = [
  {
    title: "Student Portal",
    description: "Manage student profiles, enrollments, admissions, and academic records.",
    url: "/students",
    section: "students",
    icon: GraduationCap,
  },
  {
    title: "Examinations",
    description: "Schedule exams, view grade sheets, and manage student assessments.",
    url: "/exams",
    section: "exams",
    icon: BookOpen,
  },
  {
    title: "Timetable",
    description: "View and configure class, lecture, and lab timetables.",
    url: "/timetable",
    section: "timetable",
    icon: CalendarCheck,
  },
  {
    title: "Leaves",
    description: "Manage and approve student and faculty leave applications.",
    url: "/leaves",
    section: "leaves",
    icon: ScrollText,
  },
  {
    title: "Library",
    description: "Manage library books, catalog, issues, and returns.",
    url: "/library",
    section: "library",
    icon: BookOpen,
  },
  {
    title: "Attendance",
    description: "Track daily student attendance and class registers.",
    url: "/attendance",
    section: "attendance",
    icon: CheckCircle2,
  },
  {
    title: "Fees Portal",
    description: "Manage student fee structures, invoices, dues, and ledger history.",
    url: "/fees",
    section: "fees",
    icon: Wallet,
  },
  {
    title: "Make Payment",
    description: "Process fee receipts, collections, and issue transaction receipts.",
    url: "/pay",
    section: "payments",
    icon: CreditCard,
  },
  {
    title: "Reports",
    description: "Generate comprehensive academic, fee, and institutional reports.",
    url: "/reports",
    section: "reports",
    icon: BarChart3,
  },
  {
    title: "Faculty Portal",
    description: "Manage faculty directories, qualifications, and department assignments.",
    url: "/faculty",
    section: "faculty",
    icon: Users,
  },
  {
    title: "Payroll & Salary",
    description: "Manage employee salaries, allowances, deductions, and pay slips.",
    url: "/payroll",
    section: "payroll",
    icon: FileText,
  },
  {
    title: "Course Portal",
    description: "Configure academic programs, semesters, courses, and subjects.",
    url: "/courses",
    section: "courses",
    icon: BookOpen,
  },
  {
    title: "Users & Roles",
    description: "Manage user accounts, send invitations, and assign role permissions.",
    url: "/users",
    section: "users",
    icon: ShieldCheck,
  },
  {
    title: "Audit Log",
    description: "Monitor system audit trails and user activity logs.",
    url: "/audit",
    section: "audit",
    icon: ScrollText,
  },
  {
    title: "Payment Settings",
    description: "Configure fee receipt headings, QR codes, and payment settings.",
    url: "/settings",
    section: "settings",
    icon: Settings,
  },
  {
    title: "General Portal Setup",
    description: "Configure sessions, admission portal status, and college profile.",
    url: "/general",
    section: "general",
    icon: Building2,
  },
];

function WelcomePage() {
  const { user, profile, can } = useAuth();

  const adminOnlySections = ["general", "users", "audit", "settings"];
  const authorizedModules = MODULES.filter((m) => {
    if (adminOnlySections.includes(m.section)) return false;
    return can(m.section, "view");
  });
  const displayName = profile?.name || (user?.email && typeof user.email === "string" ? user.email.split("@")[0] : "User");
  const displayRole = profile?.role ? profile.role.replace(/_/g, " ").toUpperCase() : "ACCOUNT ACTIVE";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-6 py-6 sm:py-8">
      {/* Welcome Banner */}
      <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-4 rounded-lg flex items-center justify-center shadow-sm">
        <span className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-center leading-tight">
          Welcome to Imperial College ERP/CMS - ichacc.online Portal
        </span>
      </div>

      {/* User Greeting Card */}
      <Card className="border-border/60 bg-linear-to-r from-background to-muted/20">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Hello, {displayName}!
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Logged in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider border-primary/40 bg-primary/5 text-primary">
              {displayRole}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider border-emerald-500/40 bg-emerald-500/5 text-emerald-600">
              ACTIVE
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Modules Section */}
      {authorizedModules.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">No Permissions Assigned</h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Your account is registered and active, but an Administrator has not yet assigned you permissions to open any portal sections.
              </p>
            </div>
            <div className="pt-3">
              <div className="text-xs text-muted-foreground bg-background/90 border border-amber-500/20 rounded-lg p-4 inline-block max-w-md text-left shadow-xs">
                <p className="font-semibold text-foreground mb-1">What to do next:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Contact your College Administrator.</li>
                  <li>Request them to open <strong>Users &amp; Roles</strong> and assign your permissions.</li>
                  <li>Once granted, refresh this page to view your authorized modules.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
              Your Authorized Portal Modules ({authorizedModules.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {authorizedModules.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.url}
                  to={m.url}
                  className="group block rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
