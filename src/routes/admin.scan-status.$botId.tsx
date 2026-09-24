import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Scan,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Database,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/scan-status/$botId")({
  head: () => ({ meta: [{ title: "Scan Status — Rover" }] }),
  component: ScanStatusPage,
});

function ScanStatusPage() {
  const { botId } = Route.useParams();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/autoflow/${botId}/scan-status`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError("Failed to load scan status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [botId]);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Loading Scan Status...</h1>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <XCircle className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold">{error}</h1>
          </div>
          <button onClick={fetchStatus} className="px-4 py-2 bg-primary text-white rounded-lg">Retry</button>
        </div>
      </PageTransition>
    );
  }

  const scan = status?.scanStatus;
  const isScanning = scan?.status === "scanning";
  const isComplete = scan?.status === "complete";
  const isIdle = !scan || scan.status === "idle" || scan.status === "error";

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-soft">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Auto Flow Scan Status</h1>
            <p className="text-sm text-muted-foreground font-mono">{botId}</p>
          </div>
          <button onClick={fetchStatus} className="ml-auto flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isScanning ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : isComplete ? (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              ) : (
                <Globe className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <h2 className="font-semibold capitalize">{scan?.status || "idle"}</h2>
                <p className="text-xs text-muted-foreground">
                  {isScanning ? "Scanning in progress..." :
                   isComplete ? "Scan complete!" :
                   "Waiting to start..."}
                </p>
              </div>
            </div>
            <span className={cn(
              "rounded-lg px-3 py-1 text-xs font-bold",
              isScanning ? "bg-primary/10 text-primary animate-pulse" :
              isComplete ? "bg-emerald-500/10 text-emerald-500" :
              "bg-muted text-muted-foreground"
            )}>
              {isScanning ? "LIVE" : isComplete ? "DONE" : "IDLE"}
            </span>
          </div>

          {/* Progress bar */}
          {(isScanning || isComplete) && (
            <div className="mb-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isScanning
                      ? "bg-gradient-to-r from-primary to-purple-600 animate-pulse"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600"
                  )}
                  style={{ width: `${scan?.progress || 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {scan?.totalPagesScanned || 0} / {scan?.totalPagesFound || 0} pages ({Math.round(scan?.progress || 0)}%)
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> Website
              </div>
              <p className="mt-1 text-sm font-semibold truncate">{status?.websiteUrl || "Not configured"}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3.5 w-3.5" /> Pages Found
              </div>
              <p className="mt-1 text-sm font-bold">{scan?.totalPagesFound || 0}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> Flows Detected
              </div>
              <p className="mt-1 text-sm font-bold">{scan?.flowsDetected?.length || 0}</p>
              {scan?.flowsDetected?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {scan.flowsDetected.map((f: string, i: number) => (
                    <span key={i} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{f}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flows List */}
          {scan?.flowsDetected?.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">Detected Flows:</h3>
              {scan.flowsDetected.map((flow: string, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm">{flow}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Install Details */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Installation Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Flow Mode</span>
              <span className={cn("font-semibold", status?.flowMode === "auto" ? "text-emerald-500" : "text-muted-foreground")}>
                {status?.flowMode || "not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto Flow Enabled</span>
              <span className={cn(status?.autoFlowEnabled ? "text-emerald-500" : "text-red-500")}>
                {status?.autoFlowEnabled ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Website URL</span>
              <span className="font-mono text-xs">{status?.websiteUrl || "Not configured"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Scanned</span>
              <span className="text-xs">{scan?.lastScanned ? new Date(scan.lastScanned).toLocaleString() : "Never"}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
