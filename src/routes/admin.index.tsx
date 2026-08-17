import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Users, Bot, MessageSquareText, BookOpen, Code2, Activity, Shield, UserCheck } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Rover" }] }),
  component: AdminDashboard,
});

interface AdminStats {
  totalUsers: number;
  totalChatbots: number;
  totalConversations: number;
  totalFaqs: number;
  totalInstalls: number;
  adminCount: number;
  userCount: number;
  activeChatbots: number;
  recentUsers: Array<{
    _id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentChatbots: Array<{
    _id: string;
    name: string;
    template: string;
    installs: number;
    isActive: boolean;
    createdAt: string;
    adminUserId: { username: string; email: string };
  }>;
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/admin/stats", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.message && !data.totalUsers) throw new Error(data.message);
        setStats(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading admin stats...</div>
      </PageTransition>
    );
  }

  if (error || !stats) {
    return (
      <PageTransition>
        <div className="flex h-64 items-center justify-center text-red-500">{error || "Failed to load stats"}</div>
      </PageTransition>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, hint: `${stats.adminCount} admin · ${stats.userCount} users`, tone: "from-violet-500 to-indigo-500" },
    { label: "Total Chatbots", value: stats.totalChatbots, icon: Bot, hint: `${stats.activeChatbots} active`, tone: "from-sky-500 to-cyan-500" },
    { label: "Conversations", value: stats.totalConversations, icon: MessageSquareText, hint: "All time", tone: "from-emerald-500 to-teal-500" },
    { label: "FAQ Questions", value: stats.totalFaqs, icon: BookOpen, hint: "Knowledge base", tone: "from-fuchsia-500 to-pink-500" },
    { label: "Total Installs", value: stats.totalInstalls, icon: Code2, hint: "Script deployments", tone: "from-amber-500 to-orange-500" },
    { label: "Admin Users", value: stats.adminCount, icon: Shield, hint: "Privileged access", tone: "from-rose-500 to-red-500" },
    { label: "Regular Users", value: stats.userCount, icon: UserCheck, hint: "Standard accounts", tone: "from-teal-500 to-emerald-500" },
    { label: "Active Chatbots", value: stats.activeChatbots, icon: Activity, hint: "Currently live", tone: "from-blue-500 to-indigo-500" },
  ];

  const barData = [
    { t: "Users", v: stats.totalUsers },
    { t: "Chatbots", v: stats.totalChatbots },
    { t: "Conversations", v: stats.totalConversations },
    { t: "FAQs", v: stats.totalFaqs },
    { t: "Installs", v: stats.totalInstalls },
  ];

  const areaData = [
    { d: "Admins", msgs: stats.adminCount },
    { d: "Users", msgs: stats.userCount },
    { d: "Active", msgs: stats.activeChatbots },
    { d: "Total Bots", msgs: stats.totalChatbots },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overall system-wide stats and records.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
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
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-1 text-sm font-semibold">System Overview</h3>
          <p className="mb-4 text-xs text-muted-foreground">Distribution across the platform</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="oklch(0.92 0.015 270)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="oklch(0.5 0.03 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.03 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 270)" }} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]} fill="oklch(0.55 0.2 35)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-1 text-sm font-semibold">Role Distribution</h3>
          <p className="mb-4 text-xs text-muted-foreground">Admins vs Users vs Active Bots</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.2 35)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.2 35)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.015 270)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.5 0.03 270)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.03 270)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 270)" }} />
                <Area type="monotone" dataKey="msgs" stroke="oklch(0.55 0.2 35)" strokeWidth={2.5} fill="url(#gAdmin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Users</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border/60">
            {stats.recentUsers.map((u) => (
              <li key={u._id} className="flex items-center gap-3 py-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-[10px] font-bold text-white">
                  {u.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{u.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Chatbots</h3>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border/60">
            {stats.recentChatbots.map((b) => (
              <li key={b._id} className="flex items-center gap-3 py-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.adminUserId?.username ?? "Unknown"} · {b.installs} installs
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-medium ${b.isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {b.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{formatDate(b.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageTransition>
  );
}
