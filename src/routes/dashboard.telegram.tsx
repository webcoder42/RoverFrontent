import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send, Bot, MessageCircle, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { ConnectBotForm } from "@/components/telegram/ConnectBotForm";
import { MyBots, type ConnectedBot } from "@/components/telegram/MyBots";
import { getStoredUser, getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/telegram")({
  head: () => ({ meta: [{ title: "Telegram Bot — Rover" }] }),
  component: TelegramBotPage,
});

interface ChatbotOption {
  id: string;
  name: string;
}

function TelegramBotPage() {
  const [bots, setBots] = useState<ConnectedBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [chatbots, setChatbots] = useState<ChatbotOption[]>([]);
  const [loadingChatbots, setLoadingChatbots] = useState(true);

  const user = getStoredUser();
  const uid = (user?.id as string) || "";

  const fetchBots = () => {
    fetch(`/api/bots`, { headers: getAuthHeaders() as Record<string, string> })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.bots)) setBots(data.bots);
      })
      .catch(() => {})
      .finally(() => setLoadingBots(false));
  };

  useEffect(() => {
    fetchBots();
    if (!uid) {
      setLoadingChatbots(false);
      return;
    }
    fetch(`/api/chatbot/user/${uid}`, {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        const list: Array<{ _id: string; name: string }> = Array.isArray(data.chatbots)
          ? data.chatbots
          : [];
        setChatbots(list.map((b) => ({ id: b._id, name: b.name })));
      })
      .catch(() => {})
      .finally(() => setLoadingChatbots(false));
  }, [uid]);

  const activeCount = bots.filter((b) => b.status === "active").length;

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-soft">
            <Send className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Telegram Bot</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your Telegram bot token — Rover verifies it, sets up the webhook and routes every
          incoming message through your AI chatbot.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" /> Connected bots
          </div>
          <div className="mt-2 text-2xl font-bold">{bots.length}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Bot className="h-4 w-4 text-primary" /> Your chatbots
          </div>
          <div className="mt-2 text-2xl font-bold">{chatbots.length}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Status
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-600">
            {activeCount > 0 ? "Live & receiving" : "No live bot yet"}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ConnectBotForm
          chatbots={chatbots}
          loadingChatbots={loadingChatbots}
          onConnected={fetchBots}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold">My bots</h2>
      <MyBots bots={bots} loading={loadingBots} onRefresh={fetchBots} />
    </PageTransition>
  );
}
