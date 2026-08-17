import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { PayPalButton } from "@/components/paypal/PayPalButton";
import {
  computeTax,
  computeTotal,
  fetchPayPalConfig,
  formatCurrency,
  type PayPalCaptureResult,
  type PayPalConfig,
} from "@/lib/paypal";
import {
  createLemonSqueezyCheckout,
  fetchLemonSqueezyConfig,
  type LemonSqueezyCheckoutDraft,
  type LemonSqueezyConfig,
} from "@/lib/lemonsqueezy";
import { cn } from "@/lib/utils";

export type PaymentProvider = "paypal" | "lemonsqueezy";

export interface PaymentCheckoutProps {
  /** Display title shown at the top of the card. */
  title: string;
  /** Short description of what is being purchased. */
  description: string;
  /** Amount before tax. For plan orders this is the plan price. */
  subtotal: number;
  /** Optional explicit currency. Defaults to the server PayPal currency. */
  currency?: string;
  /** Optional tax rate override (percent). Defaults to the server PayPal tax rate. */
  taxRate?: number;
  /** Order type. Use "plan" to charge a plan from the DB, "custom" for any amount. */
  orderType?: "plan" | "custom";
  /** Required when orderType is "plan". */
  planId?: string;
  /** Extra metadata attached to the order. */
  metadata?: Record<string, unknown>;
  /** Custom items to display in the summary (feature list). */
  summaryRows?: { label: string; value: string }[];
  /**
   * Called after a successful payment.
   * - PayPal: called with `("paypal", captureResult)` after the server captures the order.
   * - Lemon Squeezy: called with `("lemonsqueezy", draft)` right before redirecting to the
   *   hosted checkout. The plan is actually activated by the Lemon Squeezy webhook.
   */
  onSuccess?: (provider: PaymentProvider, result?: unknown) => void | Promise<void>;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  /** Initially selected provider. */
  defaultProvider?: PaymentProvider;
  /** Hide the provider toggle (only relevant when multiple providers are configured). */
  showProviderSelector?: boolean;
}

interface ProviderStatus {
  paypal: PayPalConfig | null;
  lemonsqueezy: LemonSqueezyConfig | null;
}

const PROVIDER_META: Record<PaymentProvider, { name: string; tagline: string; color: string }> = {
  paypal: {
    name: "PayPal",
    tagline: "Pay with your PayPal balance or a debit / credit card.",
    color: "#0070ba",
  },
  lemonsqueezy: {
    name: "Card / Debit Card",
    tagline: "Pay securely with your debit / credit card.",
    color: "#7a6ff0",
  },
};

