import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CreditCard,
  BadgeCheck,
  CircleX,
  Ban,
  Loader2,
  User as UserIcon,
  CalendarClock,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";

export const Route = createFileRoute("/admin/purchases")({
  head: () => ({ meta: [{ title: "Plan Purchases — Admin" }] }),
  component: AdminPurchases,
});

interface Purchase {
  _id: string;
  purchaseId: string;
  userId: string;
  user: { username: string; email: string; role: string };
  planId: string;
  planName: string;
  planPrice: number;
  currency: string;
  expiresInDays: number;
  status: "active" | "cancelled" | "expired";
  paymentMethod: "free" | "paypal" | "lemonsqueezy";
  paymentStatus: "free" | "paid" | "pending";
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  lemonsqueezyOrderId: string | null;
  lemonsqueezyCheckoutId: string | null;
  startedAt: string;
  expiresAt: string | null;
  periodDays: number;
  isDefault: boolean;
  createdAt: string;
}

function formatDate(input: string | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/admin/purchases", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPurchases(data);
        else if (data.message) setError(data.message);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Plan Purchases</h1>
        <p className="text-sm text-muted-foreground">
          Every plan purchase record — payment, expiry, and status.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading purchases...
        </div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-500">
          {error}
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground">
          No plan purchases yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Purchase</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Started</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-border/40 transition-colors hover:bg-accent/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                          <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-mono text-[11px] text-foreground">
                            {p.purchaseId.slice(-8)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            id: {p.purchaseId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-[9px] font-bold text-white">
                          {p.user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate text-xs font-medium">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            {p.user.username}
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                              {p.user.role}
                            </span>
                          </div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {p.userId}
                          </div>
                          <div className="truncate text-[10px] text-muted-foreground">
                            {p.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{p.planName}</span>
                      {p.isDefault && (
                        <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          default
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.planPrice > 0 ? `${p.currency} ${p.planPrice.toFixed(2)}` : "Free"}
                      {p.planPrice > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarClock className="h-3 w-3" /> {p.expiresInDays || 30} days
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.paymentStatus === "paid" ? "bg-emerald-500/15 text-emerald-600" : p.paymentStatus === "pending" ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.paymentMethod === "paypal"
                          ? "PayPal · "
                          : p.paymentMethod === "lemonsqueezy"
                            ? "Lemon Squeezy · "
                            : ""}
                        {p.paymentStatus === "paid"
                          ? "Paid"
                          : p.paymentStatus === "pending"
                            ? "Pending"
                            : "Free"}
                      </span>
                      {p.paypalOrderId && (
                        <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                          order: {p.paypalOrderId.slice(-10)}
                        </div>
                      )}
                      {p.lemonsqueezyOrderId && (
                        <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                          ls order: {p.lemonsqueezyOrderId.slice(-10)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.startedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.expiresAt ? (
                        formatDate(p.expiresAt)
                      ) : (
                        <span className="font-medium text-emerald-600">Lifetime</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === "active" ? "bg-emerald-500/15 text-emerald-600" : p.status === "expired" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.status === "active" ? (
                          <>
                            <BadgeCheck className="h-3 w-3" /> Active
                          </>
                        ) : p.status === "expired" ? (
                          <>
                            <CircleX className="h-3 w-3" /> Expired
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3" /> Cancelled
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
