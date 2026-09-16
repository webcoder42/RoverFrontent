import { Mic, MicOff, Volume2, VolumeX, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/voice";

interface VoiceControlProps {
  state: VoiceState;
  botName: string;
  wakeOn: boolean;
  voiceOn: boolean;
  onToggleWake: () => void;
  onToggleVoice: () => void;
  onTapToTalk: () => void;
  primary?: string;
  secondary?: string;
}

const VOICE_CSS = `
@keyframes rv-ring { 0% { transform: scale(0.55); opacity: 0.75; } 100% { transform: scale(1.65); opacity: 0; } }
@keyframes rv-eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
@keyframes rv-breathe { 0%,100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.35); } 50% { box-shadow: 0 0 0 7px rgba(124, 58, 237, 0); } }
.rv-mic-core { position: relative; display: grid; place-items: center; }
.rv-ring { position: absolute; inset: -3px; border-radius: 9999px; border: 2px solid currentColor; animation: rv-ring 1.6s ease-out infinite; pointer-events: none; }
.rv-ring.rv-ring-2 { animation-delay: 0.55s; }
.rv-eq { display: flex; gap: 2px; align-items: center; height: 14px; color: #fff; }
.rv-eq > span { width: 3px; height: 100%; background: currentColor; border-radius: 2px; animation: rv-eq 0.55s ease-in-out infinite alternate; }
.rv-eq > span:nth-child(1) { animation-delay: 0s; }
.rv-eq > span:nth-child(2) { animation-delay: 0.15s; }
.rv-eq > span:nth-child(3) { animation-delay: 0.3s; }
.rv-eq > span:nth-child(4) { animation-delay: 0.1s; }
.rv-idle-breathe { animation: rv-breathe 2.2s ease-in-out infinite; }
`;

export function VoiceControl({
  state,
  botName,
  wakeOn,
  voiceOn,
  onToggleWake,
  onToggleVoice,
  onTapToTalk,
  primary,
  secondary,
}: VoiceControlProps) {
  const listening = state === "listening";
  const speaking = state === "speaking";
  const background = state === "background";
  const blocked = state === "unsupported" || state === "denied";
  const active = listening || background || speaking;

  const statusText =
    state === "background"
      ? `Listening — say anything, or call "${botName}"`
      : state === "listening"
        ? "Listening… speak now"
        : state === "speaking"
          ? "Speaking…"
          : state === "unsupported"
            ? "Voice isn't supported in this browser"
            : state === "denied"
              ? "Microphone is blocked — tap mic to allow"
              : `Mic ready — tap to speak, or say "${botName}"`;

  const ringColor = listening ? "#ef4444" : background ? "#8b5cf6" : "#8b5cf6";

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 pb-1.5">
      <style>{VOICE_CSS}</style>

      <button
        type="button"
        onClick={onTapToTalk}
        disabled={blocked && state !== "denied"}
        aria-label="Talk to chatbot"
        className="relative shrink-0"
      >
        <div
          className={cn(
            "rv-mic-core h-10 w-10 rounded-full transition-transform active:scale-90",
            !active && !blocked && "rv-idle-breathe",
          )}
          style={{
            background: blocked
              ? "#64748b"
              : `linear-gradient(135deg, ${primary || "#7c3aed"}, ${secondary || "#db2777"})`,
          }}
        >
          {active && (
            <span
              className={cn("rv-ring", listening && "rv-ring-2")}
              style={{ color: ringColor }}
            />
          )}
          {speaking ? (
            <span className="rv-eq">
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : blocked ? (
            <MicOff className="h-4 w-4 text-white" />
          ) : (
            <Mic
              className={cn("h-4 w-4 text-white", listening && "animate-pulse")}
            />
          )}
        </div>
      </button>

      <div className="min-w-0 flex-1 text-[11px] leading-tight text-muted-foreground">
        {state === "speaking" && (
          <span className="mb-0.5 flex items-center gap-1.5 font-semibold text-primary">
            <Waves className="h-3 w-3" /> Bot is speaking
          </span>
        )}
        <span className={cn(active && "font-medium text-foreground")}>{statusText}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleWake}
          title="Always listen for the bot name"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors",
            wakeOn
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          <Mic className="h-3 w-3" /> {wakeOn ? "Wake ON" : "Wake OFF"}
        </button>
        <button
          type="button"
          onClick={onToggleVoice}
          title="Bot replies with voice + text"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition-colors",
            voiceOn
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {voiceOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          {voiceOn ? "Voice" : "Muted"}
        </button>
      </div>
    </div>
  );
}