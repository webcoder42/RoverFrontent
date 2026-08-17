import { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, ShieldCheck, Lock } from "lucide-react";
import { PayPalButton } from "@/components/paypal/PayPalButton";
import {
  computeTax,
  computeTotal,
  fetchPayPalConfig,
  formatCurrency,
  type PayPalCaptureResult,
  type PayPalConfig,
  type PayPalOrderDraft,
} from "@/lib/paypal";
import { cn } from "@/lib/utils";

export interface PayPalCheckoutCardProps {
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
  /** Extra metadata attached to the PayPal order. */
  metadata?: Record<string, unknown>;
  /** Custom items to display in the summary (feature list). */
  summaryRows?: { label: string; value: string }[];
  onSuccess?: (result: PayPalCaptureResult) => void | Promise<void>;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  onOrderCreated?: (draft: PayPalOrderDraft) => void;
  disabled?: boolean;
  className?: string;
}

export function PayPalCheckoutCard({
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
  onOrderCreated,
  disabled = false,
  className,
}: PayPalCheckoutCardProps) {
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [configError, setConfigError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    fetchPayPalConfig()
      .then((data) => active && setConfig(data))
      .catch((err) => active && setConfigError(err));
    return () => {
      active = false;
    };
  }, []);

  const effectiveCurrency = currency || config?.currency || "USD";
  const effectiveTaxRate = taxRate ?? config?.taxRate ?? 0;

  const { tax, total } = useMemo(
    () => ({
      tax: computeTax(subtotal, effectiveTaxRate),
      total: computeTotal(subtotal, effectiveTaxRate),
    }),
    [subtotal, effectiveTaxRate],
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0070ba]/10 text-[#0070ba]">
            <CreditCard className="h-5 w-5" />
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
              <div key={row.label} className="flex items-center justify-between text-muted-foreground">
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

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Secure payment processed by PayPal. Your card details never touch our servers.
        </div>

        {configError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            {configError instanceof Error ? configError.message : "Failed to load PayPal config"}
          </div>
        ) : (
          <PayPalButton
            config={config || undefined}
            createOrderPayload={{
              type: orderType,
              planId,
              amount: orderType === "custom" ? subtotal : undefined,
              currency: effectiveCurrency,
              taxRate: effectiveTaxRate,
              description,
              metadata,
            }}
            onOrderCreated={onOrderCreated}
            onApproved={onSuccess}
            onError={onError}
            onCancel={onCancel}
            disabled={disabled}
          />
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          {config && !config.configured
            ? "PayPal keys not configured yet"
            : "Powered by PayPal sandbox"}
          {!config && !configError && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
