import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, Code2, ListTree, ShoppingBag, Database, MailCheck, Send,
  LayoutTemplate, Layers, ArrowRight, Check, Sparkles,
  Zap, ShieldCheck, Globe2, ChevronDown, MessageCircle, CalendarCheck,
} from "lucide-react";
import logo from "@/asset/logo.png";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useState, type ReactNode } from "react";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      throw redirect({ to: user?.role === "admin" ? "/admin" : "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Webotme — AI chatbots for any website, zero code" },
      {
        name: "description",
        content:
          "Build an AI chatbot for your website in minutes. Your own flows, your own database, your own email, orders inside chat — one simple script, no coding.",
      },
    ],
  }),
  component: LandingPage,
});

/* ─── Spotlight card ─────────────────────────────────────────── */
function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setPos({ x: -400, y: -400 })}
      className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(340px circle at ${pos.x}px ${pos.y}px, rgba(180,90,30,0.16), rgba(230,170,80,0.08) 45%, transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────── */
const features = [
  { icon: Code2, title: "Zero-Code Embed", desc: "Paste one small script anywhere on your web app and your chatbot is live. No coding, no build steps.", color: "from-orange-600 to-amber-500" },
  { icon: ListTree, title: "Your Own Flows", desc: "You control every step of the conversation. Build custom flows for orders, bookings or services — exactly how you want.", color: "from-amber-600 to-orange-500" },
  { icon: ShoppingBag, title: "Orders Inside Chat", desc: "Customers browse, ask and complete their order right in the widget — products or services like web & app development.", color: "from-orange-500 to-amber-600" },
  { icon: Database, title: "Connect Your Own DB", desc: "Plug in your own MongoDB or MySQL database and let the bot answer from YOUR real data.", color: "from-amber-500 to-orange-600" },
  { icon: MailCheck, title: "Your Own Email Setup", desc: "Add your business SMTP once — order confirmations and notifications go out from your own domain.", color: "from-yellow-600 to-orange-500" },
  { icon: Send, title: "Telegram Bot, No Code", desc: "Turn the same bot into a Telegram assistant with a token — zero extra code.", color: "from-orange-600 to-yellow-500" },
  { icon: LayoutTemplate, title: "Ready-Made Templates", desc: "Start instantly with pre-built bots for shops, clinics, travel, pets, fitness and more.", color: "from-amber-500 to-orange-600" },
  { icon: Layers, title: "Many Bots, One Dashboard", desc: "Create multiple chatbots for different sites and manage them all from a single console.", color: "from-orange-500 to-yellow-500" },
];

const templates = [
  { name: "BabyCare", emoji: "🍼", desc: "Nursery & baby products store bot", grad: "from-orange-500 to-amber-400" },
  { name: "FitGuide", emoji: "💪", desc: "Fitness plans & coaching inquiries", grad: "from-amber-500 to-yellow-400" },
  { name: "HealthBuddy", emoji: "🩺", desc: "Clinic appointments & FAQs", grad: "from-orange-600 to-amber-500" },
  { name: "PetPedia", emoji: "🐾", desc: "Pet shop orders & care tips", grad: "from-yellow-500 to-orange-500" },
];

const steps = [
  { n: "01", title: "Create your bot", desc: "Pick a template or start blank. Train it with FAQs, files or connect your database." },
  { n: "02", title: "Design your flow", desc: "Define the exact conversation steps — product questions, service inquiries, order details." },
  { n: "03", title: "Paste one script", desc: "Drop the embed script into your site. Your chatbot is live everywhere, instantly." },
];

const faqs = [
  { q: "Do I need to know coding?", a: "No. You configure everything from the dashboard — training content, conversation flows, themes and email setup. At the end you copy one small script and paste it into your website." },
  { q: "Can my chatbot take real orders?", a: "Yes. Enable the order system and customers can browse products or request services inside the chat, leave their details and place an order. Every order lands in your dashboard and triggers emails instantly." },
  { q: "Which payment methods are supported?", a: "Cash on Delivery, card payments via Stripe checkout, bank transfer instructions — you choose which options appear in your bot's flow." },
  { q: "Can I connect my own database?", a: "Absolutely. Connect MongoDB or MySQL collections and the bot answers product, price and availability questions directly from your live data instead of static text." },
  { q: "Will emails come from my own business address?", a: "Yes. Add your SMTP credentials once and every customer confirmation plus owner notification goes out through your own domain — no Webotme branding required." },
  { q: "Does it work on mobile websites?", a: "The widget is fully responsive on phones, tablets and desktops. The Telegram version works anywhere Telegram does." },
];

const stats = [
  { icon: Zap, value: "< 5 min", label: "Average setup time" },
  { icon: Layers, value: "10+", label: "Templates & growing" },
  { icon: Globe2, value: "2", label: "Platforms — web & Telegram" },
  { icon: ShieldCheck, value: "100%", label: "Your data, your infra" },
];

/* ─── Navbar (sticky) ────────────────────────────────────────── */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "border-b border-border/60 bg-background/80 py-2.5 shadow-soft backdrop-blur-xl" : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="Webotme"
            className={`h-11 w-auto object-contain transition-all duration-300 ${scrolled ? "" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"}`}
          />
        </Link>
        <div className={`hidden items-center gap-7 text-sm font-medium transition-colors duration-300 md:flex ${scrolled ? "text-muted-foreground" : "text-white/80"}`}>
          <a href="#features" className="transition-colors hover:text-primary md:hover:text-white">Features</a>
          <a href="#templates" className="transition-colors hover:text-primary md:hover:text-white">Templates</a>
          <a href="#how" className="transition-colors hover:text-primary md:hover:text-white">How it works</a>
          <a href="#faq" className="transition-colors hover:text-primary md:hover:text-white">FAQ</a>
          <Link to="/plans" className="transition-colors hover:text-primary md:hover:text-white">Pricing</Link>
        </div>
        <Link
          to="/login"
          className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}

