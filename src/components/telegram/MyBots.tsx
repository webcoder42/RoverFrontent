import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Loader2,
  Play,
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  AtSign,
  Lock,
  MessageCircle,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { getAuthHeaders } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export interface ConnectedBot {
  _id: string;
  botName: string;
  description?: string;
  telegramUsername?: string;
  webhookUrl?: string;
  status: "active" | "inactive" | "failed";
  tokenMasked?: string;
  createdAt: string;
}

const STATUS_META: Record<
  ConnectedBot["status"],
  { label: string; icon: typeof Wifi; className: string }
> = {
  active: {
    label: "Active",
    icon: Wifi,
    className: "bg-emerald-500/10 text-emerald-600",
  },
  inactive: {
    label: "Inactive",
    icon: WifiOff,
    className: "bg-amber-500/10 text-amber-600",
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    className: "bg-red-500/10 text-red-600",
  },
};

interface MyBotsProps {
  bots: ConnectedBot[];
  loading: boolean;
  onRefresh: () => void;
}

export function MyBots({ bots, loading, onRefresh }: MyBotsProps) {
  const [testing, setTesting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleTest = async (bot: ConnectedBot) => {
    setTesting(bot._id);
    setError("");
    try {
      const res = await fetch(`/api/bots/${bot._id}/test`, {
        method: "POST",
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Test failed");
      }
      alert(`✅ ${data.message}\n\nWebhook: ${data.webhookUrl || "—"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async (bot: ConnectedBot) => {
    if (!window.confirm(`Disconnect "${bot.botName}"? Its webhook will be removed.`)) {
      return;
    }
    setDisconnecting(bot._id);
    setError("");
    try {
      const res = await fetch(`/api/bots/${bot._id}`, {
        method: "DELETE",
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to disconnect");
      }
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-glow">
          <MessageCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">No bot connected yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Connect your first Telegram bot above to start receiving messages through your chatbot.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {bots.map((bot, i) => {
            const Status = STATUS_META[bot.status];
            const StatusIcon = Status.icon;
            return (
              <motion.div
                key={bot._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-soft">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{bot.botName}</div>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <AtSign className="h-3 w-3" />
                        {bot.telegramUsername || "Unknown username"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${Status.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {Status.label}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground/80">
                      Token {bot.tokenMasked ? `••••${bot.tokenMasked.slice(-4)}` : "• • • •"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground/80">
                      Connected {formatDate(bot.createdAt)}
                    </span>
                  </div>
                </div>

                {bot.description && (
                  <p className="mt-3 line-clamp-2 rounded-xl bg-muted/50 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                    {bot.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 pt-1">
                  <GradientButton
                    className="flex-1 px-3 py-2 text-xs"
                    onClick={() => handleTest(bot)}
                    disabled={testing === bot._id}
                  >
                    {testing === bot._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Test
                  </GradientButton>
                  <button
                    onClick={() => handleDisconnect(bot)}
                    disabled={disconnecting === bot._id}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-red-600 disabled:opacity-50"
                    title="Disconnect"
                  >
                    {disconnecting === bot._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
