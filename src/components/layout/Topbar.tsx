import { Bell, Search, Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { clearAuth, getStoredUser } from "@/lib/auth";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const user = getStoredUser();
  const username = typeof user?.username === "string" ? user.username : "User";
  const role = typeof user?.role === "string" ? user.role : "User";
  const initials = username.substring(0, 2).toUpperCase();

  const handleSignOut = () => {
    clearAuth();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-foreground/80 md:hidden">
            <Menu className="h-4.5 w-4.5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search chatbots, templates..."
          className="h-10 w-full rounded-full border border-border/60 bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-card text-foreground/80 transition-colors hover:bg-accent">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff5a3c] ring-2 ring-card" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3 transition-colors hover:bg-accent">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8641f] text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="text-left">
                <span className="block text-[13px] font-semibold leading-tight">{username}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{role}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
