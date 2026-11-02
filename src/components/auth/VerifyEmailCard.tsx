import { apiFetch } from "@/lib/apiFetch";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";

/**
 * Reusable email verification card.
 *
 * Used by both flows on the auth screen:
 *   - after registration, when the code was just emailed, and
 *   - at every login: the password opens step one and this code finishes it.
 *
 * Owns the 6-digit input, resend cooldown and error handling. On success it
 * hands the issued session back to the parent via onVerified.
 */

const CODE_LENGTH = 6;
const DEFAULT_COOLDOWN = 45;

export interface VerifyEmailCardProps {
  email: string;
  /** Changes the supporting copy slightly between the two flows. */
  mode?: "register" | "login";
  /** Seconds until another resend is allowed (server cooldown). */
  initialCooldownSeconds?: number;
  /** Called once the code is accepted; carries the fresh session. */
  onVerified: (session: { token: string; user: Record<string, unknown> }) => void;
  /** "Wrong email?" — returns the user to the previous form. */
  onChangeEmail?: () => void;
}

interface AuthApiResponse {
  message?: string;
  token?: string;
  user?: Record<string, unknown>;
  sent?: boolean;
  retryAfter?: number;
  cooldownSeconds?: number;
}

const parseJson = async (response: Response): Promise<AuthApiResponse> => {
  const text = await response.text();
  if (!text || !text.trim()) throw new Error("Server returned an empty response");
  try {
    return JSON.parse(text) as AuthApiResponse;
  } catch {
    throw new Error("Server returned an invalid response");
  }
};

export function VerifyEmailCard({
  email,
  mode = "register",
  initialCooldownSeconds = DEFAULT_COOLDOWN,
  onVerified,
  onChangeEmail,
}: VerifyEmailCardProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  const code = digits.join("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH || submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);
      setErrorMsg("");
      setInfoMsg("");
      try {
        const res = await apiFetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: value }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.message || "Verification failed");
        if (!data.token || !data.user) {
          throw new Error("Verified, but no session was returned. Please sign in.");
        }
        onVerified({ token: data.token, user: data.user });
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Verification failed");
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [email, onVerified, focusInput],
  );

  const setDigit = (index: number, char: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigit(index, "");
      return;
    }

    if (value.length > 1) {
      // Fast typing or an IME burst fills several boxes at once.
      const chars = value.slice(0, CODE_LENGTH - index).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((ch, i) => {
          next[index + i] = ch;
        });
        return next;
      });
      // The auto-submit effect fires once the sixth digit lands.
      focusInput(Math.min(index + chars.length, CODE_LENGTH - 1));
      return;
    }

    setDigit(index, value);
    if (index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        focusInput(index - 1);
        setDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
    // The auto-submit effect fires once the sixth digit lands.
  };

  // Auto-submit as soon as the sixth digit lands.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !loading) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const res = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJson(res);
      if (res.status === 429) {
        setCooldown(Number(data.retryAfter) || DEFAULT_COOLDOWN);
        setErrorMsg(data.message || "Please wait before requesting a new code");
        return;
      }
      if (!res.ok || data.sent === false) {
        throw new Error(data.message || "Could not send the code. Please try again.");
      }
      setInfoMsg(data.message || `A new code was sent to ${email}`);
      setCooldown(Number(data.cooldownSeconds) || DEFAULT_COOLDOWN);
      setDigits(Array(CODE_LENGTH).fill(""));
      focusInput(0);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not send the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  const complete = code.length === CODE_LENGTH;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-bold">Verify your email</div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {mode === "register" ? (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">{email}</span>. Enter it below to
                activate your account.
              </>
            ) : (
              <>
                Your password is correct. For your security, we sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">{email}</span>. Enter it to finish
                signing in.
              </>
            )}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          {infoMsg}
        </div>
      )}

      <div>
        <span className="mb-2 block text-xs font-semibold text-foreground/80">
          Verification code
        </span>
        <div className="flex gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              disabled={loading}
              aria-label={`Digit ${index + 1}`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-full min-w-0 rounded-xl border border-border bg-card/80 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">The code expires in 15 minutes.</p>
      </div>

      <GradientButton
        type="button"
        onClick={() => verify(code)}
        disabled={loading || !complete}
        className="h-11 w-full text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
          </>
        ) : (
          "Verify and continue"
        )}
      </GradientButton>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Didn't receive the code?</span>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="flex items-center gap-1.5 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {resending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="h-3 w-3" /> Resend code
            </>
          )}
        </button>
      </div>

      {onChangeEmail && (
        <button
          type="button"
          onClick={onChangeEmail}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Wrong email address? Go back
        </button>
      )}
    </div>
  );
}
