/**
 * Reusable browser voice engine for the WebotMe chatbot widget.
 *
 * Features:
 *  - Wake-word background listening (e.g. say "MyPSW" to wake the bot).
 *  - Fast capture: after a wake word (or tap), whatever you say is accepted
 *    quickly — a short silence (~2.2s) finalizes the spoken query, so the bot
 *    answers by voice without long waits.
 *  - Push-to-talk (tap the mic, speak, send).
 *  - Text-to-speech replies (bot speaks + text is always visible in chat).
 *
 * Uses only native browser APIs (Web Speech API).
 */

export type VoiceState =
  | "idle"
  | "background" // wake-word listening (always-on)
  | "listening" // recording a spoken query
  | "speaking" // TTS reply playing
  | "unsupported"
  | "denied";

export interface VoiceEngineOptions {
  /** Words that wake the bot, e.g. ["MyPSW"]. */
  wakeWords?: string[];
  /** Final spoken query (wake word stripped). */
  onUserQuery?: (text: string) => void;
  /** Called the moment a wake word is heard. */
  onWake?: () => void;
  onStateChange?: (state: VoiceState) => void;
  /** Language for STT. */
  lang?: string;
  /** Seconds of silence after speech that finalizes the query (default 2.2). */
  silenceTimeout?: number;
  /**
   * When true (default), the bot answers to ANY spoken sentence, not only
   * phrases containing the exact wake word. Handles names that speech-to-text
   * hears differently ("ariya" → "aria"/"area"/"are you").
   */
  alwaysRespond?: boolean;
}

/** After a wake word, wait at most this long before responding anyway. */
const MAX_WAIT_AFTER_WAKE_MS = 7000;
const MAX_WAIT_TAP_MS = 8000;

const GREETINGS = ["hello", "hey", "hi", "ok", "ya", "a", "oye", "o", "oh", "salam", "salaam", "welcome"];

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SR && !!window.speechSynthesis;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[n];
}

const normalize = (w: string) => w.toLowerCase().replace(/[^a-z]/gi, "");

/** True when a transcript token is close enough to the bot name. */
function tokenLooksLike(token: string, name: string): boolean {
  const t = normalize(token);
  const n = normalize(name);
  if (!t || !n) return false;
  if (t === n) return true;
  if (t.length >= 3 && n.length >= 3) {
    if (t.startsWith(n) || n.startsWith(t)) return true;
    if (levenshtein(t, n) <= Math.max(1, Math.floor(Math.min(t.length, n.length) / 3))) return true;
  }
  if (t.length === n.length && levenshtein(t, n) <= 1) return true;
  return false;
}

