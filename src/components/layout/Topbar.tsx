import { Bell, Search, Menu, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import { clearAuth, getStoredUser, getStoredToken } from "@/lib/auth";
import { FREE_PLAN } from "@/lib/plans";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const user = getStoredUser();
  const username = typeof user?.username === "string" ? user.username : "User";
  const role = typeof user?.role === "string" ? user.role : "Admin";
  const initials = username.substring(0, 2).toUpperCase();

  const [planName, setPlanName] = useState<string>(FREE_PLAN.name);

  useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/plan-purchase/active", { headers })
      .then((r) => r.json())
      .then((data) => {
        const purchase = data?.purchase;
        if (purchase) {
          setPlanName(purchase.planName || purchase.planId?.name || FREE_PLAN.name);
        }
      })
      .catch(() => {});
  }, []);

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
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search chatbots, templates..."
          className="h-10 w-full rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Current plan badge */}
      <div className="hidden items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 md:flex">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium text-primary">{planName}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-card hover:bg-accent">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-card pl-1.5 pr-3 py-1.5 hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-primary text-[11px] font-bold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-xs font-semibold leading-tight">{username}</div>
                <div className="text-[10px] text-muted-foreground">{role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
