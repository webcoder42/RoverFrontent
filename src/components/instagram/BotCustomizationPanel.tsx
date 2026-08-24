import { useEffect, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquareText,
  PlusCircle,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Power,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAuthHeaders } from "@/lib/auth";

export interface KeywordReply {
  _id?: string;
  keyword: string;
  reply: string;
}

interface BotConfigData {
  welcomeMessage: string;
  fallbackMessage: string;
  keywordReplies: KeywordReply[];
  aiEnabled: boolean;
  autoReplyComments: boolean;
  isActive: boolean;
}

interface BotCustomizationPanelProps {
  accountId: string | null;
}

const DEFAULT_CONFIG: BotConfigData = {
  welcomeMessage: "Hi 👋 Welcome! How can I help you today?",
  fallbackMessage:
    "Thanks for reaching out! Our team will get back to you soon. 🙏",
  keywordReplies: [],
  aiEnabled: false,
  autoReplyComments: false,
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export function BotCustomizationPanel({ accountId }: BotCustomizationPanelProps) {
  const [config, setConfig] = useState<BotConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New keyword row being typed
  const [newKeyword, setNewKeyword] = useState("");
  const [newReply, setNewReply] = useState("");

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    setError("");
    fetch(`/api/instagram/accounts/${accountId}/config`, {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setConfig({
            welcomeMessage: data.config.welcomeMessage ?? DEFAULT_CONFIG.welcomeMessage,
            fallbackMessage: data.config.fallbackMessage ?? DEFAULT_CONFIG.fallbackMessage,
            keywordReplies: Array.isArray(data.config.keywordReplies)
              ? data.config.keywordReplies
              : [],
            aiEnabled: Boolean(data.config.aiEnabled),
            autoReplyComments: Boolean(data.config.autoReplyComments),
            isActive: data.config.isActive !== false,
          });
        }
      })
      .catch(() => setError("Failed to load bot configuration"))
      .finally(() => setLoading(false));
  }, [accountId]);

  const handleAddKeyword = () => {
    const kw = newKeyword.trim();
    const rep = newReply.trim();
    if (!kw || !rep) {
      setError("Both keyword and reply are required");
      return;
    }
    if (
      config.keywordReplies.some(
        (k) => k.keyword.toLowerCase() === kw.toLowerCase(),
      )
    ) {
      setError(`"${kw}" already exists`);
      return;
    }
    setError("");
    setConfig((c) => ({
      ...c,
      keywordReplies: [...c.keywordReplies, { keyword: kw, reply: rep }],
    }));
    setNewKeyword("");
    setNewReply("");
  };

  const handleRemoveKeyword = (index: number) => {
    setConfig((c) => ({
      ...c,
      keywordReplies: c.keywordReplies.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateKeyword = (index: number, patch: Partial<KeywordReply>) => {
    setConfig((c) => ({
      ...c,
      keywordReplies: c.keywordReplies.map((kr, i) =>
        i === index ? { ...kr, ...patch } : kr,
      ),
    }));
  };

  const handleSave = async () => {
    if (!accountId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/instagram/accounts/${accountId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeaders() as Record<string, string>),
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSuccess("Bot configuration saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!accountId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 text-white shadow-soft">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Auto-reply bot</h3>
            <p className="text-xs text-muted-foreground">
              Configure how your bot answers Instagram DMs and comments.
            </p>
          </div>
        </div>

        {/* Activate / deactivate */}
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Power
            className={`h-3.5 w-3.5 ${config.isActive ? "text-emerald-500" : ""}`}
          />
          <span>{config.isActive ? "Active" : "Paused"}</span>
          <Switch
            checked={config.isActive}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, isActive: v === true }))}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5">
        {/* Welcome + fallback messages */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <MessageSquareText className="h-3.5 w-3.5" /> Welcome message
            </Label>
            <Textarea
              value={config.welcomeMessage}
              onChange={(e) =>
                setConfig((c) => ({ ...c, welcomeMessage: e.target.value }))
              }
              className={inputClass}
              placeholder="Sent when someone messages you for the first time"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <AlertCircle className="h-3.5 w-3.5" /> Fallback message
            </Label>
            <Textarea
              value={config.fallbackMessage}
              onChange={(e) =>
                setConfig((c) => ({ ...c, fallbackMessage: e.target.value }))
              }
              className={inputClass}
              placeholder="Sent when no keyword matches and AI is off"
            />
          </div>
        </div>

        {/* Keyword replies */}
        <div className="grid gap-2">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Keyword auto-replies
          </Label>

          {config.keywordReplies.length > 0 && (
            <div className="grid gap-2">
              {config.keywordReplies.map((kr, i) => (
                <div
                  key={kr._id || `${kr.keyword}-${i}`}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-2.5 sm:flex-row sm:items-center"
                >
                  <Input
                    value={kr.keyword}
                    onChange={(e) =>
                      handleUpdateKeyword(i, { keyword: e.target.value })
                    }
                    className={`${inputClass} sm:w-44`}
                    placeholder="keyword"
                  />
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">→</span>
                  <Input
                    value={kr.reply}
                    onChange={(e) =>
                      handleUpdateKeyword(i, { reply: e.target.value })
                    }
                    className={`${inputClass} flex-1`}
                    placeholder="auto-reply"
                  />
                  <button
                    onClick={() => handleRemoveKeyword(i)}
                    className="grid h-9 w-9 shrink-0 place-items-center self-end rounded-xl border border-border bg-card text-muted-foreground hover:text-red-600"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-2.5 sm:flex-row sm:items-center">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              className={`${inputClass} sm:w-44`}
              placeholder='e.g. "price"'
            />
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">→</span>
            <Input
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              className={`${inputClass} flex-1`}
              placeholder="Our pricing starts at…"
            />
            <GradientButton
              onClick={handleAddKeyword}
              className="shrink-0 px-3 py-2 text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add
            </GradientButton>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold">AI-powered replies</div>
              <p className="text-[11px] text-muted-foreground">
                When no keyword matches, AI writes the answer.
              </p>
            </div>
            <Switch
              checked={config.aiEnabled}
              onCheckedChange={(v) =>
                setConfig((c) => ({ ...c, aiEnabled: v === true }))
              }
            />
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold">Auto-reply to comments</div>
              <p className="text-[11px] text-muted-foreground">
                Privately DM everyone who comments.
              </p>
            </div>
            <Switch
              checked={config.autoReplyComments}
              onCheckedChange={(v) =>
                setConfig((c) => ({ ...c, autoReplyComments: v === true }))
              }
            />
          </div>
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

        <GradientButton
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Save configuration
            </>
          )}
        </GradientButton>
      </div>
    </div>
  );
}
