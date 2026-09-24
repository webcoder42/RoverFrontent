import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Bot,
  Building2,
  Database,
  HardDrive,
  Brain,
  Headphones,
  Globe,
  Check,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { BackgroundBlobs, Particles } from "@/components/common/BackgroundBlobs";
import { PaymentCheckout, type PaymentProvider } from "@/components/payments/PaymentCheckout";
import { isAuthenticated, getStoredToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import logo from "@/asset/logo.png";

export const Route = createFileRoute("/checkout/$planId")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Checkout — Webotme" }] }),
  component: CheckoutPage,
});

interface Plan {
  _id: string;
  name: string;
  price: number;
  totalChatbots: number;
  bookingAgency: number;
  databaseAccess: boolean;
  databaseCollections: number;
  apiRequests: string;
  trainingStorage: number;
  ragModel: boolean;
  emailSupport: boolean;
  emailLimit: number;
  apiAccess: boolean;
  expiresInDays: number;
}

function CheckoutPage() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/plans/${planId}`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setPlan(data))
      .catch(() => {
        toast.error("Plan not found");
        navigate({ to: "/plans" });
      })
      .finally(() => setLoading(false));

    fetch("/api/plan-purchase/active", { headers })
      .then((r) => r.json())
      .then((data) => {
        const id = data?.purchase?.planId?._id || data?.purchase?.planId;
        if (id && String(id) === String(planId)) setIsActive(true);
      })
      .catch(() => {});
  }, [planId, navigate]);

  const handleSuccess = async (provider: PaymentProvider, result: unknown = {}) => {
    setPaying(true);
    try {
      const activated = (result as { activated?: boolean } | undefined)?.activated;
      if (!activated && plan) {
        // PayPal metadata fallback: activate the plan directly so the user
        // isn't charged without the plan being turned on.
        const token = getStoredToken();
        const res = await fetch("/api/plan-purchase/activate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ planId: plan._id }),
        });
        if (res.ok) {
          toast.success(`You're now on the ${plan.name} plan!`);
        } else {
          const data = await res.json().catch(() => ({}));
          toast.warning(
            data.message || "Payment completed, but plan activation needs review. Contact support.",
          );
        }
      } else {
        toast.success(`You're now on the ${plan?.name} plan!`);
      }
      await navigate({ to: "/dashboard" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundBlobs />
      <Particles count={20} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center">
          <img src={logo} alt="Webotme" className="h-14 w-auto shrink-0 object-contain" />
        </div>
        <Link
          to="/plans"
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-12 pb-20">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Secure checkout
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Complete your upgrade</h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Review your order and pay securely with PayPal to activate your new plan.
          </p>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading plan…
          </div>
        ) : plan ? (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
            {/* Plan details */}
            <div className="rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{plan.name} Plan</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Everything you need to scale your travel chatbot business.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-3xl font-extrabold tracking-tight text-primary">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{plan.expiresInDays || 30} days
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <FeatureTile icon={Bot} label="Chatbots" value={`${plan.totalChatbots}`} />
                <FeatureTile
                  icon={Building2}
                  label="Booking agencies"
                  value={`${plan.bookingAgency}`}
                />
                <FeatureTile
                  icon={Database}
                  label="Database"
                  value={
                    plan.databaseAccess
                      ? `${plan.databaseCollections || 0} collections`
                      : "Not included"
                  }
                  included={plan.databaseAccess}
                />
                <FeatureTile
                  icon={HardDrive}
                  label="Storage"
                  value={`${plan.trainingStorage} GB`}
                />
                <FeatureTile
                  icon={Brain}
                  label="RAG model"
                  value={plan.ragModel ? "Available" : "Not available"}
                  included={plan.ragModel}
                />
                <FeatureTile
                  icon={Headphones}
                  label="Email support"
                  value={
                    plan.emailSupport ? `${plan.emailLimit || "Unlimited"}/day` : "Not included"
                  }
                  included={plan.emailSupport}
                />
                <FeatureTile icon={Globe} label="API" value={`${plan.apiRequests}/day`} />
                <FeatureTile
                  icon={Globe}
                  label="Script API"
                  value={plan.apiAccess ? "Available" : "Not available"}
                  included={plan.apiAccess}
                />
              </div>

              {isActive && (
                <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" /> This is your current plan. Paying will
                  renew/upgrade it.
                </div>
              )}
            </div>

            {/* Checkout */}
            <div className="lg:sticky lg:top-6">
              <PaymentCheckout
                title={`${plan.name} Plan`}
                description={`Valid for ${plan.expiresInDays || 30} days`}
                subtotal={plan.price}
                orderType="plan"
                planId={plan._id}
                metadata={{ planId: plan._id, planName: plan.name }}
                summaryRows={[
                  { label: "Plan", value: plan.name },
                  { label: "Validity", value: `${plan.expiresInDays || 30} days` },
                ]}
                onSuccess={handleSuccess}
                onError={(err) =>
                  toast.error(err instanceof Error ? err.message : "Payment failed")
                }
                onCancel={() => toast.info("Payment cancelled")}
                disabled={paying}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  label,
  value,
  included,
}: {
  icon: any;
  label: string;
  value: string;
  included?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-medium truncate",
            included === undefined
              ? "text-foreground"
              : included
                ? "text-emerald-600"
                : "text-muted-foreground/60",
          )}
        >
          {value}
        </p>
      </div>
      {included !== undefined &&
        (included ? (
          <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <X className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/40" />
        ))}
    </div>
  );
}
