import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Copy, Check, ArrowRight, Sparkles, PartyPopper, X } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/auth";

interface CouponData {
  _id?: string;
  code: string;
  percentOff: number;
  planKey: "any" | "starter" | "pro" | "advanced";
  used: boolean;
  expiresAt: string | null;
  source: string;
}

const planLabel = (key: string) =>
  key === "advanced" ? "Premium" : key === "pro" ? "Pro" : key === "starter" ? "Starter" : "any plan";

export default function CouponBanner() {
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getAuthHeaders()) return;
    fetch("/api/coupons/mine", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const coupons: CouponData[] = Array.isArray(data?.coupons) ? data.coupons : [];
        const active =
          coupons.find(
            (c) =>
              !c.used &&
              (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now()),
          ) || null;
        if (active) {
          setCoupon(active);
          setRevealed(localStorage.getItem(`webot_coupon_revealed_${active.code}`) === "1");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!coupon) return null;

  const daysLeft = coupon.expiresAt
    ? Math.max(0, Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  const claim = () => {
    if (!revealed) {
      setRevealed(true);
      localStorage.setItem(`webot_coupon_revealed_${coupon.code}`, "1");
    }
    setModalOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-accent via-background to-background p-5 shadow-glow md:p-6"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary to-yellow-500 opacity-15 blur-3xl" />

        {!revealed ? (
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Gift className="h-6 w-6" />
            </div>
            <div className="min-w-[220px] flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                Claim your welcome coupon
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  {coupon.percentOff}% off
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                One-time {coupon.percentOff}% discount on the {planLabel(coupon.planKey)} plan.
              </p>
              {daysLeft !== null && (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                  ⏰ This coupon is removed in{" "}
                  {daysLeft <= 0 ? "less than a day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}{" "}
                  — claim it now!
                </p>
              )}
            </div>
            <button
              onClick={claim}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" /> Claim coupon
            </button>
          </div>
        ) : (
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Gift className="h-6 w-6" />
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                Your {coupon.percentOff}% off coupon
              </div>
              <button
                onClick={copy}
                className="group mt-1 inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-card px-3 py-1.5 font-mono text-base font-bold tracking-widest transition-colors hover:bg-accent"
              >
                {coupon.code}
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                Use it on the {planLabel(coupon.planKey)} plan
                {daysLeft !== null
                  ? ` — removed in ${daysLeft <= 0 ? "less than a day" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}!`
                  : " — no expiry"}
                .
              </p>
            </div>
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Upgrade now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Claim success modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-glow"
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-gradient-to-br from-primary to-yellow-400 opacity-20 blur-3xl" />
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <motion.div
                initial={{ rotate: -12, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 15 }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
              >
                <PartyPopper className="h-8 w-8" />
              </motion.div>

              <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                You&apos;ve claimed your coupon!
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Congrats 🎉 Get{" "}
                <span className="font-bold text-primary">{coupon.percentOff}% discount</span> on the{" "}
                <span className="font-bold">{planLabel(coupon.planKey)} plan</span>.
              </p>

              <button
                onClick={copy}
                className="group mx-auto mt-5 flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-accent/50 px-5 py-2.5 font-mono text-lg font-extrabold tracking-widest transition-colors hover:bg-accent"
              >
                {coupon.code}
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Tap the code to copy</p>

              <p className="mt-3 text-xs text-muted-foreground">
                {coupon.expiresAt
                  ? `⚠️ Valid till ${new Date(coupon.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}${daysLeft !== null ? ` (${daysLeft <= 0 ? "last day!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`})` : ""}`
                  : "No expiry — use it anytime."}
              </p>

              <Link
                to="/plans"
                onClick={() => setModalOpen(false)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110"
              >
                Claim {coupon.percentOff}% off now <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
