import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  Building2,
  CreditCard,
  Database,
  Globe,
  HardDrive,
  Headphones,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { isAuthenticated, getStoredToken, getStoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { noindexHead } from "@/lib/seo";
import {
  getPlanTierForPlan,
  initializePaddleClient,
  setPaddleCheckoutListener,
} from "@/lib/paddle";

export const Route = createFileRoute("/dashboard/increase-limits")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => noindexHead("Increase Plan Limits — Webotme"),
  component: IncreaseLimitsPage,
});

interface ActivePlan {
  _id?: string;
  name: string;
  price: number;
  billingInterval?: "month" | "year" | "monthly" | "yearly";
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
}

interface ActivePurchase {
  status: string;
  paymentStatus: string;
  isDefault: boolean;
  expiresAt: string | null;
  startedAt?: string;
  periodDays?: number;
  planId: ActivePlan | string;
}

interface LimitField {
  key: string;
  label: string;
  description: string;
  icon: typeof Bot;
  value: number;
  unit: string;
  step?: number;
  available?: boolean;
  unlimited?: boolean;
  monthlyRate: number;
  rateUnit?: number;
  rateDescription: string;
  rateNote?: string;
}

interface AccountCoupon {
  code: string;
  planKey: "any" | "starter" | "pro" | "advanced";
  planName: string | null;
  percentOff: number;
  used: boolean;
  expiresAt: string | null;
  reservedUntil?: string | null;
}

