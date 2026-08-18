import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  HardDrive, Database, TrendingUp, Shield, ArrowUpCircle,
  HardDrive as HardDriveIcon, Bot, Building2, Globe, Loader2, Mail,
} from "lucide-react";
import { motion } from "motion/react";
import { PageTransition } from "@/components/common/PageTransition";
import { clearAuth, getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/storage")({
  head: () => ({ meta: [{ title: "Storage — Webotme" }] }),
  component: StoragePage,
});

type StorageData = {
  _id: string;
  userId: string;
  planId: any;
  storageUsed: number;
  storageLimit: number;
  dailyApiCalls: number;
  apiLimit: number;
  totalChatbots: number;
  totalActiveChatbots: number;
  totalSimpleChatbots: number;
  totalAgencyChatbots: number;
  totalDBCollections: number;
  totalScripts: number;
};

type CollectionInfo = {
  chatbotId: string;
  chatbotName: string;
  table: string;
  database: string;
  host: string;
  port: number;
  dbType: string;
  rowCount: number;
  dataSizeBytes: number;
  indexSizeBytes: number;
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function StoragePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storage, setStorage] = useState<StorageData | null>(null);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [upgradeHover, setUpgradeHover] = useState(false);
  const [activePurchase, setActivePurchase] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = { ...getAuthHeaders(), "Content-Type": "application/json" } as Record<string, string>;
        const [usageRes, colRes, activeRes] = await Promise.all([
          fetch("/api/storage/usage", { headers }),
          fetch("/api/storage/collections", { headers }),
          fetch("/api/plan-purchase/active", { headers }),
        ]);
        if (usageRes.status === 401 || colRes.status === 401) { clearAuth(); navigate({ to: "/" }); return; }
        if (!usageRes.ok) throw new Error("Failed to load storage data");
        const usageData = await usageRes.json();
        setStorage(usageData.storage);
        if (colRes.ok) {
          const colData = await colRes.json();
          setCollections(colData.collections || []);
        }
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          setActivePurchase(activeData.purchase || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={() => window.location.reload()} className="text-xs text-primary hover:underline">Retry</button>
        </div>
      </PageTransition>
    );
  }

  const planName = storage?.planId?.name || "Free Plan";
  const plan = storage?.planId || {};
  const totalCollectionBytes = collections.reduce((s, c) => s + c.dataSizeBytes + c.indexSizeBytes, 0);
  const totalUsedBytes = (storage?.storageUsed || 0) + totalCollectionBytes;
  const usedApiCalls = storage?.dailyApiCalls || 0;
  const apiLimitV = storage?.apiLimit || 0;
  const usedSimple = storage?.totalSimpleChatbots || 0;
  const usedAgency = storage?.totalAgencyChatbots || 0;
  const usedDB = collections.length;
  const totalDB = (plan as any).databaseCollections || 0;
  const simpleBotLimit = (plan as any).totalChatbots - ((plan as any).bookingAgency || 0) || 1;
  const agencyBotLimit = (plan as any).bookingAgency || 0;
  const dbAccess = (plan as any).databaseAccess === true;
  const storageLimit = storage?.storageLimit || 0;
  const storageFull = storageLimit > 0 && (storage?.storageUsed || 0) >= storageLimit;
  const apiExceeded = apiLimitV > 0 && usedApiCalls >= apiLimitV;
  const emailLimit = (plan as any).emailLimit || 0;
  const storagePercent = storageLimit > 0 ? Math.min(100, Math.round((totalUsedBytes / storageLimit) * 100)) : 0;
  const simpleBotPercent = simpleBotLimit > 0 ? Math.min(100, Math.round((usedSimple / simpleBotLimit) * 100)) : 0;
  const agencyBotPercent = agencyBotLimit > 0 ? Math.min(100, Math.round((usedAgency / agencyBotLimit) * 100)) : 0;
  const dbPercent = totalDB > 0 ? Math.min(100, Math.round((usedDB / totalDB) * 100)) : 0;
  const apiPercent = apiLimitV > 0 ? Math.min(100, Math.round((usedApiCalls / apiLimitV) * 100)) : 0;

  const activePlanName = activePurchase?.planName || planName;
  const activePrice = activePurchase?.planPrice ?? (plan as any).price ?? 0;
  const activeExpires = activePurchase?.expiresAt || null;
  const activePeriodDays = activePurchase?.periodDays || (plan as any).expiresInDays || 30;
  const daysLeft = activeExpires
    ? Math.max(0, Math.ceil((new Date(activeExpires).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  const isFreeActive = !activeExpires || activePrice <= 0;

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <HardDriveIcon className="h-3.5 w-3.5" /> Storage & Resources
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Storage</h1>
          <p className="text-sm text-muted-foreground">Manage your storage, databases, and usage limits.</p>
        </div>
        <Link to="/plans" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:brightness-110">
          <ArrowUpCircle className="h-4 w-4" /> Upgrade Plan
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Storage Used", used: formatBytes(totalUsedBytes), total: formatBytes(storage?.storageLimit || 0), pct: storagePercent, color: "from-violet-500 to-indigo-500", bar: "bg-violet-500", icon: HardDrive, warn: storageFull },
          { label: "Simple Chatbot", used: String(usedSimple), total: String(simpleBotLimit), pct: simpleBotPercent, color: "from-sky-500 to-cyan-500", bar: "bg-sky-500", icon: Bot, warn: false },
          { label: "Agency Chatbot", used: String(usedAgency), total: String(agencyBotLimit), pct: agencyBotPercent, color: "from-amber-500 to-orange-500", bar: "bg-amber-500", icon: Building2, warn: agencyBotLimit <= 0 && usedAgency > 0 },
          { label: "DB Connections", used: String(usedDB), total: String(totalDB), pct: dbPercent, color: "from-emerald-500 to-teal-500", bar: "bg-emerald-500", icon: Database, warn: !dbAccess && usedDB > 0 },
          { label: "API Calls / Day", used: String(usedApiCalls), total: String(apiLimitV), pct: apiPercent, color: "from-fuchsia-500 to-pink-500", bar: "bg-fuchsia-500", icon: Globe, warn: apiExceeded },
          { label: "Emails / Day", used: "0", total: emailLimit > 0 ? String(emailLimit) : "0", pct: 0, color: "from-blue-500 to-indigo-500", bar: "bg-blue-500", icon: Mail, warn: emailLimit <= 0 },
        ].map((s) => (
          <div key={s.label} className={"group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft " + (s.warn ? "border-amber-500/40 bg-amber-500/5" : "border-border/60")}>
            <div className={"absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br " + s.color + " opacity-15 blur-2xl"} />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium text-muted-foreground">{s.label}</div>
              <div className={"grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br " + s.color + " text-white shadow-soft"}><s.icon className="h-3.5 w-3.5" /></div>
            </div>
            <div className="mt-2 flex items-baseline gap-1 flex-wrap">
              <span className="text-base font-bold tracking-tight">{s.used}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">/ {s.total}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={"h-full rounded-full " + s.bar} style={{ width: s.pct + "%" }} />
            </div>
            <div className="mt-1 text-right text-[10px] text-muted-foreground">
              {s.warn ? (
                <span className="font-semibold text-amber-600">
                  {s.label === "Emails / Day" ? "Not included in plan" : "Needs upgrade"}
                </span>
              ) : s.pct + "% used"}
            </div>
          </div>
        ))}
      </div>

      {(storageFull || apiExceeded) && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-amber-600">Plan Limit Reached</h4>
            <p className="text-xs text-muted-foreground">
              {storageFull
                ? "Your storage is full. Chatbot responses are disabled until you upgrade your plan."
                : `Daily API call limit of ${apiLimitV} reached. Chatbot responses are disabled until you upgrade your plan.`}
            </p>
          </div>
          <Link to="/plans" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/25 hover:brightness-110">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Upgrade Plan
          </Link>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Database Collections</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">{collections.length} connected</span>
        </div>
        {!dbAccess && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-amber-500">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-amber-600">Database access not included</h4>
              <p className="text-[11px] text-muted-foreground">
                {collections.length > 0
                  ? "Your connected collections are disabled on the current plan. Upgrade your plan to enable them."
                  : "Upgrade your plan to connect database collections."}
              </p>
            </div>
            <Link to="/plans" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:brightness-110">
              <ArrowUpCircle className="h-3.5 w-3.5" /> Upgrade
            </Link>
          </div>
        )}
        {collections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((col, i) => {
              const totalBytes = col.dataSizeBytes + col.indexSizeBytes;
              const colors = ["from-violet-500 to-indigo-500", "from-emerald-500 to-teal-500", "from-sky-500 to-cyan-500"];
              const c = colors[i % colors.length];
              const disabled = !dbAccess;
              return (
                <div key={col.chatbotId + col.table} className={"rounded-xl border p-4 " + (disabled ? "border-amber-500/30 bg-amber-500/5 opacity-80" : "border-border/60 bg-muted/30")}>
                  <div className="flex items-center gap-2">
                    <div className={"grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br " + c + " text-white shadow-soft"}><Database className="h-3.5 w-3.5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold font-mono">{col.table}</div>
                      <div className="text-[10px] text-muted-foreground">{col.chatbotName}</div>
                    </div>
                    {disabled && (
                      <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-600">Disabled</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{formatBytes(totalBytes)}</span>
                    <span>{col.rowCount.toLocaleString()} rows · {col.dbType === "mongodb" ? "MongoDB" : col.host}</span>
                  </div>
                  {disabled && (
                    <Link to="/plans" className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-500/25 transition-colors">
                      <ArrowUpCircle className="h-3 w-3" /> Upgrade to enable
                    </Link>
                  )}
                  {col.error && (
                    <div className="mt-1.5 rounded bg-red-500/10 px-2 py-1 text-[9px] text-red-400 break-all">
                      {col.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Database className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">No database collections connected yet.</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Storage Breakdown</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(storage?.storageUsed || 0)} internal + {formatBytes(totalCollectionBytes)} in database collections
          </p>
          <div className="mt-5 border-t border-border/60 pt-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Plan Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <span className="text-muted-foreground">Total Chatbots</span>
                <p className="mt-0.5 font-semibold">{storage?.totalChatbots || 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <span className="text-muted-foreground">Active Chatbots</span>
                <p className="mt-0.5 font-semibold">{storage?.totalActiveChatbots || 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <span className="text-muted-foreground">Scripts Generated</span>
                <p className="mt-0.5 font-semibold">{storage?.totalScripts || 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <span className="text-muted-foreground">API Calls Today</span>
                <p className="mt-0.5 font-semibold">{usedApiCalls} / {apiLimitV}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-gradient-soft p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold">Current Plan</h3>
            <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isFreeActive ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-600"}`}>
              {isFreeActive ? "Free" : "Active"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <p className="text-lg font-bold">{activePlanName}</p>
            <span className="text-xs text-muted-foreground">
              {activePrice > 0 ? `$${activePrice} / ${activePeriodDays} days` : "· Lifetime"}
            </span>
          </div>
          {activeExpires ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Expires {new Date(activeExpires).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              {daysLeft !== null && <span className={daysLeft <= 3 ? "font-semibold text-red-500" : ""}> · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-emerald-600">Never expires — lifetime plan</p>
          )}
          <div className="mt-5 space-y-3">
            {[
              ["Storage", formatBytes(totalUsedBytes) + " / " + formatBytes(storage?.storageLimit || 0) + (totalCollectionBytes > 0 ? " (incl. DB)" : "")],
              ["Simple Chatbots", usedSimple + " / " + simpleBotLimit],
              ["Agency Chatbots", usedAgency + " / " + agencyBotLimit],
              ["Databases", usedDB + " / " + totalDB],
              ["API Calls / Day", usedApiCalls + " / " + apiLimitV],
              ["Emails / Day", emailLimit > 0 ? "0 / " + emailLimit : "Not included"],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Link to="/plans"
              onMouseEnter={() => setUpgradeHover(true)}
              onMouseLeave={() => setUpgradeHover(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ArrowUpCircle className={"h-4 w-4 transition-transform " + (upgradeHover ? "translate-y-[-2px]" : "")} />
              {activePrice > 0 ? "Manage / Renew Plan" : "Upgrade to Business"}
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
