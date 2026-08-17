import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bot, HardDrive, Cpu, Search, X, Users, Database, MessageSquare, TrendingUp,
  ArrowUpCircle, Shield, Loader2,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/storage")({
  head: () => ({ meta: [{ title: "Storage Manage — Admin" }] }),
  component: AdminStorage,
});

interface StorageChatbot {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  installs: number;
  orderCount: number;
  conversationCount: number;
  messageCount: number;
  knowledgeChunkCount: number;
  knowledgeChunkBytes: number;
  storageUsed: number;
  storageLimit: number;
  dailyApiCalls: number;
  apiLimit: number;
  createdAt: string;
  adminUserId: { _id: string; username: string; email: string };
}

interface StorageItem {
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
  apiCallDate: string;
  lastCalculatedAt: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function AdminStorage() {
  const [chatbots, setChatbots] = useState<StorageChatbot[]>([]);
  const [storages, setStorages] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StorageChatbot | null>(null);
  const [detail, setDetail] = useState<{ storage: StorageItem; user?: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chatbots" | "users">("chatbots");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch("/api/admin/chatbots", { headers }).then((r) => r.json()).catch(() => []),
      fetch("/api/admin/stats", { headers }).then((r) => r.json()).catch(() => ({} as any)),
    ])
      .then(([bots]) => {
        const botList = (Array.isArray(bots) ? bots : []) as StorageChatbot[];
        setChatbots(botList);
        const userStorages = botList.reduce<Record<string, StorageItem>>((acc, b) => {
          const ownerId = b.adminUserId?._id || "unknown";
          const key = ownerId;
          if (!acc[key]) {
            acc[key] = {
              _id: key,
              userId: ownerId,
              planId: null,
              storageUsed: 0,
              storageLimit: 0,
              dailyApiCalls: 0,
              apiLimit: 0,
              totalChatbots: 0,
              totalActiveChatbots: 0,
              totalSimpleChatbots: 0,
              totalAgencyChatbots: 0,
              totalDBCollections: 0,
              totalScripts: 0,
              apiCallDate: "",
              lastCalculatedAt: "",
            };
          }
          acc[key].storageUsed += b.storageUsed || 0;
          acc[key].storageLimit = b.storageLimit || acc[key].storageLimit;
          acc[key].dailyApiCalls += b.dailyApiCalls || 0;
          acc[key].apiLimit = b.apiLimit || acc[key].apiLimit;
          acc[key].totalChatbots += 1;
          if (b.isActive) acc[key].totalActiveChatbots += 1;
          if (b.type === "simple") acc[key].totalSimpleChatbots += 1;
          if (b.type === "agency") acc[key].totalAgencyChatbots += 1;
          acc[key].totalScripts += b.installs || 0;
          return acc;
        }, {});
        setStorages(Object.values(userStorages));
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredChatbots = useMemo(
    () =>
      chatbots.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.adminUserId?.username || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [chatbots, search],
  );

  const filteredStorages = useMemo(
    () =>
      storages.filter((s) =>
        chatbots
          .filter((b) => (b.adminUserId?._id || "unknown") === s.userId)
          .some((b) => b.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [storages, chatbots, search],
  );

  const totals = useMemo(() => {
    const used = chatbots.reduce((a, b) => a + (b.storageUsed || 0), 0);
    const limit = chatbots.reduce((a, b) => a + (b.storageLimit || 0), 0);
    const api = chatbots.reduce((a, b) => a + (b.dailyApiCalls || 0), 0);
    const apiLimit = chatbots.reduce((a, b) => a + (b.apiLimit || 0), 0);
    return { used, limit, api, apiLimit, bots: chatbots.length, active: chatbots.filter((b) => b.isActive).length };
  }, [chatbots]);

  const loadDetail = (chatbot: StorageChatbot) => {
    setSelected(chatbot);
    setDetail(null);
    setDetailLoading(true);
    const ownerId = chatbot.adminUserId?._id;
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    if (!ownerId) {
      setDetailLoading(false);
      return;
    }
    fetch(`/api/admin/users/${ownerId}/storage`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setDetail({ storage: d.storage, user: d.user });
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const statCards = [
    { label: "Storage Used", value: formatBytes(totals.used), icon: HardDrive, color: "from-violet-500 to-indigo-500", hint: `of ${formatBytes(totals.limit)}` },
    { label: "API Calls / Day", value: totals.api.toLocaleString(), icon: Cpu, color: "from-fuchsia-500 to-pink-500", hint: `limit ${totals.apiLimit.toLocaleString()}` },
    { label: "Total Chatbots", value: totals.bots.toLocaleString(), icon: Bot, color: "from-sky-500 to-cyan-500", hint: `${totals.active} active` },
    { label: "Owners", value: storages.length.toLocaleString(), icon: Users, color: "from-emerald-500 to-teal-500", hint: "users with storage" },
  ];

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <HardDrive className="h-3.5 w-3.5" /> Storage & Resources
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Storage Manage</h1>
          <p className="text-sm text-muted-foreground">Storage and API usage across every chatbot and owner.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border/60 bg-card p-0.5">
            <button
              onClick={() => setActiveTab("chatbots")}
              className={"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " + (activeTab === "chatbots" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Bot className="h-3.5 w-3.5" /> Chatbots
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " + (activeTab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Users className="h-3.5 w-3.5" /> Users
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.color} opacity-15 blur-2xl`} />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium text-muted-foreground">{s.label}</div>
              <div className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-soft`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading storage data...
        </div>
      ) : activeTab === "chatbots" ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-5 py-3">
            <HardDrive className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Chatbot Storage</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">{filteredChatbots.length} chatbots</span>
          </div>
          {filteredChatbots.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">No chatbots found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">Chatbot</th>
                    <th className="px-4 py-3 text-left font-semibold">Owner</th>
                    <th className="px-4 py-3 text-left font-semibold">Storage</th>
                    <th className="px-4 py-3 text-left font-semibold">API Calls / Day</th>
                    <th className="px-4 py-3 text-center font-semibold">Messages</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChatbots.map((b) => {
                    const pct = b.storageLimit > 0 ? Math.min(100, Math.round(((b.storageUsed || 0) / b.storageLimit) * 100)) : 0;
                    const apiPct = b.apiLimit > 0 ? Math.min(100, Math.round(((b.dailyApiCalls || 0) / b.apiLimit) * 100)) : 0;
                    return (
                      <tr
                        key={b._id}
                        onClick={() => loadDetail(b)}
                        className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                              <Bot className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-medium">{b.name}</div>
                              <div className="text-[10px] text-muted-foreground capitalize">{b.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{b.adminUserId?.username ?? "Unknown"}</td>
                        <td className="px-4 py-3">
                          <div className="w-40">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold">{formatBytes(b.storageUsed || 0)}</span>
                              <span className="text-muted-foreground">/ {formatBytes(b.storageLimit)}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className={"h-full rounded-full " + (pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: pct + "%" }} />
                            </div>
                            <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{pct}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold">{b.dailyApiCalls || 0}</span>
                              <span className="text-muted-foreground">/ {b.apiLimit}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className={"h-full rounded-full " + (apiPct >= 90 ? "bg-red-500" : apiPct >= 60 ? "bg-amber-500" : "bg-fuchsia-500")} style={{ width: apiPct + "%" }} />
                            </div>
                            <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{apiPct}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{b.messageCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                            {b.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(b.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-5 py-3">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">User Storage Overview</h3>
            <span className="ml-auto text-[10px] text-muted-foreground">{filteredStorages.length} users</span>
          </div>
          {filteredStorages.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">Owner</th>
                    <th className="px-4 py-3 text-left font-semibold">Storage Used</th>
                    <th className="px-4 py-3 text-left font-semibold">API Calls / Day</th>
                    <th className="px-4 py-3 text-center font-semibold">Chatbots</th>
                    <th className="px-4 py-3 text-center font-semibold">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStorages.map((s) => {
                    const ownerBots = chatbots.filter((b) => (b.adminUserId?._id || "unknown") === s.userId);
                    const owner = ownerBots[0]?.adminUserId?.username || "Unknown";
                    const pct = s.storageLimit > 0 ? Math.min(100, Math.round(((s.storageUsed || 0) / s.storageLimit) * 100)) : 0;
                    const apiPct = s.apiLimit > 0 ? Math.min(100, Math.round(((s.dailyApiCalls || 0) / s.apiLimit) * 100)) : 0;
                    return (
                      <tr key={s._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-[9px] font-bold text-white">
                              {owner.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{owner}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-40">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold">{formatBytes(s.storageUsed)}</span>
                              <span className="text-muted-foreground">/ {formatBytes(s.storageLimit)}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className={"h-full rounded-full " + (pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: pct + "%" }} />
                            </div>
                            <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{pct}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold">{s.dailyApiCalls}</span>
                              <span className="text-muted-foreground">/ {s.apiLimit}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className={"h-full rounded-full " + (apiPct >= 90 ? "bg-red-500" : apiPct >= 60 ? "bg-amber-500" : "bg-fuchsia-500")} style={{ width: apiPct + "%" }} />
                            </div>
                            <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{apiPct}%</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{s.totalChatbots}</td>
                        <td className="px-4 py-3 text-center">{s.totalActiveChatbots}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4 shrink-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selected.name}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  by {selected.adminUserId?.username || "Unknown"} · {selected.adminUserId?.email || ""}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="grid h-7 w-7 place-items-center rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : !detail?.storage ? (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <HardDrive className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs">No storage record for this owner yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><HardDrive className="h-3 w-3" /> Storage Used</span>
                      <p className="mt-0.5 text-sm font-semibold">{formatBytes(detail.storage.storageUsed)}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><ArrowUpCircle className="h-3 w-3" /> Storage Limit</span>
                      <p className="mt-0.5 text-sm font-semibold">{formatBytes(detail.storage.storageLimit)}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Cpu className="h-3 w-3" /> API Calls / Day</span>
                      <p className="mt-0.5 text-sm font-semibold">{detail.storage.dailyApiCalls} / {detail.storage.apiLimit}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Shield className="h-3 w-3" /> Plan</span>
                      <p className="mt-0.5 text-sm font-semibold capitalize">{detail.storage.planId?.name || "Free Plan"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Bot className="h-3 w-3" /> Chatbots</span>
                      <p className="mt-0.5 text-sm font-semibold">{detail.storage.totalChatbots}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><TrendingUp className="h-3 w-3" /> Active</span>
                      <p className="mt-0.5 text-sm font-semibold">{detail.storage.totalActiveChatbots}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Database className="h-3 w-3" /> DB Collections</span>
                      <p className="mt-0.5 text-sm font-semibold">{detail.storage.totalDBCollections}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MessageSquare className="h-3 w-3" /> Scripts</span>
                      <p className="mt-0.5 text-sm font-semibold">{detail.storage.totalScripts}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3 w-3" /> API Usage Today
                    </h4>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={"h-full rounded-full " + (detail.storage.apiLimit > 0 && detail.storage.dailyApiCalls / detail.storage.apiLimit >= 0.9 ? "bg-red-500" : "bg-fuchsia-500")}
                        style={{ width: Math.min(100, detail.storage.apiLimit > 0 ? Math.round((detail.storage.dailyApiCalls / detail.storage.apiLimit) * 100) : 0) + "%" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
