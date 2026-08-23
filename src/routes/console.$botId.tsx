import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ReceiptText,
  UserRound,
  Store,
  CheckCircle2,
  Loader2,
  Shield,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { config } from "@/lib/config";

export const Route = createFileRoute("/console/$botId")({
  head: () => ({ meta: [{ title: "Analytics Console — WeBotMe" }] }),
  component: ConsoleDashboard,
});

type TrendPoint = { date: string; label: string; revenue: number; orders: number };
type RecentOrder = {
  id: string;
  orderNo: string;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
};
type Analytics = {
  revenue30: number;
  orders30: number;
  avgOrderValue: number;
  customers: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  trend: TrendPoint[];
  recentOrders: RecentOrder[];
  botName: string;
};
type ProductItemDto = {
  id: string;
  name: string;
  price: string | number;
  category: string;
  image?: string;
  description?: string;
  stock?: number;
};
type OrderItemDto = { name: string; price: number; quantity: number };
type OrderDto = {
  id: string;
  orderNo: string;
  customer: { fullName: string; phone: string; email: string; address: string };
  serviceName: string;
  items: OrderItemDto[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
};
type CustomerDto = {
  name: string;
  contact: string;
  orders: number;
  spent: number;
  lastAt: string | null;
};

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "customers", label: "Customers", icon: Users },
  { key: "settings", label: "Settings", icon: SettingsIcon },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const fmtMoney = (sym: string, n: number) =>
  `${n < 0 ? "-" : ""}${sym}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// ── Console session guard ──────────────────────────────────────────────────
// The dashboard only renders in a tab that passed the ID gate. sessionStorage
// is per-tab: copying the dashboard URL into another browser/tab carries no
// token, so the visitor is bounced back to /console.
const SESSION_KEY = "webotme-console-session";
const getSessionToken = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
};
const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
};
const consoleFetch = (url: string, init?: RequestInit) =>
  fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), "x-console-session": getSessionToken() },
  });
// Wrap every console response — an expired/missing session bounces to the gate
const asJson = async (r: Response): Promise<Response> => {
  if (r.status === 401) {
    clearSession();
    window.location.replace("/console");
    await new Promise(() => {}); // halt while redirecting
  }
  return r;
};

function ConsoleDashboard() {
  const { botId } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [products, setProducts] = useState<ProductItemDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [symbol, setSymbol] = useState("$");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notAgency, setNotAgency] = useState(false);
  const [storeActivated, setStoreActivated] = useState(false);
  const [storeBotId, setStoreBotId] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadAll = async () => {
    // No token in this tab → never came through the ID gate → back to gate
    if (!getSessionToken()) {
      navigate({ to: "/console", replace: true });
      return;
    }
    setLoading(true);
    setError("");
    setNotAgency(false);

    try {
      // `botId` param actually carries the secret console KEY (wc_…)
      const base = `${config.apiBaseUrl}/api/store/console/${botId}`;
      // Config first — tells us if the key is valid at all
      const cfgRes = await asJson(await consoleFetch(`${base}/config`));
      if (!cfgRes.ok) {
        setError("Invalid console ID. Please check and try again.");
        return;
      }
      const cfg = await cfgRes.json();
      setSymbol(cfg.currencySymbol || "$");
      setStoreActivated(!!cfg.activated);
      setStoreBotId(cfg.chatbotId || "");

      const anRes = await asJson(await consoleFetch(`${base}/analytics`));
      if (anRes.status === 403) {
        setNotAgency(true);
        return;
      }
      if (!anRes.ok) throw new Error("analytics");
      setAnalytics(await anRes.json());
      setLastSync(new Date());
      // Secondary loads — non-fatal
      consoleFetch(`${base}/products`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setProducts(d.products || [])).catch(() => {});
      consoleFetch(`${base}/orders`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setOrders(d.orders || [])).catch(() => {});
      consoleFetch(`${base}/customers`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setCustomers(d.customers || [])).catch(() => {});
    } catch {
      setError("Could not load the console. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  const consoleName = useMemo(() => {
    if (!analytics) return "Analytics Console";
    return `${analytics.botName} Console`;
  }, [analytics]);

  if (notAgency) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0f1a] px-4">
        <div className="max-w-sm text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-slate-500" />
          <h2 className="text-base font-bold text-white">Agency access required</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            The analytics console is only available for <span className="font-semibold text-blue-300">agency chatbots</span>.
            This chatbot is on the simple plan.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0f1a] px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <p className="text-sm text-slate-300">{error}</p>
          <Link
            to="/console"
            className="mt-4 inline-block rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Back to ID entry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/60 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
            <BarChart3 className="h-4 w-4 text-white" />
          </span>
          <span className="truncate text-sm font-bold tracking-tight text-white">{consoleName}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                tab === key
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800/80 p-4">
          {storeActivated && storeBotId ? (
            <a
              href={`/store/${storeBotId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800/60 hover:text-emerald-300"
            >
              <Store className="h-4 w-4" /> View Storefront <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ) : (
            <p className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] leading-snug text-slate-500">
              <Store className="h-4 w-4 shrink-0 opacity-60" />
              Store not activated — enable it in Settings
            </p>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0b0f1a]/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 overflow-x-auto md:hidden">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                  tab === key ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30" : "text-slate-400 hover:bg-slate-800/60"
                }`}
                title={TABS.find((t) => t.key === key)?.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <RefreshCw
              onClick={loadAll}
              className={`h-3.5 w-3.5 cursor-pointer transition hover:text-slate-300 ${loading ? "animate-spin" : ""}`}
            />
            {lastSync && !loading
              ? `Last synced ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Syncing…"}
            <span className="ml-2 rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              KEY {botId.slice(0, 14)}…
            </span>
          </div>
          {storeActivated && storeBotId ? (
            <a
              href={`/store/${storeBotId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Store className="h-3.5 w-3.5" /> View Storefront
            </a>
          ) : (
            <button
              onClick={() => setTab("settings")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <Store className="h-3.5 w-3.5" /> Activate Store
            </button>
          )}
        </header>

        <div className="p-5 md:p-8">
          {loading && !analytics ? (
            <div className="grid h-64 place-items-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            </div>
          ) : analytics ? (
            <>
              {/* Mobile heading */}
              <div className="mb-5 md:hidden">
                <h1 className="text-lg font-bold text-white">Dashboard Overview</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              {tab === "dashboard" && <OverviewTab a={analytics} symbol={symbol} />}
              {tab === "products" && <ProductsTab products={products} symbol={symbol} />}
              {tab === "orders" && <OrdersTab orders={orders} symbol={symbol} />}
              {tab === "customers" && <CustomersTab customers={customers} />}
              {tab === "settings" && (
                <SettingsTab
                  botId={botId}
                  botName={analytics.botName}
                  activated={storeActivated}
                  chatbotId={storeBotId}
                  onActivated={() => setStoreActivated(true)}
                />
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="flex items-center justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </motion.div>
  );
}

function OverviewTab({ a, symbol }: { a: Analytics; symbol: string }) {
  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-lg font-bold text-white">Dashboard Overview</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ·
          Last synced just now
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue (30d)"
          value={fmtMoney(symbol, a.revenue30)}
          tone="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={ReceiptText}
          label="Orders (30d)"
          value={String(a.orders30)}
          tone="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={fmtMoney(symbol, a.avgOrderValue)}
          tone="bg-indigo-500/15 text-indigo-400"
        />
        <StatCard
          icon={UserRound}
          label="Total Customers"
          value={String(a.customers)}
          tone="bg-fuchsia-500/15 text-fuchsia-400"
        />
        <StatCard
          icon={Package}
          label="Active Products"
          value={String(a.activeProducts)}
          tone="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low / Out of Stock"
          value={String(a.lowStock + a.outOfStock)}
          sub={a.outOfStock > 0 ? `${a.outOfStock} out of stock` : undefined}
          tone="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={RefreshCw}
          label="Pending Orders"
          value={String(a.pendingOrders)}
          tone="bg-orange-500/15 text-orange-400"
        />
        <StatCard
          icon={ShoppingCart}
          label="Completed Orders"
          value={String(a.completedOrders)}
          sub={`${a.confirmedOrders} confirmed · ${a.cancelledOrders} cancelled`}
          tone="bg-violet-500/15 text-violet-400"
        />
      </div>

      {/* Revenue trend */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
          <span className="text-[11px] text-slate-500">Last 30 days</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={a.trend} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval={4}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={((v: number, name: string) =>
                  name === "revenue" ? [fmtMoney(symbol, v), "Revenue"] : [v, "Orders"]) as any}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <button onClick={() => {}} className="hidden" />
          <span className="text-[11px] font-medium text-blue-400">Latest first</span>
        </div>
        {a.recentOrders.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            No orders yet — share your chatbot or storefront to start selling.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {a.recentOrders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs">
                <span className="w-24 font-mono text-[11px] text-slate-500">{o.orderNo}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{o.customerName}</span>
                <span className="font-semibold text-white">{fmtMoney(symbol, o.totalAmount)}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                    STATUS_STYLES[o.status] || "border-slate-600 bg-slate-800 text-slate-300"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsTab({ products, symbol }: { products: ProductItemDto[]; symbol: string }) {
  const [q, setQ] = useState("");
  const filtered = products.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-white">
          Products <span className="text-sm font-medium text-slate-500">({products.length})</span>
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/60 sm:w-64"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 py-10 text-center text-xs text-slate-500">
          No products found. Connect a product collection to this chatbot or add products.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, 60).map((p) => {
            const stock = typeof p.stock === "number" ? (p.stock as number) : null;
            const stockBadge =
              stock === null
                ? null
                : stock <= 0
                  ? { t: "Out of Stock", c: "bg-red-500/15 text-red-400 border-red-500/30" }
                  : stock <= 5
                    ? { t: `Only ${stock} left`, c: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
                    : { t: "In Stock", c: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="relative h-28 bg-slate-800/50">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-600">
                      <Package className="h-7 w-7" />
                    </div>
                  )}
                  {stockBadge && (
                    <span className={`absolute left-2 top-2 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${stockBadge.c}`}>
                      {stockBadge.t}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 min-h-[32px] text-xs font-semibold leading-tight text-slate-100">{p.name}</p>
                  {p.description && (
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{p.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400">{fmtMoney(symbol, Number(p.price) || 0)}</span>
                    {p.category && (
                      <span className="truncate rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders, symbol }: { orders: OrderDto[]; symbol: string }) {
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-white">
        Orders <span className="text-sm font-medium text-slate-500">({orders.length})</span>
      </h1>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 py-10 text-center text-xs text-slate-500">
          No orders yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="hidden grid-cols-[110px_1.2fr_1fr_90px_100px] gap-3 border-b border-slate-800 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 lg:grid">
            <span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span>
          </div>
          <div className="divide-y divide-slate-800/70">
            {orders.map((o) => (
              <div
                key={o.id}
                className="grid gap-2 px-4 py-3 text-xs lg:grid-cols-[110px_1.2fr_1fr_90px_100px] lg:items-center lg:gap-3"
              >
                <div>
                  <span className="font-mono text-[11px] text-slate-400">{o.orderNo}</span>
                  <p className="text-[10px] text-slate-600">
                    {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    {o.paymentMethod || "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{o.customer.fullName || "Guest"}</p>
                  {(o.customer.phone || o.customer.email) && (
                    <p className="truncate text-[10px] text-slate-500">{o.customer.phone || o.customer.email}</p>
                  )}
                </div>
                <div className="min-w-0 hidden lg:block">
                  <p className="truncate text-slate-300">{o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || o.serviceName}</p>
                </div>
                <span className="font-bold text-white">{fmtMoney(symbol, o.totalAmount)}</span>
                <div className="flex flex-col items-start gap-1 lg:items-stretch">
                  <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[o.status] || "border-slate-600 bg-slate-800 text-slate-300"}`}>
                    {o.status}
                  </span>
                  <span className={`text-[10px] font-medium ${o.paymentStatus === "paid" ? "text-emerald-400" : "text-slate-500"}`}>
                    {o.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab({ customers }: { customers: CustomerDto[] }) {
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-white">
        Customers <span className="text-sm font-medium text-slate-500">({customers.length})</span>
      </h1>
      {customers.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 py-10 text-center text-xs text-slate-500">
          No customers yet — customer details appear here once orders come in.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {customers.slice(0, 60).map((c, i) => (
            <div key={`${c.contact}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-sm font-bold text-blue-200">
                {(c.name || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{c.name}</p>
                <p className="truncate text-[11px] text-slate-500">{c.contact}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {c.orders} order{c.orders > 1 ? "s" : ""}
                  {c.lastAt ? ` · last ${new Date(c.lastAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Customization = {
  sections: { announcement: boolean; hero: boolean; trust: boolean; categories: boolean; featured: boolean };
  texts: { announcement: string; heroTitle: string; heroSubtitle: string; heroCta: string };
  colors: { accent: string; pageBg: string; textColor: string };
};

const DEFAULT_CUST: Customization = {
  sections: { announcement: true, hero: true, trust: true, categories: true, featured: true },
  texts: {
    announcement: "Free delivery on orders over $99 · Cash on Delivery available",
    heroTitle: "Gear that keeps you ahead",
    heroSubtitle:
      "Hand-picked products, fair prices and fast delivery — order online or pay cash on delivery.",
    heroCta: "Shop now",
  },
  colors: { accent: "#059669", pageBg: "#f8fafc", textColor: "#0f172a" },
};

const ACTIVATION_STEPS = [
  "Preparing your store…",
  "Connecting products & payments…",
  "Designing your storefront…",
];

function Toggle({
  on,
  onChange,
  label,
  desc,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-100">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-xs uppercase text-slate-200 outline-none"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function SettingsTab({
  botId,
  botName,
  activated,
  chatbotId,
  onActivated,
}: {
  botId: string; // secret console key (wc_…)
  botName: string;
  activated: boolean;
  chatbotId: string;
  onActivated: () => void;
}) {
  const defaultName = `${botName} Console`;
  const [name, setName] = useState(() => localStorage.getItem(`console-name-${botId}`) || defaultName);
  const [copied, setCopied] = useState<"key" | "store" | "dash" | "script" | null>(null);
  const storeUrl = `${window.location.origin}/store/${chatbotId}`;
  // Dashboard's own embed script — paste anywhere (even inside a button);
  // clicking it opens this analytics dashboard.
  const dashboardScript = `<script src="${config.apiBaseUrl}/static/console-widget.js" data-console="${botId}" data-app="${window.location.origin}" defer></script>`;
  const scriptTag = `<script src="${config.apiBaseUrl}/static/widget.js" data-bot="${chatbotId}" defer></script>`;

  // ── Activation flow state ──
  const [phase, setPhase] = useState<"idle" | "working" | "done">(activated ? "done" : "idle");
  const [stepIdx, setStepIdx] = useState(0);

  // ── Customizer state ──
  const [cust, setCust] = useState<Customization>(DEFAULT_CUST);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!activated) return;
    consoleFetch(`${config.apiBaseUrl}/api/store/console/${botId}/config`)
      .then(asJson)
      .then((r) => r.json())
      .then((d) => d.customization && setCust({ ...DEFAULT_CUST, ...d.customization }))
      .catch(() => {});
  }, [activated, botId]);

  useEffect(() => {
    if (phase !== "working") return;
    const iv = setInterval(() => setStepIdx((i) => Math.min(i + 1, ACTIVATION_STEPS.length - 1)), 700);
    return () => clearInterval(iv);
  }, [phase]);

  const copy = async (what: "key" | "store" | "dash" | "script", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const activate = async () => {
    setPhase("working");
    setStepIdx(0);
    await new Promise((r) => setTimeout(r, 2100)); // let the setup animation play
    try {
      const res = await asJson(
        await consoleFetch(`${config.apiBaseUrl}/api/store/console/${botId}/activate`, { method: "POST" }),
      );
      if (res.ok) {
        setPhase("done");
        setTimeout(onActivated, 900);
        return;
      }
    } catch {}
    setPhase("idle");
  };

  const saveCustomization = async () => {
    setSaving(true);
    try {
      const res = await asJson(
        await consoleFetch(`${config.apiBaseUrl}/api/store/console/${botId}/customization`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cust),
        }),
      );
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
      }
    } finally {
      setSaving(false);
    }
  };

  const patch = <K extends keyof Customization>(key: K, value: Partial<Customization[K]>) =>
    setCust((c) => ({ ...c, [key]: { ...c[key], ...value } }));

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-lg font-bold text-white">Console Settings</h1>

      {/* ── STEP 1 · Activate Your Own Store ── */}
      {!activated ? (
        phase === "done" ? (
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-3 text-sm font-bold text-white">Your store is live!</p>
            <p className="mt-1 text-xs text-emerald-300">Opening the store builder…</p>
          </motion.div>
        ) : phase === "working" ? (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                <Loader2 className="relative h-10 w-10 animate-spin text-blue-400" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 text-sm font-semibold text-blue-200"
                >
                  {ACTIVATION_STEPS[stepIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  initial={{ width: "8%" }}
                  animate={{ width: `${((stepIdx + 1) / ACTIVATION_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-teal-500/10 p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <Store className="h-6 w-6 text-white" />
              </span>
              <h2 className="mt-4 text-base font-extrabold tracking-tight text-white sm:text-lg">
                Activate your own store
              </h2>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">
                Turn this chatbot into a complete e-commerce storefront — products, cart, checkout,
                Cash on Delivery and online payments. You'll be able to customize the design right after.
              </p>
              <ul className="mt-4 grid gap-1.5 text-[11px] text-slate-400 sm:text-xs">
                {["Live product catalog from your connected database", "Cart & checkout with COD + Stripe", "Full theme control — colors, sections & texts"].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> {f}
                    </li>
                  ),
                )}
              </ul>
              <button
                onClick={activate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
              >
                <Store className="h-4 w-4" /> Activate My Store
              </button>
            </div>
          </div>
        )
      ) : (
        /* ── STEP 2 · Set Your Store ── */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-white">
                <SettingsIcon className="h-4 w-4 text-emerald-400" /> Set your store
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Customize sections, texts and colors — changes go live instantly.
              </p>
            </div>
            <a
              href={`/store/${chatbotId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Storefront
            </a>
          </div>

          {/* Live color preview strip */}
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: cust.colors.pageBg }}>
              <span className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: cust.colors.accent }}>
                {(cust.texts.heroCta || "S").charAt(0).toUpperCase()}
              </span>
              <span className="text-[11px] font-bold" style={{ color: cust.colors.textColor }}>
                {cust.texts.heroTitle}
              </span>
              <span className="ml-auto rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: cust.colors.accent }}>
                {cust.texts.heroCta}
              </span>
            </div>
          </div>

          {/* Sections */}
          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sections</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Toggle on={cust.sections.announcement} onChange={(v) => patch("sections", { announcement: v })} label="Announcement bar" desc="Top promo strip" />
            <Toggle on={cust.sections.hero} onChange={(v) => patch("sections", { hero: v })} label="Hero banner" desc="Big headline area" />
            <Toggle on={cust.sections.trust} onChange={(v) => patch("sections", { trust: v })} label="Trust badges" desc="Delivery / payment row" />
            <Toggle on={cust.sections.featured} onChange={(v) => patch("sections", { featured: v })} label="Featured products" desc="Main product grid" />
            <Toggle on={cust.sections.categories} onChange={(v) => patch("sections", { categories: v })} label="Category cards" desc="Shop by category" />
          </div>

          {/* Texts */}
          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Texts</p>
          <div className="mt-2 grid gap-3">
            {([
              ["announcement", "Announcement text", "Free delivery on orders over $99…"],
              ["heroTitle", "Hero title", "Gear that keeps you ahead"],
              ["heroSubtitle", "Hero subtitle", "Hand-picked products, fair prices…"],
              ["heroCta", "Hero button label", "Shop now"],
            ] as const).map(([k, label, ph]) => (
              <div key={k}>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
                <input
                  value={cust.texts[k]}
                  onChange={(e) => patch("texts", { [k]: e.target.value } as any)}
                  placeholder={ph}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/60"
                />
              </div>
            ))}
          </div>

          {/* Colors */}
          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Theme colors</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ColorField label="Button / accent" value={cust.colors.accent} onChange={(v) => patch("colors", { accent: v })} />
            <ColorField label="Background" value={cust.colors.pageBg} onChange={(v) => patch("colors", { pageBg: v })} />
            <ColorField label="Text" value={cust.colors.textColor} onChange={(v) => patch("colors", { textColor: v })} />
          </div>

          <button
            onClick={saveCustomization}
            disabled={saving}
            className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition disabled:opacity-60 ${
              savedFlash ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110"
            }`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedFlash ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {saving ? "Saving…" : savedFlash ? "Saved!" : "Save changes"}
          </button>
        </div>
      )}

      {/* ── Console identity ── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Console name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem(`console-name-${botId}`, e.target.value);
          }}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500/60"
        />
        <button
          onClick={() => {
            setName(defaultName);
            localStorage.removeItem(`console-name-${botId}`);
          }}
          className="mt-2 text-[11px] font-medium text-slate-500 hover:text-slate-300"
        >
          Reset to default ({defaultName})
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Console ID (private key)</label>
        <p className="mt-1 text-[11px] text-slate-500">
          This is what your client pastes at the console login page to open this dashboard. Keep it private.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 font-mono text-xs text-emerald-300">
            {botId}
          </code>
          <button onClick={() => copy("key", botId)} className="rounded-lg border border-slate-700 p-2.5 text-slate-400 hover:text-white" title="Copy console ID">
            {copied === "key" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Dashboard's own embed script */}
      <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-sky-300">Analytics dashboard script</label>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Paste this anywhere on any webpage — even inside your own button. Whoever clicks it gets
          one-click access to this analytics dashboard (a floating "Analytics" button appears if placed standalone).
        </p>
        <div className="mt-2 flex items-start gap-2">
          <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-300">
            {dashboardScript}
          </pre>
          <button onClick={() => copy("dash", dashboardScript)} className="shrink-0 rounded-lg border border-slate-700 p-2.5 text-slate-400 hover:text-white">
            {copied === "dash" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chatbot embed script</label>
        <div className="mt-2 flex items-start gap-2">
          <pre className="flex-1 overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-300">
            {scriptTag}
          </pre>
          <button onClick={() => copy("script", scriptTag)} className="rounded-lg border border-slate-700 p-2.5 text-slate-400 hover:text-white">
            {copied === "script" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
