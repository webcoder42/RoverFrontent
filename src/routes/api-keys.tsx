import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Copy, KeyRound, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { isAuthenticated, getAuthHeaders } from "@/lib/auth";
import { toast } from "sonner";

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
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex md:sticky md:top-0 md:h-screen">
        <Sidebar extra={<ApiConsoleSidebarExtra />} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Rendered inside the dedicated API-key sidebar: links to the API console
 * plus an "Analytic Key" field that shows the bot's console key (wc_…).
 */
function ApiConsoleSidebarExtra() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const botId = pathname.startsWith("/api-keys/") && !pathname.includes("/docs")
    ? pathname.split("/api-keys/")[1]?.split("/")[0]
    : undefined;

  const [consoleKey, setConsoleKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!botId) return;
    setLoadingKey(true);
    fetch("/api/store/my/console-keys", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        const found = (d?.keys || []).find((k: any) => k.chatbotId === botId);
        setConsoleKey(found?.consoleKey || null);
      })
      .catch(() => {})
      .finally(() => active && setLoadingKey(false));
    return () => {
      active = false;
    };
  }, [botId]);

  const copyKey = async () => {
    if (!consoleKey) return;
    await navigator.clipboard.writeText(consoleKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast.success("Analytic key copied");
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5 text-primary" />
        API Console
      </div>

      <div className="space-y-1.5">
        <SideLinkBot
          href="/api-keys/docs"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="How to use"
        />

        <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
          <div className="text-[10px] font-medium text-muted-foreground">
            Analytic Key
          </div>
          {loadingKey ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : consoleKey ? (
            <button
              onClick={copyKey}
              title="Copy analytic key"
              className="mt-1 flex w-full items-center gap-1.5 rounded-md font-mono text-[11px] font-semibold text-blue-500 transition hover:text-blue-400"
            >
              <span className="truncate">{consoleKey.slice(0, 11)}…</span>
              {copied ? (
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

function SideLinkBot({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs font-medium text-foreground/80 transition hover:bg-sidebar-accent/60 hover:text-foreground"
    >
      {icon}
      {label}
    </a>
  );
}