function tokenize(text: string): string[] {
  return (text || "").toLowerCase().match(/[a-z']+/g) || [];
}

function hasWakeWord(text: string, wakeWords: string[]) {
  if (!wakeWords.length) return false;
  const tokens = tokenize(text);
  return wakeWords.some((name) => tokens.some((t) => tokenLooksLike(t, name)));
}

/** Strips the name itself and any leading greeting from a spoken phrase. */
function stripAddress(text: string, wakeWords: string[]) {
  const tokens = tokenize(text);
  let clean = text;
  for (const t of tokens) {
    if (wakeWords.some((name) => tokenLooksLike(t, name))) {
      clean = clean.replace(new RegExp(`\\b${t}\\b`, "ig"), " ");
    }
  }
  // Drop leading greetings ("hello ariya ..." → "...")
  clean = clean
    .replace(new RegExp(`^\\s*(${GREETINGS.join("|")})\\b[\\s,]*`, "i"), " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean;
}

/** Rough check that the engine actually heard speech, not silence/noise. */
function isLikelySpeech(text: string): boolean {
  const words = tokenize(text).filter((t) => t.length >= 2);
  return words.length > 0;
}

export function createVoiceEngine(opts: VoiceEngineOptions = {}) {
  const wakeWords = opts.wakeWords?.filter(Boolean) || [];
  const lang = opts.lang || "en-US";
  const silenceMs = Math.round((opts.silenceTimeout ?? 2.2) * 1000);
  const alwaysRespond = opts.alwaysRespond ?? true;

  let state: VoiceState = isVoiceSupported() ? "idle" : "unsupported";
  let wakeEnabled = true;
  let voiceRepliesEnabled = true;
  let lastSpeakAt = 0;
  const LAST_SPEAK_IGNORE_MS = 1500;
  let rec: any = null;
  let backgroundSession = false;
  let stopped = false;

  // Capture state (used for both wake and push-to-talk).
  let captureActive = false;
  let captureIsWake = false;
  let pending = "";
  let lastInterimAt = 0;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;

  const setState = (next: VoiceState) => {
    if (state !== next) {
      state = next;
      opts.onStateChange?.(next);
    }
  };

  const clearTimers = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
    if (maxWaitTimer) clearTimeout(maxWaitTimer);
    maxWaitTimer = null;
  };

  // Deliver whatever has been captured (pending + latest interim).
  // If nothing but the wake word/silence was said, send "Hello" so the bot
  // always answers by voice.
  const deliver = () => {
    const interim = rec?.__lastInterim || "";
    clearTimers();
    if (deliverySoonTimer) {
      clearTimeout(deliverySoonTimer);
      deliverySoonTimer = null;
    }
    const wasWake = captureIsWake;
    captureActive = false;
    captureIsWake = false;
    const combined = stripAddress(pending + " " + interim, wakeWords);
    pending = "";
    if (rec) rec.__lastInterim = "";
    if (!combined && !wasWake) {
      // Mic tapped but no speech → do nothing.
      setState(backgroundSession && wakeEnabled ? "background" : "idle");
      return;
    }
    setState(backgroundSession && wakeEnabled ? "background" : "idle");
    opts.onUserQuery?.(combined || "Hello");
  };

  const armSilence = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (captureActive) {
        const interim = rec?.__lastInterim || "";
        // Finalize when speech stopped for >= silenceMs.
        if (Date.now() - lastInterimAt >= silenceMs || !interim) deliver();
      }
    }, silenceMs + 200);
  };

  const armMaxWait = (ms: number) => {
    if (maxWaitTimer) clearTimeout(maxWaitTimer);
    maxWaitTimer = setTimeout(() => {
      if (captureActive) deliver();
    }, ms);
  };

  const startCapture = (fromWake: boolean) => {
    captureActive = true;
    captureIsWake = fromWake;
    pending = "";
    lastInterimAt = Date.now();
    if (rec) rec.__lastInterim = "";
    setState("listening");
    armSilence();
    armMaxWait(fromWake ? MAX_WAIT_AFTER_WAKE_MS : MAX_WAIT_TAP_MS);
  };

  const makeRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setState("unsupported");
      return null;
    }
    const recognition: any = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onerror = (event: any) => {
      const err = event?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setState("denied");
        stopRecognition();
      } else if (err === "no-speech" || err === "aborted") {
        captureActive = false;
        clearTimers();
        setState(backgroundSession ? "background" : "idle");
      }
    };
    recognition.onend = () => {
      if (stopped) return;
      // Auto-restart the background session (it is continuous).
      if (backgroundSession && wakeEnabled) {
        captureActive = false;
        captureIsWake = false;
        pending = "";
        clearTimers();
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      } else if (!backgroundSession) {
        captureActive = false;
        captureIsWake = false;
        clearTimers();
        setState("idle");
      }
    };
    recognition.onresult = (event: any) => {
      // Ignore anything captured while the bot itself is speaking (echo guard).
      if (Date.now() - lastSpeakAt < LAST_SPEAK_IGNORE_MS) return;

      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (result.isFinal) finalText += text;
        else interimText += text;
      }

      if (finalText || interimText) lastInterimAt = Date.now();

      if (backgroundSession) {
        // ── Always-on mode ───────────────────────────────────────────────
        const heard = pending + " " + finalText + " " + interimText;
        const phrase = finalText + " " + interimText;

        if (!captureActive) {
          const heardWord = hasWakeWord(heard, wakeWords);
          if (heardWord) opts.onWake?.();
          // Reply to the exact wake word OR to any actual spoken sentence.
          if (heardWord || (alwaysRespond && isLikelySpeech(phrase))) {
            startCapture(true);
          }
        }

        if (captureActive) {
          if (finalText) pending += finalText + " ";
          if (rec) rec.__lastInterim = interimText;
          // Fast: as soon as a phrase finishes, deliver it.
          if (finalText) deliverySoon();
          else armSilence();
        }
      } else {
        // ── Push-to-talk mode ───────────────────────────────────────────
        if (!captureActive) startCapture(false);
        if (finalText) pending += finalText + " ";
        if (rec) rec.__lastInterim = interimText;
        if (interimText && !finalText) armSilence();
        if (finalText) {
          if (pending.trim()) deliver();
          else armSilence();
        }
      }
    };
    return recognition;
  };

  // Deliver quickly (~300ms after a finished phrase) as soon as speech ends.
  let deliverySoonTimer: ReturnType<typeof setTimeout> | null = null;
  const deliverySoon = () => {
    if (deliverySoonTimer) clearTimeout(deliverySoonTimer);
    deliverySoonTimer = setTimeout(() => {
      if (captureActive) deliver();
    }, 300);
  };

  const stopRecognition = () => {
    clearTimers();
    if (deliverySoonTimer) {
      clearTimeout(deliverySoonTimer);
      deliverySoonTimer = null;
    }
    captureActive = false;
    try {
      if (rec) rec.stop();
    } catch {
      /* noop */
    }
    rec = null;
  };

  const startRecognition = (continuous: boolean): boolean => {
    if (stopped || !isVoiceSupported()) {
      setState("unsupported");
      return false;
    }
    stopRecognition();
    const recognition = makeRecognition();
    if (!recognition) return false;
    recognition.continuous = continuous;
    try {
      recognition.start();
      rec = recognition;
      setState(continuous ? "background" : "idle");
      if (!continuous) startCapture(false);
      return true;
    } catch {
      setState("idle");
      return false;
    }
  };

  /** Always-on wake-word listening (default ON). */
  const startBackground = (): boolean => {
    if (stopped || !isVoiceSupported() || !wakeWords.length) {
      setState(isVoiceSupported() ? "idle" : "unsupported");
      return false;
    }
    backgroundSession = true;
    captureActive = false;
    pending = "";
    return startRecognition(true);
  };

  /** Once-off push-to-talk. */
  const tapToTalk = (): boolean => {
    if (stopped) return false;
    const wasBackground = backgroundSession;
    backgroundSession = false;
    captureActive = false;
    pending = "";
    const ok = startRecognition(false);
    if (ok && wasBackground && wakeEnabled && rec) {
      const resume = () => {
        if (stopped || !wakeEnabled) return;
        backgroundSession = true;
        try {
          startBackground();
        } catch {
          /* noop */
        }
      };
      const prevOnEnd = rec.onend;
      rec.onend = (event: any) => {
        prevOnEnd?.(event);
        if (!captureActive) resume();
      };
    }
    return ok;
  };

  const stop = () => {
    stopped = true;
    backgroundSession = false;
    captureActive = false;
    pending = "";
    stopRecognition();
    stopSpeaking();
    setState("idle");
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  /** Speaks a reply. The text stays visible in chat as well. */
  const speak = (text: string) => {
    const clean = String(text || "")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
      .replace(/[#*_>`~[\]]/g, " ")
      .replace(/\.{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean || !voiceRepliesEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState("unsupported");
      return;
    }
    stopSpeaking();
    lastSpeakAt = Date.now();
    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setState("speaking");
      utterance.onend = () => setState(backgroundSession ? "background" : "idle");
      utterance.onerror = () => setState(backgroundSession ? "background" : "idle");
      window.speechSynthesis.speak(utterance);
    } catch {
      /* noop */
    }
  };

  const setWakeEnabled = (enabled: boolean) => {
    wakeEnabled = enabled;
    if (!enabled) {
      backgroundSession = false;
      captureActive = false;
      pending = "";
      stopRecognition();
      if (state !== "speaking") setState("idle");
    } else if (isVoiceSupported() && wakeWords.length) {
      backgroundSession = true;
      startBackground();
    }
  };

  const setVoiceRepliesEnabled = (enabled: boolean) => {
    voiceRepliesEnabled = enabled;
    if (!enabled) stopSpeaking();
  };

  return {
    get state() {
      return state;
    },
    get enabled() {
      return wakeEnabled;
    },
    get voiceReplies() {
      return voiceRepliesEnabled;
    },
    startBackground,
    tapToTalk,
    stop,
    speak,
    stopSpeaking,
    setWakeEnabled,
    setVoiceRepliesEnabled,
    wakeWords,
  };
}

export type VoiceEngine = ReturnType<typeof createVoiceEngine>;