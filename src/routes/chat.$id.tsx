import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Check, Link2, Share2 } from "lucide-react";
import { ChatWidget } from "@/components/widget/ChatWidget";

export const Route = createFileRoute("/chat/$id")({
  component: ShareableChatPage,
});

function ShareableChatPage() {
  const { id } = Route.useParams();
  const [showBar, setShowBar] = useState(true);
  const [copied, setCopied] = useState(false);

  // The chat fills the screen and scrolls internally, so the share pill is
  // dismissed on a timer rather than on window scroll.
  useEffect(() => {
    const timer = setTimeout(() => setShowBar(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const shareUrl =
    typeof window === "undefined" ? `/chat/${id}` : `${window.location.origin}/chat/${id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Chat with us", url: shareUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copyLink();
  };

  const shareWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Chat with us: ${shareUrl}`)}`,
      "_blank",
      "noopener,noreferrer",
    );

  return (
    <div className="relative h-screen w-full bg-slate-50 dark:bg-slate-950">
      <ChatWidget botId={id} />

      {showBar && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-700/10 bg-white/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90">
            <span className="flex items-center gap-1.5 pl-1 pr-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Bot className="h-3.5 w-3.5 text-indigo-500" />
              Live chat
            </span>

            <button
              onClick={copyLink}
              title="Copy link"
              className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              onClick={shareNative}
              title="Share"
              className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={shareWhatsApp}
              title="Share on WhatsApp"
              className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
