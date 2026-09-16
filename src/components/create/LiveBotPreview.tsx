import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  MessageCircle,
  X,
  Minus,
  ShoppingCart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
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
  widgetLauncher?: "icon" | "button";
  widgetLauncherText?: string;
  widgetLauncherStyle?: "rounded" | "square" | "soft" | "pill";
  widgetPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetOpenMode?: "overlay" | "sidebar" | "fullscreen" | "newtab";
  widgetWidth?: number;
  widgetHeight?: number;
  trainingFlow?: string;
  orderSystemEnabled?: boolean;
  /** True when the bot has a connected product database — the preview then simulates a
   * live catalog. When false, browse/product steps run the flow without any demo products. */
  catalogConnected?: boolean;
  /** Auto-play a scripted demo journey (dummy data). Bump demoSeed to replay. */
  autoDemo?: boolean;
  demoScript?: string[];
  demoSeed?: number;
}

const bubbleRadius: Record<string, string> = {
  rounded: "rounded-2xl",
  square: "rounded-md",
  soft: "rounded-3xl",
};

interface Msg {
  id: string;
  from: "user" | "bot";
  text: string;
  time: Date;
}

interface PreviewField {
  name?: string;
  label?: string;
  type?: string;
  options?: string[];
  required?: boolean;
  fetchProducts?: boolean;
  allowSkip?: boolean;
  allowOther?: boolean;
  optionRoutes?: Record<string, string>;
}

interface PreviewStep {
  id?: string;
  title?: string;
  type?: "selection" | "form" | "confirmation";
  fields?: PreviewField[];
  forOption?: string;
  condition?: {
    field?: string;
    operator?: string;
    value?: string;
  };
  nextStepId?: string;
  allowOther?: boolean;
}

const cannedReplies = (input: string): string => {
  const q = input.toLowerCase();
  if (q.includes("price") || q.includes("plan"))
    return "We offer Starter (free), Pro ($29/mo) and Enterprise (custom). Want me to recommend one?";
  if (q.includes("install") || q.includes("script"))
    return "Head to Generated Scripts, copy your widget snippet, and paste it before </body>. Done in 30 seconds!";
  if (q.includes("template"))
    return "We have 5 ready-made templates including Modern Glass UI and Neon AI. Pick one in Create Chatbot → Templates.";
  if (q.includes("hello") || q.includes("hi") || q.includes("hey"))
    return "Hi there 👋 What can I help you build today?";
  if (q.includes("thanks") || q.includes("thank"))
    return "Anytime! Let me know if you need anything else.";
  return "Got it. Tell me a bit more and I'll point you in the right direction.";
};

