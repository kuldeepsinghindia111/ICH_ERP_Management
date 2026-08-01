import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useStore, type UserRole, type Section } from "@/lib/store";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, CalendarRange } from "lucide-react";
import { AuthProvider, useAuth } from "../hooks/use-auth";
import { useLocation } from "@tanstack/react-router";
import { SplashScreen } from "@/components/splash-screen";
import { SupabaseStatus } from "@/components/supabase-status";
import { useState } from "react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or go home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Imperial CMS — College Portal System" },
      {
        name: "description",
        content:
          "Manage students, semester-wise rolls, semester fees, concessions, scholarships, and pending dues from one clean academic dashboard.",
      },
      { property: "og:title", content: "Imperial CMS — College Portal System" },
      {
        property: "og:description",
        content: "Students, semester rolls, and semester-wise fees portal in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "apple-mobile-web-app-title", content: "Imperial CMS" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=imperial-3" },
      { rel: "shortcut icon", href: "/favicon.ico?v=imperial-3" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png?v=imperial-3" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png?v=imperial-3" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=imperial-3" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png?v=imperial-3" },
      { rel: "icon", type: "image/avif", href: "/imperial-logo.avif?v=imperial-3" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=imperial-3" },
      { rel: "apple-touch-icon-precomposed", sizes: "180x180", href: "/apple-touch-icon-precomposed.png?v=imperial-3" },
      { rel: "manifest", href: "/site.webmanifest?v=imperial-3" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=imperial-3" />
        <link rel="shortcut icon" href="/favicon.ico?v=imperial-3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png?v=imperial-3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png?v=imperial-3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=imperial-3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=imperial-3" />
        <link rel="icon" type="image/avif" href="/imperial-logo.avif?v=imperial-3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=imperial-3" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png?v=imperial-3" />
        <link rel="manifest" href="/site.webmanifest?v=imperial-3" />
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.location.hash.includes('type=recovery') || window.location.hash.includes('type=invite')) {
            window.location.replace('/update-password' + window.location.hash);
          }
        `}} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 sm:gap-3 border-b border-border bg-background/80 px-2 sm:px-4 backdrop-blur">
                <SidebarTrigger />
                <div className="h-6 w-px bg-border" />
                <div className="flex flex-col leading-tight min-w-0 max-w-36 sm:max-w-56 lg:max-w-none">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    <span className="md:hidden">ERP / CMS</span>
                    <span className="hidden md:inline">Active session</span>
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                    <span className="md:hidden">Imperial College Hisar Portal</span>
                    <span className="hidden md:inline">Administration Console</span>
                  </span>
                </div>
                <SessionSwitcher />
                <div className="ml-auto flex items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground">
                  <SupabaseStatus />
                  <UserProfile />
                </div>
              </header>
              <div className="flex-1">
                <Outlet />
              </div>
            </SidebarInset>
            <Toaster richColors position="top-right" />
          </SidebarProvider>
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function getRequiredSection(pathname: string): Section | null {
  if (pathname.startsWith('/students')) return 'students';
  if (pathname.startsWith('/exams')) return 'students';
  if (pathname.startsWith('/timetable')) return 'students';
  if (pathname.startsWith('/leaves')) return 'students';
  if (pathname.startsWith('/library')) return 'students';
  if (pathname.startsWith('/attendance')) return 'students';
  if (pathname.startsWith('/fees')) return 'fees';
  if (pathname.startsWith('/pay')) return 'payments';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/faculty')) return 'faculty';
  if (pathname.startsWith('/payroll')) return 'faculty';
  if (pathname.startsWith('/courses')) return 'courses';
  if (pathname.startsWith('/users')) return 'users';
  if (pathname.startsWith('/audit')) return 'audit';
  if (pathname.startsWith('/settings')) return 'settings';
  return null;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, can } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // 1. If completely logged out, force to login
      if (!user && location.pathname !== '/login' && location.pathname !== '/update-password') {
        router.navigate({ to: '/login', replace: true });
      } 
      // 2. If logged in but on login page, send to dashboard
      else if (user && location.pathname === '/login') {
        router.navigate({ to: '/', replace: true });
      }
      // 3. SECURE LOCK: If they are logged in but still "pending", FORCE them to update-password page
      else if (user && profile?.status === 'pending' && location.pathname !== '/update-password') {
        router.navigate({ to: '/update-password', replace: true });
      }
      // 4. GLOBAL ROUTE PROTECTION: Check if they have permission for the route they are trying to access
      else if (user && profile?.status === 'active' && location.pathname !== '/update-password') {
        const requiredSection = getRequiredSection(location.pathname);
        if (requiredSection && !can(requiredSection, 'view')) {
          router.navigate({ to: '/', replace: true });
        }
      }
    }
  }, [user, profile, isLoading, location.pathname, router, can]);

  useEffect(() => {
    const handleHistoryOrCacheRestore = () => {
      if (user && window.location.pathname === '/login') {
        router.navigate({ to: '/', replace: true });
      }
    };

    window.addEventListener('pageshow', handleHistoryOrCacheRestore);
    window.addEventListener('popstate', handleHistoryOrCacheRestore);

    return () => {
      window.removeEventListener('pageshow', handleHistoryOrCacheRestore);
      window.removeEventListener('popstate', handleHistoryOrCacheRestore);
    };
  }, [user, profile, router]);

  useEffect(() => {
    // Show splash screen only if we just logged in and we are NOT on the login page
    if (!isLoading && user && !sessionStorage.getItem('splashShown')) {
      setShowSplash(true);
      sessionStorage.setItem('splashShown', 'true');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Render standalone pages completely outside the dashboard layout
  if (location.pathname === '/login' || location.pathname === '/update-password') {
    return (
      <>
        <Outlet />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // If not logged in and not on a standalone page (will redirect shortly)
  if (!user) {
    return null; 
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {children}
    </>
  );
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  management: "Management",
  chief_coordinator: "Chief-Coordinator",
  academic_coordinator: "Academic Coordinator",
  accountant: "Accountant",
  faculty: "Faculty",
};

function UserProfile() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-md border border-border bg-card px-2 sm:px-2.5 py-1.5 shrink-0">
      <UserRound className="h-4 w-4 text-primary shrink-0" />
      <div className="hidden flex-col leading-tight lg:flex min-w-0">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Signed in as</span>
        <span className="text-xs font-medium text-foreground truncate max-w-32 xl:max-w-48">{user?.email}</span>
      </div>
      <button 
        onClick={signOut}
        className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors shrink-0"
      >
        Sign out
      </button>
    </div>
  );
}

function SessionSwitcher() {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const { can } = useAuth();
  const canChange = can("settings", "edit");
  const active = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 md:flex shrink-0">
      <CalendarRange className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden xl:inline">
        Session:
      </span>
      <Select
        value={activeSessionId}
        onValueChange={(v) => setActiveSession(v)}
        disabled={!canChange}
      >
        <SelectTrigger
          className="h-7 w-28 text-xs font-medium"
          title={!canChange ? "Only admins can change the active session" : undefined}
        >
          <SelectValue placeholder="Switch session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

