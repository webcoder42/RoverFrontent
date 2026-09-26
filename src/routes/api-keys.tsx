import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, DollarSign, KeyRound, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated, getStoredToken, getStoredUser, clearAuth } from "@/lib/auth";
import logo from "@/asset/logo.png";

export const Route = createFileRoute("/api-keys")({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: "/",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: ApiKeysLayout,
});

function ApiKeysLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const botId = pathname.startsWith("/api-keys/")
    ? pathname.split("/api-keys/")[1]?.split("/")[0]
    : undefined;

  const apiKeyPath = botId ? `/api-keys/${botId}` : "";
  const analyticsPath = botId ? `/api-keys/${botId}/analytics` : "";
  const apiKeyActive = apiKeyPath !== "" && pathname === apiKeyPath;
  const analyticsActive = analyticsPath !== "" && pathname === analyticsPath;

  const [planState, setPlanState] = useState<"active" | "expired" | "free">("free");
  const [activePurchase, setActivePurchase] = useState<{
    expiresAt?: string;
    planName?: string;
    status?: string;
  } | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/plan-purchase/active", { headers })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.purchase;
        if (!p) {
          setPlanState("free");
          return;
        }
        const expired =
          (p.status && p.status !== "active") ||
          (p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false);
        const paid =
          typeof p.planName === "string" &&
          p.planName !== "Free" &&
          Number(p.planPrice ?? p.planId?.price ?? 0) > 0;
        setActivePurchase(expired ? null : paid ? p : null);
        setPlanState(expired ? "expired" : paid ? "active" : "free");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Dedicated full-page sidebar (new, not the dashboard sidebar) ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen">
        <Link to="/dashboard" className="flex w-60 items-center px-6 py-5">
          <img src={logo} alt="Webotme" className="h-14 w-auto shrink-0 object-contain" />
        </Link>

        <div className="px-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-2">
          <div className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            API Console
          </div>

          {/* API Key — opens the full API key page for this chatbot */}
          {botId ? (
            <Link
              to="/api-keys/$botId"
              params={{ botId }}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                apiKeyActive
                  ? "bg-sidebar-accent text-primary shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <KeyRound className="h-4.5 w-4.5 shrink-0 text-primary" />
              <span className="relative min-w-0 flex-1">
                <span className="block">API Key</span>
                <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">
                  Create, reveal &amp; copy your backend key.
                </span>
              </span>
            </Link>
          ) : (
            <div className="rounded-xl px-3 py-2.5 text-xs text-muted-foreground">
              Open a chatbot from your dashboard to manage its API key.
            </div>
          )}

          {/* Analytics Key — opens its step page in the same sidebar layout */}
          {botId ? (
            <Link
              to="/api-keys/$botId/analytics"
              params={{ botId }}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                analyticsActive
                  ? "bg-sidebar-accent text-primary shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <BarChart3 className="h-4.5 w-4.5 shrink-0 text-sky-500" />
              <span className="relative min-w-0 flex-1">
                <span className="block">Analytics Key</span>
                <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">
                  Copy key &amp; open the live dashboard.
                </span>
              </span>
            </Link>
          ) : (
            <div className="rounded-xl px-3 py-2.5 text-xs text-muted-foreground">
              Open a chatbot from your dashboard to see its analytics key.
            </div>
          )}

          {/* How to use */}
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <BookOpen className="h-4.5 w-4.5 shrink-0" />
            <span className="relative">How to use</span>
          </a>
        </nav>

        {/* Plan box */}
        <Link
          to="/plans"
          className={cn(
            "m-4 block rounded-2xl p-4 shadow-soft transition-colors",
            planState === "active"
              ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
              : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-xs font-semibold",
              planState === "active"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {planState === "active" ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <DollarSign className="h-3.5 w-3.5" />
            )}
            {planState === "expired"
              ? "Plan Expired — Renew Now"
              : planState === "active"
                ? "Plan Active"
                : "Upgrade Plan"}
          </div>
          <p
            className={cn(
              "mt-1.5 text-xs",
              planState === "active"
                ? "text-emerald-500/70 dark:text-emerald-400/70"
                : "text-rose-500/70 dark:text-rose-400/70",
            )}
          >
            {planState === "active"
              ? activePurchase?.expiresAt
                ? `Valid until ${new Date(activePurchase.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
                : "Your plan is active and running."
              : planState === "expired"
                ? "Your plan has expired. Renew now to keep features running."
                : "View plans and pick the perfect one for you."}
          </p>
        </Link>

        {/* User footer */}
        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-[11px] font-bold text-primary-foreground">
              {getUserInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold leading-tight">{getUserName()}</div>
              <div className="text-[10px] capitalize text-muted-foreground">{getUserRole()}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:hidden">
          <Link to="/dashboard" className="flex items-center">
            <img src={logo} alt="Webotme" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
            >
              <BookOpen className="h-3.5 w-3.5" /> Docs
            </a>
            <Link
              to="/dashboard/scripts"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getUserInitials() {
  const user = getStoredUser();
  const username = typeof user?.username === "string" ? user.username : "User";
  return username.substring(0, 2).toUpperCase();
}

function getUserName() {
  const user = getStoredUser();
  return typeof user?.username === "string" ? user.username : "User";
}

function getUserRole() {
  const user = getStoredUser();
  return typeof user?.role === "string" ? user.role : "Admin";
}

function SignOutButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        clearAuth();
        navigate({ to: "/" });
      }}
      title="Sign out"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
