import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/auth";
import { toast } from "sonner";
import { useChatbotsStore } from "@/store/chatbots";

export const Route = createFileRoute("/api-keys/$botId/analytics")({
  head: () => ({ meta: [{ title: "Analytics Key — Webotme" }] }),
  component: AnalyticsKeyPage,
});

function AnalyticsKeyPage() {
  const { botId } = Route.useParams();
  const bot = useChatbotsStore((s) => s.chatbots.find((c) => c.id === botId));

  const [consoleKey, setConsoleKey] = useState<string | null>(null);
  const [botName, setBotName] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch("/api/store/my/console-keys", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data?.keys || []).find(
          (k: { chatbotId?: string; consoleKey?: string | null; botName?: string }) =>
            k.chatbotId === botId,
        );
        setConsoleKey(found?.consoleKey || null);
        setBotName(found?.botName || bot?.name || botId);
      }
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [botId, bot?.name]);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const copyKey = async () => {
    if (!consoleKey) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(consoleKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Analytics key copied");
    } catch {
      toast.error("Failed to copy key");
    } finally {
      setCopying(false);
    }
  };

  const maskedKey = consoleKey ? `${consoleKey.slice(0, 11)}…${consoleKey.slice(-4)}` : "";

  const hasKey = Boolean(consoleKey);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl p-0 sm:p-2">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">Analytics Key</h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {botName || bot?.name || botId} · {bot?.template || "Chatbot"}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl text-sm">
            <Link
              to="/api-keys/$botId"
              params={{ botId }}
              className="inline-flex items-center gap-1.5"
            >
              <KeyRound className="h-4 w-4" /> API Key
            </Link>
          </Button>
        </div>

        {/* Status strip */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Analytics Key</span>
              <BarChart3 className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-1.5 text-2xl font-bold">
              {loading ? "…" : hasKey ? "Active" : "None"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Access</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold">
              {hasKey ? "Agency dashboard" : "Not available"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Chatbot</span>
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold">{botName || bot?.name || botId}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key card */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">Your analytics key</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    One key per chatbot. Opens the sales, orders &amp; customers dashboard for this
                    chatbot.
                  </p>
                </div>
              </div>

              {!hasKey ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10">
                    <BarChart3 className="h-5 w-5 text-sky-500" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">No analytics key yet</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Analytics keys are available for agency chatbots. If this chatbot is set up as
                    an agency bot, come back here after a moment to get your key.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-500">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">Analytics key</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {revealed ? consoleKey : maskedKey}
                          </code>
                          <button
                            onClick={() => setRevealed((r) => !r)}
                            className="text-muted-foreground transition hover:text-foreground"
                            title={revealed ? "Hide" : "Reveal"}
                          >
                            {revealed ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyKey}
                          disabled={copying}
                          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copied ? "Copied" : "Copy key"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* English how-to points */}
                  <ul className="mt-4 space-y-2">
                    {[
                      "This key connects this chatbot to its live analytics dashboard — sales, orders and customers.",
                      "Keep it private. Anyone with the key can open the dashboard.",
                      "Copy the key, then press Open Analytics Console below — it is pre-filled for you.",
                      "One analytics key per chatbot. A key from another bot will not match.",
                    ].map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Open console CTA */}
                  <div className="mt-4">
                    <a
                      href={`/console?key=${encodeURIComponent(consoleKey || "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 transition hover:bg-sky-500/20"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-sky-600">
                        <ExternalLink className="h-4 w-4" />
                        Open Analytics Console (key pre-filled)
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-sky-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
