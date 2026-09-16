import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { LayoutDashboard, Bot, Users, Settings, Sparkles, Menu, DollarSign, Package, HardDrive, CreditCard, Ticket, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredUser, clearAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/layout/Topbar";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) {
      throw redirect({ to: "/" });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/chatbots", label: "All Chatbots", icon: Bot },
  { to: "/admin/flows", label: "Flow", icon: Workflow },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/storage", label: "Storage", icon: HardDrive },
  { to: "/admin/users", label: "All Users", icon: Users },
  { to: "/admin/plans", label: "Plans", icon: DollarSign },
  { to: "/admin/purchases", label: "Purchases", icon: CreditCard },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-card/90 backdrop-blur-xl">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-6 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">Admin Panel</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">System Control</div>
        </div>
      </Link>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {adminNavItems.map((item) => {
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
                  ? "text-rose-600"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav"
                  className="absolute inset-0 rounded-xl bg-rose-50 shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4.5 w-4.5 shrink-0" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="m-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-600/10 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
          <Sparkles className="h-3.5 w-3.5" />
          Admin Access
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Full system control and monitoring.
        </p>
      </div>
      <div className="border-t border-border/60 p-4">
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to User Dashboard
        </Link>
      </div>
    </aside>
  );
}

export function AdminTopbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const username = typeof user?.username === "string" ? user.username : "Admin";
  const initials = username.substring(0, 2).toUpperCase();

  const handleSignOut = () => {
    clearAuth();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-card text-foreground/80 hover:bg-accent md:hidden">
            <Menu className="h-4.5 w-4.5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-card pl-1.5 pr-3 py-1.5 hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-[11px] font-bold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-xs font-semibold leading-tight">{username}</div>
              <div className="text-[10px] text-muted-foreground">Admin</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/admin/settings" })}>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>User Dashboard</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex md:sticky md:top-0 md:h-screen">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
