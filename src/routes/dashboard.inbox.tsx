import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Code,
  Copy,
  Check,
  ExternalLink,
  X,
  ScrollText,
  Activity,
  RefreshCw,
  CheckCircle2,
  Zap,
  Globe,
  Database,
  Clock,
  AlertTriangle,
  FileText,
  ListChecks,
  KeyRound,
  Workflow,
  GitBranch,
  Library,
  Bot,
  ArrowRight,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { clearAuth, getAuthHeaders, getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/inbox")({
  head: () => ({ meta: [{ title: "Installer — Webotme" }] }),
  component: InboxPage,
});

type Chatbot = {
  _id: string;
  name: string;
  isActive: boolean;
  embedScript: string;
  installedUrls: string[];
  createdAt: string;
};

type ScanLog = {
  _id?: string;
  pageUrl: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

type ScanPage = {
  url: string;
  path: string;
  name: string;
  title: string;
  purpose: string;
  keyWork: string;
  timestamp?: string;
};

type ScanStep = {
  from: string;
  to: string;
  fromPath: string;
  toPath: string;
  fromName?: string;
  toName?: string;
  trigger: string;
  actionLabel?: string;
  section?: string;
  timestamp: string;
};

type ScanFlowStep = {
  step: number;
  action: string;
  page?: string;
  pageName?: string;
  to?: string;
  fields?: string[];
};

type ScanFlow = {
  name: string;
  heading?: string;
  category?: string;
  pageName?: string;
  description?: string;
  trigger?: string;
  pageUrl?: string;
  steps?: ScanFlowStep[];
};

type FlowLibraryCategory = {
  name: string;
  description?: string;
  flows?: ScanFlow[];
};

type FlowLibrary = {
  headline?: string;
  description?: string;
  pages?: number;
  flowsCount?: number;
  categories?: FlowLibraryCategory[];
};

type ScanStatusData = {
  botId: string;
  flowMode?: string;
  autoFlowEnabled?: boolean;
  websiteUrl?: string | null;
  scanStatus?: {
    status?: string;
    progress?: number;
    widgetVersion?: string;
    totalPagesFound?: number;
    totalPagesScanned?: number;
    flowsDetected?: string[];
    flows?: ScanFlow[];
    flowLibrary?: FlowLibrary | null;
    flowSteps?: ScanStep[];
    pages?: ScanPage[];
    lastScanned?: string | null;
    createdAt?: string;
  } | null;
  logs?: ScanLog[];
};

type WizardStepInfo = {
  step: number;
  title: string;
  tab: string;
  page: string;
  purpose?: string;
  status: string;
  summary?: Record<string, unknown>;
  enteredAt?: string;
  completedAt?: string;
};

type WizardProgressData = {
  _id?: string;
  path?: string;
  flowName?: string;
  heading?: string;
  status?: string;
  currentStep?: number;
  steps?: WizardStepInfo[];
  startedAt?: string;
  completedAt?: string;
};

function InboxPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [chatbotsLoading, setChatbotsLoading] = useState(false);
  const [chatbotsError, setChatbotsError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const user = getStoredUser();
  const userId = typeof user?.id === "string" ? user.id : "";

  useEffect(() => {
    if (!userId) return;

    const loadChatbots = async () => {
      setChatbotsLoading(true);
      setChatbotsError("");

      try {
        const res = await fetch(`/api/chatbot/user/${userId}`, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          } as Record<string, string>,
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearAuth();
            navigate({ to: "/" });
            return;
          }
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || "Failed to load chatbots");
        }

        const payload = (await res.json()) as { chatbots?: Chatbot[] };
        setChatbots(payload.chatbots || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load chatbots";
        setChatbotsError(message);
        setChatbots([]);
      } finally {
        setChatbotsLoading(false);
      }
    };

    void loadChatbots();
  }, [userId]);

  const activeChatbots = chatbots.filter((b) => b.isActive);

  const handleCopyScript = async (botId: string, script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopiedId(botId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleRemoveUrl = async (botId: string, url: string) => {
    const bot = chatbots.find((b) => b._id === botId);
    if (!bot) return;
    const updated = (bot.installedUrls || []).filter((u) => u !== url);
    try {
      const res = await fetch(`/api/chatbot/${botId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        } as Record<string, string>,
        body: JSON.stringify({ installedUrls: updated }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setChatbots((prev) =>
        prev.map((b) => (b._id === botId ? { ...b, installedUrls: updated } : b)),
      );
    } catch {}
  };

  const [logBot, setLogBot] = useState<Chatbot | null>(null);
  const [scanInfo, setScanInfo] = useState<ScanStatusData | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [scanLogsLoading, setScanLogsLoading] = useState(false);
  const [scanLogsError, setScanLogsError] = useState("");
  const [wizard, setWizard] = useState<WizardProgressData | null>(null);

  const fetchScanStatus = async (botId: string) => {
    try {
      setScanLogsError("");
      const res = await fetch(`/api/autoflow/${botId}/scan-status`, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        } as Record<string, string>,
      });
      if (!res.ok) throw new Error("Failed to fetch scan status");
      const data = await res.json();
      setScanInfo(data as ScanStatusData);
      setScanLogs(Array.isArray(data.logs) ? (data.logs as ScanLog[]) : []);
    } catch (err) {
      setScanLogsError(err instanceof Error ? err.message : "Failed to load scan logs");
    } finally {
      setScanLogsLoading(false);
    }
    try {
      const wres = await fetch(`/api/wizard/progress/${botId}`, {
        headers: getAuthHeaders() as Record<string, string>,
      });
      if (wres.ok) {
        const wdata = await wres.json();
        setWizard(wdata.progress || null);
      }
    } catch {
      /* live wizard data is optional */
    }
  };

  const openLogs = (bot: Chatbot) => {
    setLogBot(bot);
    setScanInfo(null);
    setScanLogs([]);
    setScanLogsError("");
    setScanLogsLoading(true);
    setWizard(null);
    void fetchScanStatus(bot._id);
  };

  const closeLogs = () => {
    setLogBot(null);
    setScanInfo(null);
    setScanLogs([]);
    setWizard(null);
  };

  useEffect(() => {
    if (!logBot) return;
    const interval = setInterval(() => {
      void fetchScanStatus(logBot._id);
    }, 3000);
    return () => clearInterval(interval);
  }, [logBot]);

  const logIconFor = (action: string) => {
    if (action === "page_scanned" || action === "page_found" || action === "page_explored")
      return <Globe className="h-3.5 w-3.5" />;
    if (action === "form_detected") return <FileText className="h-3.5 w-3.5" />;
    if (action === "flow_detected") return <Zap className="h-3.5 w-3.5" />;
    if (action === "login_detected") return <KeyRound className="h-3.5 w-3.5" />;
    if (action === "error") return <AlertTriangle className="h-3.5 w-3.5" />;
    return <ListChecks className="h-3.5 w-3.5" />;
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "scanning":
        return { label: "LIVE", className: "bg-primary/10 text-primary animate-pulse" };
      case "complete":
        return { label: "DONE", className: "bg-emerald-500/10 text-emerald-500" };
      case "error":
        return { label: "FAILED", className: "bg-red-500/10 text-red-500" };
      case "idle":
      case "partial":
        return { label: "PARTIAL", className: "bg-amber-500/10 text-amber-600" };
      default:
        return { label: "IDLE", className: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Installer</h1>
          <p className="text-sm text-muted-foreground">
            Manage chatbot installation scripts and embedded websites.
          </p>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="border-b border-border/60 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chatbots..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {chatbotsLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading chatbots...
              </div>
            ) : chatbotsError ? (
              <div className="py-20 text-center text-sm text-red-500">{chatbotsError}</div>
            ) : activeChatbots.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeChatbots
                  .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
                  .map((bot) => (
                    <div
                      key={bot._id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-soft text-primary shadow-sm">
                          {bot.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{bot.name}</div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </div>
                        <button
                          onClick={() => openLogs(bot)}
                          title="View scan logs"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                          <ScrollText className="h-4 w-4" />
                        </button>
                      </div>

                      {bot.embedScript ? (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Embed Script
                            </span>
                            <button
                              onClick={() => handleCopyScript(bot._id, bot.embedScript)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                            >
                              {copiedId === bot._id ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedId === bot._id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 text-[10px] leading-relaxed text-muted-foreground">
                            {bot.embedScript}
                          </pre>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-amber-500/5 p-3 text-center text-xs text-amber-600">
                          No embed script generated yet. Go to Scripts page to generate one.
                        </div>
                      )}

                      <div>
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Installed Websites ({bot.installedUrls?.length || 0})
                          </span>
                        </div>
                        {bot.installedUrls && bot.installedUrls.length > 0 ? (
                          <div className="space-y-1">
                            {bot.installedUrls.map((url, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 truncate text-xs text-primary hover:underline"
                                >
                                  {url}
                                </a>
                                <button
                                  onClick={() => handleRemoveUrl(bot._id, url)}
                                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No websites added yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Code className="mx-auto mb-4 h-12 w-12 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No active chatbots found.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a chatbot first to get its embed script.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!!logBot}
        onOpenChange={(open) => {
          if (!open) closeLogs();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-soft text-primary">
                <ScrollText className="h-4 w-4" />
              </span>
              Scan Logs
            </DialogTitle>
            <DialogDescription>
              Auto Flow website scan progress & logs — {logBot?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
            {scanLogsLoading && !scanInfo ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading scan logs...
              </div>
            ) : scanLogsError && !scanInfo ? (
              <div className="py-12 text-center text-sm text-red-500">{scanLogsError}</div>
            ) : !scanInfo || !scanInfo.scanStatus ? (
              <div
                className={cn(
                  "py-12 text-center",
                  scanLogsError ? "text-red-500" : "text-muted-foreground",
                )}
              >
                <ScanNoData />
                <p className="text-sm">{scanLogsError || "No scan found for this bot yet."}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Embed the script on a website with Auto Flow enabled to start scanning.
                </p>
              </div>
            ) : (
              <>
                <StatusCard scanInfo={scanInfo} statusLabel={statusLabel} />
                <ScannedPagesSection scanInfo={scanInfo} />
                <FlowLibrarySection scanInfo={scanInfo} />
                <FlowsSection scanInfo={scanInfo} />
                <WizardFlowSection wizard={wizard} />
                <FlowStepsSection scanInfo={scanInfo} />
                {scanLogs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Recent Logs ({scanLogs.length})
                      </span>
                      <button
                        onClick={() => {
                          if (logBot) void fetchScanStatus(logBot._id);
                        }}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        <RefreshCw className={cn("h-3 w-3", scanLogsLoading && "animate-spin")} />{" "}
                        Refresh
                      </button>
                    </div>
                    {scanLogs.map((log, idx) => (
                      <div
                        key={`${log._id || idx}`}
                        className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md",
                            log.action === "error"
                              ? "bg-red-500/10 text-red-500"
                              : log.action === "flow_detected" || log.action === "login_detected"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {logIconFor(log.action)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold">{log.details || log.action}</div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {log.pageUrl}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <ListChecks className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    No scan logs recorded yet.
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function ScanNoData() {
  return (
    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted">
      <Activity className="h-6 w-6 opacity-40 text-muted-foreground" />
    </div>
  );
}

const PAGE_PURPOSE_COLORS: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-600",
  login: "bg-blue-500/10 text-blue-600",
  dashboard: "bg-violet-500/10 text-violet-600",
  checkout: "bg-amber-500/10 text-amber-600",
  payment: "bg-orange-500/10 text-orange-600",
  cart: "bg-amber-500/10 text-amber-600",
  order: "bg-emerald-500/10 text-emerald-600",
  booking: "bg-cyan-500/10 text-cyan-600",
  product: "bg-indigo-500/10 text-indigo-600",
  "product-detail": "bg-indigo-500/10 text-indigo-600",
  category: "bg-indigo-500/10 text-indigo-600",
  contact: "bg-pink-500/10 text-pink-600",
  search: "bg-slate-500/10 text-slate-600",
  form: "bg-teal-500/10 text-teal-600",
  settings: "bg-purple-500/10 text-purple-600",
  profile: "bg-purple-500/10 text-purple-600",
};

function purposeColor(purpose: string): string {
  return PAGE_PURPOSE_COLORS[purpose?.toLowerCase().trim()] || "bg-muted text-muted-foreground";
}

function ScannedPagesSection({ scanInfo }: { scanInfo: ScanStatusData | null }) {
  const pages = scanInfo?.scanStatus?.pages;
  if (!pages || pages.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Scanned Pages ({pages.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {pages.map((p, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
          >
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                purposeColor(p.purpose),
              )}
            >
              {p.purpose || "page"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold">
                {p.name || p.keyWork || p.title || p.path || p.url}
              </div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">{p.url}</div>
            </div>
            {p.timestamp && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {new Date(p.timestamp).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DiagramStepNode {
  title: string;
  caption?: string;
  sub?: string;
  fields?: string[];
}

function libraryStepNodes(steps: ScanFlowStep[] | undefined): DiagramStepNode[] {
  return (steps || []).map((s) => ({
    title: (s.action || "step").slice(0, 60),
    caption: s.pageName || "",
    sub: s.to || undefined,
    fields: Array.isArray(s.fields) ? s.fields.slice(0, 6) : undefined,
  }));
}

function flowStepNodes(steps: ScanStep[] | undefined): DiagramStepNode[] {
  return (steps || []).map((s) => ({
    title: (s.actionLabel || s.trigger || "click").slice(0, 80),
    caption: s.toName || s.toPath || "",
    sub:
      s.fromName || s.fromPath
        ? `from ${s.fromName || s.fromPath}${s.section ? ` · ${s.section}` : ""}`
        : s.section,
  }));
}

function StepFlowDiagram({ steps }: { steps: DiagramStepNode[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1.5">
      {steps.map((s, i) => (
        <Fragment key={i}>
          <div className="relative mt-2 min-w-[150px] max-w-[210px] flex-1 rounded-lg border border-border/50 bg-background/70 px-2.5 pb-2 pt-2.5 shadow-sm">
            <span className="absolute -top-2 left-2 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="truncate text-[11px] font-semibold text-foreground">{s.title}</p>
            {s.caption ? (
              <p className="mt-0.5 truncate rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-primary/80">
                {s.caption}
              </p>
            ) : null}
            {s.sub ? (
              <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground">{s.sub}</p>
            ) : null}
            {Array.isArray(s.fields) && s.fields.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {s.fields.map((f, fdi) => (
                  <span
                    key={fdi}
                    className="rounded bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {i < steps.length - 1 ? (
            <div className="flex shrink-0 items-center pl-0.5">
              <span className="rounded-full bg-primary/10 p-1">
                <ArrowRight className="h-3 w-3 text-primary" />
              </span>
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function FlowsSection({ scanInfo }: { scanInfo: ScanStatusData | null }) {
  const flows = scanInfo?.scanStatus?.flows;
  const named = Array.isArray(flows)
    ? flows.filter((f) => f?.name && Array.isArray(f.steps) && f.steps.length > 0)
    : [];
  if (named.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
          <Workflow className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Flows ({named.length})
        </span>
      </div>
      <div className="space-y-3">
        {named.map((f, fi) => (
          <div key={fi} className="overflow-hidden rounded-lg border border-border/50 bg-muted/20">
            <div className="border-b border-border/40 bg-background/40 px-3 py-2">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  <GitBranch className="h-3 w-3" />
                  {f.heading || f.name}
                </span>
                {f.trigger === "form:branch" && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    deep branch
                  </span>
                )}
                {f.trigger === "form:wizard" && (
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
                    same-page wizard
                  </span>
                )}
                {f.category && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {f.category}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-foreground">{f.name}</p>
              {f.description ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              ) : null}
              {f.pageName || f.pageUrl ? (
                <p className="mt-1 truncate text-[10px] font-medium text-primary/80">
                  Page: {f.pageName || f.pageUrl}
                </p>
              ) : null}
            </div>
            <div className="p-2">
              <StepFlowDiagram steps={libraryStepNodes(f.steps)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowLibrarySection({ scanInfo }: { scanInfo: ScanStatusData | null }) {
  const lib = scanInfo?.scanStatus?.flowLibrary;
  const cats = lib?.categories?.filter((c) => c && Array.isArray(c.flows) && c.flows.length > 0);
  if (!cats || cats.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-600">
          <Library className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Flow Library ({lib?.flowsCount ?? cats.reduce((a, c) => a + (c.flows?.length || 0), 0)}{" "}
            flows)
          </span>
          {lib?.headline ? (
            <p className="text-[11px] font-semibold text-foreground">{lib.headline}</p>
          ) : null}
        </div>
      </div>
      {lib?.description ? (
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">{lib.description}</p>
      ) : null}
      <div className="space-y-3">
        {cats.map((cat, ci) => (
          <div key={ci} className="overflow-hidden rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 border-b border-border/40 bg-background/40 px-3 py-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                {cat.name}
              </span>
              {cat.name === "Primary" && (
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Main website task
                </span>
              )}
              {cat.description ? (
                <span className="truncate text-[10px] text-muted-foreground">
                  {cat.description}
                </span>
              ) : null}
            </div>
            <div className="space-y-2 p-2">
              {(cat.flows || []).map((f, fi) => (
                <div key={fi} className="rounded-lg border border-border/40 bg-background/60 p-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-foreground">
                      {f.name || f.heading}
                    </span>
                    {f.pageName && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-primary/80">
                        {f.pageName}
                      </span>
                    )}
                  </div>
                  {f.description ? (
                    <p className="mb-1.5 text-[10px] leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  ) : null}
                  <div className="mt-1">
                    <StepFlowDiagram steps={libraryStepNodes(f.steps)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardFlowSection({ wizard }: { wizard: WizardProgressData | null }) {
  const steps = wizard?.steps;
  if (!wizard || !Array.isArray(steps) || steps.length === 0) return null;
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const isComplete = wizard.status === "completed";
  const pathLabel =
    wizard.path === "agency-auto"
      ? "Agency · Auto Flow"
      : wizard.path === "agency-custom"
        ? "Agency · Custom Flow"
        : "Simple";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-sky-500/10 text-sky-600">
          <Bot className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Create Chatbot Flow (Live)
          </span>
          <p className="truncate text-[11px] font-semibold text-foreground">
            {wizard.heading || wizard.flowName || "Create Chatbot Flow"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-lg px-2 py-0.5 text-[10px] font-bold",
            isComplete
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-sky-500/10 text-sky-600 animate-pulse",
          )}
        >
          {isComplete ? "COMPLETED" : "IN PROGRESS"}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
          {pathLabel}
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
          {completedCount} / {steps.length} steps
        </span>
        {wizard.startedAt ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
            started {new Date(wizard.startedAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5">
        {steps.map((s, idx) => {
          const isDone = s.status === "completed";
          const isCurrent = !isDone && !isComplete && wizard.currentStep === s.step;
          const summary = s.summary && Object.keys(s.summary).length > 0 ? s.summary : null;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2",
                isCurrent
                  ? "border-sky-500/40 bg-sky-500/5"
                  : isDone
                    ? "border-border/40 bg-muted/20"
                    : "border-border/30 bg-muted/10 opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  isDone
                    ? "bg-emerald-500/10 text-emerald-600"
                    : isCurrent
                      ? "bg-sky-500/10 text-sky-600"
                      : "bg-foreground/10 text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold">{s.title || `Step ${idx + 1}`}</span>
                  {s.tab ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                      tab: {s.tab}
                    </span>
                  ) : null}
                  {s.page ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      {s.page}
                    </span>
                  ) : null}
                </div>
                {s.purpose ? (
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    {s.purpose}
                  </p>
                ) : null}
                {summary ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(summary)
                      .filter(
                        ([k, v]) =>
                          k === "botType" ||
                          k === "flowMode" ||
                          k === "category" ||
                          k === "template" ||
                          k === "name",
                      )
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="rounded bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground"
                        >
                          {k}: {String(v ?? "").slice(0, 40)}
                        </span>
                      ))}
                  </div>
                ) : null}
                {s.completedAt ? (
                  <p className="mt-0.5 text-[9px] text-muted-foreground/70">
                    done {new Date(s.completedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlowStepsSection({ scanInfo }: { scanInfo: ScanStatusData | null }) {
  const steps = scanInfo?.scanStatus?.flowSteps;
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Flow Steps ({steps.length})
        </span>
      </div>
      <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Step Path
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {steps.length} transitions
          </span>
        </div>
        <StepFlowDiagram steps={flowStepNodes(steps)} />
      </div>
    </div>
  );
}

function StatusCard({
  scanInfo,
  statusLabel,
}: {
  scanInfo: ScanStatusData | null;
  statusLabel: (s?: string) => { label: string; className: string };
}) {
  const scan = scanInfo?.scanStatus;
  if (!scan) return null;
  const isScanning = scan.status === "scanning";
  const isComplete = scan.status === "complete";
  const badge = statusLabel(scan.status);
  const progress = Math.round(scan.progress || 0);
  const flows = Array.isArray(scan.flowsDetected) ? scan.flowsDetected : [];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Activity className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold capitalize">{scan.status || "idle"}</span>
        <span
          className={cn("ml-auto rounded-lg px-2.5 py-0.5 text-[10px] font-bold", badge.className)}
        >
          {badge.label}
        </span>
        {scan.widgetVersion ? (
          <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            v{scan.widgetVersion}
          </span>
        ) : null}
      </div>

      <div className="mb-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isScanning
                ? "bg-gradient-to-r from-primary to-purple-600 animate-pulse"
                : isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                  : "bg-muted-foreground",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {scan.totalPagesScanned || 0} / {scan.totalPagesFound || 0} pages scanned ({progress}%)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Globe className="h-3 w-3" /> Website
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold">{scanInfo?.websiteUrl || "—"}</p>
        </div>
        <div className="rounded-lg bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Database className="h-3 w-3" /> Flow
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold">{scanInfo?.flowMode || "not set"}</p>
        </div>
        <div className="rounded-lg bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Last Scanned
          </div>
          <p className="mt-0.5 text-xs font-semibold">
            {scan.lastScanned ? new Date(scan.lastScanned).toLocaleString() : "Never"}
          </p>
        </div>
      </div>

      {flows.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {flows.map((f: string, i: number) => (
            <span
              key={i}
              className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
