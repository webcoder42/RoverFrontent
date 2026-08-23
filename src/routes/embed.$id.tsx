import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, Sparkles, User, RefreshCw, Plus, ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight, X, CreditCard, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import StripePaymentForm from "@/components/widget/StripePaymentForm";

export const Route = createFileRoute("/embed/$id")({
  component: EmbedChatWidget,
});

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  checkoutUrl?: string;
  clientSecret?: string;
  orderId?: string;
}

// Persistent visitor ID - same user always gets same ID across page reloads
const getVisitorId = () => {
  const key = "rover_visitor_id";
  let vid = localStorage.getItem(key);
  if (!vid) {
    vid = "v_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(key, vid);
  }
  return vid;
};

const makeSessionId = (visitorId: string) =>
  `${visitorId}::${Date.now().toString(36)}`;

function EmbedChatWidget() {
  const { id } = Route.useParams();
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [customInputMsgId, setCustomInputMsgId] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [datePickerValue, setDatePickerValue] = useState<Date>();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [processedPaymentIds, setProcessedPaymentIds] = useState<Set<string>>(new Set());
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageListRef = useRef<string[]>([]);

  const startSlideTimer = () => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    if (imageListRef.current.length < 2) return;
    slideTimerRef.current = setInterval(() => {
      setActiveImgIndex((prev) => (prev < imageListRef.current.length - 1 ? prev + 1 : 0));
    }, 3000);
  };

  const resetSlideTimer = () => {
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }
    startSlideTimer();
  };

  // Auto-slide images when product detail overlay is open
  useEffect(() => {
    if (!selectedProduct) {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
      imageListRef.current = [];
      return;
    }
    const imgs = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
      ? selectedProduct.images
      : [selectedProduct.image].filter(Boolean);
    imageListRef.current = imgs;
    setActiveImgIndex(0);
    startSlideTimer();

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
        slideTimerRef.current = null;
      }
    };
  }, [selectedProduct]);

  // Session / history state
  const [visitorId] = useState(() => getVisitorId());
  const [sessionId, setSessionId] = useState<string>("");
  


  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Max height for ~4 lines
    }
  }, [input]);

  // Fetch chatbot settings & start a fresh session
  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/chatbot/public/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Chatbot not found or inactive");
        return r.json();
      })
      .then((data) => {
        if (data.chatbot) {
          const bot = data.chatbot;
          if (bot.disabled) {
            setBot(bot);
            setLoading(false);
            return;
          }
          const kn = bot.knowledge || {};
          // Normalize service arrays from nested or flat fields
          bot.extractedServices = kn.extractedServices ?? bot.extractedServices ?? [];
          bot.trainingSheetServices = kn.trainingSheetServices ?? bot.trainingSheetServices ?? [];
          // Only show service buttons for agency chatbots (has agency email or collection db)
          const isAgency = bot.type === "agency" || !!(bot.agencyEmail1 || bot.agencyEmail2 || bot.collectionDb);
          if (isAgency && !bot.extractedServices?.length && bot.description) {
            const lines = bot.description.split('\n');
            const services: string[] = [];
            let capturing = false;
            for (const line of lines) {
              const trimmed = line.trim();
              if (/services?\s*offered/i.test(trimmed)) { capturing = true; continue; }
              if (capturing) {
                const match = trimmed.match(/^\d+\.\s+(.+)$/);
                if (match) { services.push(match[1]); }
                else if (trimmed === '') { continue; }
                else { capturing = false; }
              }
            }
            if (services.length > 0) bot.extractedServices = services;
          }
          setBot(bot);
          startNewSession(bot);
        }
      })
      .catch((e) => {
        console.error("Failed to load embedded chatbot:", e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch Stripe publishable key for inline payments
  useEffect(() => {
    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.publishableKey) setPublishableKey(data.publishableKey);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing]);

  // Start a brand-new conversation session
  const startNewSession = async (botData?: any) => {
    const currentBot = botData ?? bot;
    if (!currentBot) return;

    const newSessionId = makeSessionId(visitorId);
    setSessionId(newSessionId);

    const welcomeMsg: Message = {
      id: "welcome-msg",
      sender: "bot",
      text: currentBot.welcome || "Hi 👋 How can I help you today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    // Register session on server with welcome message
    try {
      await fetch(`/api/chatbot/public/${id}/session/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSessionId,
          userId: visitorId,
          welcomeMessage: currentBot.welcome || "Hi 👋 How can I help you today?",
        }),
      });
    } catch (e) {
      console.error("Failed to register session:", e);
    }
  };

  const handleSend = async (overrideText?: string | React.MouseEvent | any) => {
    const isEvent = overrideText && typeof overrideText === 'object' && 'preventDefault' in overrideText;
    const actualText = typeof overrideText === "string" ? overrideText : input;
    const trimmedMessage = actualText.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: trimmedMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!isEvent && typeof overrideText !== "string") setInput("");
    if (typeof overrideText === "string") setInput(""); // always clear on click as well
    setTyping(true);

    try {
      const response = await fetch(`/api/chatbot/public/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage, sessionId, userId: visitorId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "AI provider failed to respond");
      }

      const botMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "bot",
        text: data.reply || bot.welcome || "Hello! How can I help you today?",
        timestamp: new Date(),
        checkoutUrl: typeof data.checkoutUrl === "string" ? data.checkoutUrl : undefined,
        clientSecret: typeof data.clientSecret === "string" ? data.clientSecret : undefined,
        orderId: typeof data.orderId === "string" ? data.orderId : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Sorry, I could not generate a response right now.";
      const botMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "bot",
        text: fallbackMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setTyping(false);
    }
  };

  const handleReset = () => {
    startNewSession();
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading assistant...</p>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500">
          <Bot className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Chatbot Inactive</h3>
        <p className="mt-1 max-w-[240px] text-xs text-slate-500">
          This chatbot is either inactive or does not exist. Please check your dashboard settings.
        </p>
      </div>
    );
  }

  if (bot.disabled) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Plan Upgrade Required</h3>
        <p className="mt-1 max-w-[260px] text-xs text-slate-500">
          {bot.disabledReason || "This feature is not available on the current plan. Please upgrade to continue using this chatbot."}
        </p>
      </div>
    );
  }

  // Helper to detect light colors to prevent invisible text
  const isLightColor = (color?: string) => {
    if (!color) return false;
    const hex = color.replace("#", "");
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 180;
    }
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 180;
  };

  const previewMode = (bot.theme?.previewMode || bot.previewMode || "light");
  const isDarkMode = previewMode === "dark";
  const primaryBg = bot.theme?.primaryColor || bot.primaryColor || "#D94A2D";
  const secondaryBg = bot.theme?.secondaryColor || bot.secondaryColor || "#1C1C2E";
  const borderRadius = (bot.theme?.borderRadius ?? bot.borderRadius ?? 16);
  const template = bot.theme?.template || bot.template || "Modern Glass UI";

  const headerStyle = bot.theme?.headerStyle || bot.headerStyle || "gradient";
  const textStyle = bot.theme?.textStyle || bot.textStyle || "default";
  const botBubbleColor = bot.theme?.botBubbleColor || bot.botBubbleColor || "#f1f5f9";
  const botTextColor = bot.theme?.botTextColor || bot.botTextColor || "#0f172a";
  const showAvatar = bot.theme?.showAvatar ?? bot.showAvatar ?? true;
  const messageFontSize = bot.theme?.messageFontSize || bot.messageFontSize || "md";
  const inputStyle = bot.theme?.inputStyle || bot.inputStyle || "rounded";
  const headerSubtitle = bot.theme?.headerSubtitle || bot.headerSubtitle || "Online";

  const isNeon = template === "Neon AI Interface";
  const isGlass = template === "Modern Glass UI";
  const isMinimal = template === "Minimal AI Assistant";
  const isSupport = template === "Floating Support Widget";
  const isMessenger = template === "Rounded Messenger Style";

  const actualRadius = isMessenger ? 24 : isMinimal ? 4 : borderRadius;

  const bg = isDarkMode ? "#0f172a" : "#ffffff";
  const surfaceBg = isDarkMode ? "#1e293b" : "#f8fafc";
  const textCol = isDarkMode ? "#e2e8f0" : "#0f172a";

  const headerBg = isMinimal
    ? surfaceBg
    : isGlass || isNeon
    ? `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})`
    : headerStyle === "glass"
    ? `linear-gradient(135deg, ${primaryBg}cc, ${secondaryBg}cc)`
    : headerStyle === "solid"
    ? primaryBg
    : `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})`;

  const isLightHeader = isMinimal ? isDarkMode : isLightColor(primaryBg);
  const headerTextColor = isMinimal
    ? textCol
    : isLightHeader
    ? "#0f172a"
    : "#ffffff";

  const wrapperBg = isGlass
    ? `linear-gradient(135deg, ${primaryBg}22, ${secondaryBg}22), ${bg}`
    : bg;

  const userBubbleBg = isMinimal
    ? (isDarkMode ? "#334155" : "#e2e8f0")
    : isGlass || isNeon
    ? `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})`
    : primaryBg;

  const userBubbleText = isMinimal
    ? textCol
    : isLightColor(primaryBg)
    ? "#0f172a"
    : "#ffffff";

  const sendBtnBg = isMinimal
    ? textCol
    : isGlass || isNeon
    ? `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})`
    : primaryBg;

  const sendBtnText = isMinimal
    ? (isDarkMode ? "#0f172a" : "#ffffff")
    : isLightColor(primaryBg)
    ? "#0f172a"
    : "#ffffff";

  const renderMessageText = (text: string, msgId: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    let hasOptions = false;
    let hasConfirmPrompt = false;

    const isDateInput = /enter.*(?:departure|return|travel|arrival|check-in|check-out).*date|YYYY-MM-DD|select.*date/i.test(text);
    const isLatest = msgId === messages[messages.length - 1]?.id;

    const parseInlineStyles = (rawText: string, key: string) => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(rawText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(rawText.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`${key}-bold-${match.index}`} className="font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < rawText.length) {
        parts.push(rawText.substring(lastIndex));
      }

      return parts.length > 0 ? parts : rawText;
    };

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        if (listType === "ul") {
          elements.push(
            <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-1">
              {listItems}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-1">
              {listItems}
            </ol>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    // Compact product-name chips — tapping one asks the bot for full details
    let pickItems: any[] = [];
    const flushPicks = (key: string) => {
      if (pickItems.length > 0) {
        elements.push(
          <div key={`picks-${key}`} className="my-2 flex flex-wrap gap-1.5">
            {pickItems.map((p: any, idx: number) => (
              <button
                key={`pick-${key}-${idx}`}
                onClick={(e) => { e.preventDefault(); handleSend(String(p.name || "").trim()); }}
                className="flex max-w-full items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm transition-all hover:brightness-105 hover:shadow active:scale-95"
                style={{
                  borderColor: primaryBg,
                  color: isDarkMode ? "#e2e8f0" : primaryBg,
                  background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.02)",
                }}
              >
                <ShoppingCart className="h-3 w-3 shrink-0" style={{ color: primaryBg }} />
                <span className="truncate">{p.name}</span>
                {p.price ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    {p.price}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        );
        pickItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const productMatch = trimmedLine.match(/^-\s*PRODUCT:\s*(.*)$/i);
      const optionMatch = trimmedLine.match(/^-\s*OPTION:\s*(.*)$/i);
      const pickMatch = trimmedLine.match(/^-\s*PICK:\s*(.*)$/i);
      const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.*)$/);
      const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);

      if (pickMatch) {
        flushList(`flush-${i}`);
        let p: any = null;
        try { p = JSON.parse(pickMatch[1]); } catch {}
        if (p && p.name) {
          pickItems.push(p);
        }
        continue;
      }

      if (productMatch) {
        flushList(`flush-${i}`);
        let p: any = null;
        try { p = JSON.parse(productMatch[1]); } catch {}
        if (p) {
          elements.push(
            <div
              key={`prod-card-${i}`}
              onClick={() => { setSelectedProduct(p); setActiveImgIndex(0); }}
              className="my-2 overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-md transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-14 w-14 rounded-lg object-cover border shrink-0 bg-muted group-hover:scale-105 transition" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition">{p.name}</span>
                    <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {p.price}
                    </span>
                  </div>
                  {p.category && (
                    <span className="inline-block mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {p.category}
                    </span>
                  )}
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-tight">{p.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSend(`I would like to order: ${p.name}`);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition"
                  >
                    <ShoppingCart className="h-3 w-3" /> Order Now
                  </button>
                </div>
              </div>
            </div>
          );
        }
      } else if (optionMatch) {
        hasOptions = true;
        // Skip date OPTION buttons — show calendar instead
        if (isLatest && isDateInput) {
          continue;
        }
        flushList(`flush-${i}`);
        elements.push(
          <button
            key={`opt-btn-${i}`}
            onClick={(e) => { e.preventDefault(); handleSend(optionMatch[1]); }}
            className="block w-fit px-3 py-2 my-1.5 text-[13px] font-semibold border rounded-lg transition-all hover:bg-opacity-10 cursor-pointer shadow-sm hover:shadow-md"
            style={{
              borderColor: primaryBg,
              color: isDarkMode ? "#e2e8f0" : primaryBg,
              background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
            }}
          >
            {optionMatch[1]}
          </button>
        );
      } else if (bulletMatch) {
        if (listType !== "ul") {
          flushList(`flush-${i}`);
          listType = "ul";
        }
        listItems.push(
          <li key={`li-${i}`} className="mb-0.5 last:mb-0">
            {parseInlineStyles(bulletMatch[1], `line-${i}`)}
          </li>
        );
      } else if (numberMatch) {
        if (listType !== "ol") {
          flushList(`flush-${i}`);
          listType = "ol";
        }
        listItems.push(
          <li key={`li-${i}`} className="mb-0.5 last:mb-0">
            {parseInlineStyles(numberMatch[2], `line-${i}`)}
          </li>
        );
      } else {
        flushList(`flush-${i}`);
        if (trimmedLine) {
          const isConfirmLine = /reply with.*confirm|type.*confirm|please confirm.*order|please type.*confirm/i.test(trimmedLine);
          if (isConfirmLine) {
            hasConfirmPrompt = true;
            continue;
          }
          const hasInlineProduct = /-\s*PRODUCT:\s*\{/i.test(trimmedLine);
          if (hasInlineProduct) {
            const productRegex = /-\s*PRODUCT:\s*(\{.*?\})(?=\s*-\s*PRODUCT:|\s*$)/gi;
            let lastIdx = 0;
            let m;
            while ((m = productRegex.exec(trimmedLine)) !== null) {
              if (m.index > lastIdx) {
                elements.push(<p key={`p-${i}-t-${lastIdx}`} className="mb-1 last:mb-0 leading-relaxed">{parseInlineStyles(trimmedLine.substring(lastIdx, m.index), `line-${i}-${lastIdx}`)}</p>);
              }
              let prod: any = null;
              try { prod = JSON.parse(m[1]); } catch {}
              if (prod) {
                elements.push(
                  <div key={`prod-inline-${i}-${m.index}`} onClick={() => { setSelectedProduct(prod); setActiveImgIndex(0); }} className="my-2 overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-md transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="h-14 w-14 rounded-lg object-cover border shrink-0 bg-muted group-hover:scale-105 transition" />
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition">{prod.name}</span>
                          <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{prod.price}</span>
                        </div>
                        {prod.category && <span className="inline-block mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{prod.category}</span>}
                        {prod.description && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-tight">{prod.description}</p>}
                      </div>
                    </div>
                  </div>
                );
              }
              lastIdx = productRegex.lastIndex;
            }
            if (lastIdx < trimmedLine.length) {
              elements.push(<p key={`p-${i}-t-${lastIdx}`} className="mb-1 last:mb-0 leading-relaxed">{parseInlineStyles(trimmedLine.substring(lastIdx), `line-${i}-${lastIdx}`)}</p>);
            }
          } else {
            elements.push(
              <p key={`p-${i}`} className="mb-1 last:mb-0 leading-relaxed">
                {parseInlineStyles(line, `line-${i}`)}
              </p>
            );
          }
        } else if (line === "") {
          elements.push(<div key={`div-${i}`} className="h-1.5" />);
        }
      }
    }

    flushList("final");
    flushPicks("final");

    if (isLatest && hasConfirmPrompt) {
      elements.push(
        <div key="confirm-buttons" className="flex items-center gap-2 mt-3">
          <button
            onClick={(e) => { e.preventDefault(); handleSend("CONFIRM"); }}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
            style={{ background: "#10b981" }}
          >
            Confirm ✅
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleSend("CANCEL"); }}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
            style={{ background: "#ef4444" }}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (hasOptions && isLatest && customInputMsgId === msgId) {
      elements.push(
        <div key="custom-input-form" className="flex items-center gap-2 mt-2 max-w-xs z-20">
          <input
            type="text"
            placeholder="Enter manually..."
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none"
            style={{
              background: surfaceBg,
              color: textCol,
              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (customValue.trim()) {
                  handleSend(customValue.trim());
                  setCustomInputMsgId(null);
                  setCustomValue("");
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              if (customValue.trim()) {
                handleSend(customValue.trim());
                setCustomInputMsgId(null);
                setCustomValue("");
              }
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white hover:brightness-110 active:scale-95 transition-all"
            style={{ background: primaryBg }}
          >
            Send
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setCustomInputMsgId(null);
              setCustomValue("");
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:opacity-95 active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (isLatest && isDateInput) {
      elements.push(
        <div key="date-picker" className="mt-2 z-20" style={{
          background: surfaceBg,
          color: textCol,
          borderColor: isDarkMode ? "#334155" : "#e2e8f0",
          borderRadius: isMinimal ? "6px" : `${actualRadius}px`,
        }}>
          <Calendar
            mode="single"
            selected={datePickerValue}
            onSelect={(date) => {
              if (date) {
                setDatePickerValue(date);
                handleSend(format(date, "yyyy-MM-dd"));
              }
            }}
            className="rounded-lg border shadow-sm"
          />
        </div>
      );
    }

    return elements;
  };

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{
        fontFamily: bot.font || "Inter, sans-serif",
        background: wrapperBg,
        color: textCol,
      }}
    >
      {/* ── Chat Widget Header ────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between px-4 py-3 shrink-0 relative overflow-hidden ${
          isMinimal ? "border-b" : "shadow-md"
        }`}
        style={{
          background: headerBg,
          color: headerTextColor,
          borderColor: isDarkMode ? "#334155" : "#e2e8f0",
        }}
      >
        {/* Decorative dynamic glows */}
        {!isMinimal && (
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        )}

        {/* Normal chat header */}
        <>
          <div className="flex items-center gap-3 z-10">
            <div className="relative">
              <div
                className={`grid h-12 w-12 place-items-center overflow-hidden shrink-0 ${
                  isMinimal ? "rounded-md" : "rounded-xl bg-white/20 backdrop-blur border border-white/10"
                }`}
                style={{
                  background: isMinimal ? (isDarkMode ? "#334155" : "#e2e8f0") : undefined,
                }}
              >
                {bot.logo ? (
                  <img src={bot.logo} alt={bot.name} className="h-full w-full object-cover" />
                ) : (
                  <Bot className={`h-6 w-6 ${isMinimal ? (isDarkMode ? "text-slate-400" : "text-slate-500") : "text-white"}`} />
                )}
              </div>
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide leading-none">{bot.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] opacity-90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {headerSubtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 z-10">
            <button
              onClick={() => startNewSession()}
              title="New Chat"
              className={`grid h-8 w-8 place-items-center rounded-lg active:scale-95 transition-all ${
                isLightHeader ? "bg-black/5 hover:bg-black/10 text-slate-700" : "bg-white/10 hover:bg-white/20 text-white/90"
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              title="Restart Conversation"
              className={`grid h-8 w-8 place-items-center rounded-lg active:scale-95 transition-all ${
                isLightHeader ? "bg-black/5 hover:bg-black/10 text-slate-700" : "bg-white/10 hover:bg-white/20 text-white/90"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </>
      </div>

      {/* ── Chat Message List ────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
        style={{ background: bg }}
      >
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div key={m.id} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar Icon */}
                {(!isUser && showAvatar) ? (
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})` }}
                  >
                    {bot.logo ? (
                      <img src={bot.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                ) : isUser ? (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                ) : null}

                {/* Message Bubble */}
                <div className={`flex flex-col ${!isUser && !showAvatar ? "ml-0" : ""}`}>
                  <div
                    className="px-4 py-2.5 shadow-sm transition-all duration-300 whitespace-pre-wrap break-words"
                    style={{
                      borderRadius: isMinimal ? "6px" : `${actualRadius}px`,
                      borderTopRightRadius: isUser && !isMinimal ? "4px" : undefined,
                      borderTopLeftRadius: !isUser && !isMinimal ? "4px" : undefined,
                      background: isUser ? userBubbleBg : botBubbleColor,
                      color: isUser ? userBubbleText : botTextColor,
                      fontSize: messageFontSize === "sm" ? "12px" : messageFontSize === "lg" ? "15px" : "13px",
                      fontWeight: textStyle === "bold" ? "bold" : textStyle === "italic" ? "italic" : undefined,
                      fontStyle: textStyle === "italic" ? "italic" : undefined,
                      fontFamily: textStyle === "romantic" ? "'cursive', serif" : textStyle === "playful" ? "'Comic Sans MS', cursive" : textStyle === "elegant" ? "'Georgia', serif" : undefined,
                      letterSpacing: textStyle === "romantic" || textStyle === "elegant" ? "0.05em" : undefined,
                    }}
                  >
                    {renderMessageText(m.text, m.id)}
                  </div>
                  {!isUser && m.clientSecret && publishableKey && !processedPaymentIds.has(m.clientSecret) && (
                    <StripePaymentForm
                      clientSecret={m.clientSecret}
                      publishableKey={publishableKey}
                      onSuccess={() => {
                        setProcessedPaymentIds((prev) => new Set(prev).add(m.clientSecret!));
                        if (m.orderId) {
                          fetch("/api/stripe/confirm-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: m.orderId }),
                          }).catch(() => {});
                        }
                        const successMsg: Message = {
                          id: Math.random().toString(36).substring(7),
                          sender: "bot",
                          text: "✅ **Payment Successful!** Your order has been confirmed. Thank you for your purchase!",
                          timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, successMsg]);
                      }}
                      onError={(err) => console.error("Payment error:", err)}
                    />
                  )}
                  {!isUser && m.checkoutUrl && (
                    <a
                      href={m.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                      style={{ background: "#635bff" }}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay with Stripe
                    </a>
                  )}
                  <span className="text-[9px] text-slate-400 mt-1 self-start px-1 font-medium">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isUser && bot.type === "agency" && messages.length === 1 && (
                    [...new Set([...(bot.extractedServices || []), ...(bot.trainingSheetServices || [])].map((s: string) => s?.trim()).filter(Boolean))].length > 0
                  ) && (
                    <div className="flex flex-col gap-2 mt-3 max-w-[240px]">
                      {[...new Set([...(bot.extractedServices || []), ...(bot.trainingSheetServices || [])].map((s: string) => s?.trim()).filter(Boolean))].map((service: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleSend(service)}
                          className="px-3 py-2 text-xs font-semibold text-left border rounded-lg transition-all hover:shadow-sm"
                          style={{
                            borderColor: primaryBg,
                            color: isDarkMode ? "#e2e8f0" : primaryBg,
                            background: "transparent",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = `${primaryBg}15`)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Typing Indicator */}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryBg}, ${secondaryBg})` }}
              >
                {bot.logo ? (
                  <img src={bot.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className="flex gap-1.5 px-4 py-3.5 items-center justify-center rounded-xl shadow-sm"
                style={{
                  borderRadius: isMinimal ? "6px" : `${actualRadius}px`,
                  borderTopLeftRadius: !isMinimal ? "4px" : undefined,
                  background: surfaceBg,
                  color: textCol,
                }}
              >
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* ── Chat Input Footer ────────────────────────────────────────── */}
      <div
        className="p-3 shrink-0 flex items-end gap-2 border-t"
        style={{ borderColor: isDarkMode ? "#1f2937" : "#e5e7eb", background: bg }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          rows={1}
          className={`flex-1 px-4 py-2.5 text-sm focus:outline-none transition-all duration-200 border resize-none scrollbar-thin ${
            isMinimal ? "rounded-md" : inputStyle === "pill" ? "rounded-full" : inputStyle === "minimal" ? "rounded-none border-b-2" : "rounded-xl"
          }`}
          style={{
            background: surfaceBg,
            color: textCol,
            borderColor: isDarkMode ? "#1f2937" : "#e5e7eb",
            maxHeight: "120px",
            minHeight: "40px",
          }}
        />
        <button
          onClick={handleSend}
          className={`grid h-10 w-10 shrink-0 place-items-center hover:brightness-110 active:scale-95 transition-all shadow-md ${
            isMinimal ? "rounded-md" : inputStyle === "pill" ? "rounded-full" : inputStyle === "minimal" ? "rounded-none" : "rounded-xl"
          }`}
          style={{
            background: sendBtnBg,
            color: sendBtnText,
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Product Details Sheet Overlay */}
      {selectedProduct && (
        <div className="absolute inset-0 z-50 flex flex-col bg-card/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Chat
            </button>
            <span className="text-xs font-extrabold text-foreground">Product Preview</span>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Product Info & Gallery */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(() => {
              const imageList = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                ? selectedProduct.images
                : [selectedProduct.image].filter(Boolean);
              return (
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/30 p-2">
                  <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl bg-background">
                    {imageList.length > 0 ? (
                      <img
                        src={imageList[activeImgIndex] || imageList[0]}
                        alt={selectedProduct.name}
                        className="h-full w-full object-contain p-2 transition-all duration-300"
                      />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                    )}

                    {imageList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1)); resetSlideTimer(); }}
                          className="absolute left-2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background transition"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveImgIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0)); resetSlideTimer(); }}
                          className="absolute right-2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background transition"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-foreground shadow">
                          {activeImgIndex + 1} / {imageList.length}
                        </div>
                      </>
                    )}
                  </div>

                  {imageList.length > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                      {imageList.map((imgUrl: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setActiveImgIndex(idx); resetSlideTimer(); }}
                          className={cn(
                            "h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 transition",
                            activeImgIndex === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={imgUrl} alt="Thumb" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-foreground">{selectedProduct.name}</h3>
                <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {selectedProduct.price}
                </span>
              </div>

              {selectedProduct.category && (
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {selectedProduct.category}
                </span>
              )}

              {selectedProduct.description && (
                <div className="mt-2 rounded-xl border border-border/50 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                  {selectedProduct.description}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Order Button */}
          <div className="border-t p-3 bg-card shrink-0">
            <button
              type="button"
              onClick={() => {
                const name = selectedProduct.name;
                setSelectedProduct(null);
                handleSend(`I would like to order: ${name}`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-md hover:brightness-110 active:scale-[0.98] transition"
            >
              <ShoppingCart className="h-4 w-4" /> Place Order Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
