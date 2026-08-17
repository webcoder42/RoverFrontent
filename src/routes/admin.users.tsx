import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, X, Bot, HardDrive, Cpu, Database, MessageSquare, Shield, TrendingUp, Loader2, ArrowUpCircle } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "All Users — Admin" }] }),
  component: AdminUsers,
});

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserStorage {
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

interface ChatbotStorage {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  installs: number;
  orderCount: number;
  conversationCount: number;
  messageCount: number;
  knowledgeChunkCount: number;
  storageBytes: number;
  createdAt: string;
}

interface UserStorageResponse {
  user: User;
  storage: UserStorage | null;
  chatbots: ChatbotStorage[];
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [detail, setDetail] = useState<UserStorageResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/admin/stats", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.recentUsers) setUsers(data.recentUsers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (user: User) => {
    setSelected(user);
    setDetail(null);
    setDetailLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`/api/admin/users/${user._id}/storage`, { headers })
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const storage = detail?.storage;
  const storagePct = storage?.storageLimit
    ? Math.min(100, Math.round(((storage.storageUsed || 0) / storage.storageLimit) * 100))
    : 0;
  const apiPct = storage?.apiLimit
    ? Math.min(100, Math.round(((storage.dailyApiCalls || 0) / storage.apiLimit) * 100))
    : 0;

  const InfoBox = ({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) => (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</span>
      <p className={"mt-0.5 text-sm font-semibold " + color}>{value}</p>
    </div>
  );

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">All Users</h1>
          <p className="text-sm text-muted-foreground">Everyone registered on the platform.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-56 rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">No users found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-center font-semibold">Role</th>
                <th className="px-4 py-3 text-right font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => openDetail(u)}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-[9px] font-bold text-white">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${u.role === "admin" ? "bg-rose-50 text-rose-600" : "bg-muted text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4 shrink-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white">
                {selected.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selected.username}</h2>
                <p className="text-xs text-muted-foreground truncate">{selected.email} · {selected.role}</p>
              </div>
              <button onClick={() => setSelected(null)} className="grid h-7 w-7 place-items-center rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading storage details...
                </div>
              ) : !storage ? (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <HardDrive className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-xs">No storage record for this user yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Plan & storage summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-rose-500" />
                      <h3 className="text-sm font-semibold">{storage.planId?.name || "Free Plan"}</h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Last calculated {storage.lastCalculatedAt ? formatDate(storage.lastCalculatedAt) : "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <InfoBox label="Storage Used" value={`${formatBytes(storage.storageUsed)} / ${formatBytes(storage.storageLimit)}`} icon={<HardDrive className="h-3 w-3" />} color="text-violet-600" />
                    <InfoBox label="API Calls / Day" value={`${storage.dailyApiCalls} / ${storage.apiLimit}`} icon={<Cpu className="h-3 w-3" />} color="text-fuchsia-600" />
                    <InfoBox label="Chatbots" value={String(storage.totalChatbots)} icon={<Bot className="h-3 w-3" />} color="text-sky-600" />
                    <InfoBox label="Active Bots" value={String(storage.totalActiveChatbots)} icon={<TrendingUp className="h-3 w-3" />} color="text-emerald-600" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <InfoBox label="Simple Bots" value={String(storage.totalSimpleChatbots)} icon={<Bot className="h-3 w-3" />} color="" />
                    <InfoBox label="Agency Bots" value={String(storage.totalAgencyChatbots)} icon={<Bot className="h-3 w-3" />} color="" />
                    <InfoBox label="DB Collections" value={String(storage.totalDBCollections)} icon={<Database className="h-3 w-3" />} color="" />
                    <InfoBox label="Scripts" value={String(storage.totalScripts)} icon={<ArrowUpCircle className="h-3 w-3" />} color="" />
                  </div>

                  {/* Storage bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-muted-foreground">Storage used</span>
                      <span className="font-semibold">{storagePct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={"h-full rounded-full " + (storagePct >= 90 ? "bg-red-500" : storagePct >= 60 ? "bg-amber-500" : "bg-violet-500")} style={{ width: storagePct + "%" }} />
                    </div>
                  </div>

                  {/* API bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-muted-foreground">API calls used today</span>
                      <span className="font-semibold">{apiPct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={"h-full rounded-full " + (apiPct >= 90 ? "bg-red-500" : apiPct >= 60 ? "bg-amber-500" : "bg-fuchsia-500")} style={{ width: apiPct + "%" }} />
                    </div>
                  </div>

                  {/* Per-chatbot breakdown */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Bot className="h-3 w-3" /> Chatbot Breakdown
                      </h4>
                      <span className="text-[10px] text-muted-foreground">{detail?.chatbots?.length || 0} chatbots</span>
                    </div>
                    {!detail?.chatbots || detail.chatbots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No chatbots found.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.chatbots.map((b) => {
                          const botPct = storage.storageLimit ? Math.min(100, Math.round(((b.storageBytes || 0) / storage.storageLimit) * 100)) : 0;
                          return (
                            <div key={b._id} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                                    <Bot className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold">{b.name}</div>
                                    <div className="text-[10px] text-muted-foreground capitalize">{b.type} · {b.installs} installs</div>
                                  </div>
                                </div>
                                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                                  {b.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                                <div className="rounded bg-muted px-2 py-1">
                                  <span className="text-muted-foreground">Storage</span>
                                  <p className="font-semibold">{formatBytes(b.storageBytes)}</p>
                                </div>
                                <div className="rounded bg-muted px-2 py-1">
                                  <span className="text-muted-foreground">Conversations</span>
                                  <p className="font-semibold">{b.conversationCount}</p>
                                </div>
                                <div className="rounded bg-muted px-2 py-1">
                                  <span className="text-muted-foreground">Messages</span>
                                  <p className="font-semibold">{b.messageCount}</p>
                                </div>
                                <div className="rounded bg-muted px-2 py-1">
                                  <span className="text-muted-foreground">Orders</span>
                                  <p className="font-semibold">{b.orderCount}</p>
                                </div>
                                <div className="rounded bg-muted px-2 py-1">
                                  <span className="text-muted-foreground">Knowledge</span>
                                  <p className="font-semibold">{b.knowledgeChunkCount}</p>
                                </div>
                              </div>
                              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-cyan-500" style={{ width: botPct + "%" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
