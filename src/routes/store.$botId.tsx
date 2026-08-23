import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RefreshCcw,
  HeadphonesIcon,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { config } from "@/lib/config";

export const Route = createFileRoute("/store/$botId")({
  head: () => ({ meta: [{ title: "Store — WeBotMe" }] }),
  component: StorefrontPage,
});

type ProductDto = {
  id: string;
  name: string;
  price: string | number;
  category: string;
  image?: string;
  description?: string;
  stock?: number;
};
type StoreConfig = {
  botName: string;
  currencySymbol: string;
  activated: boolean;
  customization: {
    sections: { announcement: boolean; hero: boolean; trust: boolean; categories: boolean; featured: boolean };
    texts: { announcement: string; heroTitle: string; heroSubtitle: string; heroCta: string };
    colors: { accent: string; pageBg: string; textColor: string };
  } | null;
};

const DEFAULT_CUST = {
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
type CartLine = { name: string; price: number; quantity: number };

const fmt = (sym: string, n: number) => `${sym}${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function StorefrontPage() {
  const { botId } = Route.useParams();
  const [cfg, setCfg] = useState<StoreConfig | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [symbol, setSymbol] = useState("$");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cust, setCust] = useState(DEFAULT_CUST);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [selected, setSelected] = useState<ProductDto | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ orderNo: string } | null>(null);

  // Payment redirect result (?payment=success&orderId=…)
  const [payState] = useState(() => new URLSearchParams(window.location.search).get("payment"));

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/store/public/${botId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setCfg({ botName: d.name || "Store", currencySymbol: d.currencySymbol || "$", activated: !!d.activated, customization: d.customization || null });
        setSymbol(d.currencySymbol || "$");
        if (d.customization) {
          setCust({
            sections: { ...DEFAULT_CUST.sections, ...(d.customization.sections || {}) },
            texts: { ...DEFAULT_CUST.texts, ...(d.customization.texts || {}) },
            colors: { ...DEFAULT_CUST.colors, ...(d.customization.colors || {}) },
          });
        }
        return fetch(`${config.apiBaseUrl}/api/store/public/${botId}/products`)
          .then((r) => (r.ok ? r.json() : { products: [] }))
          .then((pd) => setProducts(pd.products || []));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [botId]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const c = (p.category || "").trim() || "Other";
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [products]);

  const visible = useMemo(
    () =>
      products.filter((p) => {
        const catOk = activeCat === "All" || ((p.category || "").trim() || "Other") === activeCat;
        const qOk = !q || p.name.toLowerCase().includes(q.toLowerCase());
        return catOk && qOk;
      }),
    [products, activeCat, q],
  );

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);

  const addToCart = (p: ProductDto, qty = 1) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.name === p.name);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: Math.min(999, next[i].quantity + qty) };
        return next;
      }
      return [...prev, { name: p.name, price: Number(p.price) || 0, quantity: qty }];
    });
    setSelected(null);
    setCartOpen(true);
  };

  const c = cust;

  if (notFound) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <p className="text-sm text-slate-600">This storefront doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (loading || !cfg) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Owner hasn't launched this store yet
  if (!cfg.activated) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl"
        >
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <ShoppingBag className="h-7 w-7 text-white" />
          </span>
          <h1 className="text-lg font-extrabold text-slate-900">{cfg.botName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            This store hasn't been launched yet. Please check back soon!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: c.colors.pageBg, color: c.colors.textColor }}>
      {/* Thank-you / payment-result overlay */}
      <AnimatePresence>
        {(placedOrder || payState === "success") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
              <CheckCircle2 className="mx-auto h-14 w-14" style={{ color: c.colors.accent }} />
              <h2 className="mt-4 text-xl font-bold text-slate-900">Order placed!</h2>
              <p className="mt-2 text-sm text-slate-500">
                Thank you for your purchase{placedOrder ? ` — ${placedOrder.orderNo}` : ""}. We'll contact you shortly to confirm delivery details.
              </p>
              <button
                onClick={() => {
                  setPlacedOrder(null);
                  if (payState === "success") window.location.replace(`/store/${botId}`);
                }}
                className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: c.colors.accent }}
              >
                Continue shopping
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement bar */}
      {c.sections.announcement && (
        <div className="py-2 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs" style={{ background: c.colors.accent }}>
          {c.texts.announcement}
        </div>
      )}

      {/* Header — light, logo in the corner */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5">
          <a href={`/store/${botId}`} className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-base font-black text-white shadow-md" style={{ background: c.colors.accent }}>
              {(cfg.botName || "S").charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-lg font-extrabold tracking-tight text-slate-900">{cfg.botName}</span>
          </a>
          <div className="relative mx-auto w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
            />
          </div>
          <button onClick={() => setCartOpen(true)} className="relative shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-slate-300 hover:shadow-md" title="Cart">
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: c.colors.accent }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
        {/* Category chips */}
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", ...categories.map((cat) => cat.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCat === cat
                  ? "border-transparent text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
              style={activeCat === cat ? { background: c.colors.accent } : undefined}
            >
              {cat}
            </button>
          ))}
        </nav>
      </header>

      {/* Hero */}
      {c.sections.hero && (
        <section className="relative overflow-hidden border-b border-slate-200/70">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${c.colors.accent}14 0%, transparent 55%, ${c.colors.accent}0a 100%)` }}
          />
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: `${c.colors.accent}12` }} />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl" style={{ background: `${c.colors.accent}0d` }} />
          <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
            <span className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: `${c.colors.accent}1a`, color: c.colors.accent }}>
              New season · New arrivals
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ color: c.colors.textColor }}>
              <span style={{ color: c.colors.accent }}>{c.texts.heroTitle.split(" ").slice(0, -1).join(" ")}{" "}</span>
              {c.texts.heroTitle.split(" ").slice(-1)}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">{c.texts.heroSubtitle}</p>
            <button
              onClick={() => document.getElementById("shop-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-6 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              style={{ background: c.colors.accent }}
            >
              {c.texts.heroCta}
            </button>
          </div>
        </section>
      )}

      {/* Trust badges */}
      {c.sections.trust && (
        <section className="border-b border-slate-200/70 bg-white/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-5 sm:grid-cols-4">
            {[
              { icon: Truck, t: "Fast Delivery", s: "Ships within 48h" },
              { icon: ShieldCheck, t: "Secure Payment", s: "Stripe & COD" },
              { icon: RefreshCcw, t: "Easy Returns", s: "7-day policy" },
              { icon: HeadphonesIcon, t: "AI Support 24/7", s: "Always available" },
            ].map(({ icon: Icon, t, s }) => (
              <div key={t} className="flex items-center justify-center gap-2.5 sm:justify-start">
                <Icon className="h-5 w-5 shrink-0" style={{ color: c.colors.accent }} />
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-900">{t}</p>
                  <p className="text-[10px] text-slate-400">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <main id="shop-grid" className="mx-auto max-w-6xl px-4 py-10">
        {c.sections.featured && (
          <>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: c.colors.textColor }}>
                Featured Products
              </h2>
              <span className="text-xs text-slate-400">{visible.length} item{visible.length !== 1 ? "s" : ""}</span>
            </div>
            {visible.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white/60 py-16 text-center text-sm text-slate-400">
                No products match your search.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {visible.slice(0, 32).map((p) => (
                  <ProductCard key={p.id} p={p} symbol={symbol} accent={c.colors.accent} onOpen={() => setSelected(p)} onAdd={() => addToCart(p)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Shop by category */}
        {c.sections.categories && categories.length > 0 && (
          <>
            <h2 className="mb-5 mt-12 text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: c.colors.textColor }}>
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCat(cat.name);
                    document.getElementById("shop-grid")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <ShoppingBag className="h-6 w-6 transition group-hover:scale-110" style={{ color: c.colors.accent }} />
                  <p className="mt-3 text-sm font-bold capitalize text-slate-900">{cat.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{cat.count} product{cat.count > 1 ? "s" : ""}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white" style={{ background: c.colors.accent }}>
                {(cfg.botName || "S").charAt(0).toUpperCase()}
              </span>
              <span className="font-extrabold text-slate-900">{cfg.botName}</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
              Quality products delivered to your door. Order through our AI assistant or right here — we're always open.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</p>
            <ul className="mt-3 space-y-1.5">
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.name}>
                  <button onClick={() => setActiveCat(cat.name)} className="text-xs text-slate-500 transition hover:text-slate-900">
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">We accept</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Cash on Delivery</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Visa</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Mastercard</span>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} {cfg.botName}. Powered by WeBotMe.
        </div>
      </footer>

      {/* Product modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-52 bg-slate-100 sm:h-60">
                {selected.image ? (
                  <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300"><ShoppingBag className="h-10 w-10" /></div>
                )}
                <button onClick={() => setSelected(null)} className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-600 shadow-md hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                {selected.category && (
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: `${c.colors.accent}1a`, color: c.colors.accent }}>{selected.category}</span>
                )}
                <h3 className="mt-2 text-lg font-bold text-slate-900">{selected.name}</h3>
                {selected.description && <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-slate-500">{selected.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-extrabold" style={{ color: c.colors.accent }}>{fmt(symbol, Number(selected.price) || 0)}</span>
                  <button onClick={() => addToCart(selected)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110" style={{ background: c.colors.accent }}>
                    <ShoppingCart className="h-4 w-4" /> Add to cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCart={setCart}
        symbol={symbol}
        botId={botId}
        accent={c.colors.accent}
        onPlaced={(orderNo) => {
          setPlacedOrder({ orderNo });
          setCart([]);
          setCartOpen(false);
        }}
      />
    </div>
  );
}

function ProductCard({
  p,
  symbol,
  accent,
  onOpen,
  onAdd,
}: {
  p: ProductDto;
  symbol: string;
  accent: string;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const stock = typeof p.stock === "number" ? (p.stock as number) : null;
  const badge =
    stock === null
      ? null
      : stock <= 0
        ? { t: "Out of Stock", c: "border border-red-200 bg-red-100 text-red-700" }
        : stock <= 5
          ? { t: `Only ${stock} left`, c: "border border-amber-200 bg-amber-100 text-amber-700" }
          : null;
  const soldOut = stock !== null && (stock as number) <= 0;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <button onClick={onOpen} className="relative block h-32 bg-slate-100 sm:h-40">
        {p.image ? (
          <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-slate-300"><ShoppingBag className="h-8 w-8" /></div>
        )}
        {badge && <span className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${badge.c}`}>{badge.t}</span>}
      </button>
      <div className="flex flex-1 flex-col p-3">
        <button onClick={onOpen} className="line-clamp-2 min-h-[32px] text-left text-xs font-semibold leading-tight text-slate-900 transition hover:opacity-70">
          {p.name}
        </button>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-extrabold" style={{ color: accent }}>{fmt(symbol, Number(p.price) || 0)}</span>
          <button
            onClick={onAdd}
            disabled={soldOut}
            title={soldOut ? "Out of stock" : "Add to cart"}
            className={`grid h-8 w-8 place-items-center rounded-lg shadow-sm transition ${
              soldOut ? "cursor-not-allowed bg-slate-200 !text-slate-400 shadow-none" : "text-white hover:brightness-110"
            }`}
            style={soldOut ? undefined : { background: accent }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  cart,
  setCart,
  symbol,
  botId,
  accent,
  onPlaced,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  setCart: React.Dispatch<React.SetStateAction<CartLine[]>>;
  symbol: string;
  botId: string;
  accent: string;
  onPlaced: (orderNo: string) => void;
}) {
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "" });
  const [method, setMethod] = useState<"cod" | "online">("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setStep(cart.length > 0 ? "cart" : "cart");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const setQty = (i: number, d: number) =>
    setCart((prev) => prev.map((l, j) => (j === i ? { ...l, quantity: Math.min(999, Math.max(1, l.quantity + d)) } : l)));
  const removeLine = (i: number) => setCart((prev) => prev.filter((_, j) => j !== i));

  const placeOrder = async () => {
    setError("");
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Please fill in your name, phone and delivery address.");
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/store/public/${botId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items: cart, paymentMethod: method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      onPlaced(data.orderNo || "");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ShoppingCart className="h-4.5 w-4.5" style={{ color: accent }} />
                {step === "cart" ? `Your Cart (${cart.reduce((s, l) => s + l.quantity, 0)})` : "Checkout"}
              </h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* __BODY__ */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === "cart" ? (
                cart.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm text-slate-400">Your cart is empty.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((l, i) => (
                      <div key={l.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">{l.name}</p>
                          <p className="mt-0.5 text-xs font-bold" style={{ color: accent }}>{fmt(symbol, l.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setQty(i, -1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900">{l.quantity}</span>
                          <button onClick={() => setQty(i, 1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button onClick={() => removeLine(i)} title="Remove" className="text-slate-300 transition hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {[
                    { k: "fullName", label: "Full name *", ph: "Ali Khan", type: "text" },
                    { k: "phone", label: "Phone *", ph: "+92 300 1234567", type: "tel" },
                    { k: "email", label: "Email", ph: "you@example.com", type: "email" },
                    { k: "address", label: "Delivery address *", ph: "House #, Street, City", type: "text" },
                  ].map(({ k, label, ph, type }) => (
                    <div key={k}>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</label>
                      <input
                        type={type}
                        value={(form as any)[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        placeholder={ph}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Payment method</label>
                    <div className="space-y-2">
                      {[
                        { v: "cod" as const, t: "Cash on Delivery", s: "Pay when it arrives" },
                        { v: "online" as const, t: "Online Payment", s: "Secure card payment via Stripe" },
                      ].map(({ v, t, s }) => (
                        <button
                          key={v}
                          onClick={() => setMethod(v)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            method === v ? "border-transparent bg-slate-50 ring-2" : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                          style={method === v ? ({ boxShadow: `inset 0 0 0 1px ${accent}`, ["--tw-ring-color" as any]: `${accent}22` } as any) : undefined}
                        >
                          <span
                            className={`grid h-4 w-4 place-items-center rounded-full border ${method === v ? "border-transparent" : "border-slate-300"}`}
                            style={method === v ? { background: accent } : undefined}
                          >
                            {method === v && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-slate-900">{t}</span>
                            <span className="block text-[10px] text-slate-400">{s}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 bg-white px-5 py-4">
                {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{error}</p>}
                {step === "cart" ? (
                  <>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-lg font-extrabold text-slate-900">{fmt(symbol, total)}</span>
                    </div>
                    <button
                      onClick={() => setStep("checkout")}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                      style={{ background: accent }}
                    >
                      Proceed to checkout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setStep("cart")} disabled={placing} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                      Back
                    </button>
                    <button
                      onClick={placeOrder}
                      disabled={placing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
                      style={{ background: accent }}
                    >
                      {placing && <Loader2 className="h-4 w-4 animate-spin" />}
                      {placing ? "Placing order…" : method === "cod" ? `Place order · ${fmt(symbol, total)}` : `Pay now · ${fmt(symbol, total)}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
