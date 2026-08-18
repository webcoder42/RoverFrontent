import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, Code, Copy, Check, ExternalLink, X } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { clearAuth, getAuthHeaders, getStoredUser } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/inbox")({
  head: () => ({ meta: [{ title: "Installer — Webotme" }] }),
  component: InboxPage,
});

type Chatbot = {
  _id: string;
  name: string;
  isActive: boolean;
  embedScript: string;
  installedUrls: string[];
  createdAt: string;
};

function InboxPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [chatbotsLoading, setChatbotsLoading] = useState(false);
  const [chatbotsError, setChatbotsError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const user = getStoredUser();
  const userId = typeof user?.id === "string" ? user.id : "";

  useEffect(() => {
    if (!userId) return;

    const loadChatbots = async () => {
      setChatbotsLoading(true);
      setChatbotsError("");

      try {
        const res = await fetch(`/api/chatbot/user/${userId}`, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          } as Record<string, string>,
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearAuth();
            navigate({ to: "/" });
            return;
          }
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || "Failed to load chatbots");
        }

        const payload = (await res.json()) as { chatbots?: Chatbot[] };
        setChatbots(payload.chatbots || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load chatbots";
        setChatbotsError(message);
        setChatbots([]);
      } finally {
        setChatbotsLoading(false);
      }
    };

    void loadChatbots();
  }, [userId]);

  const activeChatbots = chatbots.filter((b) => b.isActive);

  const handleCopyScript = async (botId: string, script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopiedId(botId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleRemoveUrl = async (botId: string, url: string) => {
    const bot = chatbots.find((b) => b._id === botId);
    if (!bot) return;
    const updated = (bot.installedUrls || []).filter((u) => u !== url);
    try {
      const res = await fetch(`/api/chatbot/${botId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        } as Record<string, string>,
        body: JSON.stringify({ installedUrls: updated }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setChatbots((prev) => prev.map((b) => b._id === botId ? { ...b, installedUrls: updated } : b));
    } catch {}
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Installer</h1>
          <p className="text-sm text-muted-foreground">Manage chatbot installation scripts and embedded websites.</p>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="border-b border-border/60 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chatbots..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {chatbotsLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading chatbots...
              </div>
            ) : chatbotsError ? (
              <div className="py-20 text-center text-sm text-red-500">{chatbotsError}</div>
            ) : activeChatbots.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeChatbots
                  .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
                  .map((bot) => (
                    <div key={bot._id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-soft text-primary shadow-sm">
                          {bot.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{bot.name}</div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </div>
                      </div>

                      {bot.embedScript ? (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Embed Script</span>
                            <button
                              onClick={() => handleCopyScript(bot._id, bot.embedScript)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent"
                            >
                              {copiedId === bot._id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              {copiedId === bot._id ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 text-[10px] leading-relaxed text-muted-foreground">{bot.embedScript}</pre>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-amber-500/5 p-3 text-center text-xs text-amber-600">
                          No embed script generated yet. Go to Scripts page to generate one.
                        </div>
                      )}

                      <div>
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Installed Websites ({bot.installedUrls?.length || 0})
                          </span>
                        </div>
                        {bot.installedUrls && bot.installedUrls.length > 0 ? (
                          <div className="space-y-1">
                            {bot.installedUrls.map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5">
                                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 truncate text-xs text-primary hover:underline"
                                >
                                  {url}
                                </a>
                                <button
                                  onClick={() => handleRemoveUrl(bot._id, url)}
                                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-500"
                                ><X className="h-3 w-3" /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No websites added yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Code className="mx-auto mb-4 h-12 w-12 opacity-20 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No active chatbots found.</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a chatbot first to get its embed script.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
