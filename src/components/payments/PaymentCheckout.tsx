import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { PayPalButton } from "@/components/paypal/PayPalButton";
import {
  computeTax,
  computeTotal,
  fetchPayPalConfig,
  formatCurrency,
  type PayPalCaptureResult,
  type PayPalConfig,
} from "@/lib/paypal";
import { cn } from "@/lib/utils";

export type PaymentProvider = "paypal";

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
}

const PROVIDER_META: Record<PaymentProvider, { name: string; tagline: string; color: string }> = {
  paypal: {
    name: "PayPal",
    tagline: "Pay with your PayPal balance or a debit / credit card.",
    color: "#0070ba",
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
}: PaymentCheckoutProps) {
  const [status, setStatus] = useState<ProviderStatus>({ paypal: null });
  const [statusError, setStatusError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    fetchPayPalConfig()
      .then((cfg) => {
        if (active) setStatus({ paypal: cfg });
      })
      .catch((err) => {
        if (active) setStatusError(err);
      });
    return () => {
      active = false;
    };
  }, []);

  const available: PaymentProvider[] = status.paypal?.configured ? ["paypal"] : [];
  const effectiveProvider: PaymentProvider | null =
    available.length === 0 ? null : "paypal";

  const effectiveCurrency = currency || status.paypal?.currency || "USD";
  const effectiveTaxRate = taxRate ?? status.paypal?.taxRate ?? 0;

  const tax = computeTax(subtotal, effectiveTaxRate);
  const total = computeTotal(subtotal, effectiveTaxRate);

  const providerMeta = effectiveProvider ? PROVIDER_META[effectiveProvider] : null;

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
            <Wallet className="h-5 w-5" />
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
                {formatCurrency(tax, effectiveCurrency)}
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

        {statusError && !status.paypal ? (
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
                Add PayPal keys to{" "}
                <code className="rounded bg-muted px-1">server/.env</code> and restart the server.
              </p>
            </div>
          </div>
        ) : (
          <>
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Secure payment processed by {providerMeta?.name || "the payment provider"}. Your card
              details never touch our servers.
            </div>
          </>
        )}

        {!statusError && !status.paypal && (
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