import { useCallback, useEffect, useState } from "react";
import {
  PayPalButtons,
  PayPalScriptProvider,
  type PayPalButtonsComponentProps,
} from "@paypal/react-paypal-js";
import { Loader2, AlertCircle } from "lucide-react";
import {
  capturePayPalOrder,
  createPayPalOrder,
  fetchPayPalConfig,
  type CreatePayPalOrderPayload,
  type PayPalCaptureResult,
  type PayPalConfig,
  type PayPalOrderDraft,
} from "@/lib/paypal";
import { cn } from "@/lib/utils";

export interface PayPalButtonProps {
  /** Explicit PayPal config. If omitted, it is fetched from /api/paypal/config. */
  config?: PayPalConfig;
  /** Payment payload builder. Return an object describing what to charge. */
  createOrderPayload:
    | CreatePayPalOrderPayload
    | (() => CreatePayPalOrderPayload | Promise<CreatePayPalOrderPayload>);
  /** Called once the server has created a PayPal order (before PayPal opens). */
  onOrderCreated?: (draft: PayPalOrderDraft) => void;
  /** Called after payment is captured on the server. */
  onApproved?: (result: PayPalCaptureResult) => void | Promise<void>;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  disabled?: boolean;
  style?: PayPalButtonsComponentProps["style"];
  className?: string;
}

function usePayPalConfig(config?: PayPalConfig) {
  const [resolved, setResolved] = useState<PayPalConfig | null>(config || null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (config) {
      setResolved(config);
      return;
    }
    let active = true;
    fetchPayPalConfig()
      .then((data) => active && setResolved(data))
      .catch((err) => active && setError(err));
    return () => {
      active = false;
    };
  }, [config]);

  return { config: resolved, error };
}

export function PayPalButton({
  config,
  createOrderPayload,
  onOrderCreated,
  onApproved,
  onError,
  onCancel,
  disabled = false,
  style,
  className,
}: PayPalButtonProps) {
  const { config: resolvedConfig, error: configError } = usePayPalConfig(config);
  const [processing, setProcessing] = useState(false);

  const handleCreateOrder = useCallback(
    async (): Promise<string> => {
      const payload =
        typeof createOrderPayload === "function"
          ? await createOrderPayload()
          : createOrderPayload;
      const draft = await createPayPalOrder(payload);
      onOrderCreated?.(draft);
      return draft.id;
    },
    [createOrderPayload, onOrderCreated],
  );

  const handleApprove = useCallback(
    async (data: { orderID: string }) => {
      setProcessing(true);
      try {
        const result = await capturePayPalOrder(data.orderID);
        await onApproved?.(result);
      } catch (err) {
        onError?.(err);
      } finally {
        setProcessing(false);
      }
    },
    [onApproved, onError],
  );

  if (configError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {configError instanceof Error
          ? configError.message
          : "Failed to load PayPal config"}
      </div>
    );
  }

  if (!resolvedConfig) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" /> Loading PayPal…
      </div>
    );
  }

  if (!resolvedConfig.configured || !resolvedConfig.clientId) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">PayPal is not configured</p>
          <p className="text-xs opacity-90">
            Add <code className="rounded bg-muted px-1">PAYPAL_CLIENT_ID</code> and{" "}
            <code className="rounded bg-muted px-1">PAYPAL_CLIENT_SECRET</code> to{" "}
            <code className="rounded bg-muted px-1">server/.env</code>, then restart the server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      key={resolvedConfig.clientId}
      options={{
        clientId: resolvedConfig.clientId,
        currency: resolvedConfig.currency || "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <div className={cn("min-h-[45px]", className)}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal", ...style }}
          disabled={disabled || processing}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onCancel={onCancel}
          onError={(err) => onError?.(err)}
        />
      </div>
    </PayPalScriptProvider>
  );
}
