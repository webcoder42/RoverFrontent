import { useState } from "react";
import {
  Bot,
  Loader2,
  Send,
  Link2,
  AtSign,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getAuthHeaders } from "@/lib/auth";

interface ChatbotOption {
  id: string;
  name: string;
}

interface ConnectBotFormProps {
  chatbots: ChatbotOption[];
  loadingChatbots: boolean;
  onConnected: () => void;
}

export function ConnectBotForm({ chatbots, loadingChatbots, onConnected }: ConnectBotFormProps) {
  const [botName, setBotName] = useState("");
  const [description, setDescription] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatbotId, setChatbotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!botName.trim()) {
      setError("Bot name is required");
      return;
    }
    if (!botToken.trim()) {
      setError("Bot token is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bots/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeaders() as Record<string, string>),
        },
        body: JSON.stringify({
          botName: botName.trim(),
          description,
          botToken: botToken.trim(),
          chatbotId: chatbotId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to connect bot");
      }
      setSuccess(data.message || "Bot connected successfully");
      setBotName("");
      setDescription("");
      setBotToken("");
      setChatbotId("");
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-soft">
          <Send className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Connect a new bot</h3>
          <p className="text-xs text-muted-foreground">
            Paste your Telegram bot token — it's encrypted and never shown again.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Bot className="h-3.5 w-3.5" /> Bot name
            </Label>
            <Input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className={inputClass}
              placeholder="e.g. My Support Bot"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Link2 className="h-3.5 w-3.5" /> Link to chatbot
            </Label>
            <select
              value={chatbotId}
              onChange={(e) => setChatbotId(e.target.value)}
              className={inputClass}
            >
              <option value="">
                {loadingChatbots ? "Loading chatbots…" : "Select a chatbot…"}
              </option>
              {chatbots.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <AtSign className="h-3.5 w-3.5" /> Telegram bot token
          </Label>
          <Input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className={inputClass}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" /> Description
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[72px] rounded-xl border border-border bg-card shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="What your bot does, services offered…"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-600">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <GradientButton type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying token…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Connect Bot
            </>
          )}
        </GradientButton>
      </div>
    </form>
  );
}
