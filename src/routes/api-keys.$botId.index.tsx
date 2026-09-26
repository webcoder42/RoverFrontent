import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/common/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";
import { toast } from "sonner";
import { useChatbotsStore } from "@/store/chatbots";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/api-keys/$botId/")({
  head: () => ({ meta: [{ title: "API Keys — Webotme" }] }),
  component: ApiKeysPage,
});

interface KeyInfo {
  hasKey: boolean;
  botName: string;
  name: string;
  description: string;
  maskedKey: string;
  fullKey?: string;
  createdAt: string | null;
}

const EMPTY_KEY: KeyInfo = {
  hasKey: false,
  botName: "",
  name: "",
  description: "",
  maskedKey: "",
  createdAt: null,
};

const apiUrl = (botId: string) => `/api/chatbot/${botId}/api-key`;

function ApiKeysPage() {
  const { botId } = Route.useParams();
  const bot = useChatbotsStore((s) => s.chatbots.find((c) => c.id === botId));

  const [keyInfo, setKeyInfo] = useState<KeyInfo>(EMPTY_KEY);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [tab, setTab] = useState<"overview" | "create">("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(botId), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setKeyInfo({
          hasKey: data.hasKey,
          botName: data.botName || bot?.name || botId,
          name: data.name || "",
          description: data.description || "",
          maskedKey: data.maskedKey || "",
          createdAt: data.createdAt || null,
        });
      }
    } catch {
      // leave as empty
    } finally {
      setLoading(false);
    }
  }, [botId, bot?.name]);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please give your API key a name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(apiUrl(botId), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: trimmed, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create API key");
      }
      if (data.replaced) {
        toast.warning("Previous key was replaced by this new one.");
      } else {
        toast.success("API key created");
      }
      setJustCreated(data.key);
      setKeyInfo({
        hasKey: true,
        botName: data.botName || bot?.name || botId,
        name: data.name,
        description: description.trim(),
        maskedKey: data.maskedKey,
        fullKey: data.key,
        createdAt: data.createdAt,
      });
      setName("");
      setDescription("");
      setTab("overview");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleReveal = async (): Promise<string | null> => {
    if (keyInfo.fullKey) return keyInfo.fullKey;
    setRevealing(true);
    try {
      const res = await fetch(`${apiUrl(botId)}/reveal`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reveal key");
      }
      setKeyInfo((prev) => ({ ...prev, fullKey: data.key }));
      setRevealed(true);
      return data.key;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reveal key");
      return null;
    } finally {
      setRevealing(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 1600);
    toast.success("Copied");
  };

  const copyFullKey = async () => {
    const full = keyInfo.fullKey || (await handleReveal());
    if (full) copyText(full, "key");
  };

  const handleRevoke = async () => {
    const ok = window.confirm(
      "Revoke this API key? Any app using it will stop working immediately. You can create a new one anytime.",
    );
    if (!ok) return;
    try {
      const res = await fetch(apiUrl(botId), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to revoke key");
      }
      setKeyInfo(EMPTY_KEY);
      setJustCreated(null);
      setRevealed(false);
      setMenuOpen(false);
      toast.success("API key revoked");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    }
  };

  const hasKey = keyInfo.hasKey || Boolean(keyInfo.maskedKey);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl p-0 sm:p-2">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {keyInfo.botName || bot?.name || botId} · {bot?.template || "Chatbot"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl text-sm">
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <Terminal className="h-4 w-4" /> Docs
              </a>
            </Button>
            <Button
              onClick={() => setTab("create")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Create Key
            </Button>
          </div>
        </div>

        {/* Status strip */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">API Key</span>
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1.5 text-2xl font-bold">{hasKey ? "Active" : "None"}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Key Name</span>
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold">
              {keyInfo.name || (hasKey ? "—" : "No key yet")}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <BotBadge />
            </div>
            <p className="mt-1.5 truncate text-sm font-semibold">
              {keyInfo.createdAt ? formatDate(keyInfo.createdAt) : "—"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === "create" ? (
            <motion.section
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Create form */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                      <KeyRound className="h-4 w-4 text-primary" />
                      Create your chatbot's API key
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Give it a meaningful name so you can recognize this key later — it lets
                      another website / app talk to {keyInfo.botName || bot?.name || "this chatbot"}{" "}
                      via the backend. Creating a new key replaces the previous one.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTab("overview")}
                    className="rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="key-name" className="mb-1.5 block text-xs font-semibold">
                      Key name
                    </Label>
                    <Input
                      id="key-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. My client's React website"
                      className="h-11 rounded-xl border-border bg-muted/30 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="key-desc" className="mb-1.5 block text-xs font-semibold">
                      Description{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="key-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Where or how will this key be used?"
                      rows={3}
                      className="rounded-xl border-border bg-muted/30 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="submit"
                      disabled={creating}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {creating ? "Creating…" : "Create API Key"}
                    </Button>
                    {hasKey && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600">
                        <RefreshCw className="h-3 w-3" /> Replaces the current key on save
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setTab("overview")}
                      className="rounded-xl text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.section>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Loading…</p>
                </div>
              )}

              {/* Just-created key banner */}
              <AnimatePresence>
                {!loading && justCreated && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-700">
                          API key created — save it now
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-600/80">
                          For security, you'll see the full key only now (and can reveal it again
                          later). Add it to your backend and never share it publicly.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="flex-1 truncate rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 font-mono text-xs text-emerald-800">
                            {justCreated}
                          </code>
                          <Button
                            size="sm"
                            onClick={() => copyText(justCreated, "just")}
                            className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold"
                          >
                            {copiedId === "just" ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setJustCreated(null)}
                            className="rounded-lg text-xs font-semibold"
                          >
                            I've saved it
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current key card */}
              {!loading && (
                <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold">Your API key</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        One key per chatbot. Let another app talk to it through your backend.
                      </p>
                    </div>
                  </div>

                  {!hasKey ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <p className="mt-3 text-sm font-semibold">No API key yet</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Create a key so other websites and apps can talk to{" "}
                        {keyInfo.botName || bot?.name || "this chatbot"}.
                      </p>
                      <Button
                        onClick={() => setTab("create")}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create key
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold">{keyInfo.name}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                              {revealed && keyInfo.fullKey
                                ? keyInfo.fullKey
                                : keyInfo.maskedKey || "unknown"}
                            </code>
                            <button
                              onClick={() =>
                                revealed
                                  ? setRevealed(false)
                                  : handleReveal().then((k) => {
                                      if (k) setRevealed(true);
                                    })
                              }
                              disabled={revealing}
                              className="text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                              title={revealed ? "Hide" : "Reveal"}
                            >
                              {revealing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : revealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <span className="text-[10px] text-muted-foreground">
                              {keyInfo.createdAt ? formatDate(keyInfo.createdAt) : ""}
                            </span>
                          </div>
                          {keyInfo.description && (
                            <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                              {keyInfo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyFullKey}
                            className="rounded-lg px-2"
                            title="Copy key"
                          >
                            {copiedId === "key" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setMenuOpen((m) => !m)}
                              className="rounded-lg px-2"
                              title="More actions"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                            <AnimatePresence>
                              {menuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setMenuOpen(false)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
                                  >
                                    <button
                                      onClick={() => {
                                        setRevealed((r) => !r);
                                        copyFullKey();
                                        setMenuOpen(false);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
                                    >
                                      <Copy className="h-3.5 w-3.5" /> Copy key
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (revealed) setRevealed(false);
                                        else
                                          handleReveal().then((k) => {
                                            if (k) setRevealed(true);
                                          });
                                        setMenuOpen(false);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
                                    >
                                      {revealed ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                      )}
                                      {revealed ? "Hide key" : "Show key"}
                                    </button>
                                    <button
                                      onClick={handleRevoke}
                                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Revoke & delete
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Docs link */}
                  <div className="mt-4">
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 transition hover:bg-primary/10"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Code2 className="h-4 w-4" />
                        How to use this API key — full documentation
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function BotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
      <ArrowUpRight className="h-2.5 w-2.5" />
      API
    </span>
  );
}