/* ─── Hero bot showcase slider ───────────────────────────────── */
const bots = [
  {
    icon: ShoppingBag,
    name: "Store Assistant",
    caption: "🛍️ Your shop sells itself — even while you sleep.",
    qa: [
      { q: "Do I need coding to sell online?", a: "No code! Paste one script and start taking orders today." },
      { q: "How will I know about new orders?", a: "Instant emails from YOUR domain — you never miss a sale." },
      { q: "Which payments can customers use?", a: "COD, cards & bank transfer — you pick what they see." },
      { q: "What about mobile-only buyers?", a: "Your store bot runs on Telegram too — free, no extra code." },
    ],
  },
  {
    icon: MessageCircle,
    name: "Support Bot",
    caption: "💬 Happier customers, zero extra staff cost.",
    qa: [
      { q: "Who answers customers at 2 AM?", a: "Your bot — active 24/7, so you never lose a lead." },
      { q: "Where does it learn answers from?", a: "Your own FAQs & files — replies always sound like you." },
      { q: "Can it use my live database?", a: "Yes — connect MongoDB or MySQL for real-time answers." },
      { q: "Is there an app version?", a: "Telegram bot included — reach users anywhere, free." },
    ],
  },
  {
    icon: CalendarCheck,
    name: "Booking Bot",
    caption: "📅 Full appointment book without a single phone call.",
    qa: [
      { q: "Tired of back-and-forth calls?", a: "Clients pick their own slot — bookings fill themselves." },
      { q: "Do clients get confirmations?", a: "Automatic emails from your SMTP — total professionalism." },
      { q: "Can it reduce no-shows?", a: "Built-in reminders mean far fewer empty slots." },
      { q: "Works outside the website?", a: "Yes — the same bot lives on Telegram too." },
    ],
  },
  {
    icon: Code2,
    name: "Service Inquiry Bot",
    caption: "👨‍💻 Turn visitors into paying dev clients automatically.",
    qa: [
      { q: "How do I capture project leads?", a: "The bot asks needs & budget — leads land in your dashboard." },
      { q: "Must I reply to every inquiry?", a: "No — instant quotes go out automatically, day or night." },
      { q: "Is the setup technical?", a: "Zero code — one simple script on your site." },
      { q: "Can clients contact me on mobile?", a: "Always — a Telegram bot comes included, free." },
    ],
  },
];

