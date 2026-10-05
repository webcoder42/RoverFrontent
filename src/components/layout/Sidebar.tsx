import { Link, useRouterState } from "@tanstack/react-router";
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
  ChevronsUpDown,
  DollarSign,
  HardDrive,
  Send,
  Instagram,
  Globe,
  Phone,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import logo from "@/asset/logo.png";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  external?: boolean;
};

const MAIN_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/inbox", label: "Installer", icon: MessageSquareText },
  { to: "/dashboard/create", label: "Create chatbot", icon: PlusCircle },
];

const BUILD_TOP: NavItem[] = [
  { to: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/dashboard/storage", label: "Storage", icon: HardDrive },
];

const BUILD_BOTTOM: NavItem[] = [
  { to: "/dashboard/scripts", label: "Generated scripts", icon: Code2 },
];

const SUPPORT_ITEMS: NavItem[] = [
  { to: "/docs", label: "Docs", icon: BookOpen, external: true },
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
  const user = getStoredUser();
  const username = typeof user?.username === "string" ? user.username : "User";

  const renderLink = (item: NavItem) => {
    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
    const Icon = item.icon;
    const cls = cn(
      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-[#f7e8dc] text-[#1c1917]"
        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );
    const icon = (
      <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-[#e8641f]" : "text-muted-foreground")} />
    );
    if (item.external) {
      return (
        <a key={item.to} href={item.to} target="_blank" rel="noreferrer" className={cls}>
          {icon}
          <span>{item.label}</span>
        </a>
      );
    }
    return (
      <Link key={item.to} to={item.to as any} onClick={onNavigate} className={cls}>
        {icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  const sectionLabel = (label: string) => (
    <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
      {label}
    </p>
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
      <Link to="/dashboard" onClick={onNavigate} className="flex w-full items-center px-5 py-5">
        <img src={logo} alt="Webotme" className="h-12 w-auto shrink-0 object-contain" />
      </Link>

      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#dbeafe] text-xs font-bold text-[#1e40af]">
            {username.substring(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
            {username}'s workspace
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sectionLabel("Main")}
        <div className="space-y-1">{MAIN_ITEMS.map(renderLink)}</div>

        {sectionLabel("Build")}
        <div className="space-y-1">
          {BUILD_TOP.map(renderLink)}

          <button
            type="button"
            onClick={() => setBotsOpen((o) => !o)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              botActive
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Bot className={cn("h-4.5 w-4.5 shrink-0", botActive ? "text-[#e8641f]" : "text-muted-foreground")} />
            <span className="flex-1 text-left">Bots</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", botsOpen && "rotate-180")}
            />
          </button>

          {botsOpen && (
            <div className="mt-1 space-y-1 pb-1">
              {BOT_LINKS.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    onClick={onNavigate}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg py-2 pl-10 pr-3 text-[13px] font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {BUILD_BOTTOM.map(renderLink)}
        </div>

        {sectionLabel("Support")}
        <div className="space-y-1">{SUPPORT_ITEMS.map(renderLink)}</div>
      </nav>

      {extra ? <div className="px-3 pb-2">{extra}</div> : null}

      <Link
        to="/plans"
        className={cn(
          "m-4 mt-2 block rounded-2xl border p-4 shadow-soft transition-colors",
          planState === "active"
            ? "border-emerald-200/60 bg-emerald-50 hover:bg-emerald-100"
            : "border-rose-200/60 bg-rose-50 hover:bg-rose-100",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-[13px] font-semibold",
            planState === "active" ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {planState === "active" ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          ) : (
            <DollarSign className="h-3.5 w-3.5" />
          )}
          {planState === "expired" ? "Plan Expired" : planState === "active" ? "Premium plan" : "Free plan"}
        </div>
        <p className={cn("mt-1.5 text-xs", planState === "active" ? "text-emerald-600/70" : "text-rose-500/70")}>
          {planState === "active"
            ? activePurchase?.expiresAt
              ? `Valid until ${new Date(activePurchase.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
              : "Your plan is active and running."
            : planState === "expired"
              ? "Renew now to keep features running."
              : "Upgrade to unlock all features."}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={cn(
              "h-full rounded-full",
              planState === "active" ? "w-2/3 bg-[#e8641f]" : "w-1/4 bg-rose-500",
            )}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {planState === "active" && activePurchase?.expiresAt
            ? `${Math.max(0, Math.ceil((new Date(activePurchase.expiresAt).getTime() - Date.now()) / 86400000))} days remaining`
            : planState === "expired"
              ? "Plan expired"
              : "No active plan"}
        </p>
      </Link>
    </aside>
  );
}
