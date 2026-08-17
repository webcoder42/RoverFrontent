import { useState, useRef, useEffect } from "react";
import { Bot, Send, MessageCircle, X, Minus, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

export interface BotPreviewProps {
  name: string;
  welcome: string;
  primary: string;
  secondary: string;
  radius: number;
  bubble: "rounded" | "square" | "soft";
  logo?: string;
  preview?: "light" | "dark";
  template?: string;
  className?: string;
  extractedServices?: string[];
  trainingSheetServices?: string[];
  headerStyle?: "gradient" | "solid" | "glass";
  botBubbleColor?: string;
  botTextColor?: string;
  showAvatar?: boolean;
  messageFontSize?: "sm" | "md" | "lg";
  inputStyle?: "rounded" | "pill" | "minimal";
  headerSubtitle?: string;
  textStyle?: "default" | "bold" | "italic" | "romantic" | "playful" | "elegant";
  currency?: string;
  currencySymbol?: string;
}

const bubbleRadius: Record<string, string> = {
  rounded: "rounded-2xl",
  square: "rounded-md",
  soft: "rounded-3xl",
};

interface Msg { id: string; from: "user" | "bot"; text: string; time: Date; }

const cannedReplies = (input: string): string => {
  const q = input.toLowerCase();
  if (q.includes("price") || q.includes("plan")) return "We offer Starter (free), Pro ($29/mo) and Enterprise (custom). Want me to recommend one?";
  if (q.includes("install") || q.includes("script")) return "Head to Generated Scripts, copy your widget snippet, and paste it before </body>. Done in 30 seconds!";
  if (q.includes("template")) return "We have 5 ready-made templates including Modern Glass UI and Neon AI. Pick one in Create Chatbot → Templates.";
  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) return "Hi there 👋 What can I help you build today?";
  if (q.includes("thanks") || q.includes("thank")) return "Anytime! Let me know if you need anything else.";
  return "Got it. Tell me a bit more and I'll point you in the right direction.";
};