function BotShowcase() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % bots.length), 5200);
    return () => clearInterval(t);
  }, []);
  const bot = bots[idx];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <span className="font-hand absolute -top-10 right-0 z-10 rotate-3 text-2xl text-amber-300">
        make your own — zero code!
      </span>

      {/* Stage — mimics a real website corner */}
      <div className="relative mx-auto h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-[0_30px_90px_-30px_rgba(180,90,30,0.55)] backdrop-blur-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="absolute inset-0"
            initial={{ x: 130, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -130, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* Chat window — rises UP out of the launcher */}
            <motion.div
              initial={{ opacity: 0, y: 70, scale: 0.65 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 240, damping: 22 }}
              className="absolute inset-x-3.5 bottom-[76px] top-3.5 flex origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#33200f]/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 bg-gradient-primary px-4 py-3 text-primary-foreground">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/25">
                  <bot.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-none">{bot.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-90">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online — replies instantly
                  </div>
                </div>
                <Bot className="ml-auto h-4 w-4 opacity-70" />
              </div>

              <div className="flex-1 space-y-2 overflow-hidden px-3 py-3 text-[11px] text-white/90">
                {bot.qa.map((qa, i) => (
                  <motion.div key={i} className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + i * 0.55 }}
                      className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-white/20 px-2.5 py-1.5 font-medium"
                    >
                      {qa.q}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.15 + i * 0.55 }}
                      className="max-w-[85%] rounded-lg rounded-bl-sm bg-gradient-primary px-2.5 py-1.5 font-medium text-primary-foreground"
                    >
                      {qa.a}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-white/10 px-3 py-2 text-[10px] font-semibold leading-snug text-amber-200/90">
                {bot.caption}
              </div>
            </motion.div>

            {/* Launcher icon — pops in first, bottom corner */}
            <motion.button
              aria-label={`${bot.name} launcher`}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 17 }}
              whileHover={{ scale: 1.08 }}
              className="absolute bottom-3 right-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary shadow-glow ring-4 ring-white/10"
            >
              <bot.icon className="h-6 w-6 text-primary-foreground" />
              <motion.span
                animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-amber-300"
              />
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {bots.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Show bot ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-gradient-primary" : "w-2 bg-white/25 hover:bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Section heading helper ─────────────────────────────────── */
function SectionHead({ badge, badgeColor, title, sub }: { badge: string; badgeColor: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${badgeColor}`}>{badge}</span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-sm text-muted-foreground md:text-base">{sub}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-[#2a1a10] pb-20 pt-32 md:pb-28 md:pt-44">
        <div className="animate-blob pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-orange-700/30 blur-[120px]" />
        <div className="animate-blob animation-delay-2000 pointer-events-none absolute -right-24 top-40 h-[28rem] w-[28rem] rounded-full bg-amber-500/25 blur-[130px]" />
        <div className="animate-blob animation-delay-4000 pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-yellow-600/20 blur-[120px]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 md:px-10 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-200">
              <Sparkles className="h-3.5 w-3.5" /> No code. No store needed. Just paste &amp; go.
            </div>
            <h1 className="font-hand mt-4 -rotate-2 text-5xl font-bold leading-[1.02] text-white md:text-7xl">
              Put a selling{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent">AI chatbot</span>{" "}
              on any website in minutes.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Webotme is the only bot builder where <strong className="text-white">you</strong> design the flow, plug in your own database and email, and take real orders — products, services, bookings — all inside one chat widget.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/10">
                See how it works
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
              {["Free plan included", "Live in under 5 minutes", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-amber-300" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}>
            <BotShowcase />
          </motion.div>
        </div>

        {/* stats strip */}
        <div className="relative mx-auto mt-16 max-w-6xl px-6 md:px-10">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl px-3 py-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{s.value}</div>
                  <div className="text-[11px] text-white/60">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead badge="Everything included" badgeColor="border-primary/30 bg-primary/10 text-primary" title="A complete system inside your chatbot" sub="Not just answers — real conversations that capture leads and close orders." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}>
                <SpotlightCard className="h-full p-5">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-soft`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEMPLATES ═══ */}
      <section id="templates" className="relative px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead badge="Start from a template" badgeColor="border-amber-500/30 bg-amber-500/10 text-amber-600" title="Pre-built bots, ready in one click" />          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: i * 0.1 }}>
                <SpotlightCard className="h-full p-5 text-center">
                  <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${t.grad} text-3xl shadow-soft`}>
                    {t.emoji}
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="relative overflow-hidden px-6 py-24 md:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-0 h-64 bg-gradient-to-r from-primary/10 via-amber-400/15 to-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHead badge="Live in 3 steps" badgeColor="border-primary/30 bg-accent text-primary" title="From idea to live chatbot" sub="Everything happens in your browser — no servers to configure." />
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-0.5 bg-gradient-to-r from-primary via-amber-400 to-primary opacity-40 md:block" />
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: i * 0.15 }} className="relative text-center">
                <span className="relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-card shadow-glow">
                  <span className="text-gradient text-xl font-extrabold">{s.n}</span>
                </span>
                <h3 className="mt-5 text-base font-bold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="relative px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-transparent bg-gradient-primary p-8 shadow-glow md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Other tools need a store first.
                <br />
                <span className="text-amber-300">Webotme is enough on its own.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Most chat widgets sit on top of Shopify and hand customers off somewhere else. Webotme keeps everything inside the conversation — flow, data, email and orders.
              </p>
              <Link to="/login" search={{ mode: "signup" }} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-amber-50">
                Start building free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              {[
                "No Shopify or WooCommerce required",
                "Flows designed by you, not fixed templates",
                "Connect your own MongoDB / MySQL",
                "Emails sent from your own SMTP",
                "Orders saved to your dashboard + inbox",
                "Website widget AND Telegram — same bot",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-white">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/25">
                    <Check className="h-3 w-3 text-emerald-300" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="relative px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-3xl">
          <SectionHead badge="Questions & answers" badgeColor="border-amber-500/30 bg-amber-500/10 text-amber-600" title="Frequently asked questions" />
          <div className="mt-12 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border/70 bg-card shadow-soft transition-all open:border-primary/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BAND ═══ */}
      <section className="relative overflow-hidden px-6 pb-24 md:px-10">
        <div className="animate-blob pointer-events-none absolute left-1/4 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/15 blur-[110px]" />
        <div className="animate-blob animation-delay-2000 pointer-events-none absolute right-1/4 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-amber-400/20 blur-[110px]" />
        <div className="glass relative mx-auto max-w-4xl rounded-3xl p-10 text-center shadow-glow md:p-14">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ready to meet your{" "}
            <span className="text-gradient">first customer?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Create your free account, build a bot and paste the script. Your website starts selling today.
          </p>
          <Link to="/login" search={{ mode: "signup" }} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110">
            Get started — it's free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/60 bg-card/40 px-6 py-8 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground md:flex-row">
          <img src={logo} alt="Webotme" className="h-9 w-auto object-contain" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <a href="/terms" className="transition-colors hover:text-primary">Terms of Service</a>
            <a href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</a>
            <a href="/refunds" className="transition-colors hover:text-primary">Refund Policy</a>
            <Link to="/plans" className="transition-colors hover:text-primary">Pricing</Link>
          </div>
          <span>© {new Date().getFullYear()} WeBotMe</span>
        </div>
      </footer>
    </div>
  );
}