const ANNUAL_DISCOUNT = 0.2;
const DAY_MS = 24 * 60 * 60 * 1000;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getApiLimit(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getYearlyRate(monthlyRate: number): number {
  return monthlyRate * 12 * (1 - ANNUAL_DISCOUNT);
}

function IncreaseLimitsPage() {
  const [purchase, setPurchase] = useState<ActivePurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestedLimits, setRequestedLimits] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff: number } | null>(
    null,
  );
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AccountCoupon[]>([]);
  const [couponListError, setCouponListError] = useState("");
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    setPaddleCheckoutListener((event) => {
      if (event.name === "checkout.completed") {
        setCheckoutMessage(
          "Payment submitted. Your extra limits will be available after payment confirmation.",
        );
      }
    });
    if (new URLSearchParams(window.location.search).get("addonCheckout") === "success") {
      setCheckoutMessage(
        "Payment submitted. Your extra limits will be available after payment confirmation.",
      );
    }

    return () => setPaddleCheckoutListener(null);
  }, []);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();

    apiFetch("/api/plan-purchase/active", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load your active plan.");
        }
        if (active) setPurchase(data?.purchase ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load your active plan.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();

    apiFetch("/api/coupons/mine", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not load your coupons.");
        }

        const now = Date.now();
        const coupons = Array.isArray(data?.coupons) ? (data.coupons as AccountCoupon[]) : [];
        const usableCoupons = coupons.filter(
          (coupon) =>
            !coupon.used &&
            (!coupon.expiresAt || new Date(coupon.expiresAt).getTime() > now) &&
            (!coupon.reservedUntil || new Date(coupon.reservedUntil).getTime() <= now),
        );
        if (active) setAvailableCoupons(usableCoupons);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setCouponListError(
            loadError instanceof Error ? loadError.message : "Could not load your coupons.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const plan = purchase?.planId && typeof purchase.planId === "object" ? purchase.planId : null;
  const canIncrease =
    purchase?.status === "active" &&
    purchase.paymentStatus === "paid" &&
    !purchase.isDefault &&
    !!plan;

  const fields = useMemo<LimitField[]>(() => {
    if (!plan) return [];

    return [
      {
        key: "totalChatbots",
        label: "Chatbots",
        description: "Extra chatbot capacity for your workspace",
        icon: Bot,
        value: plan.totalChatbots,
        unit: "chatbots",
        monthlyRate: 2,
        rateDescription: "per extra chatbot",
      },
      {
        key: "bookingAgency",
        label: "Agency AI agents",
        description: "Extra AI agents connected to your booking agencies",
        icon: Building2,
        value: plan.bookingAgency,
        unit: "agents",
        available: plan.bookingAgency > 0,
        monthlyRate: 5,
        rateDescription: "per extra agency AI agent",
      },
      {
        key: "databaseCollections",
        label: "Database collections",
        description: "Extra collections available to your chatbots",
        icon: Database,
        value: plan.databaseCollections,
        unit: "collections",
        available: plan.databaseAccess,
        monthlyRate: 1,
        rateDescription: "per extra collection",
      },
      {
        key: "apiRequests",
        label: "API requests",
        description: "Extra daily API request capacity",
        icon: Globe,
        value: getApiLimit(plan.apiRequests) ?? 0,
        unit: "requests/day",
        available: plan.apiAccess,
        unlimited: plan.apiAccess && getApiLimit(plan.apiRequests) === null,
        monthlyRate: 1,
        rateUnit: 1000,
        rateDescription: "per +1,000 requests/day",
      },
      {
        key: "trainingStorage",
        label: "Training storage",
        description: "Space for chatbot training files",
        icon: HardDrive,
        value: plan.trainingStorage,
        unit: "GB",
        step: 0.1,
        monthlyRate: 1,
        rateDescription: "per extra GB",
      },
      {
        key: "emailLimit",
        label: "Emails",
        description: "Daily email sending allowance",
        icon: Headphones,
        value: plan.emailLimit,
        unit: "emails/day",
        available: plan.emailSupport,
        monthlyRate: 3,
        rateUnit: 100,
        rateDescription: "per +100 emails/day",
        rateNote: "Monthly estimate assumes the added daily email quota is fully used.",
      },
    ];
  }, [plan]);

  const hasChanges = fields.some(
    (field) => Number(requestedLimits[field.key] ?? field.value) > field.value,
  );
  const changedFields = fields.filter(
    (field) => Number(requestedLimits[field.key] ?? field.value) > field.value,
  );
  const isYearlyPlan =
    plan?.billingInterval === "year" ||
    plan?.billingInterval === "yearly" ||
    /year/i.test(plan?.name ?? "") ||
    (purchase?.periodDays ?? 0) >= 365;
  const billingPeriod = isYearlyPlan ? "year" : "month";
  const termMultiplier = isYearlyPlan ? 12 : 1;
  const subtotalBeforeDiscount = changedFields.reduce((total, field) => {
    const additional = Number(requestedLimits[field.key]) - field.value;
    const periodDays = purchase?.periodDays || (isYearlyPlan ? 365 : 30);
    const remainingDays = purchase?.expiresAt
      ? Math.max(0, new Date(purchase.expiresAt).getTime() - Date.now())
      : periodDays * DAY_MS;
    const remainingRatio = Math.min(1, remainingDays / (periodDays * DAY_MS));
    return (
      total +
      roundMoney(
        (additional / (field.rateUnit ?? 1)) * field.monthlyRate * termMultiplier * remainingRatio,
      )
    );
  }, 0);
  const annualDiscountAmount = isYearlyPlan
    ? changedFields.reduce((total, field) => {
        const additional = Number(requestedLimits[field.key]) - field.value;
        const periodDays = purchase?.periodDays || 365;
        const remainingDays = purchase?.expiresAt
          ? Math.max(0, new Date(purchase.expiresAt).getTime() - Date.now())
          : periodDays * DAY_MS;
        const remainingRatio = Math.min(1, remainingDays / (periodDays * DAY_MS));
        const lineSubtotal = roundMoney(
          (additional / (field.rateUnit ?? 1)) *
            field.monthlyRate *
            termMultiplier *
            remainingRatio,
        );
        return total + roundMoney(lineSubtotal * ANNUAL_DISCOUNT);
      }, 0)
    : 0;
  const subtotalAfterAnnualDiscount = subtotalBeforeDiscount - annualDiscountAmount;
  const couponDiscountAmount = appliedCoupon
    ? roundMoney(subtotalAfterAnnualDiscount * (appliedCoupon.percentOff / 100))
    : 0;
  const totalDiscountAmount = annualDiscountAmount + couponDiscountAmount;
  const amountDue = Math.max(0, roundMoney(subtotalBeforeDiscount - totalDiscountAmount));
  const apiLimit = plan ? getApiLimit(plan.apiRequests) : null;
  const remainingPlanDays = purchase?.expiresAt
    ? Math.max(0, Math.ceil((new Date(purchase.expiresAt).getTime() - Date.now()) / DAY_MS))
    : null;

  const applyCoupon = async () => {
    if (!plan) {
      setCouponError("Your active plan is unavailable.");
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");
    try {
      const token = getStoredToken();
      const response = await apiFetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          planKey: getPlanTierForPlan(plan.name),
          ...(plan._id ? { planId: plan._id } : {}),
        }),
      });
      const data: { ok?: boolean; message?: string; percentOff?: number; code?: string } =
        await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "This coupon could not be applied.");
      }

      const percentOff = Number(data.percentOff);
      if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
        throw new Error("The coupon returned an invalid discount.");
      }
      setAppliedCoupon({ code: data.code || code, percentOff });
      setCouponCode(data.code || code);
    } catch (applyError) {
      setAppliedCoupon(null);
      setCouponError(
        applyError instanceof Error ? applyError.message : "Unable to validate coupon.",
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const updateLimit = (field: LimitField, rawValue: string) => {
    const parsed = Number(rawValue);
    if (!rawValue || !Number.isFinite(parsed)) {
      setRequestedLimits((current) => ({ ...current, [field.key]: String(field.value) }));
    } else {
      setRequestedLimits((current) => ({
        ...current,
        [field.key]: String(Math.max(field.value, parsed)),
      }));
    }
  };

  const resetLimits = () => {
    setRequestedLimits({});
  };

  const beginAddonCheckout = async () => {
    setOpeningCheckout(true);
    setCheckoutError("");
    setCheckoutMessage("");

    try {
      const paddle = await initializePaddleClient();
      const token = getStoredToken();
      const response = await apiFetch("/api/paddle/plan-addons/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          limits: Object.fromEntries(
            fields.map((field) => [field.key, Number(requestedLimits[field.key] ?? field.value)]),
          ),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      });
      const data: {
        message?: string;
        transactionId?: string;
        customerId?: string | null;
        customerEmail?: string;
      } = await response.json();
      if (!response.ok || !data.transactionId) {
        throw new Error(data.message || "Unable to start secure checkout.");
      }

      const storedUser = getStoredUser();
      const customerEmail =
        data.customerEmail || (typeof storedUser?.email === "string" ? storedUser.email : "");
      paddle.Checkout.open({
        transactionId: data.transactionId,
        discountId: null,
        customer: data.customerId ? { id: data.customerId } : { email: customerEmail },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl: window.location.origin + "/dashboard/increase-limits?addonCheckout=success",
        },
      });
    } catch (checkoutError) {
      setCheckoutError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start secure checkout.",
      );
    } finally {
      setOpeningCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your active plan...
      </div>
    );
  }

  if (error || !canIncrease || !plan) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft">
        <h1 className="text-xl font-bold">Plan limits unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ||
            "Limit increases are available for an active paid plan. Please choose or renew a plan first."}
        </p>
        <Link
          to="/plans"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          View plans
        </Link>
      </section>
    );
  }

  const features = [
    { label: "Database access", included: plan.databaseAccess },
    { label: "RAG model", included: plan.ragModel },
    { label: "Email feature", included: plan.emailSupport },
    { label: "Script API", included: plan.apiAccess },
  ];

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <Link
        to="/plans"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to plans
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customize your plan</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review your current plan and increase chatbot, agency AI agent, or resource capacity.
          Added amounts and the estimate update as you edit; included plan limits cannot be lowered.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              20% OFF yearly add-on upgrades
            </p>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              {isYearlyPlan
                ? "Every yearly add-on gets 20% off its full 12-month price."
                : "The 20% discount applies to the full amount when add-ons are billed yearly."}
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Current plan
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{plan.name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums">{formatCurrency(plan.price)}</p>
                <p className="text-xs text-muted-foreground">Already paid · not included below</p>
              </div>
            </div>
            {purchase.expiresAt && (
              <p className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                Active until {new Date(purchase.expiresAt).toLocaleDateString()}
              </p>
            )}
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Choose your extra limits</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your current limits are protected. Increase quantities to see the estimate update.
              </p>
              <p className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {isYearlyPlan ? "Yearly billing · 20% discount applied" : "Monthly billing"}
              </p>
            </div>
            <div className="space-y-3">
              {fields.map((field) => {
                const Icon = field.icon;
                const value = requestedLimits[field.key] ?? String(field.value);
                const increased = Number(value) > field.value;

                return (
                  <label
                    key={field.key}
                    className="grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-semibold">{field.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {field.description}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-primary">
                          {isYearlyPlan && (
                            <>
                              <span className="mr-1 font-normal text-muted-foreground line-through">
                                {formatCurrency(field.monthlyRate * 12)}
                              </span>
                              {formatCurrency(getYearlyRate(field.monthlyRate))}{" "}
                              {field.rateDescription} / year
                              <span className="ml-1 font-normal text-emerald-700 dark:text-emerald-400">
                                20% off
                              </span>
                            </>
                          )}
                          {!isYearlyPlan && (
                            <>
                              {formatCurrency(field.monthlyRate)} {field.rateDescription} / month
                            </>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Included:{" "}
                          {field.unlimited
                            ? "Unlimited"
                            : field.value.toLocaleString() + " " + field.unit}
                        </span>
                        {field.rateNote && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {field.rateNote}
                          </span>
                        )}
                      </span>
                    </span>
                    <span>
                      <span className="relative">
                        <Input
                          type={field.unlimited ? "text" : "number"}
                          min={field.value}
                          step={field.step ?? 1}
                          value={field.unlimited ? "Unlimited" : value}
                          disabled={field.unlimited || field.available === false}
                          aria-label={"Requested " + field.label + " limit"}
                          onChange={(event) => updateLimit(field, event.target.value)}
                          onBlur={() => {
                            if (Number(value) < field.value) {
                              updateLimit(field, String(field.value));
                            }
                          }}
                          className={
                            field.unlimited
                              ? "text-right font-semibold tabular-nums"
                              : "pr-24 text-right font-semibold tabular-nums"
                          }
                        />
                        {!field.unlimited && (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {field.unit}
                          </span>
                        )}
                      </span>
                      {field.available === false && (
                        <span className="mt-1 block text-right text-xs text-muted-foreground">
                          Not included in this plan
                        </span>
                      )}
                      {increased && (
                        <span className="mt-1 block text-right text-xs font-medium text-primary">
                          +{(Number(value) - field.value).toLocaleString()} extra
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-muted/30 p-5">
            <h2 className="font-semibold">Current access and limits</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Includes your plan allowances and any add-ons active for this plan term.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="h-4 w-4" /> Database collections
                </p>
                <p className="mt-1 font-semibold">
                  {plan.databaseAccess ? plan.databaseCollections : "Not included"}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-4 w-4" /> API requests
                </p>
                <p className="mt-1 font-semibold">
                  {!plan.apiAccess
                    ? "Not included"
                    : apiLimit === null
                      ? "Unlimited"
                      : apiLimit.toLocaleString() + " per day"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {features.map((feature) => (
                <span
                  key={feature.label}
                  className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium"
                >
                  {feature.label}: {feature.included ? "Included" : "Not included"}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5">
            <div className="border-b border-border/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Order review
              </p>
              <h2 className="mt-1 text-xl font-bold">Your estimate</h2>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Additional limits</p>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={resetLimits}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                  )}
                </div>

                {changedFields.length === 0 ? (
                  <p className="rounded-xl bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
                    Increase a limit to see your add-ons and estimated amount here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {changedFields.map((field) => {
                      const additional = Number(requestedLimits[field.key]) - field.value;
                      const periodDays = purchase?.periodDays || (isYearlyPlan ? 365 : 30);
                      const remainingDays = purchase?.expiresAt
                        ? Math.max(0, new Date(purchase.expiresAt).getTime() - Date.now())
                        : periodDays * DAY_MS;
                      const remainingRatio = Math.min(1, remainingDays / (periodDays * DAY_MS));
                      const lineSubtotal = roundMoney(
                        (additional / (field.rateUnit ?? 1)) *
                          field.monthlyRate *
                          termMultiplier *
                          remainingRatio,
                      );
                      const lineDiscount = roundMoney(
                        lineSubtotal * (isYearlyPlan ? ANNUAL_DISCOUNT : 0),
                      );
                      const lineDue = lineSubtotal - lineDiscount;

                      return (
                        <div key={field.key} className="space-y-1 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{field.label}</p>
                              <p className="text-xs text-muted-foreground">
                                +{additional.toLocaleString()} {field.unit}
                              </p>
                            </div>
                            <p className="font-medium tabular-nums">
                              {formatCurrency(lineSubtotal)}
                            </p>
                          </div>
                          {isYearlyPlan && (
                            <div className="flex justify-between pl-2 text-xs text-emerald-700 dark:text-emerald-400">
                              <span>20% annual discount</span>
                              <span className="tabular-nums">−{formatCurrency(lineDiscount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-border/50 pt-1 pl-2 text-xs">
                            <span className="text-muted-foreground">Add-on amount</span>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(lineDue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 pt-4">
                <label htmlFor="addon-coupon-code" className="mb-2 block text-sm font-semibold">
                  Coupon code
                </label>
                {availableCoupons.length > 0 && (
                  <label className="mb-2 block">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Your active, unused coupons
                    </span>
                    <select
                      value=""
                      onChange={(event) => {
                        if (event.target.value) {
                          setCouponCode(event.target.value);
                          setAppliedCoupon(null);
                          setCouponError("");
                        }
                      }}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      aria-label="Choose an active unused coupon"
                    >
                      <option value="">Choose a coupon</option>
                      {availableCoupons.map((coupon) => (
                        <option key={coupon.code} value={coupon.code}>
                          {coupon.code} · {coupon.percentOff}% off ·{" "}
                          {coupon.planName || coupon.planKey}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {couponListError && (
                  <p role="status" className="mb-2 text-xs text-muted-foreground">
                    {couponListError} You can still enter a code manually.
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    id="addon-coupon-code"
                    value={couponCode}
                    disabled={applyingCoupon || !!appliedCoupon}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder="Enter coupon"
                    aria-label="Coupon code for add-ons"
                    aria-invalid={!!couponError}
                  />
                  {appliedCoupon ? (
                    <Button type="button" variant="outline" onClick={removeCoupon}>
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void applyCoupon()}
                      disabled={applyingCoupon || !couponCode.trim()}
                    >
                      {applyingCoupon ? "Applying..." : "Apply"}
                    </Button>
                  )}
                </div>
                {couponError && (
                  <p role="alert" className="mt-2 text-xs text-destructive">
                    {couponError}
                  </p>
                )}
                {appliedCoupon && (
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {appliedCoupon.code} applied · {appliedCoupon.percentOff}% off add-ons
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Add-ons subtotal · remaining term</span>
                  <span className="tabular-nums">{formatCurrency(subtotalBeforeDiscount)}</span>
                </div>
                {isYearlyPlan && (
                  <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                    <span>20% annual discount</span>
                    <span className="tabular-nums">−{formatCurrency(annualDiscountAmount)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                    <span>Coupon ({appliedCoupon.percentOff}%)</span>
                    <span className="tabular-nums">−{formatCurrency(couponDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                  <div>
                    <p className="font-semibold">You pay for add-ons · remaining term</p>
                    <p className="text-xs text-muted-foreground">Plan price is not included</p>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {formatCurrency(amountDue)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                One-time payment for the remaining {billingPeriod} plan term
                {remainingPlanDays !== null ? " (" + remainingPlanDays + " days)" : ""}
                {isYearlyPlan ? ", including the 20% yearly discount" : ""}
                {appliedCoupon ? " and your " + appliedCoupon.percentOff + "% coupon" : ""}. Add-on
                access ends with this plan and does not auto-renew. Any applicable tax is calculated
                at checkout.
              </div>

              {checkoutError && (
                <p role="alert" className="text-xs text-destructive">
                  {checkoutError}
                </p>
              )}
              {checkoutMessage && (
                <p
                  role="status"
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  {checkoutMessage}
                </p>
              )}
              <Button
                className="w-full"
                onClick={() => void beginAddonCheckout()}
                disabled={!hasChanges || openingCheckout}
              >
                {openingCheckout ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing checkout...
                  </>
                ) : (
                  "Continue to secure checkout"
                )}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
