import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  LayoutTemplate,
  Settings,
  Bot,
  Code2,
  ChevronDown,
  DollarSign,
  HardDrive,
  Send,
  Instagram,
  Globe,
  Phone,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredToken } from "@/lib/auth";
import logo from "@/asset/logo.png";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/inbox", label: "Installer", icon: MessageSquareText },
  { to: "/dashboard/create", label: "Create Chatbot", icon: PlusCircle },
  { to: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/dashboard/storage", label: "Storage", icon: HardDrive },
  { to: "/dashboard/scripts", label: "Generated Scripts", icon: Code2 },
  { to: "/api-keys/docs", label: "Docs", icon: BookOpen },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const BOT_LINKS: NavItem[] = [
  { to: "/dashboard/telegram", label: "Telegram Bot", icon: Send },
  { to: "/dashboard/instagram", label: "Instagram Bot", icon: Instagram },
  { to: "/dashboard/facebook", label: "Facebook Bot", icon: Globe },
  { to: "/dashboard/whatsapp", label: "WhatsApp Bot", icon: Phone },
];

function isBotsActive(pathname: string) {
  return BOT_LINKS.some((b) => pathname.startsWith(b.to));
}

export function Sidebar({
  onNavigate,
  extra,
}: {
  onNavigate?: () => void;
  extra?: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [botsOpen, setBotsOpen] = useState(() => isBotsActive(pathname));
  const [planState, setPlanState] = useState<"active" | "expired" | "free">("free");
  const [activePurchase, setActivePurchase] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (isBotsActive(pathname)) setBotsOpen(true);
  }, [pathname]);

  useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/plan-purchase/active", { headers })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.purchase;
        if (!p) {
          setPlanState("free");
          return;
        }
        const expired =
          (p.status && p.status !== "active") ||
          (p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false);
        const paid =
          typeof p.planName === "string" &&
          p.planName !== "Free" &&
          Number(p.planPrice ?? p.planId?.price ?? 0) > 0;
        setActivePurchase(expired ? null : paid ? p : null);
        setPlanState(expired ? "expired" : paid ? "active" : "free");
      })
      .catch(() => {});
  }, []);

  const botActive = isBotsActive(pathname);

  const renderLink = (item: NavItem) => {
    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to as any}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="active-nav"
            className="absolute inset-0 rounded-xl bg-sidebar-accent shadow-soft"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <Icon className="relative h-4.5 w-4.5 shrink-0" />
        <span className="relative">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
      <Link to="/dashboard" onClick={onNavigate} className="flex w-60 items-center px-6 py-5">
        <img src={logo} alt="Webotme" className="h-14 w-auto shrink-0 object-contain" />
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-2">
        {navItems.slice(0, 5).map(renderLink)}

        <div>
          <button
            type="button"
            onClick={() => setBotsOpen((o) => !o)}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              botActive
                ? "text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {botActive && (
              <motion.span
                layoutId="active-nav"
                className="absolute inset-0 rounded-xl bg-sidebar-accent shadow-soft"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Bot className="relative h-4.5 w-4.5 shrink-0" />
            <span className="relative flex-1 text-left">Bots</span>
            <ChevronDown
              className={cn(
                "relative h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                botsOpen && "rotate-180",
              )}
            />
          </button>

          {botsOpen && (
            <div className="mt-1 space-y-0.5 pb-1">
              {BOT_LINKS.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 pl-10 text-[13px] font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-3.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {navItems.slice(5).map(renderLink)}
      </nav>

      {extra ? <div className="px-3 pb-2">{extra}</div> : null}

      <Link
        to="/plans"
        className={cn(
          "m-4 block rounded-2xl p-4 shadow-soft transition-colors",
          planState === "active"
            ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
            : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-semibold",
            planState === "active"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {planState === "active" ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <DollarSign className="h-3.5 w-3.5" />
          )}
          {planState === "expired" ? (
            "Plan Expired — Renew Now"
          ) : planState === "active" ? (
            "Plan Active"
          ) : (
            "Upgrade Plan"
          )}
        </div>
        <p
          className={cn(
            "mt-1.5 text-xs",
            planState === "active"
              ? "text-emerald-500/70 dark:text-emerald-400/70"
              : "text-rose-500/70 dark:text-rose-400/70",
          )}
        >
          {planState === "active"
            ? activePurchase?.expiresAt
              ? `Valid until ${new Date(activePurchase.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
              : "Your plan is active and running."
            : planState === "expired"
              ? "Your plan has expired. Renew now to keep features running."
              : "View plans and pick the perfect one for you."}
        </p>
      </Link>
    </aside>
  );
}