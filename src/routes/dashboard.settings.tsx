import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  Gift,
  KeyRound,
  Mail,
  Plug,
  RefreshCw,
  Save,
  Server,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
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

type SettingsTab = "profile" | "billing" | "coupons" | "connected" | "email" | "notifications";
type EmailType = "smtp" | "resend";

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "connected", label: "Connected accounts", icon: Plug },
  { key: "email", label: "Email setup", icon: Mail },
  { key: "notifications", label: "Notifications", icon: Bell },
];

const PROVIDER_LABELS: Record<string, string> = {
  zoho: "Zoho Mail",
  hostinger: "Hostinger",
  gmail: "Gmail",
  "google-workspace": "Google Workspace",
  "microsoft-365": "Microsoft 365",
  godaddy: "GoDaddy",
  yahoo: "Yahoo",
  outlook: "Outlook / Hotmail",
  yandex: "Yandex",
  migadu: "Migadu",
  improvmx: "ImprovMX",
  mailgun: "Mailgun",
  sendgrid: "SendGrid",
  custom: "Custom mail server",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROVIDER_SMTP: Record<string, { host: string; port: string; secure: boolean }> = {
  zoho: { host: "smtp.zoho.com", port: "465", secure: true },
  hostinger: { host: "smtp.hostinger.com", port: "465", secure: true },
  gmail: { host: "smtp.gmail.com", port: "587", secure: false },
  "google-workspace": { host: "smtp.gmail.com", port: "587", secure: false },
  "microsoft-365": { host: "smtp.office365.com", port: "587", secure: false },
  godaddy: { host: "smtpout.secureserver.net", port: "465", secure: true },
  yahoo: { host: "smtp.mail.yahoo.com", port: "465", secure: true },
  outlook: { host: "smtp-mail.outlook.com", port: "587", secure: false },
  yandex: { host: "smtp.yandex.com", port: "465", secure: true },
  migadu: { host: "smtp.migadu.com", port: "465", secure: true },
  improvmx: { host: "smtp.improvmx.com", port: "587", secure: false },
  mailgun: { host: "smtp.mailgun.org", port: "587", secure: false },
  sendgrid: { host: "smtp.sendgrid.net", port: "587", secure: false },
};

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* ── Coupons tab ─────────────────────────────────────────────── */
interface CouponRecord {
  code: string;
  planKey: string;
  percentOff: number;
  used: boolean;
  usedAt: string | null;
  usedPlanKey?: string | null;
  expiresAt: string | null;
  source: string;
  title: string;
  createdAt: string;
}

const couponPlanLabel = (key: string) =>
  key === "advanced" ? "Premium" : key === "pro" ? "Pro" : key === "starter" ? "Starter" : "Any plan";

const sourceLabel = (s: string) =>
  s === "signup"
    ? "Welcome offer"
    : s === "next_plan_offer"
      ? "Upgrade offer"
      : s === "loyalty"
        ? "Loyalty reward"
        : s === "seasonal"
          ? "Seasonal deal"
          : "Admin issued";

function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponRecord[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coupons/mine", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setCoupons(Array.isArray(data?.coupons) ? data.coupons : []))
      .catch(() => setCoupons([]));
  }, []);

  const statusOf = (c: CouponRecord): "active" | "used" | "expired" => {
    if (c.used) return "used";
    if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return "expired";
    return "active";
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const badge = (status: "active" | "used" | "expired") =>
    status === "active"
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : status === "used"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-red-500/10 text-red-600 border-red-500/30";

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Ticket className="h-4 w-4 text-primary" /> Coupons &amp; offers
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Every discount code issued to your account — active, expired and redeemed history.
        </p>
      </div>

      {coupons === null ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          Loading coupons…
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center shadow-soft">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No coupons yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Discount codes you receive will appear here with their full history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const status = statusOf(c);
            return (
              <div
                key={c.code}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-colors ${
                  status === "active" ? "border-primary/35 bg-accent/30" : "border-border/60"
                }`}
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    status === "active"
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Gift className="h-5 w-5" />
                </div>

                <div className="min-w-[180px] flex-1">
                  <button
                    onClick={() => copyCode(c.code)}
                    disabled={status !== "active"}
                    className="group inline-flex items-center gap-2 rounded-lg px-1 py-0.5 font-mono text-base font-bold tracking-wider transition-colors enabled:hover:text-primary disabled:cursor-default"
                  >
                    {c.code}
                    {status === "active" &&
                      (copiedCode === c.code ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      ))}
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{c.title || sourceLabel(c.source)}</span>
                    <span>·</span>
                    <span>Issued {c.createdAt ? formatDate(c.createdAt) : "—"}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-extrabold leading-none text-primary">
                    {c.percentOff}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">off</div>
                </div>

                <span className="rounded-full border border-border/70 bg-secondary px-2.5 py-1 text-[11px] font-semibold">
                  {couponPlanLabel(c.planKey)}
                </span>

                <div className="text-right text-[11px] text-muted-foreground">
                  {c.expiresAt ? (
                    <>
                      Expires {formatDate(c.expiresAt)}
                    </>
                  ) : (
                    <span className="font-semibold text-primary">Lifetime</span>
                  )}
                  {status === "used" && (
                    <div className="mt-0.5">
                      Used{c.usedAt ? ` ${formatDate(c.usedAt)}` : ""}
                      {c.usedPlanKey ? ` on ${couponPlanLabel(c.usedPlanKey)}` : ""}
                    </div>
                  )}
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge(status)}`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SettingsPage() {
  const userStr = localStorage.getItem("user");
  const storedUser = userStr ? JSON.parse(userStr) : null;

  const initialTab = (() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      return SETTINGS_TABS.some((x) => x.key === t) ? (t as SettingsTab) : "profile";
    } catch {
      return "profile";
    }
  })();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [name, setName] = useState(storedUser?.username || "");
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [notif, setNotif] = useState({ product: true, weekly: true, security: false });
  const [autoRenew, setAutoRenew] = useState<boolean | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [renewEndsAt, setRenewEndsAt] = useState<string | null>(null);
  const [renewBusy, setRenewBusy] = useState(false);

  // ── Email setup state (custom SMTP / Resend) ──
  const [emailCfgs, setEmailCfgs] = useState<any[]>([]);
  const [emailCfg, setEmailCfg] = useState<any>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [emailType, setEmailType] = useState<EmailType>("smtp");
  const [bizEmail, setBizEmail] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromName, setFromName] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [providerLabel, setProviderLabel] = useState("");
  const [providerKey, setProviderKey] = useState("");
  const [detectNote, setDetectNote] = useState("");
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailRemoving, setEmailRemoving] = useState(false);

  const loadEmailConfig = async () => {
    try {
      const res = await fetch("/api/email-config", { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        const configs: any[] = Array.isArray(data.configs)
          ? data.configs
          : data.config
            ? [data.config]
            : [];
        setEmailCfgs(configs);
        setEmailCfg(configs[0] || null);
        // Drop edit mode if the config being edited was deleted elsewhere
        setEditingEmailId((cur) =>
          cur && !configs.some((c) => c.id === cur) ? null : cur,
        );
        const first = configs[0];
        if (first?.fromName && !fromName) setFromName(first.fromName);
      }
    } catch {
      // silent — form stays empty
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    loadAutoRenew();
    loadEmailConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectProvider = async (rawEmail: string) => {
    const email = rawEmail.trim().toLowerCase();
    setDetecting(true);
    setDetectNote("");
    try {
      const res = await fetch("/api/email-config/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Detection failed");
      if (data.detected) {
        setProviderKey(String(data.provider || ""));
        setProviderLabel(PROVIDER_LABELS[String(data.provider)] || data.provider || "Detected");
        if (data.smtpHost) {
          setSmtpHost(data.smtpHost);
          setSmtpPort(String(data.smtpPort || 587));
          setSmtpSecure(Boolean(data.secure));
        }
        setDetectNote(
          data.note
            ? `${PROVIDER_LABELS[String(data.provider)] || data.provider}: ${data.note}`
            : "",
        );
      } else {
        setProviderKey("");
        setProviderLabel("");
        setDetectNote(
          data.message ||
            "Couldn't detect automatically — please pick your provider below or enter settings manually.",
        );
      }
    } catch (error: any) {
      setDetectNote(error.message || "Auto-detection failed — please pick your provider below.");
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (emailType !== "smtp") return;
    const email = bizEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) return;
    const timer = setTimeout(() => detectProvider(email), 700);
    return () => clearTimeout(timer);
  }, [bizEmail, emailType]);

  const handleManualProvider = (key: string) => {
    setProviderKey(key);
    setDetectNote("");
    if (!key) {
      setProviderLabel("");
      return;
    }
    const preset = PROVIDER_SMTP[key];
    setProviderLabel(PROVIDER_LABELS[key] || key);
    if (preset) {
      setSmtpHost(preset.host);
      setSmtpPort(preset.port);
      setSmtpSecure(preset.secure);
    }
  };

  const handleTestEmailSetup = async (targetId?: string | null) => {
    const id = targetId ?? editingEmailId;
    setEmailTesting(true);
    try {
      const body: Record<string, any> = { type: emailType, fromName: fromName.trim() };
      if (id) body.id = id;
      if (emailType === "smtp") {
        body.smtpHost = smtpHost.trim();
        body.smtpPort = Number(smtpPort) || 587;
        body.secure = smtpSecure;
        body.smtpUser = bizEmail.trim();
        body.smtpPass = smtpPass;
      } else {
        body.apiKey = resendKey.trim();
        body.fromEmail = resendFrom.trim();
      }
      const res = await fetch("/api/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Test failed");
      toast.success(data.message || "Connection working! Test email sent.");
      loadEmailConfig();
    } catch (error: any) {
      toast.error(error.message || "Test failed");
    } finally {
      setEmailTesting(false);
    }
  };

  const handleSaveEmailSetup = async () => {
    setEmailSaving(true);
    try {
      const editingCfg = editingEmailId
        ? emailCfgs.find((c) => c.id === editingEmailId)
        : null;
      const body: Record<string, any> = {
        type: emailType,
        fromName: fromName.trim(),
        verify: true,
      };
      if (editingEmailId) body.id = editingEmailId;
      if (emailType === "smtp") {
        if (!bizEmail.trim() || !bizEmail.includes("@")) throw new Error("Business email is required");
        if (!smtpHost.trim()) throw new Error("SMTP host is required — select your provider or enter it manually");
        const hasSavedPass = editingCfg?.type === "smtp";
        if (!smtpPass && !hasSavedPass) throw new Error("Email password is required");
        body.provider = providerKey;
        body.smtpHost = smtpHost.trim();
        body.smtpPort = Number(smtpPort) || 587;
        body.secure = smtpSecure;
        body.smtpUser = bizEmail.trim().toLowerCase();
        if (smtpPass) body.smtpPass = smtpPass;
      } else {
        if (!resendFrom.trim()) throw new Error("From email is required");
        const hasSavedKey = editingCfg?.type === "resend";
        if (!resendKey.trim() && !hasSavedKey) throw new Error("Resend API key is required");
        if (resendKey.trim()) body.apiKey = resendKey.trim();
        body.fromEmail = resendFrom.trim().toLowerCase();
      }

      const res = await fetch("/api/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save email setup");

      setSmtpPass("");
      setResendKey("");
      setEditingEmailId(null);
      await loadEmailConfig();
      toast.success(
        data.message ||
          (editingCfg
            ? "Email setup updated!"
            : "Custom email connected! Your chatbot emails will now send from your address."),
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save email setup");
    } finally {
      setEmailSaving(false);
    }
  };

  const startEditConfig = (cfg: any) => {
    setEditingEmailId(cfg.id);
    setEmailType(cfg.type === "resend" ? "resend" : "smtp");
    setFromName(cfg.fromName || "");
    setProviderKey(cfg.provider || "");
    setProviderLabel(PROVIDER_LABELS[cfg.provider] || (cfg.type === "resend" ? "Resend" : ""));
    setDetectNote("");
    if (cfg.type === "smtp") {
      setBizEmail(cfg.smtpUserMasked || "");
      setSmtpHost(cfg.smtpHost || "");
      setSmtpPort(String(cfg.smtpPort || 587));
      setSmtpSecure(Boolean(cfg.secure));
      setResendFrom("");
    } else {
      setBizEmail("");
      setResendFrom(cfg.fromEmail || "");
      setSmtpHost("");
      setSmtpPort("587");
      setSmtpSecure(false);
    }
    setSmtpPass("");
    setResendKey("");
  };

  const cancelEditConfig = () => {
    setEditingEmailId(null);
    resetEmailForm();
  };

  const resetEmailForm = () => {
    setBizEmail("");
    setSmtpPass("");
    setFromName("");
    setSmtpHost("");
    setSmtpPort("587");
    setSmtpSecure(false);
    setResendKey("");
    setResendFrom("");
    setProviderLabel("");
    setProviderKey("");
    setDetectNote("");
  };

  const handleRemoveEmailSetup = async (targetId?: string | null) => {
    const id = targetId ?? null;
    setEmailRemoving(true);
    try {
      const res = await fetch(id ? `/api/email-config?id=${encodeURIComponent(id)}` : "/api/email-config", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove email setup");
      if (editingEmailId && editingEmailId === id) cancelEditConfig();
      await loadEmailConfig();
      toast.success(
        id ? "Saved email removed" : "Custom email removed — using system default again",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to remove email setup");
    } finally {
      setEmailRemoving(false);
    }
  };

  const loadAutoRenew = async () => {
    try {
      const res = await fetch("/api/paddle/auto-renew", { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setHasSubscription(Boolean(data.hasSubscription));
      setAutoRenew(Boolean(data.autoRenew));
      setRenewEndsAt(data.endsAt ? formatDate(data.endsAt) : null);
    } catch {
      // silent — status stays hidden on failure
    }
  };

  const handleToggleAutoRenew = async (next: boolean) => {
    setRenewBusy(true);
    try {
      const res = await fetch(`/api/paddle/auto-renew/${next ? "enable" : "disable"}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update auto-renew");
      setAutoRenew(Boolean(data.autoRenew));
      setRenewEndsAt(data.endsAt ? formatDate(data.endsAt) : null);
      toast.success(next ? "Auto-renew is back on" : "Auto-renew turned off");
    } catch (error: any) {
      toast.error(error.message || "Failed to update auto-renew");
    } finally {
      setRenewBusy(false);
    }
  };

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
      if (!response.ok || !data.url)
        throw new Error(data.message || "Unable to open billing portal");
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
        <p className="text-sm text-muted-foreground">
          Manage your profile, billing, and preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-56">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-card p-2 shadow-soft lg:flex-col lg:overflow-visible">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cnTab(isActive)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logged in as card */}
          <div className="mt-4 hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft lg:block">
            <div className="mb-3 text-xs font-semibold text-muted-foreground">Logged in as</div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white">
                {(storedUser?.username || "U").substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {storedUser?.username || "Unknown"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {storedUser?.email || ""}
                </div>
                <div className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                  {storedUser?.role || "user"}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-6">
          {activeTab === "profile" && (
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
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
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
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
          )}

          {activeTab === "billing" && (
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Paddle billing</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your payment method, subscription, and invoices.
                  </p>
                </div>
                <GradientButton onClick={handleOpenBilling} disabled={openingPortal}>
                  <ExternalLink className="h-4 w-4" />{" "}
                  {openingPortal ? "Opening..." : "Manage billing"}
                </GradientButton>
              </div>

              {hasSubscription && autoRenew !== null && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/40 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      Auto-renew{" "}
                      {autoRenew ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          On
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                          Off
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {autoRenew
                        ? "Your plan renews automatically at the end of each billing period."
                        : renewEndsAt
                          ? `Auto-renew is off. You keep full access until ${renewEndsAt}, then your plan ends and you won't be charged again.`
                          : "Auto-renew is off. Your plan will end after the current billing period."}
                    </p>
                  </div>
                  <Switch
                    checked={autoRenew}
                    disabled={renewBusy}
                    onCheckedChange={(v) => handleToggleAutoRenew(v)}
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === "coupons" && <CouponsTab />}

          {activeTab === "connected" && <StripeConnectCard />}

          {activeTab === "email" && (
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Mail className="h-4 w-4 text-primary" /> Email setup
                </h2>
                {emailLoading ? null : emailCfgs.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3 w-3" />
                    {emailCfgs.length === 1
                      ? emailCfgs[0].verified
                        ? "1 email connected & verified"
                        : "1 email connected"
                      : `${emailCfgs.length} emails connected`}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Using system default
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Connect your own business email so every order confirmation &amp; notification your
                chatbots send arrives from <strong>your own address</strong> — not ours. Just enter
                your email; we auto-detect the provider (Zoho, Hostinger, Google Workspace, GoDaddy…).
                You can save multiple emails and pick which one each chatbot uses.
              </p>

              {/* ── Saved connections list ── */}
              {!emailLoading && emailCfgs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {emailCfgs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className={`rounded-xl border p-4 ${
                        editingEmailId === cfg.id
                          ? "border-primary/50 bg-primary/5"
                          : cfg.verified
                            ? "border-emerald-500/25 bg-emerald-500/5"
                            : "border-amber-500/30 bg-amber-500/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 space-y-0.5 text-xs">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="font-semibold text-foreground">
                              {PROVIDER_LABELS[cfg.provider] || (cfg.type === "resend" ? "Resend" : "SMTP")}
                            </span>
                            <span className="text-muted-foreground">
                              📧 {cfg.smtpUserMasked || cfg.fromEmail}
                            </span>
                            {cfg.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                <BadgeCheck className="h-3 w-3" /> Verified
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                Not verified
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            Type: {cfg.type === "smtp" ? "Business email (SMTP)" : "Resend API"}
                            {cfg.fromName ? ` • Sender name: ${cfg.fromName}` : ""}
                            {cfg.lastVerifiedAt ? ` • Verified ${formatDate(cfg.lastVerifiedAt)}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestEmailSetup(cfg.id)}
                            disabled={emailTesting}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${emailTesting ? "animate-spin" : ""}`} />
                            Test
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditConfig(cfg)}
                            disabled={emailSaving}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmailSetup(cfg.id)}
                            disabled={emailRemoving}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Form mode banner ── */}
              {editingEmailId ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-semibold text-foreground">
                    Editing a saved email — leave the password field empty to keep the stored one.
                  </p>
                  <button
                    type="button"
                    onClick={cancelEditConfig}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-semibold transition hover:bg-accent"
                  >
                    Cancel edit
                  </button>
                </div>
              ) : (
                emailCfgs.length > 0 && (
                  <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <p className="text-xs font-semibold text-foreground">
                      Add another email
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Fill the form below to connect one more business email.
                    </p>
                  </div>
                )
              )}

              {/* ── Method selection ── */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEmailType("smtp")}
                  className={`rounded-xl border p-4 text-left transition ${
                    emailType === "smtp"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Server className="h-4 w-4 text-primary" /> Business email
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Zoho, Hostinger, Google Workspace, GoDaddy or any hosting email.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType("resend")}
                  className={`rounded-xl border p-4 text-left transition ${
                    emailType === "resend"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-primary" /> Resend API key
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Best deliverability — requires a domain verified at resend.com.
                  </p>
                </button>
              </div>

              {/* ── SMTP form ── */}
              {emailType === "smtp" && (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground/80">
                      Your business email
                      {detecting && (
                        <span className="inline-flex items-center gap-1 font-normal text-muted-foreground">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Detecting…
                        </span>
                      )}
                    </span>
                    <input
                      value={bizEmail}
                      onChange={(e) => setBizEmail(e.target.value)}
                      className="input"
                      type="email"
                      placeholder="info@yourstore.com"
                    />
                  </label>

                  {providerLabel && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="h-3.5 w-3.5" /> {providerLabel} detected — settings filled automatically
                    </div>
                  )}
                  {detectNote && (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
                      ℹ️ {detectNote}
                    </p>
                  )}

                  <div className="grid gap-4 md:grid-cols-[1.2fr_2fr_0.8fr]">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">Email provider</span>
                      <select
                        value={providerKey}
                        onChange={(e) => handleManualProvider(e.target.value)}
                        className="input"
                      >
                        <option value="">Auto-detect from email</option>
                        {Object.keys(PROVIDER_LABELS).map((key) => (
                          <option key={key} value={key}>
                            {PROVIDER_LABELS[key]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">SMTP server</span>
                      <input
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="input font-mono text-xs"
                        placeholder="smtp.zoho.com"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">Port</span>
                      <select
                        value={smtpPort}
                        onChange={(e) => {
                          setSmtpPort(e.target.value);
                          if (e.target.value === "465") setSmtpSecure(true);
                        }}
                        className="input"
                      >
                        <option value="465">465 (SSL)</option>
                        <option value="587">587 (TLS)</option>
                        <option value="25">25</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold">SSL/TLS secure connection</div>
                      <div className="text-[11px] text-muted-foreground">Keep on for port 465</div>
                    </div>
                    <Switch checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Email password / app password
                        {emailCfg?.type === "smtp" && (
                          <span className="font-normal text-muted-foreground"> (saved — leave empty to keep)</span>
                        )}
                      </span>
                      <input
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="input font-mono"
                        type="password"
                        autoComplete="new-password"
                        placeholder={emailCfg?.type === "smtp" ? "••••••••" : "Your mail password"}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Sender name <span className="font-normal text-muted-foreground">(shown in inbox)</span>
                      </span>
                      <input
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        className="input"
                        placeholder="e.g. ECM Store"
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                    <div className="text-xs font-semibold text-foreground/80">
                      🔑 How to get your app password
                    </div>
                    <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      <li>
                        1. Open{" "}
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                        >
                          Google Security settings <ExternalLink className="h-3 w-3" />
                        </a>{" "}
                        and turn on <span className="font-semibold">2-Step Verification</span>{" "}
                        (normal Gmail passwords don&apos;t work).
                      </li>
                      <li>
                        2. Go to{" "}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                        >
                          App Passwords <ExternalLink className="h-3 w-3" />
                        </a>
                        , create one with app type <span className="font-semibold">Mail</span> and copy the 16-character password.
                      </li>
                      <li>3. Paste that 16-character app password in the password field above.</li>
                    </ol>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Zoho / Hostinger / GoDaddy: use your mailbox password, or generate an app password from your email provider&apos;s dashboard if 2FA is on.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Resend form ── */}
              {emailType === "resend" && (
                <div className="mt-5 space-y-4">
                  <ol className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
                    <li>
                      1. Sign up at{" "}
                      <a href="https://resend.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
                        resend.com <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      and verify your domain under <span className="font-semibold">Domains</span>.
                    </li>
                    <li>2. Create an API key under <span className="font-semibold">API Keys</span>.</li>
                    <li>3. Paste the key below.</li>
                  </ol>

                  <label className="block">
                    <span className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground/80">
                      Resend API key
                      {emailCfg?.type === "resend" && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600">
                          saved — leave empty to keep
                        </span>
                      )}
                    </span>
                    <input
                      value={resendKey}
                      onChange={(e) => setResendKey(e.target.value)}
                      className="input font-mono"
                      type="password"
                      autoComplete="off"
                      placeholder={emailCfg?.type === "resend" ? "re_••••••••" : "re_123abc..."}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        From email <span className="font-normal text-muted-foreground">(verified domain)</span>
                      </span>
                      <input
                        value={resendFrom}
                        onChange={(e) => setResendFrom(e.target.value)}
                        className="input"
                        type="email"
                        placeholder="orders@yourstore.com"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">Sender name</span>
                      <input
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        className="input"
                        placeholder="e.g. ECM Store"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleTestEmailSetup()}
                  disabled={emailTesting || emailLoading}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold transition hover:bg-accent disabled:opacity-50"
                >
                  {emailTesting ? "Sending test..." : "Test connection"}
                </button>
                <GradientButton onClick={handleSaveEmailSetup} disabled={emailSaving || emailLoading}>
                  <Save className="h-4 w-4" />{" "}
                  {emailSaving
                    ? "Verifying..."
                    : editingEmailId
                      ? "Update this setup"
                      : emailCfgs.length > 0
                        ? "Connect another email"
                        : "Connect email"}
                </GradientButton>
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4 text-primary" /> Notifications
              </h2>
              <div className="mt-4 space-y-4">
                {[
                  { key: "product", label: "Product updates", desc: "New features and releases" },
                  { key: "weekly", label: "Weekly digest", desc: "Stats from your chatbots" },
                  {
                    key: "security",
                    label: "Security alerts",
                    desc: "Sign-in and account changes",
                  },
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
          )}
        </div>
      </div>

      <style>{`.input{height:2.5rem;width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-card);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 30%, transparent)}`}</style>
    </PageTransition>
  );
}

function cnTab(isActive: boolean) {
  return [
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  ].join(" ");
}