export function LiveBotPreview(props: BotPreviewProps) {
  const { name, welcome, primary, secondary, radius, bubble, logo, preview = "light", template = "Modern Glass UI", className, extractedServices, trainingSheetServices, headerStyle = "gradient", botBubbleColor, botTextColor, showAvatar = true, messageFontSize = "md", inputStyle = "rounded", headerSubtitle = "Online", textStyle = "default", currency, currencySymbol } = props;

  const sym = currencySymbol || (currency ? currency.match(/\(([^)]+)\)/)?.[1] || currency : "$");

  const formatPrice = (raw: any) => {
    if (raw === null || raw === undefined || raw === "") return "N/A";
    let s = String(raw).trim();
    s = s.replace(/^[\$\€\£\₹\¥\₺\₽\৳\₱\₦\฿]|^(USD|PKR|EUR|GBP|INR|AED|SAR|CAD|AUD|SGD|JPY|CNY|BRL|ZAR|TRY|EGP|KWD|QAR)/gi, "").trim();
    if (!isNaN(Number(s))) {
      return `${sym} ${s}`.replace(/\s+/g, " ").trim();
    }
    return s.startsWith(sym) ? s : `${sym} ${s}`;
  };
  const [isOpen, setIsOpen] = useState(true);

  const [textInput, setTextInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => {
    setMsgs([{ id: "1", from: "bot", text: welcome || "Hi! How can I help?", time: new Date() }]);
  }, [welcome]);

  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [msgs, typing, isOpen]);

  const handleSend = (overrideText?: string | React.MouseEvent) => {
    const isEvent = overrideText && typeof overrideText === 'object' && 'preventDefault' in overrideText;
    const t = typeof overrideText === "string" ? overrideText.trim() : textInput.trim();
    if (!t) return;
    const userMsg: Msg = { id: crypto.randomUUID(), from: "user", text: t, time: new Date() };
    setMsgs((m) => [...m, userMsg]);
    if (!isEvent && typeof overrideText !== "string") setTextInput("");
    if (typeof overrideText === "string") setTextInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: crypto.randomUUID(), from: "bot", text: cannedReplies(t), time: new Date() }]);
    }, 900 + Math.random() * 700);
  };

  const dark = preview === "dark";
  const bg = dark ? "#0f172a" : "#ffffff";
  const surface = dark ? "#1e293b" : "#f8fafc";
  const text = dark ? "#e2e8f0" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";

  const isCustom = template === "Custom";
  const isNeon = template === "Neon AI Interface";
  const isGlass = template === "Modern Glass UI";
  const isMinimal = template === "Minimal AI Assistant";
  const isSupport = template === "Floating Support Widget";
  const isMessenger = template === "Rounded Messenger Style";

  const actualRadius = isCustom ? radius : isMessenger ? 24 : isMinimal ? 4 : radius;
  const actualBubble = isCustom ? bubble : isMessenger ? "soft" : isMinimal ? "square" : bubble;

  const headerBg = (isMinimal || isCustom) && headerStyle === "gradient"
    ? surface
    : headerStyle === "solid"
    ? primary
    : headerStyle === "glass"
    ? `linear-gradient(135deg, ${primary}aa, ${secondary}aa)`
    : `linear-gradient(135deg, ${primary}, ${secondary})`;

  const headerText = (isMinimal || isCustom) && headerStyle === "gradient" ? text : "#fff";

  const userBubbleBg = (isMinimal || isCustom) && headerStyle === "gradient"
    ? (dark ? "#334155" : "#e2e8f0")
    : isGlass || isNeon
    ? `linear-gradient(135deg, ${primary}, ${secondary})`
    : primary;

  const userBubbleText = (isMinimal || isCustom) && headerStyle === "gradient" ? text : "#fff";

  const botBubbleBg = botBubbleColor || (dark ? "#1e293b" : "#f1f5f9");
  const botTextCol = botTextColor || text;

  const wrapperBorder = isNeon && !isCustom
    ? `1px solid ${primary}55`
    : (isMinimal || isCustom)
    ? `1px solid ${dark ? "#334155" : "#e2e8f0"}`
    : `1px solid ${dark ? "#1f2937" : "#e5e7eb"}`;

  const wrapperBoxShadow = isNeon && !isCustom
    ? `0 0 40px ${primary}55, 0 20px 60px -20px ${primary}55`
    : isSupport && !isCustom
    ? "0 25px 50px -12px rgba(0,0,0,0.25)"
    : (isMinimal || isCustom)
    ? "none"
    : "0 10px 40px -10px rgba(0,0,0,0.1)";

  const wrapperBg = isGlass && !isCustom
    ? `linear-gradient(135deg, ${primary}22, ${secondary}22), ${bg}`
    : bg;

  const sendBtnBg = (isMinimal || (isCustom && headerStyle === "gradient"))
    ? text
    : isGlass || isNeon
    ? `linear-gradient(135deg, ${primary}, ${secondary})`
    : primary;

  const sendBtnText = (isMinimal || (isCustom && headerStyle === "gradient")) ? bg : "#fff";

  const panelVariants = {
    hidden: isMinimal
      ? { opacity: 0, y: 10 }
      : isSupport
      ? { opacity: 0, y: 20, scale: 0.95 }
      : isMessenger
      ? { opacity: 0, scale: 0.8, originX: 1, originY: 1 }
      : { opacity: 0, y: 20, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: isMinimal
      ? { opacity: 0, y: 10 }
      : { opacity: 0, y: 20, scale: 0.96 }
  };

  const transition = isMinimal
    ? { duration: 0.2 }
    : isMessenger
    ? { type: "spring" as const, stiffness: 400, damping: 25 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  const renderMessageText = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;

    const parseInlineStyles = (rawText: string, key: string) => {
      const boldPattern = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldPattern.exec(rawText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(rawText.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`${key}-bold-${match.index}`} className="font-bold">{match[1]}</strong>);
        lastIndex = boldPattern.lastIndex;
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      const productMatch = trimmedLine.match(/^-\s*PRODUCT:\s*(.*)$/i);
      const optionMatch = trimmedLine.match(/^-\s*OPTION:\s*(.*)$/i);
      const bulletMatch = trimmedLine.match(/^[\*\-]\s+(.*)$/);
      const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);

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
                      {formatPrice(p.price)}
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
        flushList(`flush-${i}`);
        elements.push(
          <button
            key={`opt-btn-${i}`}
            onClick={(e) => { e.preventDefault(); handleSend(optionMatch[1]); }}
            className="block w-fit px-3 py-2 my-1.5 text-[13px] font-semibold border rounded-lg transition-all hover:bg-opacity-10 cursor-pointer shadow-sm hover:shadow-md"
            style={{
              borderColor: primary,
              color: dark ? "#e2e8f0" : primary,
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
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
          elements.push(
            <p key={`p-${i}`} className="mb-1 last:mb-0 leading-relaxed">
              {parseInlineStyles(line, `line-${i}`)}
            </p>
          );
        } else if (line === "") {
          elements.push(<div key={`div-${i}`} className="h-1.5" />);
        }
      }
    }

    flushList("final");
    return elements;
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-sm h-[450px] flex flex-col justify-end overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-4", className)}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            className="absolute bottom-20 right-4 w-[calc(100%-2rem)] max-w-[320px] h-[270px] flex flex-col overflow-hidden origin-bottom-right"
            style={{
              borderRadius: actualRadius + 8,
              background: wrapperBg,
              border: wrapperBorder,
              boxShadow: wrapperBoxShadow,
            }}
          >
            {/* Header */}
            <div
              className={cn("flex items-center gap-3 px-4 py-3 shrink-0", isMinimal && "border-b")}
              style={{
                background: headerBg,
                color: headerText,
                borderColor: dark ? "#334155" : "#e2e8f0",
              }}
            >
              <div className={cn("grid h-9 w-9 place-items-center overflow-hidden shrink-0", isMinimal ? "rounded-md bg-muted" : "rounded-xl bg-white/20 backdrop-blur")} style={{ background: isMinimal ? (dark ? "#334155" : "#e2e8f0") : undefined }}>
                {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold leading-tight">{name || "Chatbot"}</div>
                <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isMinimal ? "bg-green-500" : "bg-emerald-400")} /> {headerSubtitle}
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10 shrink-0">
                <Minus className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 space-y-3 px-4 py-4 overflow-y-auto scrollbar-thin" style={{ background: bg }}>
              {msgs.map((m) => (
                <div key={m.id} className={cn("flex gap-2", m.from === "user" ? "justify-end" : "justify-start")}>
                  {m.from === "bot" && showAvatar && (
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <Bot className="h-3.5 w-3.5 text-white" />}
                    </div>
                  )}
                  <div className={cn("flex flex-col", m.from === "user" ? "items-end" : "items-start", showAvatar && m.from === "bot" ? "max-w-[75%]" : "max-w-[85%]")}>
                    <div
                      className={cn("px-3.5 py-2.5 shadow-sm whitespace-pre-wrap break-words", bubbleRadius[actualBubble], messageFontSize === "sm" ? "text-[12px]" : messageFontSize === "lg" ? "text-[15px]" : "text-[13px]", textStyle === "bold" ? "font-bold" : textStyle === "italic" ? "italic" : textStyle === "romantic" ? "font-['cursive'] tracking-wider" : textStyle === "playful" ? "font-['Comic_Sans_MS',cursive] tracking-wide" : textStyle === "elegant" ? "font-['Georgia',serif] tracking-wider" : "")}
                      style={{
                        background: m.from === "user" ? userBubbleBg : botBubbleBg,
                        color: m.from === "user" ? userBubbleText : botTextCol,
                        borderRadius: actualBubble === "square" ? 6 : actualRadius,
                      }}
                    >
                      {renderMessageText(m.text)}
                    </div>
                    {m.from === "bot" && msgs.length === 1 && (
                      [...new Set([...(extractedServices || []), ...(trainingSheetServices || [])].map((s: string) => s?.trim()).filter(Boolean))].length > 0
                    ) && (
                      <div className="flex flex-col gap-2 mt-2 max-w-[200px]">
                        {[...new Set([...(extractedServices || []), ...(trainingSheetServices || [])].map((s: string) => s?.trim()).filter(Boolean))].map((service: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleSend(service)}
                            className="px-3 py-2 text-xs font-semibold text-left border rounded-lg transition-all"
                            style={{
                              borderColor: primary,
                              color: dark ? "#e2e8f0" : primary,
                              background: "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = `${primary}15`)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 px-3.5 py-3 shadow-sm w-fit" style={{ background: surface, borderRadius: actualBubble === "square" ? 6 : actualRadius }}>
                    <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: muted }} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                    <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: muted }} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} />
                    <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: muted }} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 border-t px-3 py-2.5 shrink-0" style={{ borderColor: dark ? "#1f2937" : "#e5e7eb", background: bg }}>
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className={cn("flex-1 px-3 py-2 text-[13px] outline-none", inputStyle === "pill" ? "rounded-full" : inputStyle === "minimal" ? "rounded-none border-b-2" : actualBubble === "square" ? "rounded-md" : "rounded-xl")}
                style={{ background: surface, color: text, borderBottomColor: inputStyle === "minimal" ? primary : undefined }}
              />
              <button
                onClick={handleSend}
                disabled={!textInput.trim()}
                className={cn("grid h-9 w-9 place-items-center shrink-0 disabled:opacity-50 transition-opacity", inputStyle === "pill" ? "rounded-full" : actualBubble === "square" ? "rounded-md" : "rounded-xl")}
                style={{ background: sendBtnBg, color: sendBtnText }}
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
                                onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))}
                                className="absolute left-2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background transition"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveImgIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))}
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
                                onClick={() => setActiveImgIndex(idx)}
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
                        {formatPrice(selectedProduct.price)}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-4 right-4 z-10 grid h-12 w-12 place-items-center overflow-hidden"
        style={{
          background: sendBtnBg,
          color: sendBtnText,
          borderRadius: actualBubble === "square" ? 8 : 9999,
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        {isOpen
          ? <X className="h-[22px] w-[22px]" />
          : logo
            ? <img src={logo} alt="Bot Icon" className="h-full w-full object-cover" />
            : <MessageCircle className="h-[22px] w-[22px]" />}
      </motion.button>
    </div>
  );
}
