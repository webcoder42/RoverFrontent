import { useState, useCallback } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

type StripePaymentFormProps = {
  clientSecret: string;
  publishableKey: string;
  onSuccess: () => void;
  onError: (error: string) => void;
};

function PaymentFormInner({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe is loading. Please wait...");
      setProcessing(false);
      return;
    }

    try {
      const timeout = setTimeout(() => {
        setProcessing(false);
        setError("Payment timed out. Please try again.");
        onError("Payment timed out");
      }, 30000);

      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      clearTimeout(timeout);

      if (submitError) {
        setError(submitError.message || "Payment failed");
        onError(submitError.message || "Payment failed");
        setProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      onError(err?.message || "Payment error");
      setProcessing(false);
    }
  }, [stripe, elements, onSuccess, onError]);

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
          }}
        />
        {error && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-500/5 rounded-lg p-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
            <button
              type="button"
              onClick={() => { setError(null); setProcessing(false); }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              <RefreshCw className="h-3 w-3" /> Try Again
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          style={{ background: "#635bff" }}
        >
          {processing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
          ) : (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Pay Now</>
          )}
        </button>
      </div>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const { clientSecret, publishableKey, onSuccess, onError } = props;
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#635bff",
        colorBackground: "#ffffff",
        colorText: "#0f172a",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSizeBase: "13px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
