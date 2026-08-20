import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Bot,
  HardDrive,
  Brain,
  Building2,
  Database,
  ArrowRight,
  LogIn,
  Bot as BotIcon,
  HelpCircle,
  Headphones,
  Globe,
  Check,
  X,
  ShieldCheck,
  Loader2,
  History,
  CalendarClock,
  BadgeCheck,
  CircleX,
  Ban,
} from "lucide-react";
import { motion } from "motion/react";
import { getStoredUser, isAuthenticated, getStoredToken } from "@/lib/auth";
import {
  getPaddlePriceId,
  hasYearlyPaddlePrices,
  initializePaddleClient,
  type BillingInterval,
} from "@/lib/paddle";
import { cn } from "@/lib/utils";
import { BackgroundBlobs, Particles } from "@/components/common/BackgroundBlobs";
import logo from "@/asset/logo.png";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — Webotme" }] }),
  component: PlansPage,
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

interface PurchaseRecord {
  _id: string;
  planId: any;
  planName: string;
  planPrice: number;
  currency: string;
  status: "active" | "cancelled" | "expired";
  paymentMethod: "free" | "paypal" | "lemonsqueezy";
  paymentStatus: "free" | "paid" | "pending";
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  startedAt: string;
  expiresAt: string | null;
  periodDays?: number;
  isDefault: boolean;
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

const featureInfo: Record<string, { label: string; icon: any; desc: string }> = {
  chatbots: {
    label: "Chatbots",
    icon: Bot,
    desc: "Number of AI chatbot assistants you can create for your travel business. Each chatbot can be customized for different services.",
  },
  agencies: {
    label: "Booking Agencies",
    icon: Building2,
    desc: "Connect multiple booking agencies to automate reservations, cancellations, and inquiries across platforms.",
  },
  database: {
    label: "Database Access",
    icon: Database,
    desc: "Securely store and retrieve customer bookings, preferences, and chat history in a dedicated database.",
  },
  storage: {
    label: "Training Storage",
    icon: HardDrive,
    desc: "Allocated GB space for uploading training documents, FAQs, and custom knowledge base files.",
  },
  rag: {
    label: "RAG Model",
    icon: Brain,
    desc: "Retrieval-Augmented Generation lets your chatbot answer from your own data with higher accuracy.",
  },
  email: {
    label: "Email Support",
    icon: Headphones,
    desc: "Get email-based customer support with a daily limit. Perfect for handling customer inquiries and support tickets.",
  },
  api: {
    label: "Script API",
    icon: Globe,
    desc: "Script API allows you to integrate chatbot functionality into your own website or mobile app using our JavaScript snippet.",
  },
};

function InfoTip({
  field,
  active,
  onHover,
  onLeave,
}: {
  field: string;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const info = featureInfo[field];
  if (!info) return null;
  const Icon = info.icon;
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
      {active && (
        <span className="absolute top-full left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-border/60 bg-popover p-3 text-xs shadow-lg">
          <span className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" /> {info.label}
          </span>
          <span className="text-muted-foreground">{info.desc}</span>
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border-l border-t border-border/60 bg-popover" />
        </span>
      )}
    </span>
  );
}

const fallbackPlans: Plan[] = [
  {
    _id: "free",
    name: "Starter",
    price: 0,
    totalChatbots: 1,
    bookingAgency: 0,
    databaseAccess: false,
    databaseCollections: 0,
    apiRequests: "200",
    trainingStorage: 0.25,
    ragModel: false,
    emailSupport: false,
    emailLimit: 0,
    apiAccess: true,
    expiresInDays: 0,
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    totalChatbots: 10,
    bookingAgency: 5,
    databaseAccess: true,
    databaseCollections: 5,
    apiRequests: "5000",
    trainingStorage: 2,
    ragModel: true,
    emailSupport: true,
    emailLimit: 100,
    apiAccess: true,
    expiresInDays: 30,
  },
  {
    _id: "premium",
    name: "Advanced",
    price: 30,
    totalChatbots: 10,
    bookingAgency: 10,
    databaseAccess: true,
    databaseCollections: 10,
    apiRequests: "Unlimited",
    trainingStorage: 5,
    ragModel: true,
    emailSupport: true,
    emailLimit: 500,
    apiAccess: true,
    expiresInDays: 30,
  },
];

function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePurchase, setActivePurchase] = useState<PurchaseRecord | null>(null);
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [paddle, setPaddle] = useState<Awaited<ReturnType<typeof initializePaddleClient>> | null>(
    null,
  );
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [formattedPrices, setFormattedPrices] = useState<Record<string, string>>({});
  const [paddleError, setPaddleError] = useState<string | null>(null);

  const choosePlan = async (plan: Plan) => {
    if (!isAuthenticated()) {
      navigate({ to: "/" });
      return;
    }

    const paddlePriceId = getPaddlePriceId(plan._id, billingInterval, plan.name);
    if (paddlePriceId) {
      try {
        if (!paddle) throw new Error("Paddle checkout is not ready");
        const email = getStoredUser()?.email;
        const userId = getStoredUser()?.id;
        paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          ...(typeof email === "string" && email ? { customer: { email } } : {}),
          settings: {
            displayMode: "overlay",
            variant: "one-page",
            successUrl: `${window.location.origin}/welcome`,
          },
          customData: {
            planId: plan._id,
            planName: plan.name,
            billingInterval,
            ...(typeof userId === "string" && userId ? { userId } : {}),
          },
        });
      } catch (error) {
        setPaddleError(error instanceof Error ? error.message : "Unable to open Paddle checkout");
      }
      return;
    }

    setActivatingId(plan._id);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/plan-purchase/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId: plan._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to activate plan");
      }
      setActivePlanId(plan._id);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Activate plan error:", err);
    } finally {
      setActivatingId(null);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/plans", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(
            data.map((plan: Plan) =>
              plan.name === "Free"
                ? { ...plan, name: "Starter" }
                : plan.name === "Premium" || plan.name === "Prinum"
                  ? { ...plan, name: "Advanced" }
                  : plan,
            ),
          );
        } else {
          setPlans(fallbackPlans);
        }
      })
      .catch(() => {
        setPlans(fallbackPlans);
      })
      .finally(() => setLoading(false));

    fetch("/api/plan-purchase/active", { headers })
      .then((r) => r.json())
      .then((data) => {
        const purchase = data?.purchase;
        if (purchase?.planId?._id) {
          setActivePlanId(purchase.planId._id);
        } else if (purchase?.planId) {
          setActivePlanId(purchase.planId);
        }
        setActivePurchase(purchase || null);
      })
      .catch(() => {});

    fetch("/api/plan-purchase/history", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.history)) setHistory(data.history);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    initializePaddleClient()
      .then((client) => {
        if (!cancelled) setPaddle(client);
      })
      .catch((error) => {
        if (!cancelled)
          setPaddleError(error instanceof Error ? error.message : "Paddle failed to load");
      });

    // Country detection improves localized previews but must not block Paddle prices.
    fetch("/api/paddle/config")
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          countryCode?: string;
        };
        if (!cancelled && response.ok) setCountryCode(data.countryCode);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!paddle) return;
    let cancelled = false;
    const paidPlans = plans.filter((plan) =>
      getPaddlePriceId(plan._id, billingInterval, plan.name),
    );
    Promise.all(
      paidPlans.map(async (plan) => {
        const priceId = getPaddlePriceId(plan._id, billingInterval, plan.name);
        if (!priceId) return null;
        const preview = await paddle.PricePreview({
          items: [{ priceId, quantity: 1 }],
          ...(countryCode ? { address: { countryCode } } : {}),
        });
        return [plan._id, preview.data.details.lineItems[0]?.formattedTotals.total] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled)
          setFormattedPrices(Object.fromEntries(entries.filter(Boolean) as [string, string][]));
      })
      .catch((error) => {
        if (!cancelled)
          setPaddleError(
            error instanceof Error ? error.message : "Unable to preview Paddle prices",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [billingInterval, countryCode, paddle, plans]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundBlobs />
      <Particles count={24} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center">
          <img src={logo} alt="Webotme" className="h-14 w-auto shrink-0 object-contain" />
        </div>
        <button
          onClick={() => navigate({ to: isAuthenticated() ? "/dashboard" : "/" })}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <LogIn className="h-4 w-4" /> {isAuthenticated() ? "Dashboard" : "Login"}
        </button>
      </div>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Choose your plan
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Subscription Plans</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Pick the perfect plan for your needs. Upgrade anytime.
          </p>
          <div className="mx-auto mt-6 inline-flex rounded-xl border border-border/60 bg-card/70 p-1">
            {(["month", ...(hasYearlyPaddlePrices ? ["year"] : [])] as BillingInterval[]).map(
              (interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                    billingInterval === interval
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {interval === "month" ? "Monthly" : "Yearly"}
                </button>
              ),
            )}
          </div>
          {paddleError && (
            <p className="mx-auto mt-4 max-w-xl text-sm text-destructive">{paddleError}</p>
          )}
        </motion.div>
      </div>

      {/* Plans grid */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-border/60 bg-card/50 text-sm text-muted-foreground">
            No plans available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`group relative flex flex-col rounded-3xl border bg-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${activePlanId === plan._id ? "border-primary/60 ring-2 ring-primary/20 shadow-lg shadow-primary/10" : "border-border/60"}`}
              >
                {/* Header gradient */}
                <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-3xl">
                  <div className="h-full w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                </div>

                <div className="px-6 pt-8 pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {activePlanId === plan._id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formattedPrices[plan._id] || (plan.price > 0 ? "Loading price…" : "Free")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formattedPrices[plan._id] ? `/${billingInterval}` : "Lifetime"}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 px-6 pb-6 space-y-3.5">
                  <FeatureRow
                    icon={Bot}
                    label={`${plan.totalChatbots} chatbot${plan.totalChatbots !== 1 ? "s" : ""}`}
                    hoverKey={`${plan._id}-chatbots`}
                    infoKey="chatbots"
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Building2}
                    label={`${plan.bookingAgency} booking agenc${plan.bookingAgency !== 1 ? "ies" : "y"}`}
                    hoverKey={`${plan._id}-agencies`}
                    infoKey="agencies"
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Database}
                    label={`Database: ${plan.databaseAccess ? `${plan.databaseCollections || 0} collections` : "Not included"}`}
                    hoverKey={`${plan._id}-database`}
                    infoKey="database"
                    check={plan.databaseAccess}
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Globe}
                    label={`API: ${plan.apiRequests || "0"}/day`}
                    hoverKey={`${plan._id}-api`}
                    infoKey="api"
                    check
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={HardDrive}
                    label={`${plan.trainingStorage} GB storage`}
                    hoverKey={`${plan._id}-storage`}
                    infoKey="storage"
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Brain}
                    label={`RAG: ${plan.ragModel ? "Available" : "Not available"}`}
                    hoverKey={`${plan._id}-rag`}
                    infoKey="rag"
                    check={plan.ragModel}
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Headphones}
                    label={`Email: ${plan.emailSupport ? `${plan.emailLimit || "Unlimited"}/day` : "Not included"}`}
                    hoverKey={`${plan._id}-email`}
                    infoKey="email"
                    check={plan.emailSupport}
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                  <FeatureRow
                    icon={Globe}
                    label={`Script API: ${plan.apiAccess ? "Available" : "Not available"}`}
                    hoverKey={`${plan._id}-api`}
                    infoKey="api"
                    check={plan.apiAccess}
                    hoveredInfo={hoveredInfo}
                    onHover={setHoveredInfo}
                  />
                </div>

                {/* CTA */}
                <div className="px-6 pb-8">
                  {activePlanId === plan._id ? (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600"
                      >
                        <ShieldCheck className="h-4 w-4" /> Current Plan
                      </button>
                      {activePurchase?.expiresAt && (
                        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                          Active until {formatDate(activePurchase.expiresAt)} — valid for{" "}
                          {activePurchase.periodDays || plan.expiresInDays || 30} days
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => choosePlan(plan)}
                      disabled={activatingId !== null}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 transition-all duration-200 disabled:opacity-60"
                    >
                      {activatingId === plan._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {formattedPrices[plan._id]
                        ? `Subscribe to ${plan.name}`
                        : `Start ${plan.name}`}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase History */}
      {history.length > 0 && (
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold">Purchase History</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Started</th>
                    <th className="px-4 py-3 font-semibold">Expires</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec) => {
                    const isCurrent =
                      rec._id === activePurchase?._id ||
                      (rec.status === "active" && rec.planId?._id === activePlanId);
                    return (
                      <tr
                        key={rec._id}
                        className={cn(
                          "border-b border-border/40 transition-colors",
                          isCurrent ? "bg-emerald-500/5" : "hover:bg-accent/40",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {rec.planName || rec.planId?.name || "Free"}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                <BadgeCheck className="h-3 w-3" /> Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.planPrice > 0
                            ? `${rec.currency || "USD"} ${rec.planPrice.toFixed(2)}`
                            : "Free"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              rec.paymentStatus === "paid"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : rec.paymentStatus === "pending"
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {rec.paymentMethod === "paypal"
                              ? "PayPal · "
                              : rec.paymentMethod === "lemonsqueezy"
                                ? "Lemon Squeezy · "
                                : ""}
                            {rec.paymentStatus === "paid"
                              ? "Paid"
                              : rec.paymentStatus === "pending"
                                ? "Pending"
                                : "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(rec.startedAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(rec.expiresAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              rec.status === "active"
                                ? "bg-emerald-500/15 text-emerald-600"
                                : rec.status === "expired"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {rec.status === "active" ? (
                              <>
                                <BadgeCheck className="h-3 w-3" /> Active
                              </>
                            ) : rec.status === "expired" ? (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  label,
  infoKey,
  check,
  hoverKey,
  hoveredInfo,
  onHover,
}: {
  icon: any;
  label: string;
  infoKey: string;
  check?: boolean;
  hoverKey: string;
  hoveredInfo: string | null;
  onHover: (key: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span
        className={cn(
          "flex-1",
          check !== undefined
            ? check
              ? "text-foreground font-medium"
              : "text-muted-foreground/50"
            : "text-muted-foreground",
        )}
      >
        {check !== undefined ? (
          <span className="flex items-center gap-1.5">
            {check ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Check className="h-2.5 w-2.5" />
              </span>
            ) : (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-muted-foreground/40">
                <X className="h-2.5 w-2.5" />
              </span>
            )}
            {label}
          </span>
        ) : (
          label
        )}
      </span>
      <InfoTip
        field={infoKey}
        active={hoveredInfo === hoverKey}
        onHover={() => onHover(hoverKey)}
        onLeave={() => onHover(null)}
      />
    </div>
  );
}