export function LiveBotPreview(props: BotPreviewProps) {
  const {
    name,
    welcome,
    primary,
    secondary,
    radius,
    bubble,
    logo,
    preview = "light",
    template = "Modern Glass UI",
    className,
    extractedServices,
    trainingSheetServices,
    headerStyle = "gradient",
    botBubbleColor,
    botTextColor,
    showAvatar = true,
    messageFontSize = "md",
    inputStyle = "rounded",
    headerSubtitle = "Online",
    textStyle = "default",
    currency,
    currencySymbol,
    widgetLauncher = "icon",
    widgetLauncherText = "Chat with us",
    widgetLauncherStyle = "rounded",
    widgetPosition = "bottom-right",
    widgetOpenMode = "overlay",
    widgetWidth = 400,
    widgetHeight = 540,
    trainingFlow,
    autoDemo = false,
    demoScript,
    demoSeed = 0,
    catalogConnected = true,
  } = props;

  const sym = currencySymbol || (currency ? currency.match(/\(([^)]+)\)/)?.[1] || currency : "$");

  const formatPrice = (raw: any) => {
    if (raw === null || raw === undefined || raw === "") return "N/A";
    let s = String(raw).trim();
    s = s
      .replace(
        /^[\$\€\£\₹\¥\₺\₽\৳\₱\₦\฿]|^(USD|PKR|EUR|GBP|INR|AED|SAR|CAD|AUD|SGD|JPY|CNY|BRL|ZAR|TRY|EGP|KWD|QAR)/gi,
        "",
      )
      .trim();
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

  // ── Training Flow Interactive Simulation State ──────────────────────────
  const [activeFlowCat, setActiveFlowCat] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [collected, setCollected] = useState<Record<string, any>>({});

  // Refs mirror the flow state so auto-play (setTimeout closures) never reads
  // stale values — interactive buttons and the demo script share one state.
  const activeFlowCatRef = useRef<string | null>(null);
  const stepIdxRef = useRef<number>(0);
  const collectedRef = useRef<Record<string, any>>({});

  useEffect(() => {
    activeFlowCatRef.current = activeFlowCat;
  }, [activeFlowCat]);
  useEffect(() => {
    stepIdxRef.current = stepIdx;
  }, [stepIdx]);
  useEffect(() => {
    collectedRef.current = collected;
  }, [collected]);

  const applyFlowState = (
    cat: string | null | undefined,
    idx?: number,
    coll?: Record<string, any>,
  ) => {
    if (cat !== undefined) activeFlowCatRef.current = cat;
    if (idx !== undefined) stepIdxRef.current = idx;
    if (coll !== undefined) collectedRef.current = coll;
    setActiveFlowCat(activeFlowCatRef.current);
    setStepIdx(stepIdxRef.current);
    setCollected({ ...collectedRef.current });
  };

  const parsedFlow = (() => {
    if (!trainingFlow) return null;
    try {
      return JSON.parse(trainingFlow);
    } catch {
      return null;
    }
  })();

  const resetChatFlow = () => {
    setActiveFlowCat(null);
    setStepIdx(0);
    setCollected({});
    applyFlowState(null, 0, {});
    let initialText = welcome || "Hello! What would you like to order or book today?";
    if (parsedFlow) {
      const isMulti =
        !parsedFlow.steps && typeof parsedFlow === "object" && Object.keys(parsedFlow).length > 0;
      if (isMulti) {
        const cats = Object.keys(parsedFlow);
        initialText +=
          "\n\n**Select a service or category to begin:**\n" +
          cats.map((c) => `- OPTION: ${c}`).join("\n");
      } else if (parsedFlow.steps && parsedFlow.steps.length > 0) {
        const s1 = parsedFlow.steps[0];
        if (s1.type === "selection" || s1.type === "form") {
          const allOpts: string[] = [];
          let allowOther = !!s1.allowOther;
          for (const f of s1.fields || []) {
            if (f.allowOther) allowOther = true;
            for (const o of f.options || []) {
              if (o && typeof o === "string" && o.trim() && !allOpts.includes(o.trim())) {
                allOpts.push(o.trim());
              }
            }
          }
          if ((s1 as any).options && Array.isArray((s1 as any).options)) {
            for (const o of (s1 as any).options) {
              if (o && typeof o === "string" && o.trim() && !allOpts.includes(o.trim())) {
                allOpts.push(o.trim());
              }
            }
          }
          initialText += `\n\n**${s1.title || (s1.type === "selection" ? "Choose Option" : "Fill Details")}**\n`;
          if (s1.type === "selection") {
            if (allOpts.length > 0) {
              initialText += allOpts.map((o) => `- OPTION: ${o}`).join("\n");
            }
            if (allowOther && !allOpts.some((o) => /^other\b/i.test(o))) {
              initialText += `\n- OPTION: Other (Please specify)`;
            }
          } else if (s1.type === "form") {
            const missingFields = (s1.fields || []).filter((f: any) => f.name);
            if (missingFields.length > 0) {
              initialText += `Please provide the following details:\n`;
              for (const f of missingFields) {
                initialText += `- ${f.label || f.name} (${f.type || "text"})\n`;
              }
            }
          }
        }
      }
    }
    setMsgs([{ id: "1", from: "bot", text: initialText, time: new Date() }]);
  };

  useEffect(() => {
    resetChatFlow();
  }, [welcome, trainingFlow]);

  // ── Auto-play scripted demo (dummy data) ───────────────────────────────
  useEffect(() => {
    if (!autoDemo || !demoScript || demoScript.length === 0) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    resetChatFlow();

    const run = (i: number) => {
      if (cancelled || i >= demoScript.length) return;
      const text = demoScript[i];
      later(() => {
        if (cancelled) return;
        setMsgs((m) => [
          ...m,
          { id: crypto.randomUUID(), from: "user" as const, text, time: new Date() },
        ]);
        setTyping(true);
        later(() => {
          if (cancelled) return;
          const reply = simulateFlowResponse(text);
          setTyping(false);
          setMsgs((m) => [
            ...m,
            { id: crypto.randomUUID(), from: "bot" as const, text: reply, time: new Date() },
          ]);
          later(() => run(i + 1), 650);
        }, 850);
      }, 400);
    };
    run(0);

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDemo, demoSeed]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [msgs, typing, isOpen]);

  const dummyProductsFor = (cat: string) => [
    {
      name: `${cat} Pro Edition`,
      price: `${sym} 49`,
      category: cat,
      description: "Premium high-durability unit",
    },
    {
      name: `${cat} Plus Series`,
      price: `${sym} 89`,
      category: cat,
      description: "Flagship certified edition",
    },
  ];

  // Path B for the demo: a bare product name (no category picked) resolves
  // against the dummy catalog, pre-fills the product and jumps to quantity.
  const resolveDirectProduct = (
    text: string,
  ): { name: string; price: string; category: string } | null => {
    if (!catalogConnected) return null;
    if (!parsedFlow || parsedFlow.steps) return null;
    const cats = Object.keys(parsedFlow);
    for (const cat of cats) {
      const found = dummyProductsFor(cat).find((p) => {
        const n = text.toLowerCase();
        return n === p.name.toLowerCase() || n.includes(p.name.toLowerCase());
      });
      if (found) {
        return { name: found.name, price: "49", category: cat };
      }
    }
    return null;
  };

  const stepMatchesCond = (step: PreviewStep | undefined, collected: Record<string, unknown>): boolean => {
    if (!step) return false;
    const cond = step.condition;
    const forOpt = step.forOption || (step as any).parentOption;

    if (cond && typeof cond === "object") {
      const fieldName = cond.field;
      const condVal = cond.value;
      if (fieldName && condVal) {
        const actual = String(collected[fieldName] || "").toLowerCase().trim();
        const target = String(condVal).toLowerCase().trim();
        if (actual !== target && !actual.includes(target)) return false;
      } else if (condVal) {
        const target = String(condVal).toLowerCase().trim();
        const anyMatch = Object.values(collected).some((v) => {
          const s = String(v).toLowerCase().trim();
          return s === target || s.includes(target);
        });
        if (!anyMatch) return false;
      }
    }

    if (forOpt && typeof forOpt === "string" && forOpt.trim() && forOpt.toLowerCase() !== "all") {
      const target = forOpt.toLowerCase().trim();
      const anyMatch = Object.values(collected).some((v) => {
        const s = String(v).toLowerCase().trim();
        return s === target || s.includes(target);
      });
      if (!anyMatch) return false;
    } else if (Array.isArray(forOpt) && forOpt.length > 0) {
      const anyMatchArray = forOpt.some((optTarget) => {
        const target = String(optTarget).toLowerCase().trim();
        return Object.values(collected).some((v) => {
          const s = String(v).toLowerCase().trim();
          return s === target || s.includes(target);
        });
      });
      if (!anyMatchArray) return false;
    }

    return true;
  };

  const findNextStepIdx = (
    steps: PreviewStep[],
    fromIdx: number,
    collected: Record<string, unknown>,
    targetId?: string,
  ): number => {
    if (!steps?.length) return 0;
    if (targetId) {
      const directIdx = steps.findIndex((s) => s.id === targetId);
      if (directIdx !== -1) {
        if (stepMatchesCond(steps[directIdx], collected)) return directIdx;
        return findNextStepIdx(steps, directIdx + 1, collected);
      }
    }
    for (let i = fromIdx; i < steps.length; i++) {
      if (stepMatchesCond(steps[i], collected)) return i;
    }
    return steps.length;
  };

  const stepPrompt = (
    step: PreviewStep,
    category: string | null,
    collected: Record<string, unknown>,
  ): string => {
    if (step.type === "selection") {
      let reply = `**${step.title}**\n\n`;
      const allOpts: string[] = [];
      let hasFetchProducts = false;
      let isPayment = /payment|pay/i.test(step.title || "");
      let allowOther = !!step.allowOther;

      for (const field of step.fields || []) {
        if (field.options && field.options.length > 0) {
          for (const o of field.options) {
            if (o && typeof o === "string" && o.trim() && !allOpts.includes(o.trim())) {
              allOpts.push(o.trim());
            }
          }
        }
        if (field.fetchProducts) hasFetchProducts = true;
        if (field.allowOther) allowOther = true;
        if (field.name === "paymentMethod" || field.allowSkip) isPayment = true;
      }

      if (hasFetchProducts) {
        const cat = String(category || collected.service || "Item");
        if (!catalogConnected) {
          reply += `⚠️ **Catalog not connected.**\n\nConnect a product database in the **Orders & Storage** step — live products from **${cat}** will appear here and the flow will run end-to-end.\n\n`;
        } else {
          reply += `Available items in **${cat}**:\n`;
          for (const p of dummyProductsFor(cat)) {
            reply += `- PRODUCT: ${JSON.stringify(p)}\n`;
          }
          reply += `\nTap a product to see details (image, price) or tap **Order Now** straight away:\n`;
        }
      }

      if (allOpts.length > 0) {
        reply += allOpts.map((o: string) => `- OPTION: ${o}`).join("\n");
      }
      if (isPayment) {
        reply += `\n- OPTION: Skip Payment (Pay Later)`;
      }
      if (allowOther && !allOpts.some((o: string) => /^other\b/i.test(o))) {
        reply += `\n- OPTION: Other (Please specify)`;
      }
      return reply;
    }

    if (step.type === "form") {
      let reply = `**${step.title}**\n\n`;
      const missingFields = (step.fields || []).filter((f) => !collected[f.name || ""]);
      if (collected.product && missingFields.some((f) => f.name === "quantity")) {
        const priceVal = collected.price ? ` (${sym} ${collected.price})` : "";
        reply += `Selected Product: **${collected.product}**${priceVal}\n\nPlease enter the **Quantity** you want to order:`;
      } else if (missingFields.length > 0) {
        reply += `Please provide the following details:\n`;
        for (const f of missingFields) {
          reply += `- ${f.label} (${f.type})\n`;
        }
      }
      return reply;
    }

    if (step.type === "confirmation") {
      const isBooking = !!(
        collected.bookingDate ||
        collected.date ||
        collected.slot ||
        collected.time ||
        (collected.service && !collected.product) ||
        collected.restaurant ||
        collected.hotel ||
        collected.session
      );
      let reply = `**${step.title || (isBooking ? "Booking Confirmation" : "Order Confirmation")}**\n\n`;
      reply += isBooking ? `Here is your booking summary:\n` : `Here is your order summary:\n`;
      if (category || collected.service)
        reply += `- **Category/Service**: ${category || collected.service}\n`;
      if (collected.product) reply += `- **Product**: ${collected.product}\n`;
      if (collected.bookingDate) reply += `- **Date**: ${collected.bookingDate}\n`;
      if (collected.time) reply += `- **Time Slot**: ${collected.time}\n`;
      if (collected.quantity) reply += `- **Quantity**: ${collected.quantity}\n`;
      if (collected.fullName) reply += `- **Name**: ${collected.fullName}\n`;
      if (collected.phone) reply += `- **Phone**: ${collected.phone}\n`;
      if (collected.paymentMethod) reply += `- **Payment**: ${collected.paymentMethod}\n`;
      if (collected.cardNumber) reply += `- **Card**: ${maskCard(String(collected.cardNumber))}\n`;
      reply += `\nClick **Confirm** below or type **yes** to finalize.`;
      reply += `\n- OPTION: Confirm`;
      return reply;
    }

    return "Please continue with the next step.";
  };

  const maskCard = (num: string) => {
    const digits = num.replace(/\D/g, "");
    return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : num;
  };

  const cardPrompt = (stage: number, payment: string) => {
    if (stage === 0)
      return `💳 **Online Payment**\n\nYou selected **${payment}**. Complete your payment securely in chat:\n\nPlease enter your **Card Number** (16 digits):`;
    if (stage === 1) return `👍 Card accepted. Now enter the **Expiry Date** (MM/YY):`;
    return `Last step — enter the **CVV** (3 digits):`;
  };

  const simulateFlowResponse = (userText: string): string => {
    if (!parsedFlow) return cannedReplies(userText);
    const trimmed = userText.trim();
    const isMulti =
      !parsedFlow.steps && typeof parsedFlow === "object" && Object.keys(parsedFlow).length > 0;
    const isOrderAck =
      /^(yes|no|ok|okay|done|cancel|confirm)\b/i.test(trimmed) ||
      /^\d[\d\s\-()]{7,}$/.test(trimmed);

    // Resolve active steps array (read from refs = always fresh)
    let currentCategory = activeFlowCatRef.current;
    if (isMulti && !currentCategory) {
      const cats = Object.keys(parsedFlow);
      const matched = cats.find(
        (c) =>
          c.toLowerCase() === trimmed.toLowerCase() ||
          trimmed.toLowerCase().includes(c.toLowerCase()),
      );
      if (matched) {
        // Path A — a category was tapped. Show that category's product list
        // WITHOUT advancing: the browse step stays until a product is picked.
        currentCategory = matched;
        applyFlowState(matched);
        const catSteps: PreviewStep[] = parsedFlow[matched]?.steps || [];
        const browse = catSteps[0];
        if (browse) {
          return stepPrompt(browse, matched, collectedRef.current);
        }
      } else if (!isOrderAck) {
        // Path B — typed a product name directly: resolve from the catalog,
        // prefill it, and jump straight to quantity (browse is skipped).
        const direct = resolveDirectProduct(trimmed);
        if (direct) {
          currentCategory = direct.category;
          const catSteps: PreviewStep[] = parsedFlow[direct.category]?.steps || [];
          const quantityIdx = catSteps.findIndex(
            (s) => s.type === "form" && s.fields?.some((f) => f.name === "quantity"),
          );
          const jumpIdx = quantityIdx >= 0 ? quantityIdx : 1;
          const browseField = catSteps[0]?.fields?.[0]?.name || "productChoice";
          const coll = {
            ...collectedRef.current,
            [browseField]: direct.name,
            product: direct.name,
            price: direct.price,
            service: direct.category,
          };
          applyFlowState(direct.category, jumpIdx, coll);
          const next = catSteps[jumpIdx];
          if (next) return stepPrompt(next, direct.category, coll);
        }
        return (
          `**Please select one of the following options:**\n\n` +
          cats.map((c) => `- OPTION: ${c}`).join("\n")
        );
      }
    }

    const activeSteps: PreviewStep[] =
      (isMulti && currentCategory ? parsedFlow[currentCategory]?.steps : parsedFlow.steps) || [];
    if (activeSteps.length === 0) return cannedReplies(userText);

    let curIdx = stepIdxRef.current;
    const currentStep = activeSteps[curIdx];
    const newCollected = { ...collectedRef.current };

    // Pending product-card confirmation — mirror of engine Block D: a DB
    // product tap shows the full card and the flow waits for "Order Now".
    const pendingCard = newCollected.__pendingProductCard;
    if (pendingCard && typeof pendingCard === "object") {
      const pc = pendingCard as { name?: unknown; price?: unknown };
      const cardName = String(pc.name ?? "");
      if (!cardName) {
        delete newCollected.__pendingProductCard;
        applyFlowState(currentCategory, curIdx, newCollected);
      } else {
        const isConfirm =
          /^(order now|confirm(ed)?|yes|yeah|yep|yup|ok(?:ay)?|done|sahi)\b/i.test(trimmed) ||
          /^i\s+(?:would\s+like\s+to\s+)?order(?:\s*:)?\s*(.+)/i.test(trimmed) ||
          trimmed.toLowerCase().includes(cardName.toLowerCase());
        if (isConfirm) {
          newCollected.product = cardName;
          newCollected.price = newCollected.price || String(pc.price ?? "");
          delete newCollected.__pendingProductCard;
          curIdx++;
          applyFlowState(currentCategory, curIdx, newCollected);
          const next = activeSteps[curIdx];
          return next ? stepPrompt(next, currentCategory, newCollected) : "Order confirmed!";
        }
        // Not a confirmation → treat as a changed choice (mirror of engine section A).
        delete newCollected.__pendingProductCard;
        applyFlowState(currentCategory, curIdx, newCollected);
      }
    }

    // Check for cancel
    if (/^cancel$/i.test(trimmed)) {
      resetChatFlow();
      return "Your request has been cancelled. Let me know if you need anything else! 😊";
    }

    // Demo-only: capture card details in-chat after Pay Online is selected
    const onlineStep = newCollected.__onlineCard;
    if (typeof onlineStep === "number" && onlineStep <= 2) {
      const payment = String(newCollected.paymentMethod || "Pay Online");
      if (onlineStep === 0) {
        newCollected.cardNumber = trimmed;
        const cardVerification =
          /^card\s*(?:accepted|verified|ok)$/i.test(trimmed) || /^\d[\d\s-]{12,}$/.test(trimmed);
        newCollected.__onlineCard = cardVerification ? 1 : 0;
        applyFlowState(undefined, curIdx, newCollected);
        return cardPrompt(cardVerification ? 1 : 0, payment);
      }
      if (onlineStep === 1) {
        newCollected.cardExpiry = trimmed;
        newCollected.__onlineCard =
          /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(trimmed) || /^\d{4}$/.test(trimmed) ? 2 : 1;
        applyFlowState(undefined, curIdx, newCollected);
        return cardPrompt(newCollected.__onlineCard, payment);
      }
      newCollected.cardCvc = trimmed;
      delete newCollected.__onlineCard;
      curIdx = findNextStepIdx(activeSteps, curIdx + 1, newCollected);
      applyFlowState(undefined, curIdx, newCollected);
      const confirmStep = activeSteps[curIdx];
      if (confirmStep) return stepPrompt(confirmStep, currentCategory, newCollected);
      return "Thank you! All steps have been completed.";
    }

    // Awaiting custom "Other" typed input
    if (newCollected.__awaitingOther) {
      const targetF = String(newCollected.__awaitingOther);
      delete newCollected.__awaitingOther;
      newCollected[targetF] = trimmed;
      curIdx = findNextStepIdx(activeSteps, curIdx + 1, newCollected);
      applyFlowState(currentCategory, curIdx, newCollected);
      const next = activeSteps[curIdx];
      return next ? stepPrompt(next, currentCategory, newCollected) : "Thank you! All steps have been completed.";
    }

    // Check for payment skip
    const isPaymentStep =
      currentStep &&
      (/payment|pay/i.test(currentStep.title || "") ||
        currentStep.fields?.some((f) => f.name === "paymentMethod" || f.allowSkip));
    const isSkipIntent =
      /^(skip|skip payment|pay later|cash later|later|none|na|n\/a|pay at appointment|at appointment)$/i.test(
        trimmed,
      );
    if (isPaymentStep && isSkipIntent) {
      newCollected.paymentMethod = "Pay Later / Skip Payment";
      curIdx = findNextStepIdx(activeSteps, curIdx + 1, newCollected);
      applyFlowState(undefined, curIdx, newCollected);
    } else if (currentStep) {
      // Step-specific handling
      if (currentStep.type === "selection") {
        const allStepOpts: string[] = [];
        for (const f of currentStep.fields || []) {
          for (const o of f.options || []) {
            if (o && typeof o === "string" && o.trim() && !allStepOpts.includes(o.trim())) {
              allStepOpts.push(o.trim());
            }
          }
        }

        const field =
          (currentStep.fields || []).find((f) => (f.options || []).length > 0) ||
          currentStep.fields?.[0] || { name: "selection" };
        const fieldName = field.name || "selection";

        const isAllowOther = !!(currentStep.allowOther || (currentStep.fields || []).some((f) => f.allowOther));
        const isOtherClick = /^(other|other \(please specify\)|other \(type custom\)|other \(specify\)|other \.\.\.)$/i.test(trimmed);
        if (isAllowOther && isOtherClick) {
          newCollected.__awaitingOther = fieldName;
          applyFlowState(currentCategory, curIdx, newCollected);
          return "Please specify your custom option below:";
        }

        const orderMatch = trimmed.match(/^i\s+(?:would\s+like\s+to\s+)?order(?:\s*:)?\s*(.+)/i);
        const value = orderMatch ? orderMatch[1].trim() : trimmed;

        // DB products step: tapping a real catalog record shows the full card
        if ((currentStep.fields || []).some((f) => f.fetchProducts)) {
          const hit = resolveDirectProduct(value);
          if (hit) {
            newCollected[fieldName] = value;
            newCollected.__pendingProductCard = {
              name: hit.name,
              price: hit.price,
              category: hit.category,
            };
            applyFlowState(currentCategory, curIdx, newCollected);
            return (
              `**${hit.name}** — ${sym} ${hit.price}` +
              (hit.category ? `\n🏷️ ${hit.category}` : "") +
              `\n\n- PRODUCT: ${JSON.stringify({
                name: hit.name,
                price: `${sym} ${hit.price}`,
                category: hit.category,
                image: "",
                images: [],
                description: `Premium ${hit.category} product from the connected catalog.`,
                attributes: { Category: hit.category, Stock: "In stock" },
              })}\n\nTap **Order Now** to place your order.`
            );
          }
        }

        const matched = allStepOpts.find((o) => o.toLowerCase() === value.toLowerCase()) || value;
        newCollected[fieldName] = matched;

        if (
          fieldName !== "service" &&
          (/service|category/i.test(currentStep.title || "") ||
            ["service", "category", "serviceType", "service_type"].includes(fieldName))
        ) {
          newCollected.service = matched;
        }
        if (/country/i.test(currentStep.title || "") || /country/i.test(fieldName)) {
          newCollected.country = matched;
        }

        // If DB products step
        if (field.fetchProducts) {
          newCollected.product = value;
          const hit = resolveDirectProduct(value);
          if (hit) newCollected.price = hit.price;
        }
        // Demo-only: Pay Online → collect card details in-chat before confirming
        if (
          fieldName === "paymentMethod" &&
          /online|card|stripe|paypal|paddle|debit|visa|master/i.test(value)
        ) {
          newCollected.__onlineCard = 0;
          applyFlowState(undefined, curIdx, newCollected);
          return cardPrompt(0, value);
        }

        let targetId = (currentStep as any).nextStepId;
        for (const f of currentStep.fields || []) {
          if ((f as any)?.optionRoutes?.[matched]) {
            targetId = (f as any).optionRoutes[matched];
            break;
          }
        }
        curIdx = findNextStepIdx(activeSteps, curIdx + 1, newCollected, targetId);
        applyFlowState(undefined, curIdx, newCollected);
      } else if (currentStep.type === "form") {
        // Numeric-field guard (mirror of engine Block H): the Quantity step
        // only continues on a real NUMBER; restating the same product (with or
        // without the order prefix) re-asks for the number, and typing a
        // different product re-shows its card — never a silent digit scrape.
        const preMissing = (currentStep.fields || []).filter((f) => !newCollected[f.name || ""]);
        const preNumField =
          preMissing[0] &&
          (preMissing[0].type === "number" ||
            /quantity|qty|\bprice\b|\badult\b|\bpax\b|\bseat\b|\bno\.? of\b/i.test(
              String(preMissing[0].name || "") + " " + String(preMissing[0].label || ""),
            ))
            ? preMissing[0]
            : undefined;
        if (preNumField) {
          const oRe = trimmed.match(
            /^i\s+(?:would\s+like\s+to\s+)?order(?:\s*:)?\s*(.+)/i,
          );
          const ref = oRe ? oRe[1].trim() : trimmed;
          if (!/^\d+(?:\.\d+)?$/.test(ref)) {
            const sameProduct =
              !!newCollected.product &&
              ref.toLowerCase() === String(newCollected.product).toLowerCase();
            if (!sameProduct) {
              const sw = resolveDirectProduct(ref);
              if (sw) {
                newCollected.product = sw.name;
                newCollected.price = String(sw.price);
                newCollected.__pendingProductCard = {
                  name: sw.name,
                  price: String(sw.price),
                  category: sw.category,
                };
                applyFlowState(currentCategory, curIdx, newCollected);
                return `**${sw.name}** — ${sym} ${sw.price}\n\nTap **Order Now** to place your order.`;
              }
            }
            return sameProduct
              ? `**${newCollected.product}** — theek hai ✅ Please type the **quantity** as a number (e.g. **1**, **2**).`
              : `⚠️ Quantity must be a **number** (e.g. **2**). Please type digits only.`;
          }
        }
        if (/^order:\s*(.+)/i.test(trimmed)) {
          const m = trimmed.match(/^order:\s*(.+)/i);
          newCollected.product = m ? m[1].trim() : trimmed;
        } else {
          // Fill the next missing field only (may be a multi-field form)
          const missing = (currentStep.fields || []).filter((f) => !newCollected[f.name || ""]);
          if (missing.length > 0 && missing[0].name) {
            newCollected[missing[0].name] = trimmed;
          }
        }
        const remaining = (currentStep.fields || []).filter((f) => !newCollected[f.name || ""]);
        if (remaining.length === 0) {
          curIdx = findNextStepIdx(activeSteps, curIdx + 1, newCollected);
        }
        applyFlowState(undefined, curIdx, newCollected);
      } else if (currentStep.type === "confirmation") {
        if (/^(confirm|yes|proceed|book now|order now|ok)$/i.test(trimmed)) {
          const isBooking = !!(
            newCollected.bookingDate ||
            newCollected.date ||
            newCollected.slot ||
            newCollected.time ||
            (newCollected.service && !newCollected.product) ||
            newCollected.restaurant ||
            newCollected.hotel ||
            newCollected.session
          );
          return `🎉 **${isBooking ? "Booking Confirmed!" : "Order Confirmed!"}**\n\nThank you! Your ${isBooking ? "booking" : "order"} has been placed successfully.\n\nSummary:\n- **${isBooking ? "Service" : "Product"}**: ${newCollected.product || newCollected.service || newCollected.restaurant || newCollected.hotel || newCollected.session || newCollected.show || currentCategory || "Standard"}\n${newCollected.slot ? `- **Slot**: ${newCollected.slot}\n` : ""}${newCollected.checkIn ? `- **Check-in**: ${newCollected.checkIn}\n` : ""}${newCollected.checkOut ? `- **Check-out**: ${newCollected.checkOut}\n` : ""}${newCollected.time ? `- **Time**: ${newCollected.time}\n` : ""}${newCollected.seat ? `- **Seat**: ${newCollected.seat}\n` : ""}${newCollected.quantity ? `- **Quantity**: ${newCollected.quantity}\n` : ""}${newCollected.fullName ? `- **Client**: ${newCollected.fullName}\n` : ""}${newCollected.phone ? `- **Phone**: ${newCollected.phone}\n` : ""}${newCollected.paymentMethod ? `- **Payment**: ${newCollected.paymentMethod}\n` : ""}- **Status**: Confirmed ✅\n\nWe will reach out to you shortly!`;
        }
      }
    }

    if (curIdx >= activeSteps.length) {
      return "Thank you! All steps have been completed.";
    }

    return stepPrompt(activeSteps[curIdx], currentCategory, newCollected);
  };

  const handleSend = (overrideText?: string | React.MouseEvent) => {
    const isEvent =
      overrideText && typeof overrideText === "object" && "preventDefault" in overrideText;
    const t = typeof overrideText === "string" ? overrideText.trim() : textInput.trim();
    if (!t) return;
    const userMsg: Msg = { id: crypto.randomUUID(), from: "user", text: t, time: new Date() };
    setMsgs((m) => [...m, userMsg]);
    if (!isEvent && typeof overrideText !== "string") setTextInput("");
    if (typeof overrideText === "string") setTextInput("");
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        const reply = simulateFlowResponse(t);
        setMsgs((m) => [
          ...m,
          { id: crypto.randomUUID(), from: "bot", text: reply, time: new Date() },
        ]);
      },
      500 + Math.random() * 300,
    );
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

  const headerBg =
    (isMinimal || isCustom) && headerStyle === "gradient"
      ? surface
      : headerStyle === "solid"
        ? primary
        : headerStyle === "glass"
          ? `linear-gradient(135deg, ${primary}aa, ${secondary}aa)`
          : `linear-gradient(135deg, ${primary}, ${secondary})`;

  const headerText = (isMinimal || isCustom) && headerStyle === "gradient" ? text : "#fff";

  const userBubbleBg =
    (isMinimal || isCustom) && headerStyle === "gradient"
      ? dark
        ? "#334155"
        : "#e2e8f0"
      : isGlass || isNeon
        ? `linear-gradient(135deg, ${primary}, ${secondary})`
        : primary;

  const userBubbleText = (isMinimal || isCustom) && headerStyle === "gradient" ? text : "#fff";

  const botBubbleBg = botBubbleColor || (dark ? "#1e293b" : "#f1f5f9");
  const botTextCol = botTextColor || text;

  const wrapperBorder =
    isNeon && !isCustom
      ? `1px solid ${primary}55`
      : isMinimal || isCustom
        ? `1px solid ${dark ? "#334155" : "#e2e8f0"}`
        : `1px solid ${dark ? "#1f2937" : "#e5e7eb"}`;

  const wrapperBoxShadow =
    isNeon && !isCustom
      ? `0 0 40px ${primary}55, 0 20px 60px -20px ${primary}55`
      : isSupport && !isCustom
        ? "0 25px 50px -12px rgba(0,0,0,0.25)"
        : isMinimal || isCustom
          ? "none"
          : "0 10px 40px -10px rgba(0,0,0,0.1)";

  const wrapperBg =
    isGlass && !isCustom ? `linear-gradient(135deg, ${primary}22, ${secondary}22), ${bg}` : bg;

  const sendBtnBg =
    isMinimal || (isCustom && headerStyle === "gradient")
      ? text
      : isGlass || isNeon
        ? `linear-gradient(135deg, ${primary}, ${secondary})`
        : primary;

  const sendBtnText = isMinimal || (isCustom && headerStyle === "gradient") ? bg : "#fff";

  const panelVariants = {
    hidden: isMinimal
      ? { opacity: 0, y: 10 }
      : isSupport
        ? { opacity: 0, y: 20, scale: 0.95 }
        : isMessenger
          ? { opacity: 0, scale: 0.8, originX: 1, originY: 1 }
          : { opacity: 0, y: 20, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: isMinimal ? { opacity: 0, y: 10 } : { opacity: 0, y: 20, scale: 0.96 },
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
        parts.push(
          <strong key={`${key}-bold-${match.index}`} className="font-bold">
            {match[1]}
          </strong>,
        );
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
            </ul>,
          );
        } else {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-1">
              {listItems}
            </ol>,
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
                onClick={(e) => {
                  e.preventDefault();
                  handleSend(String(p.name || "").trim());
                }}
                className="flex max-w-full items-center gap-1 rounded-full border border-primary/60 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm transition-all hover:bg-primary/10 active:scale-95"
              >
                <ShoppingCart className="h-3 w-3 shrink-0" />
                <span className="truncate">{p.name}</span>
                {p.price ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    {p.price}
                  </span>
                ) : null}
              </button>
            ))}
          </div>,
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
        try {
          p = JSON.parse(pickMatch[1]);
        } catch {}
        if (p && p.name) {
          pickItems.push(p);
        }
        continue;
      }

      if (productMatch) {
        flushList(`flush-${i}`);
        let p: any = null;
        try {
          p = JSON.parse(productMatch[1]);
        } catch {}
        if (p) {
          elements.push(
            <div
              key={`prod-card-${i}`}
              onClick={() => {
                setSelectedProduct(p);
                setActiveImgIndex(0);
              }}
              className="my-2 overflow-hidden rounded-xl border border-border/80 bg-card p-3 shadow-md transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-14 w-14 rounded-lg object-cover border shrink-0 bg-muted group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition">
                      {p.name}
                    </span>
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
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-tight">
                      {p.description}
                    </p>
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
            </div>,
          );
        }
      } else if (optionMatch) {
        flushList(`flush-${i}`);
        elements.push(
          <button
            key={`opt-btn-${i}`}
            onClick={(e) => {
              e.preventDefault();
              handleSend(optionMatch[1]);
            }}
            className="block w-fit px-3 py-2 my-1.5 text-[13px] font-semibold border rounded-lg transition-all hover:bg-opacity-10 cursor-pointer shadow-sm hover:shadow-md"
            style={{
              borderColor: primary,
              color: dark ? "#e2e8f0" : primary,
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
            }}
          >
            {optionMatch[1]}
          </button>,
        );
      } else if (bulletMatch) {
        if (listType !== "ul") {
          flushList(`flush-${i}`);
          listType = "ul";
        }
        listItems.push(
          <li key={`li-${i}`} className="mb-0.5 last:mb-0">
            {parseInlineStyles(bulletMatch[1], `line-${i}`)}
          </li>,
        );
      } else if (numberMatch) {
        if (listType !== "ol") {
          flushList(`flush-${i}`);
          listType = "ol";
        }
        listItems.push(
          <li key={`li-${i}`} className="mb-0.5 last:mb-0">
            {parseInlineStyles(numberMatch[2], `line-${i}`)}
          </li>,
        );
      } else {
        flushList(`flush-${i}`);
        if (trimmedLine) {
          elements.push(
            <p key={`p-${i}`} className="mb-1 last:mb-0 leading-relaxed">
              {parseInlineStyles(line, `line-${i}`)}
            </p>,
          );
        } else if (line === "") {
          elements.push(<div key={`div-${i}`} className="h-1.5" />);
        }
      }
    }

    flushList("final");
    flushPicks("final");
    return elements;
  };

  const isRight = widgetPosition.endsWith("-right");
  const isTop = widgetPosition.startsWith("top-");
  const cornerStyle = {
    ...(isTop ? { top: 16 } : { bottom: 16 }),
    ...(isRight ? { right: 16 } : { left: 16 }),
  } as const;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-sm h-[450px] flex flex-col justify-end overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-4",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            className="absolute w-[calc(100%-2rem)] max-w-[320px] h-[270px] flex flex-col overflow-hidden origin-bottom-right"
            style={{
              ...(widgetOpenMode === "sidebar"
                ? { top: 0, bottom: 0, right: 0, height: "100%", maxWidth: 280, borderRadius: 0 }
                : widgetOpenMode === "fullscreen"
                  ? {
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: "100%",
                      maxWidth: "none",
                      height: "100%",
                      borderRadius: 0,
                    }
                  : isTop
                    ? { top: 16, ...(isRight ? { right: 16 } : { left: 16 }) }
                    : { bottom: 16, ...(isRight ? { right: 16 } : { left: 16 }) }),
              borderRadius: widgetOpenMode === "overlay" ? actualRadius + 8 : 0,
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
              <div
                className={cn(
                  "grid h-12 w-12 place-items-center overflow-hidden shrink-0",
                  isMinimal ? "rounded-md bg-muted" : "rounded-xl bg-white/20 backdrop-blur",
                )}
                style={{ background: isMinimal ? (dark ? "#334155" : "#e2e8f0") : undefined }}
              >
                {logo ? (
                  <img src={logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Bot className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold leading-tight">
                  {name || "Chatbot"}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isMinimal ? "bg-green-500" : "bg-emerald-400",
                    )}
                  />{" "}
                  {headerSubtitle}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={resetChatFlow}
                  title="Restart Flow / Reset Chat"
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10 transition cursor-pointer opacity-80 hover:opacity-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10 shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 px-4 py-4 overflow-y-auto scrollbar-thin"
              style={{ background: bg }}
            >
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex gap-2", m.from === "user" ? "justify-end" : "justify-start")}
                >
                  {m.from === "bot" && showAvatar && (
                    <div
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                    >
                      {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex flex-col",
                      m.from === "user" ? "items-end" : "items-start",
                      showAvatar && m.from === "bot" ? "max-w-[75%]" : "max-w-[85%]",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3.5 py-2.5 shadow-sm whitespace-pre-wrap break-words",
                        bubbleRadius[actualBubble],
                        messageFontSize === "sm"
                          ? "text-[12px]"
                          : messageFontSize === "lg"
                            ? "text-[15px]"
                            : "text-[13px]",
                        textStyle === "bold"
                          ? "font-bold"
                          : textStyle === "italic"
                            ? "italic"
                            : textStyle === "romantic"
                              ? "font-['cursive'] tracking-wider"
                              : textStyle === "playful"
                                ? "font-['Comic_Sans_MS',cursive] tracking-wide"
                                : textStyle === "elegant"
                                  ? "font-['Georgia',serif] tracking-wider"
                                  : "",
                      )}
                      style={{
                        background: m.from === "user" ? userBubbleBg : botBubbleBg,
                        color: m.from === "user" ? userBubbleText : botTextCol,
                        borderRadius: actualBubble === "square" ? 6 : actualRadius,
                      }}
                    >
                      {renderMessageText(m.text)}
                    </div>
                    {m.from === "bot" &&
                      msgs.length === 1 &&
                      [
                        ...new Set(
                          [...(extractedServices || []), ...(trainingSheetServices || [])]
                            .map((s: string) => s?.trim())
                            .filter(Boolean),
                        ),
                      ].length > 0 && (
                        <div className="flex flex-col gap-2 mt-2 max-w-[200px]">
                          {[
                            ...new Set(
                              [...(extractedServices || []), ...(trainingSheetServices || [])]
                                .map((s: string) => s?.trim())
                                .filter(Boolean),
                            ),
                          ].map((service: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => handleSend(service)}
                              className="px-3 py-2 text-xs font-semibold text-left border rounded-lg transition-all"
                              style={{
                                borderColor: primary,
                                color: dark ? "#e2e8f0" : primary,
                                background: "transparent",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = `${primary}15`)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
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
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-3 shadow-sm w-fit"
                    style={{
                      background: surface,
                      borderRadius: actualBubble === "square" ? 6 : actualRadius,
                    }}
                  >
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: muted }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: muted }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
                    />
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: muted }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div
              className="flex items-center gap-2 border-t px-3 py-2.5 shrink-0"
              style={{ borderColor: dark ? "#1f2937" : "#e5e7eb", background: bg }}
            >
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className={cn(
                  "flex-1 px-3 py-2 text-[13px] outline-none",
                  inputStyle === "pill"
                    ? "rounded-full"
                    : inputStyle === "minimal"
                      ? "rounded-none border-b-2"
                      : actualBubble === "square"
                        ? "rounded-md"
                        : "rounded-xl",
                )}
                style={{
                  background: surface,
                  color: text,
                  borderBottomColor: inputStyle === "minimal" ? primary : undefined,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!textInput.trim()}
                className={cn(
                  "grid h-9 w-9 place-items-center shrink-0 disabled:opacity-50 transition-opacity",
                  inputStyle === "pill"
                    ? "rounded-full"
                    : actualBubble === "square"
                      ? "rounded-md"
                      : "rounded-xl",
                )}
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
                    const imageList =
                      Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
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
                                onClick={() =>
                                  setActiveImgIndex((prev) =>
                                    prev > 0 ? prev - 1 : imageList.length - 1,
                                  )
                                }
                                className="absolute left-2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background transition"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveImgIndex((prev) =>
                                    prev < imageList.length - 1 ? prev + 1 : 0,
                                  )
                                }
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
                                  activeImgIndex === idx
                                    ? "border-primary scale-105"
                                    : "border-transparent opacity-60 hover:opacity-100",
                                )}
                              >
                                <img
                                  src={imgUrl}
                                  alt="Thumb"
                                  className="h-full w-full object-cover"
                                />
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

                    {selectedProduct.attributes &&
                      typeof selectedProduct.attributes === "object" &&
                      Object.keys(selectedProduct.attributes).length > 0 && (
                        <div className="mt-2 rounded-xl border border-border/50 p-3">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Details
                          </p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {Object.entries(selectedProduct.attributes).map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-2 text-[11px]">
                                <span className="shrink-0 text-muted-foreground">{k}</span>
                                <span className="truncate text-right font-semibold text-foreground">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
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
        className="absolute z-10 grid place-items-center overflow-hidden"
        style={{
          ...cornerStyle,
          ...(widgetLauncher === "button"
            ? { padding: "6px 18px 6px 8px", gap: 8, gridAutoFlow: "column", width: "auto" }
            : { width: 48, height: 48 }),
          background: sendBtnBg,
          color: sendBtnText,
          borderRadius:
            widgetLauncher === "button"
              ? widgetLauncherStyle === "pill"
                ? 9999
                : widgetLauncherStyle === "square"
                  ? 10
                  : widgetLauncherStyle === "soft"
                    ? 18
                    : 12
              : actualBubble === "square"
                ? 8
                : 9999,
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        {isOpen ? (
          <X className="h-[22px] w-[22px]" />
        ) : widgetLauncher === "button" ? (
          <>
            {logo ? (
              <img src={logo} alt="Bot Icon" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
            <span className="text-xs font-semibold">{widgetLauncherText}</span>
          </>
        ) : logo ? (
          <img src={logo} alt="Bot Icon" className="h-full w-full object-cover" />
        ) : (
          <MessageCircle className="h-[22px] w-[22px]" />
        )}
      </motion.button>
    </div>
  );
}
