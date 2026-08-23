import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Ticket,
  Gift,
  Copy,
  Check,
  Ban,
  Loader2,
  RefreshCw,
  PlusCircle,
  Infinity as InfinityIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/common/PageTransition";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin" }] }),
  component: AdminCoupons,
});

interface CouponRow {
  code: string;
  percentOff: number;
  planKey: string;
  used: boolean;
  usedAt: string | null;
  usedPlanKey?: string | null;
  expiresAt: string | null;
  source: string;
  title: string;
  notes: string;
  createdAt: string;
  userId: { _id?: string; username?: string; email?: string } | null;
}

interface UserOption {
  _id: string;
  username: string;
  email: string;
}

const planLabel = (k: string) =>
  k === "advanced" ? "Premium" : k === "pro" ? "Pro" : k === "starter" ? "Starter" : "Any plan";

function fmt(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

type Status = "active" | "used" | "expired";
function statusOf(c: CouponRow): Status {
  if (c.used) return "used";
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

const statusStyles: Record<Status, string> = {
  active:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  used: "bg-muted text-muted-foreground border-border",
  expired: "bg-red-500/10 text-red-600 border-red-500/30",
};

function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // issue form
  const [fUser, setFUser] = useState("");
  const [fPlan, setFPlan] = useState("any");
  const [fPercent, setFPercent] = useState("50");
  const [fDays, setFDays] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fNotes, setFNotes] = useState("");

  const headers = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  const load = () => {
    fetch("/api/admin/coupons", { headers: headers() })
      .then((r) => r.json())
      .then((data) => setCoupons(Array.isArray(data?.coupons) ? data.coupons : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/admin/users", { headers: headers() })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data?.users) ? data.users : []))
      .catch(() => {});
  };

  useEffect(load, []);

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => statusOf(c) === "active").length,
    used: coupons.filter((c) => statusOf(c) === "used").length,
    expired: coupons.filter((c) => statusOf(c) === "expired").length,
  };

  const issue = async () => {
    if (!fUser) return toast.error("Select a user first");
    setIssuing(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          userId: fUser,
          planKey: fPlan,
          percentOff: fPercent,
          validDays: fDays,
          title: fTitle,
          notes: fNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Failed to issue coupon");
      toast.success(`Coupon ${data.coupon.code} issued! It now shows in that user's dashboard.`);
      setFTitle("");
      setFNotes("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIssuing(false);
    }
  };

  const revoke = async (code: string) => {
    if (!confirm(`Revoke ${code}? The user will no longer be able to use it.`)) return;
    setRevoking(code);
    try {
      const res = await fetch(`/api/admin/coupons/${code}/revoke`, {
        method: "PATCH",
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Failed to revoke");
      toast.success(`${code} revoked`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRevoking(null);
    }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 1500);
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
            <Ticket className="h-6 w-6 text-primary" /> Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            Issue discount codes to any user and track who claimed or redeemed them.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Issued", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Used", value: stats.used },
          { label: "Expired / Revoked", value: stats.expired },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Issue form */}
      <div className="mb-8 rounded-2xl border border-primary/25 bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <PlusCircle className="h-4 w-4 text-primary" /> Issue a new coupon
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">User *</span>
            <select value={fUser} onChange={(e) => setFUser(e.target.value)} className={inputCls}>
              <option value="">— Select user —</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Plan</span>
            <select value={fPlan} onChange={(e) => setFPlan(e.target.value)} className={inputCls}>
              <option value="any">Any plan</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="advanced">Premium</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Discount %</span>
            <input
              type="number"
              min={1}
              max={100}
              value={fPercent}
              onChange={(e) => setFPercent(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">
              Validity (days) — empty = lifetime
            </span>
            <input
              type="number"
              min={0}
              placeholder="e.g. 7 (or leave empty for lifetime)"
              value={fDays}
              onChange={(e) => setFDays(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Title</span>
            <input
              placeholder='e.g. "Loyalty reward"'
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Internal note</span>
            <input
              placeholder="Only visible to admins"
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
        <button
          onClick={issue}
          disabled={issuing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
        >
          {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          {issuing ? "Issuing…" : "Issue coupon"}
        </button>
      </div>

      {/* Records */}
      {loading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading coupons…
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center shadow-soft">
          <Ticket className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No coupons issued yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const st = statusOf(c);
                  return (
                    <tr key={c.code} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copy(c.code)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider hover:text-primary"
                        >
                          {c.code}
                          {copied === c.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{c.userId?.username || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{c.userId?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">{c.percentOff}%</td>
                      <td className="px-4 py-3">{planLabel(c.planKey)}</td>
                      <td className="px-4 py-3">
                        <div>{c.title || c.source}</div>
                        {c.notes && (
                          <div className="max-w-[160px] truncate text-[11px] italic text-muted-foreground">
                            {c.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">{fmt(c.createdAt)}</td>
                      <td className="px-4 py-3 text-xs">
                        {c.expiresAt ? (
                          fmt(c.expiresAt)
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-primary">
                            <InfinityIcon className="h-3.5 w-3.5" /> Lifetime
                          </span>
                        )}
                        {st === "used" && (
                          <div className="text-[11px] text-muted-foreground">
                            Used{c.usedAt ? ` ${fmt(c.usedAt)}` : ""}
                            {c.usedPlanKey ? ` on ${planLabel(c.usedPlanKey)}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[st]}`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {st === "active" && (
                          <button
                            onClick={() => revoke(c.code)}
                            disabled={revoking === c.code}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {revoking === c.code ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
