import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Code2, LayoutTemplate, MessageSquareText, TrendingUp, Activity, Sparkles, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTransition } from "@/components/common/PageTransition";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { useChatbotsStore } from "@/store/chatbots";
import { useFaqStore } from "@/store/faq";
import { LiveBotPreview } from "@/components/create/LiveBotPreview";
import { formatDate } from "@/lib/format";
import { getStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — Webotme" }] }),
  component: Overview,
});

const areaData = [
  { d: "Mon", msgs: 1240 }, { d: "Tue", msgs: 1580 }, { d: "Wed", msgs: 1820 },
  { d: "Thu", msgs: 1410 }, { d: "Fri", msgs: 2160 }, { d: "Sat", msgs: 1980 }, { d: "Sun", msgs: 2380 },
];
const barData = [
  { t: "Glass", v: 320 }, { t: "Minimal", v: 210 }, { t: "Support", v: 480 }, { t: "Messenger", v: 290 }, { t: "Neon", v: 150 },
];

function Overview() {
  const user = getStoredUser();
  const userName = typeof user?.username === "string" ? user.username : "Alex";
  const bots = useChatbotsStore((s) => s.chatbots);
  const faqs = useFaqStore((s) => s.faqs);
  const totalInstalls = bots.reduce((a, b) => a + b.installs, 0);

  const stats = [
    { label: "Total Chatbots", value: bots.length, icon: Bot, hint: "+2 this week", tone: "from-violet-500 to-indigo-500" },
    { label: "FAQ Questions", value: faqs.length, icon: MessageSquareText, hint: "Curated answers", tone: "from-sky-500 to-cyan-500" },
    { label: "Active Templates", value: 5, icon: LayoutTemplate, hint: "All published", tone: "from-emerald-500 to-teal-500" },
    { label: "Script Installs", value: totalInstalls, icon: Code2, hint: "+18% MoM", tone: "from-fuchsia-500 to-pink-500" },
  ];

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back, {userName}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Overview</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening across your chatbots today.</p>
        </div>
        <Link
          to="/dashboard/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" /> New Chatbot
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.tone} opacity-15 blur-2xl transition group-hover:opacity-25`} />
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${s.tone} text-white shadow-soft`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              <AnimatedCounter value={s.value} />
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {s.hint}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Conversations this week</h3>
              <p className="text-xs text-muted-foreground">Messages handled across all chatbots</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">+12.4%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.2 35)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.2 35)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.015 270)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.5 0.03 270)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.03 270)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 270)" }} />
                <Area type="monotone" dataKey="msgs" stroke="oklch(0.55 0.2 35)" strokeWidth={2.5} fill="url(#gMsgs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold">Installs by template</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="oklch(0.92 0.015 270)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="oklch(0.5 0.03 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.03 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 270)" }} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]} fill="oklch(0.65 0.18 85)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent chatbot activity</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border/60">
            {bots.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${b.primary}, ${b.secondary})` }}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.template} · {b.installs.toLocaleString()} installs</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border/60 pt-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent generated scripts</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {bots.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1 truncate text-xs font-mono">widget.js?id={b.id}</div>
                  <span className="text-[10px] text-muted-foreground">{formatDate(b.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-gradient-soft p-5 shadow-soft">
          <h3 className="text-sm font-semibold">Live preview</h3>
          <p className="text-xs text-muted-foreground">How your latest bot looks</p>
          <div className="mt-4">
            <LiveBotPreview
              name={bots[0]?.name ?? "My Bot"}
              welcome={bots[0]?.welcome ?? "Hi!"}
              primary={bots[0]?.primary ?? "#D94A2D"}
              secondary={bots[0]?.secondary ?? "#1C1C2E"}
              radius={bots[0]?.radius ?? 16}
              bubble={bots[0]?.bubble ?? "rounded"}
              template={bots[0]?.template}
              headerStyle={bots[0]?.headerStyle}
              textStyle={bots[0]?.textStyle}
              botBubbleColor={bots[0]?.botBubbleColor}
              botTextColor={bots[0]?.botTextColor}
              showAvatar={bots[0]?.showAvatar}
              messageFontSize={bots[0]?.messageFontSize}
              inputStyle={bots[0]?.inputStyle}
              headerSubtitle={bots[0]?.headerSubtitle}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
