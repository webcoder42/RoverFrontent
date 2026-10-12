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
const MAX_WAIT_AFTER_WAKE_MS = 7000;
const MAX_WAIT_TAP_MS = 8000;
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
  const silenceMs = Math.round((opts.silenceTimeout ?? 2.2) * 1000);
  const alwaysRespond = opts.alwaysRespond ?? true;
  const speechRate = opts.rate ?? 0.9; // Friendly, clear human conversational speed
  const speechPitch = opts.pitch ?? 1.0;



  let state: VoiceState = isVoiceSupported() ? "idle" : "unsupported";
  let wakeEnabled = true;
  let voiceRepliesEnabled = true;
  let conversationalMode = false;
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
      if ((wakeEnabled || conversationalMode) && !rec) {
        try {
          if (conversationalMode) {
            resumeListening();
          } else {
            startBackground();
          }
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

  // Watchdog: ensures recognition remains active if conversationalMode or wakeEnabled
  let watchdog: ReturnType<typeof setInterval> | null = null;
  const ensureBackgroundAlive = () => {
    if (stopped || state === "speaking") return;
    if (conversationalMode && !rec) {
      try { resumeListening(); } catch {}
      return;
    }
    if (backgroundSession && wakeEnabled && !rec) {
      try { startBackground(); } catch {}
      return;
    }
  };
  const startWatchdog = () => {
    if (!watchdog) watchdog = setInterval(ensureBackgroundAlive, 3000);
  };
  startWatchdog();

  // Timer for the deferred speak() (kept so we can cancel stale ones).
  let speakTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
    if (maxWaitTimer) clearTimeout(maxWaitTimer);
    maxWaitTimer = null;
    if (deliverySoonTimer) {
      clearTimeout(deliverySoonTimer);
      deliverySoonTimer = null;
    }
  };

  // Deliver whatever has been captured (pending + latest interim).
  const deliver = () => {
    const interim = rec?.__lastInterim || "";
    clearTimers();
    const wasWake = captureIsWake;
    captureActive = false;
    captureIsWake = false;
    const combined = stripAddress(pending + " " + interim, wakeWords);
    pending = "";
    if (rec) rec.__lastInterim = "";

    if (!combined && !wasWake) {
      // Nothing heard, stay in listening mode if conversation is alive
      setState(conversationalMode ? "listening" : (backgroundSession && wakeEnabled ? "background" : "idle"));
      return;
    }

    // Keep conversational voice active so after bot speaks, it listens again
    conversationalMode = true;
    setState("idle");
    opts.onUserQuery?.(combined || "Hello");
  };

  const armSilence = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (captureActive) {
        if (Date.now() - lastInterimAt >= silenceMs) {
          deliver();
        } else {
          armSilence();
        }
      }
    }, silenceMs);
  };

  const armMaxWait = (ms: number) => {
    if (maxWaitTimer) clearTimeout(maxWaitTimer);
    maxWaitTimer = setTimeout(() => {
      if (captureActive) deliver();
    }, ms);
  };

  const startCapture = (fromWake: boolean) => {
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

  const resumeListening = () => {
    if (stopped) return;
    conversationalMode = true;
    stopSpeaking();
    if (!rec) {
      startRecognition(true);
    }
    startCapture(false);
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
        console.warn("[RoverVoice] SpeechRecognition network error:", err);
        setState("brave_blocked");
        stopRecognition();
      } else if (err === "no-speech" || err === "aborted") {
        // Normal silence timeout in browser - do not kill session!
        if (captureActive) {
          clearTimers();
          captureActive = false;
        }
        if (state !== "speaking") {
          setState(conversationalMode ? "listening" : (backgroundSession && wakeEnabled ? "background" : "idle"));
        }
      }
    };
    recognition.onend = () => {
      console.log("[RoverVoice] SpeechRecognition ended, conversationalMode=", conversationalMode, "wake=", wakeEnabled);
      if (stopped) return;
      clearTimers();
      captureActive = false;
      captureIsWake = false;
      pending = "";
      if (rec) rec.__lastInterim = "";

      // If bot is currently speaking, utter.onend will trigger resumeListening
      if (state === "speaking") return;

      if (conversationalMode) {
        setTimeout(() => {
          if (!stopped && conversationalMode && state !== "speaking") {
            try {
              recognition.start();
              rec = recognition;
              startCapture(false);
            } catch {
              /* already active or retry in watchdog */
            }
          }
        }, 200);
      } else if (backgroundSession && wakeEnabled) {
        setTimeout(() => {
          if (!stopped && wakeEnabled && state !== "speaking") {
            try {
              recognition.start();
              rec = recognition;
              setState("background");
            } catch {
              /* already active */
            }
          }
        }, 200);
      } else {
        setState("idle");
      }
    };
    recognition.onresult = (event: any) => {
      lastResultAt = Date.now();
      const nowMs = Date.now();
      const speakingRightNow = state === "speaking" && typeof window !== "undefined" && window.speechSynthesis?.speaking;
      if (speakingRightNow) return;
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

      if (backgroundSession && !conversationalMode) {
        // ── Wake-word background mode ─────────────────────────────────────
        const heard = pending + " " + finalText + " " + interimText;
        const phrase = finalText + " " + interimText;

        if (!captureActive) {
          const heardWord = hasWakeWord(heard, wakeWords);
          if (heardWord) opts.onWake?.();
          if (heardWord || (alwaysRespond && isLikelySpeech(phrase))) {
            startCapture(true);
          }
        }

        if (captureActive) {
          if (finalText) pending += finalText + " ";
          if (rec) rec.__lastInterim = interimText;
          if (finalText) deliverySoon();
          else armSilence();
        }
      } else {
        // ── Conversational / Push-to-talk mode ────────────────────────────
        if (!captureActive) startCapture(false);
        if (finalText) pending += finalText + " ";
        if (rec) rec.__lastInterim = interimText;

        // Reset silence timer on every new interim or final word
        if (finalText) {
          deliverySoon();
        } else {
          armSilence();
        }
      }
    };
    return recognition;
  };

  // Deliver after 1800ms of true silence following speech, so natural pauses don't cut user off!
  let deliverySoonTimer: ReturnType<typeof setTimeout> | null = null;
  const deliverySoon = () => {
    if (deliverySoonTimer) clearTimeout(deliverySoonTimer);
    deliverySoonTimer = setTimeout(() => {
      if (captureActive) {
        if (Date.now() - lastInterimAt >= 1800) {
          deliver();
        } else {
          armSilence();
        }
      }
    }, 1800);
  };

  const stopRecognition = () => {
    clearTimers();
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
      setState(conversationalMode ? "listening" : (continuous ? "background" : "idle"));
      if (conversationalMode || !continuous) startCapture(false);
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
    // If currently speaking, tapping interrupts TTS and immediately listens to user!
    if (state === "speaking") {
      stopSpeaking();
      conversationalMode = true;
      resumeListening();
      return true;
    }
    // If already actively listening, tapping again pauses/mutes voice
    if (state === "listening" && conversationalMode) {
      conversationalMode = false;
      stopRecognition();
      setState(backgroundSession && wakeEnabled ? "background" : "idle");
      return true;
    }

    conversationalMode = true;
    stopSpeaking();
    backgroundSession = false;
    captureActive = false;
    pending = "";
    console.log("[RoverVoice] tapToTalk: starting, micPermission=", micPermissionGranted);
    const ok = startRecognition(true);
    if (ok) {
      startCapture(false);
      return true;
    }
    // Recognition failed to start — acquire permission and retry
    console.log("[RoverVoice] tapToTalk: recognition failed, acquiring mic...");
    setState("listening");
    acquireMicPermission().then((granted) => {
      if (!granted || stopped) {
        console.warn("[RoverVoice] tapToTalk: mic denied");
        setState(isBraveBrowser() ? "brave_blocked" : "denied");
        return;
      }
      console.log("[RoverVoice] tapToTalk: retrying after permission grant");
      startRecognition(true);
      startCapture(false);
    });
    return false;
  };

  const stop = () => {
    stopped = true;
    conversationalMode = false;
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
    if (state === "speaking") {
      lastSpeakAt = Date.now();
      setState(conversationalMode ? "listening" : (backgroundSession && wakeEnabled ? "background" : "idle"));
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
                if (!stopped && conversationalMode) {
                  resumeListening();
                } else {
                  setState(backgroundSession && wakeEnabled ? "background" : "idle");
                }
              }
            }, MAX_SPEAK_DURATION_MS);
          };
          utterance.onend = () => {
            if (speakSafetyTimer) { clearTimeout(speakSafetyTimer); speakSafetyTimer = null; }
            lastSpeakAt = Date.now();
            // Automatically resume listening so conversation flows seamlessly!
            if (!stopped && conversationalMode) {
              setTimeout(() => {
                if (!stopped && conversationalMode && state !== "speaking") {
                  resumeListening();
                }
              }, 400);
            } else if (!captureActive) {
              setState(backgroundSession && wakeEnabled ? "background" : "idle");
            }
          };
          utterance.onerror = () => {
            if (speakSafetyTimer) { clearTimeout(speakSafetyTimer); speakSafetyTimer = null; }
            lastSpeakAt = Date.now();
            if (!stopped && conversationalMode) {
              setTimeout(() => {
                if (!stopped && conversationalMode && state !== "speaking") {
                  resumeListening();
                }
              }, 400);
            } else if (!captureActive) {
              setState(backgroundSession && wakeEnabled ? "background" : "idle");
            }
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
    get conversational() {
      return conversationalMode;
    },
    startBackground,
    tapToTalk,
    resumeListening,
    endConversation: () => {
      conversationalMode = false;
      stopSpeaking();
      stopRecognition();
      setState(backgroundSession && wakeEnabled ? "background" : "idle");
    },
    stop,
    speak,
    stopSpeaking,
    setWakeEnabled,
    setVoiceRepliesEnabled,
    wakeWords,
  };
}

export type VoiceEngine = ReturnType<typeof createVoiceEngine>;
