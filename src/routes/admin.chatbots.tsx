import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Search, X, HardDrive, MessageSquare, ShoppingCart, FileText, Database, Cpu, Globe, Layers, CreditCard, Download, User, Calendar } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/chatbots")({
  head: () => ({ meta: [{ title: "All Chatbots — Admin" }] }),
  component: AdminChatbots,
});

interface ChatbotDetail {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  installs: number;
  orderCount: number;
  createdAt: string;
  adminUserId: { _id: string; username: string; email: string };
  theme?: { template?: string; primaryColor?: string; secondaryColor?: string };
  ai?: { provider?: string; model?: string };
  knowledge?: {
    files?: any[]; knowledgeBase?: any[]; trainingKnowledge?: any[];
    trainingSheet?: any[]; trainingFlow?: string; onlyKnowledge?: boolean;
    extractedServices?: string[];
  };
  dbCollection?: { connected?: boolean; dbType?: string; table?: string; db?: string; host?: string; port?: number };
  productCollection?: { connected?: boolean; dbType?: string; table?: string; db?: string; host?: string; port?: number };
  embedScript?: string;
  installedUrls?: string[];
  conversationCount: number;
  messageCount: number;
  knowledgeChunkCount: number;
  knowledgeChunkBytes: number;
  storageUsed: number;
  storageLimit: number;
  dailyApiCalls: number;
  apiLimit: number;
}

interface OrderItem {
  _id: string;
  serviceName: string;
  customerDetails: Record<string, string>;
  orderData: Record<string, any>;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalAmount: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

interface ConversationItem {
  _id: string;
  sessionId: string;
  userId?: string;
  messages: Array<{ id: string; sender: string; text: string; timestamp: string }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeChunkItem {
  _id: string;
  text: string;
}

interface ChatbotDetailsData {
  chatbot: any;
  conversations: ConversationItem[];
  orders: OrderItem[];
  knowledgeChunks: KnowledgeChunkItem[];
  storage: any;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function AdminChatbots() {
  const [chatbots, setChatbots] = useState<ChatbotDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ChatbotDetail | null>(null);
  const [details, setDetails] = useState<ChatbotDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/admin/chatbots", { headers })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setChatbots(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = chatbots.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const DetailBox = ({ label, value, icon, capitalize, color }: { label: string; value: string; icon?: any; capitalize?: boolean; color?: string }) => (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</span>
      <p className={"mt-0.5 text-xs font-semibold " + (color || "") + (capitalize ? " capitalize" : "")}>{value}</p>
    </div>
  );

