import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  LayoutTemplate,
  Code2,
  Settings,
  Bot,
  Sparkles,
  DollarSign,
  HardDrive,
  Send,
  Instagram,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/asset/logo.png";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
export const navItems: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/inbox", label: "Installer", icon: MessageSquareText },
  { to: "/dashboard/faq", label: "FAQ Manager", icon: MessageSquareText },
  { to: "/dashboard/create", label: "Create Chatbot", icon: PlusCircle },
  { to: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/dashboard/storage", label: "Storage", icon: HardDrive },
  { to: "/dashboard/telegram", label: "Telegram Bot", icon: Send },
  { to: "/dashboard/instagram", label: "Instagram Bot", icon: Instagram },
  { to: "/dashboard/scripts", label: "Generated Scripts", icon: Code2 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
      <Link to="/dashboard" onClick={onNavigate} className="flex w-60 items-center px-6 py-5">
        <img src={logo} alt="Webotme" className="h-14 w-auto shrink-0 object-contain" />
      </Link>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
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
        })}
      </nav>
      <Link
        to="/plans"
        className="m-4 block rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 shadow-soft hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <DollarSign className="h-3.5 w-3.5" />
          Upgrade Plan
        </div>
        <p className="mt-1.5 text-xs text-rose-500/70 dark:text-rose-400/70">
          View plans and pick the perfect one for you.
        </p>
      </Link>
    </aside>
  );
}
