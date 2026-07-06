import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  BarChart3,
  Users,
  BookOpen,
  Building2,
  CreditCard,
  Settings,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { type Section } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";

const nav: { title: string; url: string; icon: typeof LayoutDashboard; section?: Section }[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: GraduationCap, section: "students" },
  { title: "Fees", url: "/fees", icon: Wallet, section: "fees" },
  { title: "Make Payment", url: "/pay", icon: CreditCard, section: "payments" },
  { title: "Reports", url: "/reports", icon: BarChart3, section: "reports" },
];

const admin: { title: string; url: string; icon: typeof Users; section: Section }[] = [
  { title: "Faculty", url: "/faculty", icon: Users, section: "faculty" },
  { title: "Courses", url: "/courses", icon: BookOpen, section: "courses" },
  { title: "Users & Roles", url: "/users", icon: ShieldCheck, section: "users" },
  { title: "Audit Log", url: "/audit", icon: ScrollText, section: "audit" },
  { title: "Payment Settings", url: "/settings", icon: Settings, section: "settings" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { can, profile } = useAuth();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  const visibleNav = nav.filter((n) => !n.section || can(n.section, "view"));
  const visibleAdmin = admin.filter((n) => can(n.section, "view"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold text-sidebar-foreground">
              Imperial College Hisar
            </span>
            <span className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">
              Management Suite
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-[11px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Signed in as <span className="text-sidebar-foreground">{profile?.name ?? "—"}</span>
          <span className="ml-1 capitalize">({profile?.role})</span>
          {/* <div className="mt-0.5 font-mono text-[10px]">{profile?.userCode}</div> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
