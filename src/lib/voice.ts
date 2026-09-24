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
  | "denied"
  | "brave_blocked";


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
   * Always respond to spoken queries (default true).
   */
  alwaysRespond?: boolean;
  /** Speaking rate (speed). Default is 0.9 for a friendly, natural human pace. */
  rate?: number;
  /** Speaking pitch. Default is 1.0. */
  pitch?: number;
}


/** After a wake word, wait at most this long before responding anyway. */
const MAX_WAIT_AFTER_WAKE_MS = 5500;
const MAX_WAIT_TAP_MS = 6000;
/** Max duration for any TTS utterance — safety net if onend never fires. */
const MAX_SPEAK_DURATION_MS = 30000;


const GREETINGS = [
  "hello",
  "hey",
  "hi",
  "ok",
  "ya",
  "a",
  "oye",
  "o",
  "oh",
  "salam",
  "salaam",
  "welcome",
];

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SR && !!window.speechSynthesis;
}

export function isBraveBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean(
    (navigator as any).brave && typeof (navigator as any).brave.isBrave === "function"
  );
}


/**
 * Ask the browser for mic permission on a real user gesture (tap/click/key).
 * Chrome silently blocks SpeechRecognition that auto-starts without a gesture,
 * especially inside a cross-origin widget iframe — so we prime the mic first.
 */
let micPermissionGranted = false;
function acquireMicPermission(): Promise<boolean> {
  if (micPermissionGranted) return Promise.resolve(true);
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    console.warn("[RoverVoice] getUserMedia not available");
    return Promise.resolve(false);
  }
  console.log("[RoverVoice] Requesting mic permission...");
  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // Keep the mic open briefly so the browser registers the grant, then
      // release it (SpeechRecognition manages its own capture afterwards).
      setTimeout(() => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          /* noop */
        }
      }, 500);
      micPermissionGranted = true;
      console.log("[RoverVoice] Mic permission GRANTED");
      return true;
    })
    .catch((err) => {
      console.warn("[RoverVoice] Mic permission DENIED:", err);
      return false;
    });
}

// ── SpeechSynthesis voice helpers ─────────────────────────────────────────
let loadedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const vs = window.speechSynthesis.getVoices() || [];
  if (vs.length) loadedVoices = vs;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
  refreshVoices();
}

function pickBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (!loadedVoices.length) refreshVoices();
  const target = (langCode || "en-US").toLowerCase().replace("_", "-");
  const list = loadedVoices;
  if (!list.length) return null;

  // Preference score: prioritize modern natural/neural voices over old robotic voices
  const scoreVoice = (v: SpeechSynthesisVoice) => {
    const name = (v.name || "").toLowerCase();
    let score = 0;
    if (name.includes("natural") || name.includes("neural")) score += 40;
    if (name.includes("google")) score += 30;
    if (name.includes("online")) score += 20;
    if (name.includes("premium")) score += 15;
    if (v.localService === false) score += 10; // Cloud neural voices sound more human
    return score;
  };

  const exact = list.filter(
    (v) => (v.lang || "").toLowerCase().replace("_", "-") === target,
  );
  if (exact.length) {
    exact.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return exact[0];
  }

  const base = target.split("-")[0];
  const sameBase = list.filter((v) =>
    (v.lang || "").toLowerCase().startsWith(base),
  );
  if (sameBase.length) {
    sameBase.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sameBase[0];
  }

  const sortedAll = [...list].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sortedAll.find((v) => v.default) || sortedAll[0] || null;
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
  // Support unicode letters and numbers in any language (English, Urdu, etc.)
  return (text || "").toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
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
  // Drop leading greetings ("hello ariya ..." → "...") ONLY if there is more text after it.
  const withoutGreeting = clean
    .replace(new RegExp(`^\\s*(${GREETINGS.join("|")})\\b[\\s,]*`, "i"), " ")
    .replace(/\s+/g, " ")
    .trim();
  // If stripping left nothing (e.g. user just said "hello" or "salam"), preserve the spoken text!
  return withoutGreeting || clean.trim() || text.trim();
}

/** Rough check that the engine actually heard speech, not silence/noise. */
function isLikelySpeech(text: string): boolean {
  const trimmed = (text || "").trim();
  if (!trimmed) return false;
  return tokenize(trimmed).length > 0;
}

