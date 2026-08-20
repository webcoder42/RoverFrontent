import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, ExternalLink, Mail, Save, User } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { GradientButton } from "@/components/common/GradientButton";
import { StripeConnectCard } from "@/components/stripe/StripeConnectCard";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Webotme" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const userStr = localStorage.getItem("user");
  const storedUser = userStr ? JSON.parse(userStr) : null;

  const [name, setName] = useState(storedUser?.username || "");
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [notif, setNotif] = useState({ product: true, weekly: true, security: false });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeParam = params.get("stripe");
    if (stripeParam === "return") {
      toast.success("Returned from Stripe. Checking your connection status…");
      window.history.replaceState({}, "", "/dashboard/settings");
    } else if (stripeParam === "refresh") {
      toast.message("Stripe onboarding link expired. Use Complete Stripe setup to continue.");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, []);

  const handleSave = async () => {
    if (!storedUser?.id) {
      toast.error("User not logged in");
      return;
    }
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: storedUser.id, username: name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      // Update localStorage
      const updatedUser = { ...storedUser, username: data.user.username };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenBilling = async () => {
    setOpeningPortal(true);
    try {
      const response = await fetch("/api/paddle/portal", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || "Unable to open billing portal");
      window.location.assign(data.url);
    } catch (error: any) {
      toast.error(error.message || "Unable to open billing portal");
      setOpeningPortal(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and notification preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Section */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <User className="h-4 w-4 text-primary" /> Profile
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Editable: Name */}
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <User className="h-4 w-4" /> Full name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </label>

            {/* Read-only: Email */}
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <Mail className="h-4 w-4" /> Email
              </span>
              <div className="relative">
                <input
                  value={storedUser?.email || ""}
                  readOnly
                  className="input cursor-not-allowed opacity-60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Read only
                </span>
              </div>
            </label>
          </div>

          <div className="mt-8 flex justify-end">
            <GradientButton onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
            </GradientButton>
          </div>
        </section>

        <StripeConnectCard className="lg:col-span-3" />

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Paddle billing</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage your payment method, subscription, and invoices.</p>
            </div>
            <GradientButton onClick={handleOpenBilling} disabled={openingPortal}>
              <ExternalLink className="h-4 w-4" /> {openingPortal ? "Opening..." : "Manage billing"}
            </GradientButton>
          </div>
        </section>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Notifications */}
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-primary" /> Notifications
            </h2>
            <div className="mt-4 space-y-4">
              {[
                { key: "product", label: "Product updates", desc: "New features and releases" },
                { key: "weekly", label: "Weekly digest", desc: "Stats from your chatbots" },
                { key: "security", label: "Security alerts", desc: "Sign-in and account changes" },
              ].map((n) => (
                <div key={n.key} className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">{n.label}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </div>
                  <Switch
                    checked={(notif as any)[n.key]}
                    onCheckedChange={(v) => setNotif((s) => ({ ...s, [n.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Logged in as card */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="text-xs font-semibold text-muted-foreground mb-3">Logged in as</div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shrink-0">
                {(storedUser?.username || "U").substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{storedUser?.username || "Unknown"}</div>
                <div className="text-xs text-muted-foreground truncate">{storedUser?.email || ""}</div>
                <div className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                  {storedUser?.role || "user"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`.input{height:2.5rem;width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-card);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 30%, transparent)}`}</style>
    </PageTransition>
  );
}
