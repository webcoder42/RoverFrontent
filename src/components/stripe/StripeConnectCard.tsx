import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Unplug, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GradientButton } from "@/components/common/GradientButton";
import {
  disconnectStripeAccount,
  fetchStripeConnectStatus,
  refreshStripeConnectOnboarding,
  startStripeConnectOnboarding,
  type StripeConnectStatus,
} from "@/lib/stripe";
import { cn } from "@/lib/utils";

type StripeConnectCardProps = {
  compact?: boolean;
  onStatusChange?: (status: StripeConnectStatus | null) => void;
  className?: string;
};

export function StripeConnectCard({ compact = false, onStatusChange, className }: StripeConnectCardProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"connect" | "refresh" | "disconnect" | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStripeConnectStatus();
      setStatus(data);
      onStatusChange?.(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Stripe status");
      setStatus(null);
      onStatusChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const redirectToStripe = async (action: "connect" | "refresh") => {
    setActionLoading(action);
    try {
      const data =
        action === "connect"
          ? await startStripeConnectOnboarding()
          : await refreshStripeConnectOnboarding();

      if (!data.url) {
        throw new Error("Stripe did not return an onboarding URL");
      }

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Could not open Stripe onboarding");
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Stripe from Webotme? Online payments will stop until you connect again.")) {
      return;
    }

    setActionLoading("disconnect");
    try {
      await disconnectStripeAccount();
      toast.success("Stripe account disconnected");
      await loadStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect Stripe");
    } finally {
      setActionLoading(null);
    }
  };

  const isReady = Boolean(status?.connected && status.chargesEnabled && status.onboardingComplete);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-soft",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Stripe Connect
            </p>
            <h2 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
              Accept online payments
            </h2>
          </div>
        </div>

        {!loading && status && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isReady
                ? "bg-emerald-500/10 text-emerald-600"
                : status.connected
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {isReady ? "Ready for payments" : status.connected ? "Setup incomplete" : "Not connected"}
          </span>
        )}
      </div>

      <p className={cn("mt-3 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        Connect your Stripe account to accept <strong>Online Payment</strong> in chatbot orders.
        Payments go directly to your connected Stripe account.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Stripe status…
        </div>
      ) : !status?.configured ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Stripe keys not configured on server</p>
              <p className="mt-1 text-xs opacity-90">
                Add <code className="rounded bg-muted px-1">STRIPE_SECRET_KEY</code> and{" "}
                <code className="rounded bg-muted px-1">STRIPE_PUBLISHABLE_KEY</code> to{" "}
                <code className="rounded bg-muted px-1">server/.env</code>, then restart the server.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {status.connected && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Account linked", ok: status.connected },
                { label: "Charges enabled", ok: status.chargesEnabled },
                { label: "Payouts enabled", ok: status.payoutsEnabled },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
                    item.ok
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  {item.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {item.label}
                </div>
              ))}
            </div>
          )}

          {status.accountId && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Stripe account: <span className="font-mono">{status.accountId}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!status.connected ? (
              <button
                type="button"
                onClick={() => redirectToStripe("connect")}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5851ea] disabled:opacity-60"
              >
                {actionLoading === "connect" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Connect with Stripe
              </button>
            ) : !isReady ? (
              <GradientButton
                type="button"
                onClick={() => redirectToStripe("refresh")}
                disabled={actionLoading !== null}
                className="!bg-[#635bff] hover:!brightness-110"
              >
                {actionLoading === "refresh" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Complete Stripe setup
              </GradientButton>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Online payments active
              </span>
            )}

            {status.connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
              >
                {actionLoading === "disconnect" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                Disconnect
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
