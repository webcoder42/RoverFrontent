import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Copy,
  DollarSign,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated, getAuthHeaders, getStoredToken, getStoredUser, clearAuth } from "@/lib/auth";
import { toast } from "sonner";
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

  const [planState, setPlanState] = useState<"active" | "expired" | "free">("free");
  const [activePurchase, setActivePurchase] = useState<Record<string, any> | null>(null);

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
          {/* ── Inner API Console sub-sidebar: API key + Analytic key ── */}
          <div className="pb-1">
            <ApiConsoleCard botId={botId} />
          </div>
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
            {planState === "expired" ? (
              "Plan Expired — Renew Now"
            ) : planState === "active" ? (
              "Plan Active"
            ) : (
              "Upgrade Plan"
            )}
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

/**
 * Inner API Console card rendered inside the dedicated sidebar.
 * Shows the bot's API key (wbm_…) and the analytic key (wc_…).
 */
function ApiConsoleCard({ botId }: { botId?: string }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [consoleKey, setConsoleKey] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingConsole, setLoadingConsole] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    let active = true;
    if (!botId) return;
    setLoadingApi(true);
    setLoadingConsole(true);
    fetch(`/api/chatbot/${botId}/api-key`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        setApiKey(d?.maskedKey || null);
      })
      .catch(() => {})
      .finally(() => active && setLoadingApi(false));
    fetch("/api/store/my/console-keys", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const found = (d?.keys || []).find((k: any) => k.chatbotId === botId);
        setConsoleKey(found?.consoleKey || null);
      })
      .catch(() => {})
      .finally(() => active && setLoadingConsole(false));
    return () => {
      active = false;
    };
  }, [botId]);

  const copyText = async (text: string, id: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 1600);
    toast.success("Copied");
  };

  const copyFullApiKey = async () => {
    if (!botId) return;
    try {
      const res = await fetch(`/api/chatbot/${botId}/api-key/reveal`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.key) {
        await copyText(data.key, "api");
      } else {
        toast.error(data.message || "Failed to reveal key");
      }
    } catch {
      toast.error("Failed to reveal key");
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5 text-primary" />
        API Console
      </div>

      <div className="space-y-1.5">
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs font-medium text-foreground/80 transition hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <BookOpen className="h-3.5 w-3.5" />
          How to use
        </a>

        {/* API key field */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
          <div className="text-[10px] font-medium text-muted-foreground">API Key</div>
          {loadingApi ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : apiKey ? (
            <button
              onClick={copyFullApiKey}
              title="Copy API key"
              className="mt-1 flex w-full items-center gap-1.5 rounded-md font-mono text-[11px] font-semibold text-violet-500 transition hover:text-violet-400"
            >
              <span className="truncate">{apiKey}</span>
              {copiedId === "api" ? (
                <span className="text-emerald-500">✓</span>
              ) : (
                <Copy className="h-3 w-3 shrink-0 opacity-60" />
              )}
            </button>
          ) : (
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {botId ? "No key yet" : "Select a bot"}
            </div>
          )}
        </div>

        {/* Analytic key field */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
          <div className="text-[10px] font-medium text-muted-foreground">Analytic Key</div>
          {loadingConsole ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : consoleKey ? (
            <button
              onClick={() => copyText(consoleKey, "console")}
              title="Copy analytic key"
              className="mt-1 flex w-full items-center gap-1.5 rounded-md font-mono text-[11px] font-semibold text-blue-500 transition hover:text-blue-400"
            >
              <span className="truncate">{consoleKey.slice(0, 11)}…</span>
              {copiedId === "console" ? (
                <span className="text-emerald-500">✓</span>
              ) : (
                <Copy className="h-3 w-3 shrink-0 opacity-60" />
              )}
            </button>
          ) : (
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {botId ? "No key yet" : "Select a bot"}
            </div>
          )}
        </div>
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