export function createVoiceEngine(opts: VoiceEngineOptions = {}) {
  const wakeWords = opts.wakeWords?.filter(Boolean) || [];
  const lang =
    opts.lang ||
    (typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US");
  const silenceMs = Math.round((opts.silenceTimeout ?? 1.4) * 1000);
  const alwaysRespond = opts.alwaysRespond ?? true;
  const speechRate = opts.rate ?? 0.9; // Friendly, clear human conversational speed
  const speechPitch = opts.pitch ?? 1.0;



  let state: VoiceState = isVoiceSupported() ? "idle" : "unsupported";
  let wakeEnabled = true;
  let voiceRepliesEnabled = true;
  let lastSpeakAt = 0;
  const LAST_SPEAK_IGNORE_MS = 500;
  let lastResultAt = Date.now();
  let speakSafetyTimer: ReturnType<typeof setTimeout> | null = null;
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

  // Autoplay unlock: Chrome/Safari block speechSynthesis audio until the user
  // interacts with the page. Prime it with a silent utterance on first gesture.
  let voiceUnlocked = false;
  const warmUpVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || voiceUnlocked) return;
    voiceUnlocked = true;
    try {
      refreshVoices();
      const prime = new SpeechSynthesisUtterance(" ");
      prime.volume = 0;
      prime.rate = 10;
      window.speechSynthesis.speak(prime);
    } catch {
      /* noop */
    }
  };
  const gestureRef = () => warmUpVoice();
  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", gestureRef, { passive: true });
    window.addEventListener("keydown", gestureRef);
    window.addEventListener("touchstart", gestureRef, { passive: true });
  }

  // Permission priming: on the first user gesture request the mic so Chrome
  // shows the allow prompt (works inside the widget iframe), then (re)start
  // background listening if it was blocked or never began.
  let micPrimed = false;
  const primeMicOnGesture = () => {
    if (micPrimed) return;
    micPrimed = true;
    acquireMicPermission().then((granted) => {
      if (!granted) {
        micPrimed = false;
        return;
      }
      if (state === "denied") setState("idle");
      // Only auto-start background if recognition is NOT already running
      // (tapToTalk handles its own start).
      if (wakeEnabled && !rec) {
        try {
          startBackground();
        } catch {
          /* noop */
        }
      }
    });
  };
  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", primeMicOnGesture, { passive: true });
    window.addEventListener("touchstart", primeMicOnGesture, { passive: true });
    window.addEventListener("keydown", primeMicOnGesture);
  }

  // Watchdog: Chrome can silently drop a continuous recognition session without
  // firing onerror/onend. If we should be listening but have no live session,
  // restart it periodically.
  let watchdog: ReturnType<typeof setInterval> | null = null;
  const ensureBackgroundAlive = () => {
    if (stopped || !backgroundSession || !wakeEnabled) return;
    // If recognition object is gone, restart it.
    if (!rec) {
      try {
        startBackground();
      } catch {
        /* noop */
      }
      return;
    }
    // If we haven't received ANY result in 30s while in background mode,
    // the recognition session is likely dead — restart it.
    if (Date.now() - lastResultAt > 30000) {
      try { rec.stop(); } catch { /* noop */ }
      rec = null;
      try {
        startBackground();
      } catch {
        /* noop */
      }
    }
  };
  const startWatchdog = () => {
    if (!watchdog) watchdog = setInterval(ensureBackgroundAlive, 4000);
  };
  startWatchdog();

  // Timer for the deferred speak() (kept so we can cancel stale ones).
  let speakTimer: ReturnType<typeof setTimeout> | null = null;

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
    const wasBackground = backgroundSession;
    captureActive = false;
    captureIsWake = false;
    const combined = stripAddress(pending + " " + interim, wakeWords);
    pending = "";
    if (rec) rec.__lastInterim = "";
    if (!combined && !wasWake) {
      // Mic tapped but no speech → do nothing.
      if (!wasBackground) {
        stopRecognition();
        if (wakeEnabled) {
          setTimeout(() => {
            if (!stopped && wakeEnabled && !backgroundSession) startBackground();
          }, 300);
        }
      }
      setState(backgroundSession && wakeEnabled ? "background" : "idle");
      return;
    }
    if (!wasBackground) {
      stopRecognition();
      if (wakeEnabled) {
        setTimeout(() => {
          if (!stopped && wakeEnabled && !backgroundSession) startBackground();
        }, 500);
      }
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
    }, silenceMs + 100);
  };


  const armMaxWait = (ms: number) => {
    if (maxWaitTimer) clearTimeout(maxWaitTimer);
    maxWaitTimer = setTimeout(() => {
      if (captureActive) deliver();
    }, ms);
  };

  const startCapture = (fromWake: boolean) => {
    // If the bot is mid-sentence, cut it off so the mic captures ONLY the
    // user's words (exact speech), not a mix with the bot's own voice.
    stopSpeaking();
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
      console.warn("[RoverVoice] SpeechRecognition error:", err);
      if (err === "not-allowed" || err === "service-not-allowed") {
        if (isBraveBrowser()) {
          setState("brave_blocked");
        } else {
          setState("denied");
        }
        stopRecognition();
      } else if (err === "network") {
        console.warn("[RoverVoice] SpeechRecognition network error (Google Speech blocked in Brave/offline):", err);
        setState("brave_blocked");
        stopRecognition();
      } else if (err === "no-speech" || err === "aborted") {
        captureActive = false;
        clearTimers();
        setState(backgroundSession ? "background" : "idle");
      }
    };
    recognition.onend = () => {
      console.log("[RoverVoice] SpeechRecognition ended, background=", backgroundSession, "wake=", wakeEnabled);
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
      // Track that recognition is alive (used by the watchdog).
      lastResultAt = Date.now();
      // Ignore audio while the bot is ACTIVELY speaking — stops the mic from
      // hearing the bot's own voice (echo → bot answering itself loop).
      // We check speechSynthesis.speaking as ground truth: if TTS actually
      // stopped but onend hasn't fired yet, we still accept user speech.
      const nowMs = Date.now();
      const speakingRightNow = state === "speaking" && typeof window !== "undefined" && window.speechSynthesis?.speaking;
      if (speakingRightNow) return;
      // Tiny tail-window right after TTS finishes (noise pedestal).
      if (nowMs - lastSpeakAt < LAST_SPEAK_IGNORE_MS) return;

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
          // Deliver shortly after the segment ends so the full phrase is
          // captured, not just the first word.
          if (pending.trim()) deliverySoon();
          else armSilence();
        }
      }
    };
    return recognition;
  };

  // Deliver ~400ms after a finished segment so natural speech is delivered
  // promptly and sharp without awkward lag.
  let deliverySoonTimer: ReturnType<typeof setTimeout> | null = null;
  const deliverySoon = () => {
    if (deliverySoonTimer) clearTimeout(deliverySoonTimer);
    deliverySoonTimer = setTimeout(() => {
      if (captureActive) deliver();
    }, 450);
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
      console.warn("[RoverVoice] startRecognition: unsupported or stopped");
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
      console.log("[RoverVoice] SpeechRecognition STARTED, continuous=", continuous);
      setState(continuous ? "background" : "idle");
      if (!continuous) startCapture(false);
      return true;
    } catch (e) {
      console.warn("[RoverVoice] recognition.start() FAILED:", e);
      setState("idle");
      return false;
    }
  };

  /** Helper: set up resume-to-background after a tap-to-talk session ends. */
  const setupResumeAfterTap = () => {
    if (!rec) return;
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
    const ok = startRecognition(true);
    if (!ok && !micPermissionGranted) {
      // Mic permission not yet granted — acquire and retry.
      console.log("[RoverVoice] startBackground failed, acquiring mic permission...");
      setState("idle");
      acquireMicPermission().then((granted) => {
        if (!granted || stopped) {
          setState("denied");
          return;
        }
        if (backgroundSession) startRecognition(true);
      });
    }
    return ok;
  };

  /** Once-off push-to-talk. */
  const tapToTalk = (): boolean => {
    if (stopped) return false;
    // Stop any current speaking so mic only hears the user.
    stopSpeaking();
    backgroundSession = false;
    captureActive = false;
    pending = "";
    console.log("[RoverVoice] tapToTalk: starting, micPermission=", micPermissionGranted);
    // Use continuous: true so browser doesn't cut off on short pauses
    const ok = startRecognition(true);
    if (ok) {
      return true;
    }
    // Recognition failed to start — likely no mic permission.
    // Acquire permission and retry (async).
    console.log("[RoverVoice] tapToTalk: recognition failed, acquiring mic...");
    setState("listening"); // Show immediate UI feedback
    acquireMicPermission().then((granted) => {
      if (!granted || stopped) {
        console.warn("[RoverVoice] tapToTalk: mic denied");
        setState(isBraveBrowser() ? "brave_blocked" : "denied");
        return;
      }
      console.log("[RoverVoice] tapToTalk: retrying after permission grant");
      startRecognition(true);
    });
    return false;
  };

  const stop = () => {
    stopped = true;
    backgroundSession = false;
    captureActive = false;
    pending = "";
    if (speakTimer) {
      clearTimeout(speakTimer);
      speakTimer = null;
    }
    if (speakSafetyTimer) {
      clearTimeout(speakSafetyTimer);
      speakSafetyTimer = null;
    }
    stopRecognition();
    stopSpeaking();
    if (watchdog) {
      clearInterval(watchdog);
      watchdog = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pointerdown", gestureRef);
      window.removeEventListener("keydown", gestureRef);
      window.removeEventListener("touchstart", gestureRef);
      window.removeEventListener("pointerdown", primeMicOnGesture);
      window.removeEventListener("touchstart", primeMicOnGesture);
      window.removeEventListener("keydown", primeMicOnGesture);
    }
    setState("idle");
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speakSafetyTimer) {
      clearTimeout(speakSafetyTimer);
      speakSafetyTimer = null;
    }
    // If state was stuck on "speaking", unstick it immediately so the mic
    // is no longer blocked.
    if (state === "speaking") {
      lastSpeakAt = Date.now();
      setState(backgroundSession ? "background" : "idle");
    }
  };

  /** Speaks a reply. The text stays visible in chat as well. */
  const speak = (text: string) => {
    const clean = String(text || "")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
      .replace(/[#*_>`~[\]]/g, " ")
      .replace(/\.{2,}/g, ". ")
      .replace(/([.!?])\s*/g, "$1 ")
      .replace(/,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean || !voiceRepliesEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState("unsupported");
      return;
    }
    stopSpeaking();
    lastSpeakAt = Date.now();
    if (speakTimer) {
      clearTimeout(speakTimer);
      speakTimer = null;
    }
    // Chrome bug workaround: calling speak() in the same tick as cancel() can
    // silently swallow the utterance. Give the cancel a tick to take effect.
    speakTimer = setTimeout(
      () => {
        speakTimer = null;
        if (stopped) return;
        try {
          const utterance = new SpeechSynthesisUtterance(clean);
          const voice = pickBestVoice(lang);
          if (voice) utterance.voice = voice;
          utterance.lang = lang;
          utterance.rate = speechRate;
          utterance.pitch = speechPitch;
          utterance.volume = 1;

          utterance.onstart = () => {
            lastSpeakAt = Date.now();
            setState("speaking");
            // Safety: if onend never fires, force-exit speaking state
            if (speakSafetyTimer) clearTimeout(speakSafetyTimer);
            speakSafetyTimer = setTimeout(() => {
              speakSafetyTimer = null;
              if (state === "speaking") {
                lastSpeakAt = Date.now();
                setState(backgroundSession ? "background" : "idle");
              }
            }, MAX_SPEAK_DURATION_MS);
          };
          utterance.onend = () => {
            if (speakSafetyTimer) { clearTimeout(speakSafetyTimer); speakSafetyTimer = null; }
            // Guard the mic from TTS tail audio right after we stop speaking.
            lastSpeakAt = Date.now();
            if (!captureActive) setState(backgroundSession ? "background" : "idle");
          };
          utterance.onerror = () => {
            if (speakSafetyTimer) { clearTimeout(speakSafetyTimer); speakSafetyTimer = null; }
            lastSpeakAt = Date.now();
            if (!captureActive) setState(backgroundSession ? "background" : "idle");
          };
          window.speechSynthesis.speak(utterance);
        } catch {
          /* noop */
        }
      },
      window.speechSynthesis.speaking ? 150 : 30,
    );
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
