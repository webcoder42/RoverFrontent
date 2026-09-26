import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, BadgeCheck, Bot, Loader2, Mic, Paperclip, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help — Webotme" }] }),
  component: HelpChatPage,
});

type Msg = { id: number; role: "user" | "bot"; text: string; time: string };

const SUGGESTIONS = [
  "How do I install the widget?",
  "How do I create an API key?",
  "How do I train my bot?",
  "How do I turn off the mic?",
];

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const BOT_REPLIES = [
  "Good question! Head to the Dashboard → Generated Scripts, copy your widget snippet and paste it right before </body> on your site. Done — the chat box shows up automatically.",
  "Go to Dashboard → Generated Scripts → select your chatbot → open API Keys. Create a key, copy it, and keep it in your backend only — never in the frontend.",
  "Open your chatbot in the dashboard, go to Knowledge/Training, and upload docs, sheets or paste text. The bot answers from that data after you save it.",
  "Mic/voice is a bot setting — open your chatbot settings and toggle Voice off. The API (SDK) channel returns text only, so on a custom UI there's no mic at all.",
  "Works! The reply engine used by the widget and the API key is the same, so responses stay identical.",
];
let replyIdx = 0;

function HelpChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      role: "bot",
      text: "Hi, I'm your Help Assistant 👋 Ask me anything about widgets, API keys, flows or training.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const send = async (raw?: string) => {
    const t = (raw ?? input).trim();
    if (!t || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: m.length + 1, role: "user", text: t, time: now() }]);

    const reply = BOT_REPLIES[replyIdx % BOT_REPLIES.length];
    replyIdx += 1;

    setTimeout(() => {
      setMessages((m) => [...m, { id: m.length + 1, role: "bot", text: reply, time: now() }]);
      setSending(false);
    }, 700);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              Help Assistant <BadgeCheck className="h-4 w-4 text-sky-500" />
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Online · replies instantly
            </p>
          </div>
        </div>
        <span className="ml-auto hidden rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          Test page — safe to delete
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto pb-4"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-end gap-2", m.role === "user" && "flex-row-reverse")}
            >
              {m.role === "bot" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
                  m.role === "bot"
                    ? "rounded-bl-md border border-border/60 bg-card"
                    : "rounded-br-md bg-gradient-primary text-primary-foreground",
                )}
              >
                <p>{m.text}</p>
                <p
                  className={cn(
                    "mt-1 text-right text-[10px]",
                    m.role === "bot" ? "text-muted-foreground" : "text-primary-foreground/70",
                  )}
                >
                  {m.time}
                </p>
              </div>
            </motion.div>
          ))}
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3 shadow-soft">
                {[0, 150, 300].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: d / 1000 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {messages.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-soft">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            title="Attach (preview only)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message…"
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground"
            title="Voice input (preview only)"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => send()}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-gradient-primary text-primary-foreground shadow-soft"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          UI preview only — no real API calls. Delete this route anytime.
        </p>
      </div>
    </div>
  );
}