  const statCard = (label: string, value: string, icon: any, color: string) => (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
      <div className={"grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br " + color + " text-white shadow-xs"}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold">{value}</div>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">All Chatbots</h1>
          <p className="text-sm text-muted-foreground">Every chatbot created on the platform.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search chatbots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-56 rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">No chatbots found.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Owner</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Template</th>
                <th className="px-4 py-3 text-center font-semibold">Installs</th>
                <th className="px-4 py-3 text-center font-semibold">Orders</th>
                <th className="px-4 py-3 text-center font-semibold">Conversations</th>
                <th className="px-4 py-3 text-center font-semibold">Storage</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b._id}
                  onClick={() => { setSelected(b); setActiveTab("overview"); setDetails(null); }}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.adminUserId?.username ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{b.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.theme?.template || "—"}</td>
                  <td className="px-4 py-3 text-center">{b.installs}</td>
                  <td className="px-4 py-3 text-center">{b.orderCount}</td>
                  <td className="px-4 py-3 text-center">{b.conversationCount}</td>
                  <td className="px-4 py-3 text-center font-mono text-[11px]">{formatBytes(b.storageUsed)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
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

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border/60 px-6 pt-3 shrink-0 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: Bot },
                { id: "conversations", label: "Conversations", icon: MessageSquare },
                { id: "orders", label: "Orders", icon: ShoppingCart },
                { id: "knowledge", label: "Knowledge", icon: FileText },
                { id: "database", label: "Database", icon: Database },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (tab.id !== "overview" && !details) { setDetailsLoading(true); fetch(`/api/admin/chatbots/${selected._id}/details`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()).then(d => setDetails(d)).catch(() => {}).finally(() => setDetailsLoading(false)); } }}
                  className={"flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors shrink-0 " + (activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statCard("Installs", String(selected.installs), <Globe className="h-3.5 w-3.5" />, "from-sky-500 to-cyan-500")}
                    {statCard("Orders", String(selected.orderCount), <ShoppingCart className="h-3.5 w-3.5" />, "from-amber-500 to-orange-500")}
                    {statCard("Conversations", String(selected.conversationCount), <MessageSquare className="h-3.5 w-3.5" />, "from-emerald-500 to-teal-500")}
                    {statCard("Messages", String(selected.messageCount), <MessageSquare className="h-3.5 w-3.5" />, "from-fuchsia-500 to-pink-500")}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailBox label="Type" value={selected.type} capitalize />
                    <DetailBox label="Template" value={selected.theme?.template || "—"} />
                    <DetailBox label="AI Provider" value={selected.ai?.provider || "—"} capitalize />
                    <DetailBox label="AI Model" value={selected.ai?.model || "—"} />
                    <DetailBox label="Status" value={selected.isActive ? "Active" : "Inactive"} color={selected.isActive ? "text-emerald-600" : ""} />
                    <DetailBox label="Created" value={formatDate(selected.createdAt)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailBox label="Storage Used" value={`${formatBytes(selected.storageUsed)} / ${formatBytes(selected.storageLimit)}`} icon={<HardDrive className="h-3 w-3" />} />
                    <DetailBox label="API Calls Today" value={`${selected.dailyApiCalls} / ${selected.apiLimit}`} icon={<Cpu className="h-3 w-3" />} />
                  </div>
                  {selected.installedUrls && selected.installedUrls.length > 0 && (
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Globe className="h-3 w-3" /> Installed On</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">{selected.installedUrls.map((url, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{url}</span>)}</div>
                    </div>
                  )}
                  {selected.knowledge?.extractedServices && selected.knowledge.extractedServices.length > 0 && (
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Layers className="h-3 w-3" /> Services ({selected.knowledge.extractedServices.length})</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">{selected.knowledge.extractedServices.map((s, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[10px]">{s}</span>)}</div>
                    </div>
                  )}
                  {selected.embedScript && (
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="text-[10px] text-muted-foreground">Embed Script</span>
                      <p className="mt-0.5 text-[10px] font-mono text-muted-foreground break-all line-clamp-2">{selected.embedScript}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "conversations" && (
                <div>
                  {detailsLoading ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading...</div>
                  : !details ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading failed</div>
                  : details.conversations.length === 0 ? <div className="flex h-40 items-center justify-center text-muted-foreground">No conversations</div>
                  : <div className="space-y-2">
                      {details.conversations.map((conv) => (
                        <div key={conv._id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-[10px] text-muted-foreground">{conv.sessionId.slice(0, 24)}...</span>
                              <span className={"text-[10px] px-1.5 py-0.5 rounded " + (conv.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>{conv.status}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatDate(conv.createdAt)}</span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {conv.messages.slice(-5).map((msg) => (
                              <div key={msg.id} className={"flex gap-1.5 text-[11px] " + (msg.sender === "user" ? "" : "justify-end")}>
                                <span className={"shrink-0 font-semibold " + (msg.sender === "user" ? "text-sky-500" : msg.sender === "bot" ? "text-amber-500" : "text-violet-500")}>{msg.sender === "user" ? "U" : msg.sender === "bot" ? "B" : "A"}:</span>
                                <span className="text-muted-foreground truncate">{msg.text}</span>
                              </div>
                            ))}
                          </div>
                          {conv.messages.length > 5 && <div className="text-[10px] text-muted-foreground mt-1">+{conv.messages.length - 5} more messages</div>}
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )}

              {activeTab === "orders" && (
                <div>
                  {detailsLoading ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading...</div>
                  : !details ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading failed</div>
                  : details.orders.length === 0 ? <div className="flex h-40 items-center justify-center text-muted-foreground">No orders</div>
                  : <div className="space-y-2">
                      {details.orders.map((order) => (
                        <div key={order._id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs">
                              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                              <span className="font-semibold">{order.serviceName}</span>
                              {order.totalAmount ? <span className="font-mono text-[11px]">${order.totalAmount}</span> : null}
                            </div>
                            <div className="flex gap-1.5">
                              <span className={"text-[10px] px-1.5 py-0.5 rounded " + (order.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-500" : order.paymentStatus === "failed" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground")}>{order.paymentStatus || "unpaid"}</span>
                              <span className={"text-[10px] px-1.5 py-0.5 rounded " + (order.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : order.status === "cancelled" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground")}>{order.status}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                            {order.paymentMethod && <span><CreditCard className="h-3 w-3 inline mr-1" />{order.paymentMethod}</span>}
                            <span><Calendar className="h-3 w-3 inline mr-1" />{formatDate(order.createdAt)}</span>
                          </div>
                          {order.customerDetails && Object.keys(order.customerDetails).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                              {Object.entries(order.customerDetails).map(([k, v]) => (
                                <span key={k} className="rounded bg-muted px-1.5 py-0.5"><span className="text-muted-foreground">{k}:</span> {v}</span>
                              ))}
                            </div>
                          )}
                          {order.stripePaymentIntentId && <div className="mt-1 text-[9px] font-mono text-muted-foreground">PI: {order.stripePaymentIntentId}</div>}
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )}

              {activeTab === "knowledge" && (
                <div>
                  {detailsLoading ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading...</div>
                  : !details ? <div className="flex h-40 items-center justify-center text-muted-foreground">Loading failed</div>
                  : <div className="space-y-3">
                      {/* Files */}
                      {(() => {
                        const k = details.chatbot?.knowledge || {};
                        const sections = [
                          { title: "Uploaded Files", items: k.files || [], fields: ["name", "content"] },
                          { title: "Knowledge Base", items: k.knowledgeBase || [], fields: ["name", "content", "url"] },
                          { title: "Training Knowledge", items: k.trainingKnowledge || [], fields: ["name", "content", "url"] },
                          { title: "Training Sheet", items: k.trainingSheet || [], fields: ["name", "content", "url"] },
                        ];
                        return sections.map((section) => (
                          <div key={section.title}>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">{section.title} ({section.items.length})</h4>
                            {section.items.length === 0 ? <p className="text-[11px] text-muted-foreground">None</p>
                            : <div className="space-y-1">
                                {section.items.map((item: any, i: number) => (
                                  <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2">
                                    <div className="text-xs font-medium">{item.name || "Unnamed"}</div>
                                    {item.content && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>}
                                    {item.url && <p className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">{item.url}</p>}
                                  </div>
                                ))}
                              </div>
                            }
                          </div>
                        ));
                      })()}

                      {/* Training Flow */}
                      {details.chatbot?.knowledge?.trainingFlow && (
                        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Training Flow</h4>
                          <p className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap line-clamp-4">{details.chatbot.knowledge.trainingFlow}</p>
                        </div>
                      )}

                      {/* Knowledge Chunks */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Knowledge Chunks ({details.knowledgeChunks.length})</h4>
                        {details.knowledgeChunks.length === 0 ? <p className="text-[11px] text-muted-foreground">No chunks</p>
                        : <div className="space-y-1 max-h-60 overflow-y-auto">
                            {details.knowledgeChunks.slice(0, 50).map((chunk) => (
                              <div key={chunk._id} className="rounded border border-border/40 bg-muted/20 p-2">
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{chunk.text}</p>
                              </div>
                            ))}
                            {details.knowledgeChunks.length > 50 && <p className="text-[10px] text-muted-foreground">+{details.knowledgeChunks.length - 50} more chunks</p>}
                          </div>
                        }
                      </div>

                      {/* Settings */}
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Settings</h4>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span>Only Knowledge: {details.chatbot?.knowledge?.onlyKnowledge ? "Yes" : "No"}</span>
                          <span>·</span>
                          <span>Answer Any Question: {details.chatbot?.knowledge?.answerAnyQuestion ? "Yes" : "No"}</span>
                          {details.chatbot?.orderSystemEnabled && <><span>·</span><span>Order System: Enabled</span></>}
                        </div>
                      </div>
                    </div>
                  }
                </div>
              )}

              {activeTab === "database" && (
                <div className="space-y-3">
                  {(() => {
                    const db = selected.dbCollection;
                    const prod = selected.productCollection;
                    return <>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> DB Collection</h4>
                        {db?.connected ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <span>Type: {db.dbType || "—"}</span>
                            <span>Table: {db.table || "—"}</span>
                            <span>Database: {db.db || "—"}</span>
                            <span>Host: {db.host || "—"}</span>
                            <span>Port: {db.port || "—"}</span>
                          </div>
                        ) : <p className="text-[11px] text-muted-foreground">Not connected</p>}
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Products Collection</h4>
                        {prod?.connected ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <span>Type: {prod.dbType || "—"}</span>
                            <span>Table: {prod.table || "—"}</span>
                            <span>Database: {prod.db || "—"}</span>
                            <span>Host: {prod.host || "—"}</span>
                            <span>Port: {prod.port || "—"}</span>
                          </div>
                        ) : <p className="text-[11px] text-muted-foreground">Not connected</p>}
                      </div>
                    </>;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
