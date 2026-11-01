import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound, Rocket } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";
import { useChatbotsStore } from "@/store/chatbots";
import { MOBILE_APP_OPTIONS, type MobileAppId } from "@/lib/mobileSetup";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/app-setup/$botId")({
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
  head: () => noindexHead("Setup your chatbot — Webotme"),
  validateSearch: (search: Record<string, unknown>): { app?: string } => ({
    app: typeof search.app === "string" ? search.app : undefined,
  }),
  component: AppSetupPage,
});

function AppSetupPage() {
  const { botId } = Route.useParams();
  const { app } = Route.useSearch();
  const navigate = useNavigate();
  const bot = useChatbotsStore((s) => s.chatbots.find((c) => c.id === botId));
  const [copied, setCopied] = useState("");

  const selectedOption =
    MOBILE_APP_OPTIONS.find((o) => o.id === app) || MOBILE_APP_OPTIONS[0];

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success("Copied!");
      setTimeout(() => setCopied(""), 1600);
    } catch {
      window.prompt("Copy this", text);
    }
  };

  const switchApp = (id: MobileAppId) =>
    navigate({ to: "/app-setup/$botId", params: { botId }, search: { app: id } });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl p-0 sm:p-2">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/scripts"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-soft hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-soft">
                <Rocket className="h-4 w-4" />
              </span>
              Setup your chatbot
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {bot?.name || botId} · {selectedOption.title}
            </p>
          </div>
        </div>

        {/* App switcher */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MOBILE_APP_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const selected = selectedOption.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => switchApp(option.id)}
                className={cn(
                  "group relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
                  selected
                    ? "border-violet-500/60 bg-violet-500/10 shadow-soft"
                    : "border-border/70 bg-card hover:border-violet-500/40 hover:bg-accent/30",
                )}
              >
                <span className="flex w-full items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                      selected
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-soft"
                        : "bg-muted text-muted-foreground group-hover:text-violet-600",
                    )}
                  >
                    <OptionIcon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{option.title}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {option.framework}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                      selected
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-border text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </span>
                <span className="text-[10px] leading-4 text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bot ID */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-3 shadow-soft">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Bot ID
            </p>
            <code className="block truncate font-mono text-[11px] text-foreground/80">
              {botId}
            </code>
          </div>
          <button
            onClick={() => copy(botId, "botid")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-soft hover:brightness-110"
          >
            {copied === "botid" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied === "botid" ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Footer links */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/api-keys/$botId"
            params={{ botId }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-soft hover:bg-accent hover:text-foreground"
          >
            <KeyRound className="h-3.5 w-3.5" /> API key
          </Link>
          <Link
            to="/dashboard/scripts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
          >
            Done — back to scripts <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
