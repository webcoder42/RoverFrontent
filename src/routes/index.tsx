import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import logo from "@/asset/logo.png";
import { BackgroundBlobs, Particles } from "@/components/common/BackgroundBlobs";
import { GradientButton } from "@/components/common/GradientButton";
import { isAuthenticated } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";

function LegalLinksBar() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground/70">
      <a href="/terms" className="transition-colors hover:text-primary">
        Terms of Service
      </a>
      <a href="/privacy" className="transition-colors hover:text-primary">
        Privacy Policy
      </a>
      <a href="/refunds" className="transition-colors hover:text-primary">
        Refund Policy
      </a>
      <span>© {new Date().getFullYear()} WeBotMe</span>
    </div>
  );
}

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      throw redirect({ to: user?.role === "admin" ? "/admin" : "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Webotme — Premium AI Chatbot Console" },
      {
        name: "description",
        content: "Sign in to manage AI chatbots, FAQs, templates, and embed scripts.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [purpose, setPurpose] = useState<string[]>([]);
  const [profession, setProfession] = useState("");
  const [workType, setWorkType] = useState("");
  const [heardFrom, setHeardFrom] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const purposeOptions = [
    "Agency Chatbot",
    "Customer Support",
    "Lead Generation",
    "Personal Assistant",
    "Education",
    "E-commerce",
    "Entertainment",
    "Internal Tool",
  ];

  const professionOptions = [
    "Developer",
    "Manager",
    "Designer",
    "Business Owner",
    "Marketer",
    "Student",
    "Freelancer",
    "Other",
  ];

  const workOptions = ["Personal", "Business", "Startup", "Enterprise", "Freelance"];

  const heardOptions = [
    "Google Search",
    "Social Media",
    "Friend / Referral",
    "YouTube",
    "Blog / Article",
    "Other",
  ];

  const safeJson = async (response: Response, retryFn?: () => Promise<Response>): Promise<any> => {
    const text = await response.text();
    if (!text || text.trim() === "") {
      if (retryFn) {
        setErrorMsg("Server is waking up, retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        setErrorMsg("");
        const retried = await retryFn();
        const retriedText = await retried.text();
        if (!retriedText || retriedText.trim() === "") {
          throw new Error("Server is still starting up. Please try again in a moment.");
        }
        return JSON.parse(retriedText);
      }
      throw new Error("Server returned an empty response. Please try again in a moment.");
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response. Please try again.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : { username, email, password, purpose, profession, workType, heardFrom };

      const makeRequest = () =>
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

      const res = await makeRequest();
      const data = await safeJson(res, makeRequest);

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (!isLogin) {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await safeJson(loginRes);
        if (!loginRes.ok)
          throw new Error(loginData.message || "Registration successful but auto-login failed");

        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        setStep(6);
        return;
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      navigate({ to: storedUser?.role === "admin" ? "/admin" : "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePurpose = (val: string) => {
    setPurpose((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const canContinueStep1 = username.trim() && email.trim() && password.trim().length >= 6;
  const canContinueStep2 = purpose.length > 0;
  const canContinueStep3 = profession !== "";
  const canContinueStep4 = workType !== "";

  const switchToLogin = () => {
    setIsLogin(true);
    setStep(1);
    setErrorMsg("");
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setStep(1);
    setErrorMsg("");
    setPurpose([]);
    setProfession("");
    setWorkType("");
    setHeardFrom("");
  };

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showDone, setShowDone] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const loadingMessages = [
    "Setting up your workspace...",
    "Creating your dashboard...",
    "Almost done...",
  ];

  useEffect(() => {
    if (step !== 6) return;
    setLoadingMsgIdx(0);
    setShowDone(false);
    setShowContinue(false);
    const t1 = setTimeout(() => setLoadingMsgIdx(1), 1200);
    const t2 = setTimeout(() => setLoadingMsgIdx(2), 2400);
    const t3 = setTimeout(() => {
      setShowDone(true);
      setShowContinue(true);
    }, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step]);

  return (
    <>
      {step === 6 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <BackgroundBlobs />
          <div className="relative flex flex-col items-center gap-6 px-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Bot className="h-8 w-8" />
            </div>

            <AnimatePresence mode="wait">
              {!showDone ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-lg font-semibold">{loadingMessages[loadingMsgIdx]}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500"
                  >
                    <Check className="h-7 w-7 text-white" />
                  </motion.div>
                  <span className="text-lg font-semibold">Done!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-2 mt-2"
                >
                  <p className="text-xs text-muted-foreground">Your account is ready</p>
                  <GradientButton
                    type="button"
                    onClick={() => {
                      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                      navigate({ to: storedUser?.role === "admin" ? "/admin" : "/dashboard" });
                    }}
                    className="h-11 px-8 text-sm"
                  >
                    Continue to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                  </GradientButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <BackgroundBlobs />
        <Particles count={24} />
        <LegalLinksBar />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative grid w-full max-w-5xl gap-8 md:grid-cols-2"
        >
          {/* Brand panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden rounded-3xl bg-gradient-primary p-10 text-primary-foreground shadow-glow md:flex">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                <img src={logo} alt="Webotme" className="h-10 w-10 shrink-0 rounded object-cover" />{" "}
                Console
              </div>
              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight">
                Launch beautiful AI chatbots in minutes.
              </h1>
              <p className="mt-3 max-w-sm text-sm opacity-90">
                Design, theme and embed an AI assistant on any website — without writing a single
                line of code.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/25">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-semibold">Traveler Assistant</div>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="max-w-[80%] rounded-xl bg-white/20 px-3 py-2 text-xs">
                    Hi! How can I help you today?
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-xl bg-white px-3 py-2 text-xs text-primary">
                    I want to build an AI assistant.
                  </div>
                  <div className="max-w-[80%] rounded-xl bg-white/20 px-3 py-2 text-xs">
                    Amazing — let's get you signed in 🚀
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form card */}
          <div className="glass relative rounded-3xl p-8 shadow-soft md:p-10">
            <div className="flex items-center gap-2.5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {isLogin ? "Welcome back" : "Create an account"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLogin ? "Sign in to your Webotme console" : "Get started with Webotme"}
                </div>
              </div>
            </div>

            {!isLogin && step > 1 && step < 6 && (
              <div className="mt-4 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${s < step ? "bg-primary" : "bg-border"}`}
                  />
                ))}
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {errorMsg}
              </div>
            )}

            <form onSubmit={submit} className="mt-8 space-y-4">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Email
                      </span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="you@company.com"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Password
                      </span>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="••••••••"
                        />
                      </div>
                    </label>
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 text-muted-foreground">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-3.5 w-3.5 rounded border-border accent-[oklch(0.55_0.2_35)]"
                        />
                        Remember me
                      </label>
                      <a className="font-medium text-primary hover:underline" href="#">
                        Forgot password?
                      </a>
                    </div>
                    <GradientButton
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full text-sm"
                    >
                      {loading ? "Please wait..." : "Sign in to Console"}
                    </GradientButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 1 && (
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Username
                          </span>
                          <div className="relative">
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="h-11 w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Webotmeadmin"
                            />
                          </div>
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Email
                          </span>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-11 w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="you@company.com"
                            />
                          </div>
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Password
                          </span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-11 w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="•••••••• (min 6 chars)"
                            />
                          </div>
                        </label>
                        <GradientButton
                          type="button"
                          onClick={() => canContinueStep1 && setStep(2)}
                          disabled={!canContinueStep1}
                          className="h-11 w-full text-sm"
                        >
                          Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                        </GradientButton>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold">
                            What will you use Webotme for?
                          </div>
                          <p className="text-xs text-muted-foreground">Select all that apply</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {purposeOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => togglePurpose(opt)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all text-left ${
                                purpose.includes(opt)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card/60 text-muted-foreground hover:border-foreground/30"
                              }`}
                            >
                              <div
                                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                                  purpose.includes(opt)
                                    ? "border-primary bg-primary text-white"
                                    : "border-border"
                                }`}
                              >
                                {purpose.includes(opt) && <Check className="h-3 w-3" />}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="h-11 rounded-xl border border-border bg-card/60 px-4 text-sm hover:bg-accent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <GradientButton
                            type="button"
                            onClick={() => canContinueStep2 && setStep(3)}
                            disabled={!canContinueStep2}
                            className="h-11 flex-1 text-sm"
                          >
                            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                          </GradientButton>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold">Who are you?</div>
                          <p className="text-xs text-muted-foreground">Select your role</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {professionOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setProfession(opt)}
                              className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                                profession === opt
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card/60 text-muted-foreground hover:border-foreground/30"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="h-11 rounded-xl border border-border bg-card/60 px-4 text-sm hover:bg-accent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <GradientButton
                            type="button"
                            onClick={() => canContinueStep3 && setStep(4)}
                            disabled={!canContinueStep3}
                            className="h-11 flex-1 text-sm"
                          >
                            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                          </GradientButton>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold">Work for?</div>
                          <p className="text-xs text-muted-foreground">Select your work type</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {workOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setWorkType(opt)}
                              className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                                workType === opt
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card/60 text-muted-foreground hover:border-foreground/30"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="h-11 rounded-xl border border-border bg-card/60 px-4 text-sm hover:bg-accent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <GradientButton
                            type="button"
                            onClick={() => canContinueStep4 && setStep(5)}
                            disabled={!canContinueStep4}
                            className="h-11 flex-1 text-sm"
                          >
                            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                          </GradientButton>
                        </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold">Where did you hear about us?</div>
                          <p className="text-xs text-muted-foreground">Select one option</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {heardOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setHeardFrom(opt)}
                              className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                                heardFrom === opt
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-card/60 text-muted-foreground hover:border-foreground/30"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="h-11 rounded-xl border border-border bg-card/60 px-4 text-sm hover:bg-accent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <GradientButton
                            type="submit"
                            disabled={loading || !heardFrom}
                            className="h-11 flex-1 text-sm"
                          >
                            {loading ? "Creating account..." : "Create Account"}
                          </GradientButton>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToRegister}
                    className="font-medium text-primary hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