export function PaymentCheckout({
  title,
  description,
  subtotal,
  currency,
  taxRate,
  orderType = "custom",
  planId,
  metadata,
  summaryRows,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className,
  defaultProvider = "paypal",
  showProviderSelector = true,
}: PaymentCheckoutProps) {
  const [status, setStatus] = useState<ProviderStatus>({
    paypal: null,
    lemonsqueezy: null,
  });
  const [statusError, setStatusError] = useState<unknown>(null);
  const [provider, setProvider] = useState<PaymentProvider>(defaultProvider);
  const [creatingLS, setCreatingLS] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchPayPalConfig(), fetchLemonSqueezyConfig()]).then(([paypal, lemon]) => {
      if (!active) return;
      setStatus({
        paypal: paypal.status === "fulfilled" ? paypal.value : null,
        lemonsqueezy: lemon.status === "fulfilled" ? lemon.value : null,
      });
      if (paypal.status === "rejected") setStatusError(paypal.reason);
      else if (lemon.status === "rejected") setStatusError(lemon.reason);
    });
    return () => {
      active = false;
    };
  }, []);

  const available = useMemo<PaymentProvider[]>(() => {
    const list: PaymentProvider[] = [];
    if (status.paypal?.configured) list.push("paypal");
    if (status.lemonsqueezy?.configured) list.push("lemonsqueezy");
    return list;
  }, [status]);

  const effectiveProvider: PaymentProvider | null =
    available.length === 0 ? null : available.includes(provider) ? provider : available[0];

  const effectiveCurrency =
    currency || status.paypal?.currency || status.lemonsqueezy?.currency || "USD";
  const effectiveTaxRate = taxRate ?? status.paypal?.taxRate ?? status.lemonsqueezy?.taxRate ?? 0;

  const isLS = effectiveProvider === "lemonsqueezy";
  const tax = computeTax(subtotal, effectiveTaxRate);
  const total = computeTotal(subtotal, effectiveTaxRate);

  const handleLemonSqueezy = useCallback(async () => {
    if (disabled || creatingLS) return;
    setCreatingLS(true);
    try {
      const draft = await createLemonSqueezyCheckout({
        type: orderType,
        planId,
        amount: orderType === "custom" ? subtotal : undefined,
        description,
        metadata,
      });
      await onSuccess?.("lemonsqueezy", draft);
      window.location.assign(draft.checkoutUrl);
    } catch (err) {
      onError?.(err);
      setCreatingLS(false);
    }
  }, [
    disabled,
    creatingLS,
    orderType,
    planId,
    subtotal,
    description,
    metadata,
    onSuccess,
    onError,
  ]);

  const providerMeta = effectiveProvider ? PROVIDER_META[effectiveProvider] : null;
  const showSelector = showProviderSelector && available.length > 1 && !disabled;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-white"
            style={{
              backgroundColor: providerMeta?.color || "#0070ba",
            }}
          >
            {effectiveProvider === "lemonsqueezy" ? (
              <CreditCard className="h-5 w-5" />
            ) : (
              <Wallet className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Order Summary
          </p>

          <div className="space-y-2 text-sm">
            {summaryRows?.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-muted-foreground"
              >
                <span>{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(subtotal, effectiveCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>
                Tax
                {effectiveTaxRate > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">({effectiveTaxRate}%)</span>
                )}
              </span>
              <span className="font-medium">
                {effectiveTaxRate > 0 ? (
                  formatCurrency(tax, effectiveCurrency)
                ) : isLS ? (
                  <span className="text-xs text-muted-foreground">Handled by Lemon Squeezy</span>
                ) : (
                  formatCurrency(tax, effectiveCurrency)
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-base">
              <span className="font-bold">Total</span>
              <span className="text-xl font-extrabold text-primary">
                {formatCurrency(total, effectiveCurrency)}
              </span>
            </div>
          </div>
        </div>

        {statusError && !status.paypal && !status.lemonsqueezy ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            {statusError instanceof Error
              ? statusError.message
              : "Failed to load payment providers"}
          </div>
        ) : available.length === 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">No payment provider is configured</p>
              <p className="text-xs opacity-90">
                Add PayPal and/or Lemon Squeezy keys to{" "}
                <code className="rounded bg-muted px-1">server/.env</code> and restart the server.
              </p>
            </div>
          </div>
        ) : (
          <>
            {showSelector && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pay with
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {available.map((p) => {
                    const meta = PROVIDER_META[p];
                    const selected = effectiveProvider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                          selected
                            ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20"
                            : "border-border/60 bg-muted/20 hover:bg-accent",
                        )}
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {p === "lemonsqueezy" ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <Wallet className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{meta.name}</span>
                          <span className="block text-[11px] leading-tight text-muted-foreground">
                            {meta.tagline}
                          </span>
                        </span>
                        {selected && (
                          <span className="absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {effectiveProvider === "paypal" ? (
              <PayPalButton
                createOrderPayload={{
                  type: orderType,
                  planId,
                  amount: orderType === "custom" ? subtotal : undefined,
                  currency: effectiveCurrency,
                  taxRate: effectiveTaxRate,
                  description,
                  metadata,
                }}
                onApproved={(result) => onSuccess?.("paypal", result)}
                onError={onError}
                onCancel={onCancel}
                disabled={disabled}
              />
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleLemonSqueezy}
                  disabled={disabled || creatingLS}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 disabled:opacity-60"
                  style={{
                    backgroundColor: "#7a6ff0",
                    boxShadow: "0 10px 20px -10px rgba(122,111,240,0.6)",
                  }}
                >
                  {creatingLS ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {creatingLS ? "Redirecting to secure checkout…" : "Pay with Card / Debit"}
                  {!creatingLS && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
                </button>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  You'll be redirected to our secure hosted checkout. The final amount is charged in
                  the store's currency, and your plan is activated automatically once payment
                  succeeds.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Secure payment processed by {providerMeta?.name || "the payment provider"}. Your card
              details never touch our servers.
            </div>
          </>
        )}

        {!statusError && !status.paypal && !status.lemonsqueezy && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Loading payment providers…
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
