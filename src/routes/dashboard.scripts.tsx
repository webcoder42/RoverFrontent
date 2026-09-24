import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Sparkles,
  Copy,
  Eye,
  Code2,
  Loader2,
  Pencil,
  Trash2,
  Search,
  Check,
  Upload,
  ChevronRight,
  ChevronLeft,
  Filter,
  HardDrive,
  FileText,
  Database,
  ShoppingCart,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  EyeOff,
  Braces,
  ChevronUp,
  ChevronDown,
  X,
  Shield,
  MessageSquareText,
  Globe,
  Layers,
  ArrowUpCircle,
  BarChart3,
  KeyRound,
  Clock,
  ShoppingBag,
  Zap,
  Tag,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { GradientButton } from "@/components/common/GradientButton";
import { LiveBotPreview } from "@/components/create/LiveBotPreview";
import { StripeConnectCard } from "@/components/stripe/StripeConnectCard";
import { cn } from "@/lib/utils";
import { config, getWidgetScriptUrl } from "@/lib/config";
import { CURRENCY_LIST } from "@/lib/currency";
import { useChatbotsStore, type Chatbot, type Template } from "@/store/chatbots";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DetectedCatalogColumns } from "@/components/common/DetectedCatalogColumns";
import { guessMapping } from "@/lib/productMapping";
import { demoDataForFlow } from "@/lib/flowDemoData";
import {
  FlowDiagram,
  flowIconForSlug,
  stepIconFor,
  type FlowDef,
  type FlowLink,
} from "@/components/flow/FlowDiagram";
import { FlowBuilder } from "@/components/flow/FlowBuilder";

export const Route = createFileRoute("/dashboard/scripts")({
  head: () => ({ meta: [{ title: "Generated Scripts — Webotme" }] }),
  component: ScriptsPage,
});

interface TemplateInfo {
  slug: string;
  name: string;
  description: string;
  welcome: string;
  type: string;
  theme: Record<string, any>;
  ai: Record<string, any>;
  knowledge: {
    onlyKnowledge: boolean;
    answerAnyQuestion: boolean;
    files: Array<{ name: string; contentPreview: string }>;
    fileCount: number;
  };
}

interface DefaultFlowOption {
  slug: string;
  name: string;
  tagline?: string;
  icon?: string;
  tone?: string;
  flowKind?: string;
  stepsCount?: number;
  trainingFlow?: string;
  welcome?: string;
}

interface FlowStepMeta {
  id?: string;
  title?: string;
  type?: string;
  fields?: Array<{
    name?: string;
    label?: string;
    type?: string;
    options?: string[];
    required?: boolean;
    fetchProducts?: boolean;
    allowSkip?: boolean;
  }>;
}

const FALLBACK_FLOWS: DefaultFlowOption[] = [
  {
    slug: "ecommerce",
    name: "E-Commerce",
    tagline: "Shop, cart, checkout & payment",
    icon: "shopping-bag",
    tone: "from-rose-500 to-purple-600",
    flowKind: "multi-category",
    stepsCount: 8,
  },
  {
    slug: "service",
    name: "Service Booking",
    tagline: "Book a service, pick a slot",
    icon: "wrench",
    tone: "from-sky-500 to-cyan-500",
    flowKind: "single",
    stepsCount: 7,
  },
  {
    slug: "table",
    name: "Book a Table",
    tagline: "Restaurant reservation",
    icon: "utensils",
    tone: "from-orange-500 to-amber-500",
    flowKind: "single",
    stepsCount: 7,
  },
  {
    slug: "ride",
    name: "Book a Ride",
    tagline: "Ride-hailing like Careem / Uber",
    icon: "car",
    tone: "from-emerald-500 to-teal-500",
    flowKind: "single",
    stepsCount: 6,
  },
  {
    slug: "ticket",
    name: "Book a Ticket",
    tagline: "Movie, flight & bus tickets",
    icon: "ticket",
    tone: "from-fuchsia-500 to-pink-500",
    flowKind: "single",
    stepsCount: 5,
  },
  {
    slug: "hotel",
    name: "Book a Room",
    tagline: "Hotel rooms & stays",
    icon: "bed",
    tone: "from-indigo-500 to-violet-500",
    flowKind: "single",
    stepsCount: 6,
  },
  {
    slug: "session",
    name: "Book a Session",
    tagline: "Consultations & classes",
    icon: "graduation-cap",
    tone: "from-teal-500 to-emerald-500",
    flowKind: "single",
    stepsCount: 6,
  },
];

type EditDraft = {
  type: Chatbot["type"];
  category: string;
  useOwnDb: boolean;
  bookingEnabled: boolean;
  bookingMethod: "none" | "chatbot" | "web" | "both";
  orderSystemEnabled: boolean;
  productType: string;
  currency: string;
  currencySymbol: string;
  productDbType: "mysql" | "mongodb" | "postgresql" | "";
  productUri: string;
  productDb: string;
  productTable: string;
  productHost: string;
  productPort: number;
  productUsername: string;
  productPassword: string;
  productSsl: boolean;
  productConnected: boolean;
  catalogFields: string[];
  productMapping: {
    titleField: string;
    priceField: string;
    categoryField: string;
    imageField: string;
    descriptionField: string;
    titleLabel?: string;
    priceLabel?: string;
    categoryLabel?: string;
    imageLabel?: string;
    descriptionLabel?: string;
    customFields: Array<{ label: string; field: string }>;
  };
  name: string;
  welcome: string;
  description: string;
  logo?: string;
  primary: string;
  secondary: string;
  font: string;
  radius: number;
  bubble: Chatbot["bubble"];
  preview: "light" | "dark";
  template: Template;
  headerStyle: "gradient" | "solid" | "glass";
  textStyle: "default" | "bold" | "italic" | "romantic" | "playful" | "elegant";
  botBubbleColor: string;
  botTextColor: string;
  showAvatar: boolean;
  messageFontSize: "sm" | "md" | "lg";
  inputStyle: "rounded" | "pill" | "minimal";
  headerSubtitle: string;
  widgetLauncher: "icon" | "button";
  widgetLauncherText: string;
  widgetLauncherStyle: "rounded" | "square" | "soft" | "pill";
  widgetPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetOpenMode: "overlay" | "sidebar" | "fullscreen" | "newtab";
  widgetWidth: number;
  widgetHeight: number;
  widgetSmartPosition: boolean;
  widgetCustomCss: string;
  knowledgeFiles: Array<{ name: string; content: string; url?: string }>;
  knowledgeBase: Array<{ name: string; content: string; url?: string }>;
  trainingKnowledge: Array<{ name: string; content: string; url?: string }>;
  trainingSheet: Array<{ name: string; content: string; url?: string }>;
  collectionDb: string;
  collectionUsername: string;
  collectionPassword: string;
  collectionHost: string;
  collectionPort: number;
  collectionTable: string;
  collectionSsl: boolean;
  collectionConnected: boolean;
  collectionUri: string;
  collectionStoreType: "user_chat" | "all_orders" | "agent_contact" | "";
  databaseType: "mysql" | "mongodb" | "postgresql" | "";
  databaseMode: "full" | "collection" | "";
  agencyEmail1: string;
  agencyEmail2: string;
  ownerEmail: string;
  customerConfirmation: boolean;
  senderMode: "platform" | "own";
  configId: string;
  extractedServices: string[];
  trainingSheetServices: string[];
  trainingFlow: string;
  flowMode: "custom" | "auto";
  allowedPages: string[];
};

const emptyDraft: EditDraft = {
  type: "simple",
  category: "",
  useOwnDb: false,
  bookingEnabled: false,
  bookingMethod: "none",
  orderSystemEnabled: false,
  productType: "",
  currency: "United States Dollar (USD $)",
  currencySymbol: "$",
  productDbType: "",
  productUri: "",
  productDb: "",
  productTable: "",
  productHost: "",
  productPort: 3306,
  productUsername: "",
  productPassword: "",
  productSsl: false,
  productConnected: false,
  catalogFields: [] as string[],
  productMapping: {
    titleField: "name",
    priceField: "price",
    categoryField: "category",
    imageField: "image",
    descriptionField: "description",
    titleLabel: "Name / Title",
    priceLabel: "Price",
    categoryLabel: "Category",
    imageLabel: "Image URL",
    descriptionLabel: "Description / Details",
    customFields: [] as Array<{ label: string; field: string }>,
  },
  name: "",
  welcome: "Hi 👋 How can I help you today?",
  description: "A helpful AI assistant for my site.",
  logo: undefined,
  primary: "#D94A2D",
  secondary: "#1C1C2E",
  font: "Inter",
  radius: 16,
  bubble: "rounded",
  preview: "light",
  template: "Modern Glass UI",
  headerStyle: "gradient",
  textStyle: "default",
  botBubbleColor: "#f1f5f9",
  botTextColor: "#0f172a",
  showAvatar: true,
  messageFontSize: "md",
  inputStyle: "rounded",
  headerSubtitle: "Online",
  widgetLauncher: "icon",
  widgetLauncherText: "Chat with us",
  widgetLauncherStyle: "rounded",
  widgetPosition: "bottom-right",
  widgetOpenMode: "overlay",
  widgetWidth: 400,
  widgetHeight: 540,
  widgetSmartPosition: true,
  widgetCustomCss: "",
  knowledgeFiles: [],
  knowledgeBase: [],
  trainingKnowledge: [],
  trainingSheet: [],
  collectionDb: "",
  collectionUsername: "",
  collectionPassword: "",
  collectionHost: "",
  collectionPort: 3306,
  collectionTable: "",
  collectionSsl: false,
  collectionConnected: false,
  collectionUri: "",
  collectionStoreType: "",
  databaseType: "",
  databaseMode: "",
  agencyEmail1: "",
  agencyEmail2: "",
  ownerEmail: "",
  customerConfirmation: true,
  senderMode: "platform",
  configId: "",
  extractedServices: [],
  trainingSheetServices: [],
  trainingFlow: "",
  flowMode: "custom",
  allowedPages: [] as string[],
};

const fonts = ["Inter", "Manrope", "Space Grotesk", "DM Sans"];
const bubbles = [
  { id: "rounded" as const, label: "Rounded" },
  { id: "square" as const, label: "Square" },
  { id: "soft" as const, label: "Soft" },
];

const categoryOptions = [
  { id: "ecommerce", label: "E-Commerce" },
  { id: "travel", label: "Travel & Tourism" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "realestate", label: "Real Estate" },
  { id: "restaurant", label: "Restaurant & Food" },
  { id: "salon", label: "Salon & Spa" },
  { id: "logistics", label: "Logistics & Courier" },
  { id: "hotel", label: "Hotel & Hospitality" },
  { id: "finance", label: "Finance & Banking" },
  { id: "automotive", label: "Automotive" },
  { id: "legal", label: "Legal Services" },
  { id: "entertainment", label: "Entertainment" },
  { id: "fitness", label: "Fitness & Gym" },
  { id: "other", label: "Other / Custom" },
];

const databaseTypeOptions = [
  { id: "mysql", label: "MySQL", desc: "Relational database" },
  { id: "mongodb", label: "MongoDB", desc: "NoSQL document store" },
  { id: "postgresql", label: "PostgreSQL", desc: "Advanced relational" },
] as const;

const defaultIcons = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%238b5cf6'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%230ea5e9'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 8V4H8'/%3E%3Crect width='16' height='12' x='4' y='8' rx='2'/%3E%3Cpath d='M2 14h2'/%3E%3Cpath d='M20 14h2'/%3E%3Cpath d='M15 13v2'/%3E%3Cpath d='M9 13v2'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%2310b981'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23f43f5e'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='16' height='16' x='4' y='4' rx='2'/%3E%3Crect width='6' height='6' x='9' y='9' rx='1'/%3E%3Cpath d='M15 2v2'/%3E%3Cpath d='M15 20v2'/%3E%3Cpath d='M2 15h2'/%3E%3Cpath d='M2 9h2'/%3E%3Cpath d='M20 15h2'/%3E%3Cpath d='M20 9h2'/%3E%3Cpath d='M9 2v2'/%3E%3Cpath d='M9 20v2'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%230f172a'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Cpath d='M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z'/%3E%3Cpath d='M15.7 4.3c3.08-1.13 6.4-.27 7.4 1.8.98 2.07-1.42 5.6-5.4 7.9-3.97 2.33-8.4 3.2-9.38 1.14-1-2.07 1.4-5.6 5.4-7.9Z'/%3E%3Cpath d='M8.3 19.7c-3.08 1.13-6.4.27-7.4-1.8-.98-2.07 1.42-5.6 5.4-7.9 3.97-2.33 8.4-3.2 9.38-1.14 1 2.07-1.4 5.6-5.4 7.9Z'/%3E%3C/g%3E%3C/svg%3E",
];

const getUserContext = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string };
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Detects whether the given trainingFlow JSON is a Service Booking flow
 * (first step is a non-product "choose service/category" selection). Used so
 * "+ Add Category" generates a service-specific flow instead of an
 * e-commerce one. The e-commerce flow (fetchProducts category step) is NOT
 * treated as a service flow.
 */
const isServiceBookingFlowJson = (raw: string | undefined | null): boolean => {
  if (!raw) return false;
  let obj: any = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!obj || typeof obj !== "object") return false;
  const root = Array.isArray(obj.steps)
    ? obj
    : Object.values(obj).find((v: any) => v && typeof v === "object" && Array.isArray(v.steps));
  const first = root?.steps?.[0];
  if (!first || first.type !== "selection") return false;
  const field = (first.fields || []).find((f: any) =>
    ["service", "category", "serviceType", "service_type"].includes(f?.name),
  );
  return !!field && field.fetchProducts !== true && !/payment|pay/i.test(first.title || "");
};

const mapChatbot = (cb: any): Chatbot => {
  const theme = cb.theme || {};
  const knowledge = cb.knowledge || {};
  const agency = cb.agency || {};
  const dbCol = cb.dbCollection || {};
  const prodCol = cb.productCollection || {};
  const widget = cb.widget || {};
  return {
    id: cb._id,
    type: cb.type || "simple",
    category: cb.category || "",
    useOwnDb: cb.useOwnDb ?? false,
    bookingEnabled: (cb.bookingMethod || "none") !== "none",
    bookingMethod: cb.bookingMethod || "none",
    orderSystemEnabled: cb.orderSystemEnabled ?? false,
    productType: cb.productType ?? "",
    productCollection: prodCol
      ? {
          dbType: prodCol.dbType ?? "",
          uri: prodCol.uri ?? "",
          db: prodCol.db ?? "",
          table: prodCol.table ?? "",
          host: prodCol.host ?? "",
          port: prodCol.port ?? 3306,
          username: prodCol.username ?? "",
          password: prodCol.password ?? "",
          ssl: prodCol.ssl ?? false,
          connected: prodCol.connected ?? false,
          mapping: prodCol.mapping || undefined,
        }
      : undefined,
    name: cb.name,
    currency: cb.currency || "United States Dollar (USD $)",
    currencySymbol: cb.currencySymbol || "$",
    template: theme.template || cb.template || "Modern Glass UI",
    description: cb.description,
    welcome: cb.welcome,
    primary: theme.primaryColor || cb.primaryColor || "#D94A2D",
    secondary: theme.secondaryColor || cb.secondaryColor || "#1C1C2E",
    font: theme.font || cb.font || "Inter",
    radius: theme.borderRadius ?? cb.borderRadius ?? 16,
    bubble: theme.bubbleStyle || cb.bubbleStyle || "rounded",
    logo: cb.logo ?? undefined,
    createdAt: cb.createdAt,
    installs: cb.installs,
    embedScript: cb.embedScript,
    fromTemplate: cb.fromTemplate ?? false,
    preview: theme.previewMode || cb.previewMode || "light",
    headerStyle: theme.headerStyle || cb.headerStyle || "gradient",
    textStyle: theme.textStyle || cb.textStyle || "default",
    botBubbleColor: theme.botBubbleColor || cb.botBubbleColor || "#f1f5f9",
    botTextColor: theme.botTextColor || cb.botTextColor || "#0f172a",
    showAvatar: theme.showAvatar ?? cb.showAvatar ?? true,
    messageFontSize: theme.messageFontSize || cb.messageFontSize || "md",
    inputStyle: theme.inputStyle || cb.inputStyle || "rounded",
    headerSubtitle: theme.headerSubtitle || cb.headerSubtitle || "Online",
    widgetLauncher: widget.launcher ?? cb.widgetLauncher ?? "icon",
    widgetLauncherText: widget.launcherText ?? cb.widgetLauncherText ?? "Chat with us",
    widgetLauncherStyle: widget.launcherStyle ?? cb.widgetLauncherStyle ?? "rounded",
    widgetPosition: widget.position ?? cb.widgetPosition ?? "bottom-right",
    widgetOpenMode: widget.openMode ?? cb.widgetOpenMode ?? "overlay",
    widgetWidth: widget.width ?? cb.widgetWidth ?? 400,
    widgetHeight: widget.height ?? cb.widgetHeight ?? 540,
    widgetSmartPosition: widget.smartPosition ?? cb.widgetSmartPosition ?? true,
    widgetCustomCss: widget.customCss ?? cb.widgetCustomCss ?? "",
    knowledgeFiles: knowledge.files ?? cb.knowledgeFiles ?? [],
    knowledgeBase: knowledge.knowledgeBase ?? cb.knowledgeBase ?? [],
    trainingKnowledge: knowledge.trainingKnowledge ?? cb.trainingKnowledge ?? [],
    trainingSheet: knowledge.trainingSheet ?? cb.trainingSheet ?? [],
    collectionDb: dbCol.db ?? cb.collectionDb ?? undefined,
    collectionUsername: dbCol.username ?? cb.collectionUsername ?? undefined,
    collectionPassword: dbCol.password ?? cb.collectionPassword ?? undefined,
    collectionHost: dbCol.host ?? cb.collectionHost ?? undefined,
    collectionPort: dbCol.port ?? cb.collectionPort ?? 3306,
    collectionTable: dbCol.table ?? cb.collectionTable ?? undefined,
    collectionSsl: dbCol.ssl ?? cb.collectionSsl ?? false,
    collectionConnected: dbCol.connected ?? cb.collectionConnected ?? false,
    collectionUri: dbCol.uri ?? cb.collectionUri ?? "",
    collectionStoreType: dbCol.storeType ?? cb.collectionStoreType ?? "",
    databaseType: dbCol.type ?? cb.databaseType ?? "",
    databaseMode: dbCol.mode ?? cb.databaseMode ?? "",
    agencyEmail1: agency.email1 ?? cb.agencyEmail1 ?? "",
    agencyEmail2: agency.email2 ?? cb.agencyEmail2 ?? "",
    ownerEmail: cb.emailNotifications?.ownerEmail ?? "",
    customerConfirmation: cb.emailNotifications?.customerConfirmation ?? true,
    senderMode: cb.emailNotifications?.senderMode ?? "platform",
    configId: cb.emailNotifications?.configId ?? "",
    extractedServices: knowledge.extractedServices ?? cb.extractedServices ?? [],
    trainingSheetServices: knowledge.trainingSheetServices ?? cb.trainingSheetServices ?? [],
    trainingFlow: knowledge.trainingFlow ?? cb.trainingFlow ?? "",
  };
};

const TEMPLATE_NAMES = new Set(["HealthBuddy", "FitGuide", "PetPedia", "BabyCare"]);

const TEMPLATE_KNOWLEDGE_FILES = new Set([
  "common-diseases.txt",
  "first-aid.txt",
  "nutrition.txt",
  "diet-plans.txt",
  "weight-management.txt",
  "workouts.txt",
  "breeds.txt",
  "pet-care.txt",
  "pet-health.txt",
  "feeding.txt",
  "milestones.txt",
  "newborn-care.txt",
]);

function syncCategoriesWithFlow(updatedCategories: string[], flowStr?: string): string {
  if (!flowStr) return flowStr || "";
  try {
    const flowObj = JSON.parse(flowStr);
    if (!flowObj || typeof flowObj !== "object") return flowStr;

    if (!Array.isArray(flowObj.steps)) {
      const updatedObj: Record<string, any> = {};
      for (const cat of updatedCategories) {
        if (flowObj[cat]) {
          updatedObj[cat] = flowObj[cat];
        } else {
          const isApp = /app|mobile|ios|android/i.test(cat);
          const isWeb = /web|site|design|landing/i.test(cat);
          const isBot = /bot|chat|ai|automation/i.test(cat);

          let specificStep: any;
          if (isApp) {
            specificStep = {
              id: "platform",
              title: `Target Platform for ${cat}`,
              type: "selection",
              fields: [
                {
                  name: "platform",
                  label: "Target Platform",
                  type: "text",
                  options: ["iOS (iPhone/iPad)", "Android", "Cross-Platform (Both)"],
                  required: true,
                },
              ],
            };
          } else if (isWeb) {
            specificStep = {
              id: "type",
              title: `Website Type for ${cat}`,
              type: "selection",
              fields: [
                {
                  name: "websiteType",
                  label: "Website Type",
                  type: "text",
                  options: [
                    "E-Commerce Store",
                    "Business Landing Page",
                    "Custom Web App",
                    "Portfolio",
                  ],
                  required: true,
                },
              ],
            };
          } else if (isBot) {
            specificStep = {
              id: "channel",
              title: `Integration Channel for ${cat}`,
              type: "selection",
              fields: [
                {
                  name: "channel",
                  label: "Integration Channel",
                  type: "text",
                  options: [
                    "Website Widget",
                    "WhatsApp Business",
                    "Instagram / Facebook",
                    "Custom API",
                  ],
                  required: true,
                },
              ],
            };
          } else {
            specificStep = {
              id: "package",
              title: `Select Package for ${cat}`,
              type: "selection",
              fields: [
                {
                  name: "package",
                  label: "Service Package",
                  type: "text",
                  options: ["Basic Package", "Standard Package", "Premium Custom"],
                  required: true,
                },
              ],
            };
          }

          updatedObj[cat] = {
            steps: [
              specificStep,
              {
                id: "budget",
                title: `Budget & Scope for ${cat}`,
                type: "selection",
                fields: [
                  {
                    name: "budget",
                    label: "Estimated Budget",
                    type: "text",
                    options: ["$500 - $1,500", "$1,500 - $3,500", "$3,500 - $7,500", "$7,500+"],
                    required: true,
                  },
                ],
              },
              {
                id: "contact",
                title: "Your Contact Details",
                type: "form",
                fields: [
                  { name: "fullName", label: "Full Name", type: "text", required: true },
                  { name: "phone", label: "Phone Number", type: "tel", required: true },
                  { name: "email", label: "Email Address", type: "email", required: false },
                ],
              },
              {
                id: "payment",
                title: "Payment Preference",
                type: "selection",
                fields: [
                  {
                    name: "paymentMethod",
                    label: "Payment Method",
                    type: "text",
                    options: ["Cash / Direct Bank Transfer", "Pay Online"],
                    required: true,
                    allowSkip: true,
                  },
                ],
              },
              { id: "confirm", title: `Confirm ${cat} Request`, type: "confirmation", fields: [] },
            ],
          };
        }
      }
      return JSON.stringify(updatedObj, null, 2);
    } else if (flowObj.steps.length > 0) {
      const serviceStep =
        flowObj.steps.find(
          (s: any) =>
            s.type === "selection" &&
            s.fields?.some(
              (f: any) =>
                f.name === "service" ||
                f.name === "category" ||
                f.name === "serviceType" ||
                f.label?.toLowerCase().includes("service") ||
                f.label?.toLowerCase().includes("category"),
            ),
        ) || flowObj.steps[0];

      if (serviceStep && serviceStep.type === "selection" && serviceStep.fields?.length > 0) {
        serviceStep.fields[0].options =
          updatedCategories.length > 0 ? updatedCategories : ["Service 1"];
        return JSON.stringify(flowObj, null, 2);
      }
    }
  } catch {}
  return flowStr;
}

const isTemplateBotCheck = (bot: Chatbot): boolean => {
  if (bot.fromTemplate) return true;
  if (TEMPLATE_NAMES.has(bot.name)) return true;
  const files = bot.knowledgeFiles ?? [];
  if (files.length > 0 && files.every((f) => TEMPLATE_KNOWLEDGE_FILES.has(f.name))) return true;
  return false;
};

const templateIcons: Record<string, string> = {
  healthbuddy: "🏥",
  fitguide: "💪",
  petpedia: "🐾",
  babycare: "👶",
};
const templateGradients: Record<string, string> = {
  healthbuddy: "from-emerald-500 to-teal-600",
  fitguide: "from-orange-500 to-red-500",
  petpedia: "from-violet-500 to-purple-600",
  babycare: "from-pink-500 to-rose-500",
};

function ScriptsPage() {
  const { chatbots, setChatbots, update, remove } = useChatbotsStore();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  // consoleKey per chatbot (agency only) — fetched from the owner-only endpoint
  const [consoleKeys, setConsoleKeys] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genStage, setGenStage] = useState<Record<string, string>>({});
  const [cssOpen, setCssOpen] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Chatbot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chatbot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingBot, setEditingBot] = useState<Chatbot | null>(null);
  const [isTemplateBot, setIsTemplateBot] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [autoFlowScan, setAutoFlowScan] = useState<any>(null);
  const [tourStep, setTourStep] = useState(0);
  const [tourRect, setTourRect] = useState<DOMRect | null>(null);
  const tourElRef = useRef<Element | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const usedStorageTargets = useMemo(() => {
    return chatbots
      .filter((b) => b.id !== editingBot?.id)
      .map((b) => b.collectionStoreType)
      .filter(Boolean) as string[];
  }, [chatbots, editingBot]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [syncingDB, setSyncingDB] = useState(false);
  const [dbSchemaMeta, setDbSchemaMeta] = useState<any>(null);
  const [connectedEmails, setConnectedEmails] = useState<any[]>([]);
  const [selectedFlowCategory, setSelectedFlowCategory] = useState<string | null>(null);
  const [defaultFlows, setDefaultFlows] = useState<DefaultFlowOption[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(true);
  const [selectedFlowSlug, setSelectedFlowSlug] = useState<string | null>(null);
  const [manualKnowledgeName, setManualKnowledgeName] = useState("");
  const [manualKnowledgeContent, setManualKnowledgeContent] = useState("");
  const [manualKBName, setManualKBName] = useState("");
  const [manualKBContent, setManualKBContent] = useState("");
  const [manualTKName, setManualTKName] = useState("");
  const [manualTKContent, setManualTKContent] = useState("");
  const [manualTSName, setManualTSName] = useState("");
  const [manualTSContent, setManualTSContent] = useState("");
  const [selectedFileForView, setSelectedFileForView] = useState<{
    name: string;
    content: string;
    url?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const editSteps =
    draft.type === "agency"
      ? draft.flowMode === "auto"
        ? [
            { n: 1, label: "Identity" },
            { n: 4, label: "Training & Flow" },
            { n: 5, label: "Bot Details" },
            { n: 6, label: "Knowledge" },
            { n: 7, label: "Email Setup" },
          ]
        : [
            { n: 1, label: "Identity" },
            { n: 2, label: "Data Collection" },
            { n: 3, label: "Orders & Storage" },
            { n: 4, label: "Training & Flow" },
            { n: 5, label: "Bot Details" },
            { n: 6, label: "Knowledge" },
            { n: 7, label: "Email Setup" },
          ]
      : [];
  const editStepIndex = editSteps.findIndex((step) => step.n === editStep);
  const isLastEditStep = editStepIndex === editSteps.length - 1;

  useEffect(() => {
    const user = getUserContext();
    if (!user?.id) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/chatbot/user/${user.id}`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch("/api/templates", { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch("/api/storage/usage", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([botsData, tmplData, storageData]) => {
        const bots: any[] = Array.isArray(botsData.chatbots) ? botsData.chatbots : [];
        const storage = storageData?.storage || null;
        const plan = storage?.planId || {};
        const agencyAllowed = (plan.bookingAgency || 0) > 0;
        const dbAllowed = plan.databaseAccess === true;
        const storageFull =
          (storage?.storageLimit || 0) > 0 &&
          (storage?.storageUsed || 0) >= (storage?.storageLimit || 0);
        const simpleBotLimit = Math.max(0, plan.totalChatbots || 0);
        const agencyBotLimit = plan.bookingAgency || 0;
        const orderedBots = [...bots].sort(
          (a: any, b: any) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
        );
        let simpleCount = 0;
        let agencyCount = 0;
        const mapped = orderedBots.map((cb: any) => {
          const bot = mapChatbot(cb);
          if (bot.type === "agency") {
            agencyCount += 1;
            if (!agencyAllowed) {
              bot.planRestricted = true;
              bot.planRestrictionReason =
                "Agency chatbots are not included in your current plan. Upgrade your plan to enable this chatbot.";
            } else if (agencyCount > agencyBotLimit) {
              bot.planRestricted = true;
              bot.planRestrictionReason = `Agency chatbot limit reached (${agencyBotLimit}/${agencyBotLimit}). Upgrade your plan to create more.`;
            }
          } else {
            simpleCount += 1;
            if (simpleCount > simpleBotLimit) {
              bot.planRestricted = true;
              bot.planRestrictionReason = `Simple chatbot limit reached (${simpleBotLimit}/${simpleBotLimit}). Upgrade your plan to create more.`;
            }
          }
          if (
            !bot.planRestricted &&
            (bot.collectionConnected || bot.productCollection?.connected) &&
            !dbAllowed
          ) {
            bot.planRestricted = true;
            bot.planRestrictionReason =
              "Database collections are not included in your current plan. Upgrade your plan to enable database features.";
          } else if (!bot.planRestricted && storageFull) {
            bot.planRestricted = true;
            bot.planRestrictionReason =
              "Your storage is full. Upgrade your plan to increase your storage limit.";
          }
          return bot;
        });
        setChatbots(mapped);
        if (tmplData.templates) setTemplates(tmplData.templates);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));

    const tourDone = localStorage.getItem("scriptsTourDone");
    if (!tourDone) {
      const timer = setTimeout(() => setTourStep(1), 600);
      return () => clearTimeout(timer);
    }
  }, [setChatbots]);

  // Fetch this owner's analytics console keys (agency bots only)
  useEffect(() => {
    fetch("/api/store/my/console-keys", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const map: Record<string, string> = {};
        for (const k of d?.keys || []) {
          if (k.consoleKey) map[k.chatbotId] = k.consoleKey;
        }
        setConsoleKeys(map);
      })
      .catch(() => {});
  }, [loading]);

  useEffect(() => {
    if (tourStep === 0 || tourStep >= 6) return;
    const id = setTimeout(() => {
      const sel = `[data-tour='step${tourStep}']`;
      const el = document.querySelector(sel);
      if (el) {
        tourElRef.current = el;
        setTourRect(el.getBoundingClientRect());
      }
    }, 150);
    return () => clearTimeout(id);
  }, [tourStep]);

  useEffect(() => {
    if (!editingBot) return;
    fetch("/api/email-config", { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const configs: any[] = Array.isArray(d?.configs) ? d.configs : d?.config ? [d.config] : [];
        setConnectedEmails(configs);
      })
      .catch(() => {
        setConnectedEmails([]);
      });
  }, [editingBot]);

  const filtered = useMemo(
    () =>
      chatbots.filter(
        (b) =>
          (filter === "all" || b.template === filter) &&
          b.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [chatbots, q, filter],
  );

  const templateOptions = ["all", ...Array.from(new Set(chatbots.map((b) => b.template)))];

  const buildEmbedScript = (
    botId: string,
    botName: string,
    opts?: Partial<
      Pick<
        Chatbot,
        | "widgetLauncher"
        | "widgetLauncherText"
        | "widgetLauncherStyle"
        | "widgetPosition"
        | "widgetOpenMode"
        | "widgetWidth"
        | "widgetHeight"
        | "widgetSmartPosition"
        | "widgetCustomCss"
      >
    >,
  ) => {
    const launcher = opts?.widgetLauncher || "icon";
    const launcherText = opts?.widgetLauncherText || "Chat with us";
    const launcherStyle = opts?.widgetLauncherStyle || "rounded";
    const position = opts?.widgetPosition || "bottom-right";
    const openMode = opts?.widgetOpenMode || "overlay";
    const width = opts?.widgetWidth || 400;
    const height = opts?.widgetHeight || 540;
    const smartPosition = opts?.widgetSmartPosition ?? true;
    const customCss = opts?.widgetCustomCss || "";

    return `<!-- ${botName} chatbot widget -->
<script async src="${getWidgetScriptUrl()}" data-bot-id="${botId}" data-api-host="${config.apiBaseUrl}" data-chat-host="${config.chatBaseUrl}"></script>

<!-- ================================================================
  Webotme Widget Custom CSS
  Add CSS in this block to position, resize and style your widget —
  these styles apply automatically.

  Selectors:
    #rover-chatbot-bubble  → launcher button / icon
    #rover-chatbot-frame   → chat panel

  Optionally you can override from the script tag itself:
  data-widget-position="top-left"  data-widget-open-mode="sidebar"
  data-widget-width="480"          data-widget-height="640"
  data-widget-launcher="button"    data-widget-launcher-text="Chat with us"
  data-widget-launcher-style="pill"
================================================================= -->
<style data-rover-custom-css="true">
  /* Add your own CSS here — e.g. move the widget up or make it bigger */
  /* #rover-chatbot-bubble { bottom: 80px; right: 40px; } */
  /* #rover-chatbot-frame { width: 480px; height: 640px; } */
${
  customCss
    ? customCss
        .split("\n")
        .map((l) => "  " + l)
        .join("\n")
    : "  /* -- saved custom CSS will appear here -- */"
}
</style>`;
  };

  const splitEmbedScript = (script: string) => {
    const marker = "Webotme Widget Custom CSS";
    const idx = script.indexOf(marker);
    if (idx === -1) return { tag: script, css: "" };
    const tag = script.slice(0, script.lastIndexOf("<!--", idx)).replace(/\n+$/, "");
    const css = script.slice(script.lastIndexOf("<!--", idx));
    return { tag, css };
  };

  const handleGenerate = async (botId: string, botName: string) => {
    setGenerating((prev) => ({ ...prev, [botId]: true }));
    setGenStage((prev) => ({ ...prev, [botId]: "Packaging UI components..." }));
    await new Promise((r) => setTimeout(r, 400));
    setGenStage((prev) => ({ ...prev, [botId]: "Saving script..." }));
    await new Promise((r) => setTimeout(r, 400));

    const currentBot = chatbots.find((cb) => cb.id === botId);
    const scriptText = buildEmbedScript(botId, botName, currentBot || undefined);

    try {
      const res = await fetch(`/api/chatbot/${botId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ embedScript: scriptText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save script");
      update(botId, { embedScript: scriptText });
      toast.success("Script generated!");
    } catch (err: any) {
      toast.error(err.message || "Could not save script");
    } finally {
      setGenerating((prev) => ({ ...prev, [botId]: false }));
    }
  };

  const handleTemplateGenerate = async (slug: string) => {
    const user = getUserContext();
    if (!user?.id) {
      toast.error("Please log in first");
      return;
    }
    setGenerating((prev) => ({ ...prev, [slug]: true }));

    try {
      const res = await fetch(`/api/templates/${slug}/init`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      const botId = data.chatbot?._id || data.chatbot?.id;
      let scriptText = data.embedScript || "";

      if (!scriptText && botId) {
        scriptText = buildEmbedScript(botId, data.chatbot.name, {
          widgetLauncher: data.chatbot.widget?.launcher,
          widgetLauncherText: data.chatbot.widget?.launcherText,
          widgetLauncherStyle: data.chatbot.widget?.launcherStyle,
          widgetPosition: data.chatbot.widget?.position,
          widgetOpenMode: data.chatbot.widget?.openMode,
          widgetWidth: data.chatbot.widget?.width,
          widgetHeight: data.chatbot.widget?.height,
          widgetSmartPosition: data.chatbot.widget?.smartPosition,
          widgetCustomCss: data.chatbot.widget?.customCss,
        });
        await fetch(`/api/chatbot/${botId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ embedScript: scriptText }),
        });
      }

      const user2 = getUserContext();
      if (user2?.id) {
        const botsRes = await fetch(`/api/chatbot/user/${user2.id}`, { headers: getAuthHeaders() });
        const botsData = await botsRes.json();
        if (botsData.chatbots) setChatbots(botsData.chatbots.map(mapChatbot));
      }

      toast.success(`${data.chatbot.name} created! Script is ready.`);
      if (tourStep === 1) setTourStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to create bot");
    } finally {
      setGenerating((prev) => ({ ...prev, [slug]: false }));
    }
  };

  const parseServicesFromDescription = (desc: string): string[] => {
    const lines = desc.split("\n");
    const services: string[] = [];
    let capturing = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/services?\s*offered/i.test(trimmed)) {
        capturing = true;
        continue;
      }
      if (capturing) {
        const match = trimmed.match(/^\d+\.\s+(.+)$/);
        if (match) services.push(match[1]);
        else if (trimmed === "") continue;
        else capturing = false;
      }
    }
    return services;
  };

  const buildCatalogBody = (d: EditDraft): any | null => {
    const body: any = {
      type: d.productDbType,
      isProductCollection: true,
      productMapping: d.productMapping,
    };

    if (d.productDbType === "mongodb") {
      if (!d.productUri || !d.productDb || !d.productTable) {
        toast.error("Please fill Connection URI, Database Name, and Collection Name");
        return null;
      }
      body.uri = d.productUri;
      body.database = d.productDb;
      body.collection = d.productTable;
    } else {
      if (
        !d.productDb ||
        !d.productHost ||
        !d.productUsername ||
        !d.productPassword ||
        !d.productTable
      ) {
        toast.error("Please fill all catalog fields first");
        return null;
      }
      body.host = d.productHost;
      body.port = d.productPort || (d.productDbType === "mysql" ? 3306 : 5432);
      body.database = d.productDb;
      body.user = d.productUsername;
      body.password = d.productPassword;
      body.table = d.productTable;
      body.ssl = d.productSsl;
    }

    return body;
  };

  const runCatalogTest = async (d: EditDraft, silent = false) => {
    const body = buildCatalogBody(d);
    if (!body) return;

    const toastId = toast.loading(
      silent ? "Fetching catalog fields..." : "Testing catalog connection...",
    );
    try {
      const res = await fetch("/api/chatbot/test-collection", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.connected) {
        setDraft((prev) => {
          const fields = Array.isArray(data.fields) ? data.fields : prev.catalogFields;
          const guessed = guessMapping(fields, prev.productMapping);
          return {
            ...prev,
            productConnected: true,
            catalogFields: fields,
            productMapping: { ...guessed, customFields: prev.productMapping.customFields ?? [] },
          };
        });
        const msg =
          data.productCount !== undefined
            ? `Connected! Found ${data.productCount} product(s) in catalog.`
            : "Catalog connection successful!";
        toast.success(msg, { id: toastId });
      } else {
        setDraft((prev) => ({ ...prev, productConnected: false }));
        toast.error(data.message || "Connection failed", { id: toastId });
      }
    } catch (err: any) {
      setDraft((prev) => ({ ...prev, productConnected: false }));
      toast.error(err.message || "Connection test failed", { id: toastId });
    }
  };

  const openEditor = (bot: Chatbot) => {
    setEditingBot(bot);
    setEditStep(1);
    setIsTemplateBot(isTemplateBotCheck(bot));
    const isAgency =
      bot.type === "agency" || !!(bot.agencyEmail1 || bot.agencyEmail2 || bot.collectionDb);
    let cleanDesc = bot.description || "";
    if (!isAgency && cleanDesc) {
      const lines = cleanDesc.split("\n");
      const filtered = [];
      let inServices = false;
      for (const line of lines) {
        if (/services?\s*offered/i.test(line.trim())) {
          inServices = true;
          continue;
        }
        if (inServices) {
          if (/^\d+\.\s+/.test(line.trim())) continue;
          if (line.trim() === "") continue;
          inServices = false;
        }
        filtered.push(line);
      }
      cleanDesc = filtered.join("\n").trim();
    }
    setDraft({
      type: bot.type || "simple",
      category: bot.category || "",
      useOwnDb: bot.useOwnDb ?? false,
      bookingEnabled: (bot.bookingMethod || "none") !== "none",
      bookingMethod: bot.bookingMethod || "none",
      orderSystemEnabled: bot.orderSystemEnabled ?? false,
      productType: bot.productType ?? "",
      currency: bot.currency || "United States Dollar (USD $)",
      currencySymbol: bot.currencySymbol || "$",
      productDbType: (bot.productCollection?.dbType as any) ?? "",
      productUri: bot.productCollection?.uri ?? "",
      productDb: bot.productCollection?.db ?? "",
      productTable: bot.productCollection?.table ?? "",
      productHost: bot.productCollection?.host ?? "",
      productPort: bot.productCollection?.port ?? 3306,
      productUsername: bot.productCollection?.username ?? "",
      productPassword: bot.productCollection?.password ?? "",
      productSsl: bot.productCollection?.ssl ?? false,
      productConnected: bot.productCollection?.connected ?? false,
      catalogFields: [],
      productMapping: bot.productCollection?.mapping
        ? {
            titleField: bot.productCollection.mapping.titleField || "name",
            priceField: bot.productCollection.mapping.priceField || "price",
            categoryField: bot.productCollection.mapping.categoryField || "category",
            imageField: bot.productCollection.mapping.imageField || "image",
            descriptionField: bot.productCollection.mapping.descriptionField || "description",
            titleLabel: bot.productCollection.mapping.titleLabel || "Name / Title",
            priceLabel: bot.productCollection.mapping.priceLabel || "Price",
            categoryLabel: bot.productCollection.mapping.categoryLabel || "Category",
            imageLabel: bot.productCollection.mapping.imageLabel || "Image URL",
            descriptionLabel:
              bot.productCollection.mapping.descriptionLabel || "Description / Details",
            customFields: Array.isArray(bot.productCollection.mapping.customFields)
              ? bot.productCollection.mapping.customFields.filter(
                  (cf: any) => cf && (cf.label || cf.field),
                )
              : [],
          }
        : {
            titleField: "name",
            priceField: "price",
            categoryField: "category",
            imageField: "image",
            descriptionField: "description",
            titleLabel: "Name / Title",
            priceLabel: "Price",
            categoryLabel: "Category",
            imageLabel: "Image URL",
            descriptionLabel: "Description / Details",
            customFields: [] as Array<{ label: string; field: string }>,
          },
      name: bot.name,
      welcome: bot.welcome,
      description: cleanDesc,
      logo: bot.logo,
      primary: bot.primary,
      secondary: bot.secondary,
      font: bot.font,
      radius: bot.radius,
      bubble: bot.bubble,
      preview: bot.preview ?? "light",
      template: bot.template,
      headerStyle: bot.headerStyle || "gradient",
      textStyle: bot.textStyle || "default",
      botBubbleColor: bot.botBubbleColor || "#f1f5f9",
      botTextColor: bot.botTextColor || "#0f172a",
      showAvatar: bot.showAvatar ?? true,
      messageFontSize: bot.messageFontSize || "md",
      inputStyle: bot.inputStyle || "rounded",
      headerSubtitle: bot.headerSubtitle || "Online",
      widgetLauncher: bot.widgetLauncher ?? "icon",
      widgetLauncherText: bot.widgetLauncherText ?? "Chat with us",
      widgetLauncherStyle: bot.widgetLauncherStyle ?? "rounded",
      widgetPosition: bot.widgetPosition ?? "bottom-right",
      widgetOpenMode: bot.widgetOpenMode ?? "overlay",
      widgetWidth: bot.widgetWidth ?? 400,
      widgetHeight: bot.widgetHeight ?? 540,
      widgetSmartPosition: bot.widgetSmartPosition ?? true,
      widgetCustomCss: bot.widgetCustomCss ?? "",
      knowledgeFiles: bot.knowledgeFiles ?? [],
      knowledgeBase: bot.knowledgeBase ?? [],
      trainingKnowledge: bot.trainingKnowledge ?? [],
      trainingSheet: bot.trainingSheet ?? [],
      collectionDb: bot.collectionDb ?? "",
      collectionUsername: bot.collectionUsername ?? "",
      collectionPassword: bot.collectionPassword ?? "",
      collectionHost: bot.collectionHost ?? "",
      collectionPort: bot.collectionPort ?? 3306,
      collectionTable: bot.collectionTable ?? "",
      collectionSsl: bot.collectionSsl ?? false,
      collectionConnected: bot.collectionConnected ?? false,
      collectionUri: bot.collectionUri ?? "",
      collectionStoreType: bot.collectionStoreType ?? "",
      databaseType: bot.databaseType ?? "",
      databaseMode: bot.databaseMode ?? "",
      agencyEmail1: bot.agencyEmail1 ?? "",
      agencyEmail2: bot.agencyEmail2 ?? "",
      ownerEmail: bot.ownerEmail ?? "",
      customerConfirmation: bot.customerConfirmation ?? true,
      senderMode: bot.senderMode ?? "platform",
      configId: bot.configId ?? "",
      extractedServices: bot.extractedServices ?? [],
      trainingSheetServices: bot.trainingSheetServices ?? [],
      trainingFlow: bot.trainingFlow ?? "",
      flowMode: bot.flowMode ?? "custom",
      allowedPages: bot.allowedPages ?? [],
    });

    setSelectedFlowSlug(null);

    const pc = bot.productCollection;
    if (pc?.connected) {
      const fetchDraft: EditDraft = {
        ...emptyDraft,
        productDbType: (pc.dbType as any) ?? "",
        productUri: pc.uri ?? "",
        productDb: pc.db ?? "",
        productTable: pc.table ?? "",
        productHost: pc.host ?? "",
        productPort: pc.port ?? 3306,
        productUsername: pc.username ?? "",
        productPassword: pc.password ?? "",
        productSsl: pc.ssl ?? false,
      };
      setTimeout(() => runCatalogTest(fetchDraft, true), 400);
    }
  };

  const handleViewFile = async (f: { name: string; content?: string; url?: string }) => {
    if (selectedFileForView?.name === f.name) {
      setSelectedFileForView(null);
      return;
    }
    if (f.content && f.content.trim()) {
      setSelectedFileForView(f as any);
      return;
    }
    setSelectedFileForView({ name: f.name, content: "" });
    try {
      const botId = editingBot?.id;
      if (!botId) return;
      const res = await fetch(
        `/api/chatbot/${botId}/file-content?filename=${encodeURIComponent(f.name)}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (res.ok && data.content) {
        setSelectedFileForView({ name: f.name, content: data.content });
      }
    } catch (err) {
      setSelectedFileForView({ name: f.name, content: "" });
    }
  };

  const closeEditor = () => {
    setEditingBot(null);
    setEditStep(1);
    setIsTemplateBot(false);
    setDraft(emptyDraft);
    setDbSchemaMeta(null);
    setSyncingDB(false);
    setSelectedFlowSlug(null);
    setAutoFlowScan(null);
  };

  useEffect(() => {
    let alive = true;
    if (editingBot?.id) {
      fetch(`/api/autoflow/${editingBot.id}/scan-status`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setAutoFlowScan(d?.scanStatus ?? null);

          const hasAutoFlow =
            d?.flowMode === "auto" ||
            d?.autoFlowEnabled === true ||
            d?.scanStatus?.status === "complete" ||
            (Array.isArray(d?.scanStatus?.flowsDetected) && d.scanStatus.flowsDetected.length > 0);
          if (hasAutoFlow) {
            setDraft((prev) =>
              prev.flowMode === "auto" ? prev : { ...prev, flowMode: "auto" },
            );
          }
        })
        .catch(() => {
          if (alive) setAutoFlowScan(null);
        });
    } else {
      setAutoFlowScan(null);
    }
    return () => {
      alive = false;
    };
  }, [editingBot?.id]);

  const selectFlow = (f: DefaultFlowOption | null) => {
    setSelectedFlowSlug(f ? f.slug : null);
    setDraft((p) => ({
      ...p,
      trainingFlow: f ? f.trainingFlow || "" : "",
      orderSystemEnabled: f ? true : p.orderSystemEnabled,
    }));
  };

  useEffect(() => {
    let alive = true;
    const enrich = (f: DefaultFlowOption): DefaultFlowOption => ({
      ...f,
      trainingFlow: f.trainingFlow ?? demoDataForFlow(f.slug).trainingFlow,
      welcome: f.welcome ?? demoDataForFlow(f.slug).welcome,
    });
    const fallback = FALLBACK_FLOWS.map(enrich);
    const applyDefault = (flows: DefaultFlowOption[]) => {
      const def = flows.find((fl) => fl.slug === "ecommerce") ?? flows[0];
      if (!def) return;
      setDraft((p) => (p.trainingFlow ? p : { ...p, trainingFlow: def.trainingFlow || "" }));
      setSelectedFlowSlug(def.slug);
    };
    (async () => {
      try {
        const res = await fetch("/api/flow/defaults");
        const data = await res.json();
        if (!alive) return;
        if (data?.success && Array.isArray(data.flows) && data.flows.length > 0) {
          const withFlow = data.flows.map((f: DefaultFlowOption) => enrich(f));
          setDefaultFlows(withFlow);
          applyDefault(withFlow);
        } else {
          setDefaultFlows(fallback);
          applyDefault(fallback);
        }
      } catch {
        if (!alive) return;
        setDefaultFlows(fallback);
        applyDefault(fallback);
      } finally {
        if (alive) setFlowsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectedFlow = defaultFlows.find((f) => f.slug === selectedFlowSlug) ?? null;
  const flowPreview = (() => {
    if (!selectedFlow?.trainingFlow) return null;
    try {
      const obj = JSON.parse(selectedFlow.trainingFlow) as {
        steps?: unknown;
        [key: string]: unknown;
      };
      const steps: FlowStepMeta[] = Array.isArray(obj?.steps) ? (obj.steps as FlowStepMeta[]) : [];
      if (steps.length > 0) return { kind: "single", categories: [] as string[], steps };
      const cats = Object.keys(obj || {}).filter((k) =>
        Array.isArray((obj[k] as { steps?: unknown } | undefined)?.steps),
      );
      if (cats.length > 0) {
        return {
          kind: "multi-category",
          categories: cats,
          steps: ((obj[cats[0]] as { steps?: FlowStepMeta[] } | undefined)?.steps ??
            []) as FlowStepMeta[],
        };
      }
    } catch {
      return null;
    }
    return null;
  })();

  const draftFlowLibrarySlug = (() => {
    try {
      const obj = JSON.parse(draft.trainingFlow || "{}") as Record<string, unknown>;
      if (Array.isArray(obj.steps)) return null;
      const cats = Object.keys(obj).filter((k) =>
        Array.isArray((obj[k] as { steps?: unknown } | undefined)?.steps),
      );
      return cats.length > 0 ? "ecommerce" : null;
    } catch {
      return null;
    }
  })();
  const activeFlowSlug = selectedFlowSlug ?? draftFlowLibrarySlug;

  const diagramFlow = ((): FlowDef | null => {
    if (!selectedFlow || !flowPreview) return null;
    const steps = flowPreview.steps.map((s, i) => {
      const desc =
        s.type === "form"
          ? `Ask: ${(s.fields || []).map((fd) => fd.label).join(", ") || "enter details"}`
          : s.type === "confirmation"
            ? "Review the summary & confirm"
            : s.type === "selection"
              ? "Choose an option"
              : "Continue with the next step";
      return {
        id: s.id || `step-${i}`,
        label: s.title || `Step ${i + 1}`,
        desc,
        icon: stepIconFor(s),
      };
    });
    if (steps.length === 0) return null;
    const links: FlowLink[] = steps.slice(0, -1).map((s, i) => ({
      source: s.id,
      target: steps[i + 1].id,
      label: i === 0 ? "Browse" : "Next",
    }));
    const spec: NonNullable<FlowDef["spec"]> = {};
    flowPreview.steps.forEach((s, i) => {
      const sid = steps[i].id;
      const isPayment =
        s.type === "selection" &&
        ((s.fields || []).some((f) => f.name === "paymentMethod") ||
          /payment|pay/i.test(s.title || ""));
      const isRead = s.type === "selection" && (s.fields || []).some((f) => f.fetchProducts);
      const isWrite = s.type === "confirmation";
      if (isRead) {
        spec[sid] = { kind: "db-read", label: "Read product catalog", detail: s.title || "" };
      } else if (isWrite) {
        spec[sid] = { kind: "db-write", label: "Save order", detail: s.title || "" };
      } else if (isPayment) {
        spec[sid] = { kind: "api", label: "Payment API", detail: s.title || "" };
      }
    });
    return {
      id: selectedFlow.slug,
      name: selectedFlow.name,
      tagline: selectedFlow.tagline,
      icon: flowIconForSlug(selectedFlow.slug),
      tone: selectedFlow.tone || "from-violet-500 to-indigo-500",
      steps,
      links,
      spec: Object.keys(spec).length > 0 ? spec : undefined,
    };
  })();

  const syncCategoriesAndFlowFromDB = async () => {
    const hasDb =
      draft.collectionConnected ||
      Boolean(
        draft.collectionUri ||
        draft.collectionHost ||
        draft.collectionTable ||
        draft.productUri ||
        draft.productTable,
      ) ||
      Boolean(editingBot?.dbCollection?.connected || editingBot?.productCollection?.uri);
    if (!hasDb) {
      toast.error("Please configure and connect your database in Step 3 (Orders & Storage) first!");
      return;
    }
    setSyncingDB(true);
    const toastId = toast.loading(
      "Analyzing database collection & sampling catalog schema with AI...",
    );
    try {
      const productConfig =
        draft.productUri || draft.productTable || editingBot?.productCollection?.uri
          ? {
              dbType: draft.productDbType || editingBot?.productCollection?.dbType || "mongodb",
              uri: draft.productUri || editingBot?.productCollection?.uri,
              db: draft.productDb || editingBot?.productCollection?.db,
              table: draft.productTable || editingBot?.productCollection?.table,
              mapping: draft.productMapping || editingBot?.productCollection?.mapping,
            }
          : undefined;

      const dbConfig =
        draft.collectionUri || draft.collectionHost || draft.collectionTable
          ? {
              dbType: draft.databaseType || "mongodb",
              uri: draft.collectionUri,
              db: draft.collectionDb,
              table: draft.collectionTable,
              host: draft.collectionHost,
              port: draft.collectionPort,
              username: draft.collectionUsername,
              password: draft.collectionPassword,
              ssl: draft.collectionSsl,
              mapping: draft.productMapping,
            }
          : undefined;

      const res = await fetch("/api/orders/detect-schema", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          chatbotId: editingBot?.id || (editingBot as any)?._id,
          productConfig,
          dbConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to analyze database");

      if (data.schemaInfo) {
        setDbSchemaMeta(data.schemaInfo);
      }

      const allExistingCats = [
        ...new Set([...(draft.extractedServices || []), ...(draft.trainingSheetServices || [])]),
      ]
        .map((s: string) => s?.trim())
        .filter(Boolean);
      const fetchedCats: string[] =
        data.categories && data.categories.length > 0
          ? data.categories
          : allExistingCats.length > 0
            ? allExistingCats
            : ["Audio Video Cables"];

      const flowObj: any = {};
      for (const cat of fetchedCats) {
        flowObj[cat] = JSON.parse(JSON.stringify(data.flow || { steps: [] }));
      }
      // Also preserve a fallback key so steps always render
      flowObj["General"] = JSON.parse(JSON.stringify(data.flow || { steps: [] }));

      setDraft((prev) => ({
        ...prev,
        trainingSheetServices: fetchedCats,
        extractedServices: fetchedCats,
        trainingFlow: JSON.stringify(flowObj, null, 2),
      }));
      setSelectedFlowCategory(fetchedCats[0]);
      toast.success(
        `Synced ${fetchedCats.length} categories from DB (${data.schemaInfo?.isProductCatalog ? "Product Catalog" : "Database"}) & built AI flow!`,
        { id: toastId },
      );
    } catch (err: any) {
      console.error("DB Sync Error:", err);
      setSyncingDB(false);
    }
  };

  const [generatingFlow, setGeneratingFlow] = useState(false);

  const generateAIFlowWithGroqGemini = async () => {
    try {
      setGeneratingFlow(true);
      // Detect the currently selected flow slug so the server generates
      // the correct per-type journey (hotel, ride, table, ticket, session,
      // multi-category service, or ecommerce).
      const currentSlug = activeFlowSlug ?? selectedFlowSlug ?? "service";
      const isSingleFlow = ["hotel", "ride", "table", "ticket", "session"].includes(currentSlug);

      const toastId = toast.loading(
        isSingleFlow
          ? `Generating ${currentSlug} booking flow with AI…`
          : "Generating journey flow with Groq / Gemini AI…",
      );
      const cats = [
        ...new Set([...(draft.trainingSheetServices || []), ...(draft.extractedServices || [])]),
      ].filter(Boolean);

      const res = await fetch("/api/chatbot/generate-flow", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          botName: draft.name,
          // For single-flow types (hotel/ride/etc.) categories are not used;
          // for multi-category types pass whatever the user configured.
          categories: cats.length > 0 ? cats : ["Web Dev", "App Dev", "ChatBot"],
          description: draft.description || draft.welcome,
          flowSlug: currentSlug, // ← tell the server which journey to build
          preferredProvider: "groq",
        }),
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server response error (${res.status})`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate flow");
      }

      setDraft((prev) => ({
        ...prev,
        trainingFlow: data.trainingFlow,
        // Only update service lists for multi-category flows;
        // single-step flows (hotel/ride/etc.) don't use categories.
        ...(isSingleFlow
          ? {}
          : {
              trainingSheetServices: data.categories || prev.trainingSheetServices,
              extractedServices: data.categories || prev.extractedServices,
            }),
      }));

      toast.success(
        `${isSingleFlow ? currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1) + " booking" : "AI"} flow generated with ${data.provider || "AI"}!`,
        { id: toastId },
      );
    } catch (err: any) {
      console.error("Generate AI Flow error:", err);
      toast.error(err.message || "Failed to auto-generate AI flow");
    } finally {
      setGeneratingFlow(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const uploadToCloudinary = async (file: File, dataUrl: string) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension);
    const signRes = await fetch("/api/chatbot/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ resourceType: isImage ? "image" : "raw" }),
    });
    const signData = await signRes.json();
    if (!signRes.ok) {
      throw new Error(
        signRes.status === 401
          ? "Your session has expired. Please sign in again before uploading files."
          : signData.message || "Failed to get upload signature",
      );
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/${isImage ? "image" : "raw"}/upload`,
      { method: "POST", body: formData },
    );
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Upload failed");
    return (uploadData.secure_url || uploadData.url) as string;
  };

  const onLogo = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const url = await uploadToCloudinary(file, dataUrl);
      setDraft((prev) => ({ ...prev, logo: url }));
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  const parseKnowledgeFile = async (file: File, onProgress?: (pct: number) => void) => {
    const name = file.name;
    const extension = name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") {
      // @ts-ignore
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n\n";
        if (onProgress) onProgress(Math.round((pageNum / pdf.numPages) * 100));
      }
      return { text: text.trim(), pages: pdf.numPages };
    }
    if (extension === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (onProgress) onProgress(100);
      return { text: result.value.trim(), pages: null };
    }
    if (extension === "txt" || extension === "md" || extension === "json") {
      const text = await file.text();
      if (onProgress) onProgress(100);
      return { text: text.trim(), pages: null, lines: text.split("\n").length };
    }
    toast.error("Unsupported file type. Use PDF, DOCX, TXT, MD, or JSON.");
    return null;
  };

  const addKnowledgeFiles = async (files: FileList | null) => {
    if (!files) return;
    const existingNames = new Set(draft.knowledgeFiles.map((f) => f.name));
    const newFiles: Array<{ name: string; content: string; url?: string }> = [];
    const totalFiles = files.length;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      try {
        if (existingNames.has(file.name)) {
          toast.error(`${file.name} already exists.`);
          continue;
        }
        setUploadStatus(`Extracting ${file.name}...`);
        const result = await parseKnowledgeFile(file, (pct) => {
          setUploadProgress(Math.round((i * 100 + pct * 0.7) / totalFiles));
        });
        if (!result) continue;
        setUploadStatus(`Uploading ${file.name}...`);
        setUploadProgress(Math.round((i * 100 + 70) / totalFiles));
        const dataUrl = await readFileAsDataUrl(file);
        const url = await uploadToCloudinary(file, dataUrl);
        newFiles.push({ name: file.name, content: result.text, url });
        setUploadProgress(Math.round((i * 100 + 100) / totalFiles));
      } catch (error: any) {
        toast.error(`Failed to process ${file.name}`);
      }
    }
    if (newFiles.length) {
      setDraft((prev) => ({ ...prev, knowledgeFiles: [...prev.knowledgeFiles, ...newFiles] }));
      toast.success(`${newFiles.length} file(s) uploaded`);
    }
    setUploading(false);
    setUploadProgress(100);
    setUploadStatus(`Done!`);
    setTimeout(() => setUploadStatus(""), 2000);
  };

  const addManualKnowledge = () => {
    if (!manualKnowledgeName.trim() || !manualKnowledgeContent.trim()) {
      toast.error("Provide name and content");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      knowledgeFiles: [
        ...prev.knowledgeFiles,
        { name: manualKnowledgeName.trim(), content: manualKnowledgeContent.trim() },
      ],
    }));
    setManualKnowledgeName("");
    setManualKnowledgeContent("");
    toast.success("Knowledge added");
  };

  const removeKnowledgeFile = (index: number) => {
    setDraft((prev) => {
      const next = [...prev.knowledgeFiles];
      next.splice(index, 1);
      return { ...prev, knowledgeFiles: next };
    });
  };

  const parseLinesFromText = (text: string): string[] => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const result: string[] = [];
    const tocLine = lines.find((l) => /table\s+of\s+contents/i.test(l));
    if (tocLine) {
      const re = /\d+\.\s+([A-Za-z&][A-Za-z& \/-]+?)\s*\(\d+\s*products?\)/g;
      let m;
      while ((m = re.exec(tocLine)) !== null) {
        const name = m[1].trim();
        if (name && !result.includes(name)) result.push(name);
      }
    }
    if (result.length === 0) {
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+([A-Za-z].*?)(?:\s*\(.*?\))?(?:\s+(?:SKU|Price|—).*)?$/);
        if (m) {
          const name = m[1].trim();
          if (name.length < 80 && !result.includes(name)) result.push(name);
        }
      }
    }
    return result;
  };

  const uploadEditFileType = async (
    files: FileList | null,
    field: "knowledgeBase" | "trainingKnowledge" | "trainingSheet",
  ) => {
    if (!files) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    const newFiles: Array<{ name: string; content: string; url?: string }> = [];
    let combinedContent = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadStatus(`Extracting ${file.name}...`);
        const result = await parseKnowledgeFile(file, (pct) => {
          setUploadProgress(Math.round((i * 100 + pct * 0.7) / files.length));
        });
        if (!result) continue;
        combinedContent += result.text + "\n\n";
        setUploadStatus(`Uploading ${file.name}...`);
        setUploadProgress(Math.round((i * 100 + 70) / files.length));
        const dataUrl = await readFileAsDataUrl(file);
        const url = await uploadToCloudinary(file, dataUrl);
        newFiles.push({ name: file.name, content: result.text, url });
        setUploadProgress(Math.round((i * 100 + 100) / files.length));
      } catch {
        toast.error(`Failed to process ${file.name}`);
      }
    }
    if (newFiles.length) {
      const patch: any = { [field]: [...(draft as any)[field], ...newFiles] };
      if (field === "trainingSheet" && editingBot?.type === "agency") {
        const lines = parseLinesFromText(combinedContent);
        if (lines.length > 0) {
          patch.trainingSheetServices = [...new Set([...draft.trainingSheetServices, ...lines])];
          toast.success(`Loaded ${lines.length} items from training sheet!`);
        }
      }
      setDraft((prev) => ({ ...prev, ...patch }));
      toast.success(`${newFiles.length} file(s) uploaded`);
    }
    setUploading(false);
    setUploadProgress(100);
    setUploadStatus(`Done!`);
    setTimeout(() => setUploadStatus(""), 2000);
  };

  const addManualEditFileType = (
    field: "knowledgeBase" | "trainingKnowledge" | "trainingSheet",
  ) => {
    let name: string,
      content: string,
      setName: (v: string) => void,
      setContent: (v: string) => void;
    if (field === "knowledgeBase") {
      name = manualKBName;
      content = manualKBContent;
      setName = setManualKBName;
      setContent = setManualKBContent;
    } else if (field === "trainingKnowledge") {
      name = manualTKName;
      content = manualTKContent;
      setName = setManualTKName;
      setContent = setManualTKContent;
    } else {
      name = manualTSName;
      content = manualTSContent;
      setName = setManualTSName;
      setContent = setManualTSContent;
    }
    if (!name.trim() || !content.trim()) {
      toast.error("Provide name and content");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      [field]: [...(prev as any)[field], { name: name.trim(), content: content.trim() }],
    }));
    setName("");
    setContent("");
    toast.success("Added");
  };

  const removeEditFileType = (
    index: number,
    field: "knowledgeBase" | "trainingKnowledge" | "trainingSheet",
  ) => {
    setDraft((prev) => {
      const next = [...(prev as any)[field]];
      next.splice(index, 1);
      return { ...prev, [field]: next };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBot) return;
    setSavingEdit(true);
    try {
      const isAgency =
        draft.type === "agency" ||
        !!(draft.agencyEmail1 || draft.agencyEmail2 || draft.collectionDb || draft.databaseType);
      const payload: Record<string, any> = {
        flowMode: draft.flowMode,
        allowedPages: draft.allowedPages,
        type: draft.type,
        category: draft.category,
        useOwnDb: draft.useOwnDb,
        bookingMethod: draft.bookingEnabled
          ? draft.bookingMethod === "none"
            ? "chatbot"
            : draft.bookingMethod
          : "none",
        name: draft.name,
        welcome: draft.welcome,
        description: draft.description,
        logo: draft.logo ?? null,
        orderSystemEnabled: draft.orderSystemEnabled,
        productType: draft.productType,
        currency: draft.currency,
        currencySymbol: draft.currencySymbol,
        theme: {
          primaryColor: draft.primary,
          secondaryColor: draft.secondary,
          font: draft.font,
          borderRadius: draft.radius,
          bubbleStyle: draft.bubble,
          previewMode: draft.preview,
          template: draft.template,
          headerStyle: draft.headerStyle,
          textStyle: draft.textStyle,
          botBubbleColor: draft.botBubbleColor,
          botTextColor: draft.botTextColor,
          showAvatar: draft.showAvatar,
          messageFontSize: draft.messageFontSize,
          inputStyle: draft.inputStyle,
          headerSubtitle: draft.headerSubtitle,
        },
        widget: {
          launcher: draft.widgetLauncher,
          launcherText: draft.widgetLauncherText,
          launcherStyle: draft.widgetLauncherStyle,
          position: draft.widgetPosition,
          openMode: draft.widgetOpenMode,
          width: draft.widgetWidth,
          height: draft.widgetHeight,
          smartPosition: draft.widgetSmartPosition,
          customCss: draft.widgetCustomCss,
        },
        knowledge: {
          files: draft.knowledgeFiles,
          knowledgeBase: draft.knowledgeBase,
          trainingKnowledge: draft.trainingKnowledge,
          trainingSheet: draft.trainingSheet,
          extractedServices: draft.extractedServices,
          trainingSheetServices: draft.trainingSheetServices,
          trainingFlow: draft.flowMode === "auto" ? "" : draft.trainingFlow,
        },
      };

      if (isAgency) {
        payload.agency = { email1: draft.agencyEmail1 || null, email2: draft.agencyEmail2 || null };
        payload.emailNotifications = {
          ownerEmail: draft.ownerEmail.trim(),
          customerConfirmation: draft.customerConfirmation,
          senderMode: draft.senderMode,
          configId: draft.senderMode === "own" ? draft.configId : "",
        };
      }

      if (draft.databaseType) {
        payload.dbCollection = {
          type: draft.databaseType || null,
          mode: draft.databaseMode || "collection",
          uri: draft.collectionUri || null,
          db: draft.collectionDb || null,
          username: draft.collectionUsername || null,
          password: draft.collectionPassword || null,
          host: draft.collectionHost || null,
          port: draft.collectionPort || 3306,
          table: draft.collectionTable || null,
          ssl: draft.collectionSsl,
          connected: draft.collectionConnected,
          storeType: draft.collectionStoreType || null,
        };
      }

      if (draft.orderSystemEnabled && draft.productDbType) {
        payload.productCollection = {
          dbType: draft.productDbType || null,
          uri: draft.productUri || null,
          db: draft.productDb || null,
          username: draft.productUsername || null,
          password: draft.productPassword || null,
          host: draft.productHost || null,
          port: draft.productPort || 3306,
          table: draft.productTable || null,
          ssl: draft.productSsl,
          connected: draft.productConnected,
          mapping: draft.productMapping,
        };
      } else if (!draft.orderSystemEnabled) {
        payload.productCollection = null;
      }
      const res = await fetch(`/api/chatbot/${editingBot.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      const updated = mapChatbot(data.chatbot);
      update(updated.id, updated);
      toast.success(`${updated.name} updated.`);
      closeEditor();
    } catch (err: any) {
      toast.error(err.message || "Could not update");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbot/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      remove(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Generated Scripts</h1>
            <p className="text-sm text-muted-foreground">
              Your chatbots and ready-made templates — generate embed scripts for your website.
            </p>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="hidden md:inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground shadow-soft"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            How to use this
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by chatbot name…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {chatbots.length > 0 && (
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-11 rounded-xl border border-border bg-card pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                {templateOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All templates" : t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Your Chatbots */}
          {filtered.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4" /> Your Chatbots
              </h2>
              <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((b, i) => {
                  const isGen = generating[b.id];
                  const stage = genStage[b.id] || "";
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-soft shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${b.primary}, ${b.secondary})`,
                          }}
                        >
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt=""
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{b.name}</div>
                          <div className="text-xs text-muted-foreground">{b.template}</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(b.createdAt)}
                        </span>
                      </div>

                      {b.planRestricted && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                          <Shield className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="text-[11px] font-semibold text-amber-600">
                            Upgrade your plan
                          </span>
                          <Link
                            to="/plans"
                            className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 hover:underline"
                          >
                            <ArrowUpCircle className="h-3 w-3" /> Upgrade
                          </Link>
                        </div>
                      )}

                      <div className="mt-4 min-h-[60px]">
                        <AnimatePresence mode="wait">
                          {isGen ? (
                            <motion.div
                              key="gen"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm text-muted-foreground"
                            >
                              <Loader2 className="h-4 w-4 animate-spin" /> {stage}
                            </motion.div>
                          ) : b.planRestricted ? (
                            <motion.div
                              key="locked"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex h-full min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-4 text-center"
                            >
                              <Shield className="h-4 w-4 text-amber-500" />
                              <span className="text-[11px] font-medium leading-4 text-amber-600">
                                Embed script is disabled on your current plan.
                              </span>
                            </motion.div>
                          ) : b.embedScript ? (
                            <motion.div
                              key="script"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="h-[220px] overflow-y-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-[11px] leading-5 text-foreground/80"
                            >
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                <Code2 className="h-3 w-3" /> embed
                              </div>
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                                {splitEmbedScript(b.embedScript || "").tag}
                              </pre>
                              {splitEmbedScript(b.embedScript || "").css && (
                                <>
                                  <button
                                    onClick={() =>
                                      setCssOpen((prev) => ({ ...prev, [b.id]: !prev[b.id] }))
                                    }
                                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform ${cssOpen[b.id] ? "rotate-180" : ""}`}
                                    />
                                    {cssOpen[b.id] ? "Hide CSS" : "CSS (customize)"}
                                  </button>
                                  {cssOpen[b.id] && (
                                    <pre className="mt-1.5 max-h-28 overflow-y-auto overflow-x-auto whitespace-pre-wrap border-t border-border/60 pt-1.5">
                                      {splitEmbedScript(b.embedScript || "").css}
                                    </pre>
                                  )}
                                </>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="cta"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-5 text-center"
                            >
                              <Sparkles className="h-5 w-5 text-primary/80 animate-pulse mb-1" />
                              <span className="text-xs text-muted-foreground">
                                No script generated yet
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                        {b.embedScript && !isGen && !b.planRestricted && (
                          <button
                            {...(i === 0 ? { "data-tour": "step2" } : {})}
                            onClick={() => {
                              navigator.clipboard.writeText(b.embedScript || "");
                              toast.success("Copied!");
                              if (tourStep === 2) setTourStep(3);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        )}
                        {!b.planRestricted && (
                          <button
                            {...(i === 0 ? { "data-tour": "step3" } : {})}
                            onClick={() => {
                              handleGenerate(b.id, b.name);
                              if (tourStep === 3) setTourStep(4);
                            }}
                            disabled={isGen}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Sparkles className="h-3.5 w-3.5" />{" "}
                            {b.embedScript ? "Regenerate" : "Generate"}
                          </button>
                        )}
                        {b.type === "agency" && (
                          <>
                            <a
                              href="/console"
                              target="_blank"
                              rel="noreferrer"
                              title="Open analytics console (paste your console ID)"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <BarChart3 className="h-3.5 w-3.5" /> Analytics
                            </a>
                            {consoleKeys[b.id] && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(consoleKeys[b.id]);
                                  toast.success("Console ID copied!");
                                }}
                                title="Copy your private console ID"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 font-mono text-[11px] font-semibold text-blue-400 transition hover:bg-blue-500/20"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                {consoleKeys[b.id].slice(0, 11)}…
                                <Copy className="h-3 w-3 opacity-60" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          {...(i === 0 ? { "data-tour": "step5" } : {})}
                          onClick={() => {
                            setPreview(b);
                            if (tourStep === 5) setTourStep(6);
                          }}
                          className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          {...(i === 0 ? { "data-tour": "step4" } : {})}
                          disabled={b.planRestricted}
                          onClick={() => {
                            if (b.planRestricted) return;
                            openEditor(b);
                            if (tourStep === 4) setTourStep(6);
                          }}
                          title={b.planRestricted ? "Disabled on current plan" : "Edit"}
                          className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled={b.planRestricted}
                          onClick={() => {
                            if (b.planRestricted) return;
                            setDeleteTarget(b);
                          }}
                          title={b.planRestricted ? "Disabled on current plan" : "Delete"}
                          className="inline-flex items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          to="/api-keys/$botId"
                          params={{ botId: b.id }}
                          title="Open API key for this chatbot"
                          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 transition hover:bg-violet-500/20 hover:text-violet-700"
                        >
                          API Key <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ready-made Templates */}
          {templates.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Ready-made Bots
              </h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((t, i) => {
                  const isGen = generating[t.slug];
                  return (
                    <motion.div
                      key={t.slug}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft"
                    >
                      <div
                        className={`bg-gradient-to-r ${templateGradients[t.slug] || "from-primary to-indigo-600"} px-5 py-4`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{templateIcons[t.slug] || "🤖"}</span>
                          <div>
                            <h3 className="text-lg font-bold text-white">{t.name}</h3>
                            <p className="text-xs text-white/80">
                              {t.knowledge?.fileCount ?? 0} knowledge files
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(t.knowledge?.files ?? []).map((f) => (
                            <span
                              key={f.name}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                            >
                              <Code2 className="h-3 w-3" /> {f.name}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto pt-4">
                          {isGen ? (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Creating bot…
                            </div>
                          ) : (
                            <button
                              {...(i === 0 ? { "data-tour": "step1" } : {})}
                              onClick={() => handleTemplateGenerate(t.slug)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                            >
                              <Sparkles className="h-4 w-4" /> Use This Bot
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {filtered.length === 0 && templates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg">
                <Code2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold">No scripts yet</h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create your first chatbot or use a ready-made template to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="pt-2">
              <LiveBotPreview
                name={preview.name}
                welcome=""
                primary={preview.primary}
                secondary={preview.secondary}
                bubble={preview.bubble}
                radius={preview.radius}
                template={preview.template}
                logo={preview.logo}
                headerStyle={preview.headerStyle}
                textStyle={preview.textStyle}
                botBubbleColor={preview.botBubbleColor}
                botTextColor={preview.botTextColor}
                showAvatar={preview.showAvatar}
                messageFontSize={preview.messageFontSize}
                inputStyle={preview.inputStyle}
                headerSubtitle={preview.headerSubtitle}
                widgetLauncher={preview.widgetLauncher}
                widgetLauncherText={preview.widgetLauncherText}
                widgetLauncherStyle={preview.widgetLauncherStyle}
                widgetPosition={preview.widgetPosition}
                widgetOpenMode={preview.widgetOpenMode}
                widgetWidth={preview.widgetWidth}
                widgetHeight={preview.widgetHeight}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBot} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit {editingBot?.name}</DialogTitle>
          </DialogHeader>
          {draft.type === "agency" && (
            <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex min-w-max items-center gap-1">
                {editSteps.map((s, i) => {
                  const active = editStep === s.n;
                  const done = editStepIndex > i;
                  return (
                    <div key={s.n} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditStep(s.n)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : done
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full text-[9px] font-extrabold",
                            active
                              ? "bg-primary text-primary-foreground"
                              : done
                                ? "bg-emerald-500 text-white"
                                : "bg-muted",
                          )}
                        >
                          {done ? <Check className="h-2.5 w-2.5" /> : s.n}
                        </span>
                        {s.label}
                      </button>
                      {i < editSteps.length - 1 && (
                        <div className={cn("h-px w-3", done ? "bg-emerald-500/50" : "bg-border")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              {draft.type !== "agency" ? (
                <>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Bot Details
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">
                        Simple chatbot
                      </h3>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Chatbot Name
                      </label>
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Welcome Message
                      </label>
                      <input
                        value={draft.welcome}
                        onChange={(e) => setDraft((p) => ({ ...p, welcome: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Appearance
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">
                        Logo, colors & theme
                      </h3>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Logo
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {defaultIcons.map((icon, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, logo: icon }))}
                            className={`overflow-hidden rounded-xl border-2 transition-all hover:scale-105 ${draft.logo === icon ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}
                          >
                            <img
                              src={icon}
                              alt={`Default ${i}`}
                              className="h-10 w-10 object-cover"
                            />
                          </button>
                        ))}
                        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground hover:bg-muted/70 flex-1">
                          {draft.logo && !defaultIcons.includes(draft.logo) ? (
                            <img
                              src={draft.logo}
                              alt=""
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-soft text-primary">
                              <Upload className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">Upload logo</div>
                            <div className="text-xs">PNG, JPG or SVG</div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Launcher button
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          { v: "icon" as const, l: "Icon", d: "Logo icon" },
                          { v: "button" as const, l: "Button", d: "Text button" },
                        ].map((s) => (
                          <button
                            key={s.v}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, widgetLauncher: s.v }))}
                            className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2.5 text-left transition ${draft.widgetLauncher === s.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                          >
                            <span className="block text-xs font-semibold">{s.l}</span>
                            <span className="mt-0.5 block text-[10px] text-muted-foreground">
                              {s.d}
                            </span>
                          </button>
                        ))}
                      </div>
                      {draft.widgetLauncher === "button" && (
                        <div className="mt-3 space-y-3">
                          <input
                            value={draft.widgetLauncherText}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, widgetLauncherText: e.target.value }))
                            }
                            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Chat with us"
                          />
                          <div className="grid grid-cols-4 gap-2">
                            {(["rounded", "pill", "square", "soft"] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setDraft((p) => ({ ...p, widgetLauncherStyle: st }))}
                                className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition ${draft.widgetLauncherStyle === st ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-3">
                            <div
                              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
                              style={{
                                background: `linear-gradient(135deg, ${draft.primary || "#7c3aed"}, ${draft.secondary || "#db2777"})`,
                                borderRadius:
                                  draft.widgetLauncherStyle === "pill"
                                    ? 999
                                    : draft.widgetLauncherStyle === "square"
                                      ? 6
                                      : draft.widgetLauncherStyle === "soft"
                                        ? 18
                                        : 12,
                              }}
                            >
                              {draft.widgetLauncherText || "Chat with us"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Theme
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">
                        Colors & template
                      </h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                          Primary color
                        </label>
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                          <input
                            type="color"
                            value={draft.primary}
                            onChange={(e) => setDraft((p) => ({ ...p, primary: e.target.value }))}
                            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                          />
                          <input
                            value={draft.primary}
                            onChange={(e) => setDraft((p) => ({ ...p, primary: e.target.value }))}
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                          Secondary color
                        </label>
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                          <input
                            type="color"
                            value={draft.secondary}
                            onChange={(e) => setDraft((p) => ({ ...p, secondary: e.target.value }))}
                            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                          />
                          <input
                            value={draft.secondary}
                            onChange={(e) => setDraft((p) => ({ ...p, secondary: e.target.value }))}
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                          Font
                        </label>
                        <select
                          value={draft.font}
                          onChange={(e) => setDraft((p) => ({ ...p, font: e.target.value }))}
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {fonts.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                          Border radius — {draft.radius}px
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={32}
                          value={draft.radius}
                          onChange={(e) =>
                            setDraft((p) => ({ ...p, radius: Number(e.target.value) }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Bubble style
                      </label>
                      <div className="flex gap-2">
                        {bubbles.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, bubble: b.id }))}
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${draft.bubble === b.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                        Template
                      </label>
                      <select
                        value={draft.template}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, template: e.target.value as Template }))
                        }
                        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {[
                          "Modern Glass UI",
                          "Minimal AI Assistant",
                          "Floating Support Widget",
                          "Rounded Messenger Style",
                          "Neon AI Interface",
                          "Custom",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {editStep === 1 && (
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Bot identity
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            {draft.type === "agency" ? "Agency chatbot" : "Simple chatbot"}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {draft.category
                              ? `Business category: ${categoryOptions.find((item) => item.id === draft.category)?.label || draft.category}`
                              : "Choose a business category to tailor the bot context."}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.type === "agency" ? "bg-violet-500/10 text-violet-600" : "bg-emerald-500/10 text-emerald-600"}`}
                        >
                          {draft.type === "agency" ? "Agency" : "Simple"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground/80">Bot type</span>
                          <div className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 flex items-center text-sm text-muted-foreground cursor-not-allowed select-none">
                            {draft.type === "agency" ? "Agency chatbot" : "Simple chatbot"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-foreground/80">Category</span>
                          <div className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 flex items-center text-sm text-muted-foreground cursor-not-allowed select-none">
                            {categoryOptions.find((item) => item.id === draft.category)?.label ||
                              draft.category ||
                              "None"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-card/70 px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Booking / Appointment
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Tell us if you have a booking system, and how customers should book.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, bookingEnabled: true }))}
                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                              draft.bookingEnabled
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                : "border-border/60 hover:border-primary/40 bg-card"
                            }`}
                          >
                            Yes, I have a booking system
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                bookingEnabled: false,
                                bookingMethod: "none",
                                useOwnDb: false,
                              }))
                            }
                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                              !draft.bookingEnabled
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                : "border-border/60 hover:border-primary/40 bg-card"
                            }`}
                          >
                            No, use Webotme built-in
                          </button>
                        </div>

                        {draft.bookingEnabled && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              How would you like customers to book?
                            </p>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {(
                                [
                                  {
                                    id: "chatbot",
                                    icon: MessageSquareText,
                                    title: "Via Chatbot",
                                    desc: "Book by chatting with the bot",
                                  },
                                  {
                                    id: "web",
                                    icon: Globe,
                                    title: "Via Web App",
                                    desc: "Book on your web app",
                                  },
                                  {
                                    id: "both",
                                    icon: Layers,
                                    title: "Both",
                                    desc: "Chatbot and web app, both",
                                  },
                                ] as const
                              ).map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    setDraft((p) => ({
                                      ...p,
                                      bookingMethod: opt.id,
                                      useOwnDb: opt.id === "web" ? false : true,
                                    }))
                                  }
                                  className={`rounded-xl border p-3 text-left transition hover:shadow-sm ${
                                    draft.bookingMethod === opt.id
                                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                      : "border-border/60 hover:border-primary/40 bg-card"
                                  }`}
                                >
                                  <div className="mb-1 text-primary">
                                    <opt.icon className="h-4 w-4" />
                                  </div>
                                  <p className="text-xs font-semibold">{opt.title}</p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {opt.desc}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {editStep === 2 && (
                    <>
                      {/* ── Data Collection Connection (Order System) ── */}
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                              <ShoppingCart className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                Data Collection (Database)
                              </p>
                              <h3 className="text-sm font-semibold text-foreground">
                                {draft.productConnected
                                  ? "Data collection connected"
                                  : "Connect your collection"}
                              </h3>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.productConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
                          >
                            {draft.productConnected ? "Connected" : "Not connected"}
                          </span>
                        </div>

                        <p className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                          Give the connection string (URI) of your database collection below —
                          Webotme will automatically detect its columns and fetch any data from it
                          (items, products, services, bookings, etc.) to answer customers. Orders
                          you take are saved here too.
                        </p>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-foreground/80">
                            Do you want to implement an Order System?
                          </label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, orderSystemEnabled: true }))}
                              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                                draft.orderSystemEnabled
                                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                  : "border-border bg-card text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              <Check
                                className={`h-3.5 w-3.5 ${draft.orderSystemEnabled ? "opacity-100" : "opacity-0"}`}
                              />
                              Yes, enable Order System
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((p) => ({
                                  ...p,
                                  orderSystemEnabled: false,
                                  productConnected: false,
                                }))
                              }
                              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${
                                !draft.orderSystemEnabled
                                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                  : "border-border bg-card text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              <Check
                                className={`h-3.5 w-3.5 ${!draft.orderSystemEnabled ? "opacity-100" : "opacity-0"}`}
                              />
                              No, skip Order System
                            </button>
                          </div>
                        </div>

                        {draft.orderSystemEnabled && (
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-foreground/80">
                                What do you sell?
                              </label>
                              <p className="mb-2 text-[11px] text-muted-foreground">
                                Describe what you offer or the bookings customers can place — e.g.
                                Physical Products, Software, Services, Appointments. e.g. Physical
                                Products, Software, Services, Appointments.
                              </p>
                              <input
                                value={draft.productType}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, productType: e.target.value }))
                                }
                                placeholder="e.g. Physical Products, Software, Services, Appointments"
                                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold text-foreground/80">
                                Select database type
                              </label>
                              <div className="grid gap-2 md:grid-cols-3">
                                {databaseTypeOptions.map((db) => (
                                  <button
                                    key={db.id}
                                    type="button"
                                    onClick={() =>
                                      setDraft((p) => ({ ...p, productDbType: db.id as any }))
                                    }
                                    className={`rounded-xl border px-3 py-2 text-left transition ${draft.productDbType === db.id ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                                  >
                                    <div className="text-xs font-semibold">{db.label}</div>
                                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                                      {db.desc}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {draft.productDbType && (
                              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                                {draft.productDbType === "mongodb" ? (
                                  <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-foreground/80">
                                      Connection String URI
                                      <input
                                        value={draft.productUri}
                                        onChange={(e) =>
                                          setDraft((p) => ({ ...p, productUri: e.target.value }))
                                        }
                                        placeholder="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net"
                                        className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                      />
                                    </label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Database Name
                                        <input
                                          value={draft.productDb}
                                          onChange={(e) =>
                                            setDraft((p) => ({ ...p, productDb: e.target.value }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Collection Name
                                        <input
                                          value={draft.productTable}
                                          onChange={(e) =>
                                            setDraft((p) => ({
                                              ...p,
                                              productTable: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Host
                                        <input
                                          value={draft.productHost}
                                          onChange={(e) =>
                                            setDraft((p) => ({ ...p, productHost: e.target.value }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Port
                                        <input
                                          type="number"
                                          value={draft.productPort}
                                          onChange={(e) =>
                                            setDraft((p) => ({
                                              ...p,
                                              productPort: Number(e.target.value),
                                            }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Database Name
                                        <input
                                          value={draft.productDb}
                                          onChange={(e) =>
                                            setDraft((p) => ({ ...p, productDb: e.target.value }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Table Name
                                        <input
                                          value={draft.productTable}
                                          onChange={(e) =>
                                            setDraft((p) => ({
                                              ...p,
                                              productTable: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Username
                                        <input
                                          value={draft.productUsername}
                                          onChange={(e) =>
                                            setDraft((p) => ({
                                              ...p,
                                              productUsername: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                      <label className="block text-xs font-semibold text-foreground/80">
                                        Password
                                        <input
                                          type="password"
                                          value={draft.productPassword}
                                          onChange={(e) =>
                                            setDraft((p) => ({
                                              ...p,
                                              productPassword: e.target.value,
                                            }))
                                          }
                                          className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </label>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={draft.productSsl}
                                        onChange={(e) =>
                                          setDraft((p) => ({ ...p, productSsl: e.target.checked }))
                                        }
                                        className="rounded border-border"
                                      />
                                      Use SSL
                                    </label>
                                  </div>
                                )}

                                {/* Product columns — auto-detected from the collection */}
                                <DetectedCatalogColumns
                                  mapping={draft.productMapping}
                                  catalogFields={draft.catalogFields}
                                  connected={draft.productConnected}
                                  onMappingChange={(m) =>
                                    setDraft((p) => ({
                                      ...p,
                                      productMapping: { ...m, customFields: m.customFields ?? [] },
                                    }))
                                  }
                                />

                                <div className="flex items-center gap-3 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => runCatalogTest(draft, false)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                                  >
                                    <Database className="h-3.5 w-3.5" /> Test &amp; Auto-Detect
                                    Columns
                                  </button>
                                  {draft.productConnected && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                      <Check className="h-3.5 w-3.5" /> Collection Connected
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {editStep === 3 && (
                    <>
                      {/* ── Orders & Chat Storage Database Connection ── */}
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                              Orders & Chat Storage Database
                            </p>
                            <h3 className="mt-1 text-sm font-semibold text-foreground">
                              {draft.collectionConnected
                                ? "Storage collection connected"
                                : "Connect storage collection"}
                            </h3>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.collectionConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
                          >
                            {draft.collectionConnected ? "Connected" : "Pending"}
                          </span>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold text-foreground/80">
                            Select storage database type
                          </label>
                          <div className="grid gap-2 md:grid-cols-3">
                            {databaseTypeOptions.map((db) => (
                              <button
                                key={db.id}
                                type="button"
                                onClick={() =>
                                  setDraft((p) => ({
                                    ...p,
                                    databaseType: db.id as any,
                                    databaseMode: p.databaseMode || "collection",
                                  }))
                                }
                                className={`rounded-xl border px-3 py-2 text-left transition ${draft.databaseType === db.id ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}
                              >
                                <div className="text-xs font-semibold">{db.label}</div>
                                <div className="mt-0.5 text-[10px] text-muted-foreground">
                                  {db.desc}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {draft.databaseType && (
                          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                            {draft.databaseType === "mongodb" ? (
                              <div className="space-y-3">
                                <label className="block text-xs font-semibold text-foreground/80">
                                  Connection string URI
                                  <input
                                    value={draft.collectionUri}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, collectionUri: e.target.value }))
                                    }
                                    placeholder="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net"
                                    className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  />
                                </label>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Database name
                                    <input
                                      value={draft.collectionDb}
                                      onChange={(e) =>
                                        setDraft((p) => ({ ...p, collectionDb: e.target.value }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Collection name
                                    <input
                                      value={draft.collectionTable}
                                      onChange={(e) =>
                                        setDraft((p) => ({ ...p, collectionTable: e.target.value }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Host
                                    <input
                                      value={draft.collectionHost}
                                      onChange={(e) =>
                                        setDraft((p) => ({ ...p, collectionHost: e.target.value }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Port
                                    <input
                                      type="number"
                                      value={draft.collectionPort}
                                      onChange={(e) =>
                                        setDraft((p) => ({
                                          ...p,
                                          collectionPort: Number(e.target.value),
                                        }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Database name
                                    <input
                                      value={draft.collectionDb}
                                      onChange={(e) =>
                                        setDraft((p) => ({ ...p, collectionDb: e.target.value }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Table name
                                    <input
                                      value={draft.collectionTable}
                                      onChange={(e) =>
                                        setDraft((p) => ({ ...p, collectionTable: e.target.value }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Username
                                    <input
                                      value={draft.collectionUsername}
                                      onChange={(e) =>
                                        setDraft((p) => ({
                                          ...p,
                                          collectionUsername: e.target.value,
                                        }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                  <label className="block text-xs font-semibold text-foreground/80">
                                    Password
                                    <input
                                      type="password"
                                      value={draft.collectionPassword}
                                      onChange={(e) =>
                                        setDraft((p) => ({
                                          ...p,
                                          collectionPassword: e.target.value,
                                        }))
                                      }
                                      className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={draft.collectionSsl}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, collectionSsl: e.target.checked }))
                                    }
                                    className="rounded border-border"
                                  />
                                  Use SSL
                                </label>
                              </div>
                            )}

                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const body: any = {
                                    type: draft.databaseType,
                                    isProductCollection: false,
                                  };

                                  if (draft.databaseType === "mongodb") {
                                    if (
                                      !draft.collectionUri ||
                                      !draft.collectionDb ||
                                      !draft.collectionTable
                                    ) {
                                      toast.error(
                                        "Please fill Connection URI, Database Name, and Collection Name",
                                      );
                                      return;
                                    }
                                    body.uri = draft.collectionUri;
                                    body.database = draft.collectionDb;
                                    body.collection = draft.collectionTable;
                                  } else {
                                    if (
                                      !draft.collectionDb ||
                                      !draft.collectionHost ||
                                      !draft.collectionUsername ||
                                      !draft.collectionPassword ||
                                      !draft.collectionTable
                                    ) {
                                      toast.error("Please fill all collection fields first");
                                      return;
                                    }
                                    body.host = draft.collectionHost;
                                    body.port =
                                      draft.collectionPort ||
                                      (draft.databaseType === "mysql" ? 3306 : 5432);
                                    body.database = draft.collectionDb;
                                    body.user = draft.collectionUsername;
                                    body.password = draft.collectionPassword;
                                    body.table = draft.collectionTable;
                                    body.ssl = draft.collectionSsl;
                                  }

                                  const toastId = toast.loading("Testing storage connection...");
                                  try {
                                    const res = await fetch("/api/chatbot/test-collection", {
                                      method: "POST",
                                      headers: getAuthHeaders(),
                                      body: JSON.stringify(body),
                                    });
                                    const data = await res.json();
                                    if (data.connected) {
                                      setDraft((prev) => ({ ...prev, collectionConnected: true }));
                                      toast.success("Storage connection successful!", {
                                        id: toastId,
                                      });
                                    } else {
                                      setDraft((prev) => ({ ...prev, collectionConnected: false }));
                                      toast.error(data.message || "Connection failed", {
                                        id: toastId,
                                      });
                                    }
                                  } catch (err: any) {
                                    setDraft((prev) => ({ ...prev, collectionConnected: false }));
                                    toast.error(err.message || "Connection test failed", {
                                      id: toastId,
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                              >
                                <Database className="h-3.5 w-3.5" /> Test Storage Connection
                              </button>
                              {draft.collectionConnected && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                  <Check className="h-3.5 w-3.5" /> Storage Connected
                                </span>
                              )}
                            </div>

                            <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                              <label className="mb-1 block text-xs font-semibold text-foreground/80">
                                Storage target
                              </label>
                              <select
                                value={draft.collectionStoreType}
                                onChange={(e) =>
                                  setDraft((p) => ({
                                    ...p,
                                    collectionStoreType: e.target.value as any,
                                  }))
                                }
                                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="">Select storage target purpose…</option>
                                <option value="user_chat">
                                  User Chat (Store user messages & chat logs)
                                </option>
                                <option value="all_orders">
                                  All Orders (Store booking orders & product purchases)
                                </option>
                                <option value="agent_contact">
                                  Real-time Agent Contact (Store support escalations)
                                </option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {draft.orderSystemEnabled && <StripeConnectCard compact />}
                    </>
                  )}
                  {editStep === 4 && (
                    <>
                      {/* ── Connected Database Sync Banner ── */}
                      {(draft.collectionConnected ||
                        draft.collectionTable ||
                        draft.collectionUri) && (
                        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shrink-0 shadow-md shadow-primary/20">
                              <Database className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                                  Connected Database
                                </span>
                                <span className="rounded-md bg-card border border-border px-2 py-0.5 text-xs font-mono font-bold text-foreground">
                                  {draft.collectionTable || "Storage Collection"}
                                </span>
                                {draft.collectionConnected && (
                                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Live Connected
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                AI inspects your collection schema, detects whether it is a product
                                catalog with brand/price fields, auto-extracts categories, and
                                builds a customized ordering flow.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={syncingDB}
                            onClick={syncCategoriesAndFlowFromDB}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 transition shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className={cn("h-4 w-4", syncingDB && "animate-spin")} />
                            {syncingDB
                              ? "Analyzing DB Schema..."
                              : "✨ AI Auto-Detect & Build Flow"}
                          </button>
                        </div>
                      )}

                      {/* ── Detected DB Schema Chips ── */}
                      {dbSchemaMeta && (
                        <div className="rounded-xl border border-border/80 bg-card p-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            AI Schema Analysis:
                          </span>
                          <span
                            className={cn(
                              "rounded-lg px-2 py-0.5 font-semibold text-[11px] border",
                              dbSchemaMeta.isProductCatalog
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : "border-violet-500/30 bg-violet-500/10 text-violet-600",
                            )}
                          >
                            {dbSchemaMeta.isProductCatalog
                              ? "🛒 Product Catalog"
                              : "📅 Service / Booking"}
                          </span>
                          {dbSchemaMeta.hasBrand && (
                            <span className="rounded-lg px-2 py-0.5 font-semibold text-[11px] border border-blue-500/30 bg-blue-500/10 text-blue-600">
                              🏷️ Brand Field Detected
                            </span>
                          )}
                          {dbSchemaMeta.hasPrice && (
                            <span className="rounded-lg px-2 py-0.5 font-semibold text-[11px] border border-amber-500/30 bg-amber-500/10 text-amber-600">
                              💲 Price Field Detected
                            </span>
                          )}
                          {dbSchemaMeta.hasImage && (
                            <span className="rounded-lg px-2 py-0.5 font-semibold text-[11px] border border-indigo-500/30 bg-indigo-500/10 text-indigo-600">
                              🖼️ Image Field Detected
                            </span>
                          )}
                          {dbSchemaMeta.sampleCount > 0 && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              Sampled {dbSchemaMeta.sampleCount} live records
                            </span>
                          )}
                        </div>
                      )}

                      {/* ── Flow Mode Toggle (Custom vs Auto) ── */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {draft.flowMode !== "auto" && (
                          <button
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, flowMode: "custom" }))}
                            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                              draft.flowMode === "custom"
                                ? "border-primary bg-primary/10 ring-1 ring-primary"
                                : "border-border/60 bg-card hover:bg-accent"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="h-4 w-4" />
                              </span>
                              Custom Flow
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Pick a built-in journey — E-Commerce, Service Booking, Book a Table,
                              etc.
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              flowMode: "auto",
                              trainingFlow: "",
                            }))
                          }
                          className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                            draft.flowMode === "auto"
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border/60 bg-card hover:bg-accent"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                              <Zap className="h-4 w-4" />
                            </span>
                            Auto Flow
                          </span>
                          <span className="text-xs text-muted-foreground">
                            AI analyzes your website live — reads slots, alerts, buttons and fills
                            forms itself.
                          </span>
                        </button>
                      </div>

                      {draft.flowMode === "auto" && (
                        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold">Show on pages</h3>
                              <p className="text-[11px] text-muted-foreground">
                                Comma-separated path prefixes. Leave empty to show everywhere.
                              </p>
                            </div>
                          </div>
                          <input
                            value={draft.allowedPages.join(",")}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                allowedPages: e.target.value
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              }))
                            }
                            placeholder="/booking,/contact (blank = all pages)"
                            className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}

                      {/* ── Auto Flow Summary (detected live website data) ── */}
                      {draft.flowMode === "auto" && (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                          <div className="flex items-start gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                  Auto Flow is Active
                                </h3>
                                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                  {autoFlowScan?.status || "scanning"}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                This bot does <b>not</b> use a fixed chat flow. It reads your live
                                website (pages, buttons, forms, wizard steps) and drives visitors
                                through the real steps on the page. Below is the data detected for
                                this bot.
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-border/60 bg-card/70 p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Pages Detected
                              </span>
                              <p className="mt-0.5 text-sm font-bold">
                                {autoFlowScan?.totalPagesFound ?? autoFlowScan?.pages ?? 0}
                              </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card/70 p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Flows Detected
                              </span>
                              <p className="mt-0.5 text-sm font-bold">
                                {autoFlowScan?.flowsDetected?.length ?? 0}
                              </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card/70 p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Pages Active On
                              </span>
                              <p className="mt-0.5 text-sm font-bold truncate">
                                {draft.allowedPages.length > 0
                                  ? draft.allowedPages.join(", ")
                                  : "All pages"}
                              </p>
                            </div>
                          </div>

                          {autoFlowScan?.flowsDetected?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Auto-flow steps this bot follows
                              </span>
                              {autoFlowScan.flowsDetected
                                .slice(0, 8)
                                .map((f: string, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2"
                                  >
                                    <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                    <span className="text-xs font-medium">{f}</span>
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="mt-3">
                            <Link
                              to="/admin/scan-status/$botId"
                              params={{ botId: editingBot?.id || "" }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                            >
                              View full scan status <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {draft.flowMode === "custom" && (
                        <>
                          {/* ── Default Flow Library Section ── */}
                          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Layers className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold">Default Flow Library</h3>
                                <p className="text-[11px] text-muted-foreground">
                                  Pick a built-in journey (saved as knowledge.trainingFlow) — the
                                  widget runs it end-to-end in chat. Selecting a flow overwrites the
                                  flow below.
                                </p>
                              </div>
                            </div>

                            {flowsLoading ? (
                              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card p-3 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading default
                                flows…
                              </div>
                            ) : (
                              <>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  <button
                                    type="button"
                                    onClick={() => selectFlow(null)}
                                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${activeFlowSlug === null && !draft.trainingFlow ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border/70 bg-card hover:bg-accent"}`}
                                  >
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                                        <Layers className="h-3.5 w-3.5" />
                                      </span>
                                      No Flow
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      Knowledge-only answers
                                    </span>
                                  </button>

                                  {defaultFlows.map((f) => {
                                    const active = activeFlowSlug === f.slug;
                                    return (
                                      <button
                                        key={f.slug}
                                        type="button"
                                        onClick={() => selectFlow(f)}
                                        className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border/70 bg-card hover:bg-accent"}`}
                                      >
                                        <span className="text-sm font-semibold flex items-center gap-2">
                                          <span
                                            className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${f.tone || "from-violet-500 to-indigo-500"} text-white`}
                                          >
                                            <Sparkles className="h-3.5 w-3.5" />
                                          </span>
                                          {f.name}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {f.tagline}
                                        </span>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                          {f.stepsCount ?? "?"} steps
                                          {f.flowKind === "multi-category"
                                            ? " · multi-category"
                                            : ""}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {selectedFlow && flowPreview && (
                                  <div className="mt-4 rounded-xl border border-primary/25 bg-card p-4">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        {selectedFlow.name} — Flow Preview
                                      </h4>
                                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                        {flowPreview.categories.length > 0
                                          ? `categories: ${flowPreview.categories.join(" · ")}`
                                          : `${flowPreview.steps.length} steps`}
                                      </span>
                                    </div>
                                    {diagramFlow ? (
                                      <div className="mt-4">
                                        <FlowDiagram flow={diagramFlow} height={420} />
                                      </div>
                                    ) : (
                                      <ol className="mt-3 space-y-2">
                                        {flowPreview.steps.map((s, i) => (
                                          <li
                                            key={s.id ?? i}
                                            className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                                          >
                                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                              {i + 1}
                                            </span>
                                            <span className="flex-1">
                                              <span className="block text-sm font-medium">
                                                {s.title}
                                              </span>
                                              <span className="block text-[11px] text-muted-foreground">
                                                {s.type === "selection"
                                                  ? "Choose an option"
                                                  : s.type === "form"
                                                    ? `Ask: ${(s.fields || []).map((fd) => fd.label).join(", ") || "enter details"}`
                                                    : "Confirm"}
                                              </span>
                                            </span>
                                          </li>
                                        ))}
                                      </ol>
                                    )}
                                    {selectedFlow.welcome ? (
                                      <p className="mt-3 text-[11px] text-muted-foreground">
                                        Welcome: {selectedFlow.welcome}
                                      </p>
                                    ) : null}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* ── Training Sheet Files & File Categories Section ── */}
                          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                  Training Data & Categories
                                </p>
                                <h3 className="text-sm font-semibold text-foreground">
                                  Training Sheet Files & File Categories
                                </h3>
                              </div>
                            </div>

                            {/* Uploaded Training Files List */}
                            {((draft.trainingSheet && draft.trainingSheet.length > 0) ||
                              (draft.knowledgeFiles && draft.knowledgeFiles.length > 0)) && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground/80">
                                  Uploaded Training Files
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    ...(draft.trainingSheet || []),
                                    ...(draft.knowledgeFiles || []),
                                  ].map((file, fIdx) => (
                                    <div
                                      key={fIdx}
                                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-xs"
                                    >
                                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="font-medium truncate max-w-[220px]">
                                        {file.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* File Categories List */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground/80">
                                  File Categories (
                                  {
                                    [
                                      ...new Set([
                                        ...(draft.trainingSheetServices || []),
                                        ...(draft.extractedServices || []),
                                      ]),
                                    ].length
                                  }
                                  )
                                </label>
                                <div className="flex items-center gap-2">
                                  {(draft.collectionConnected ||
                                    draft.collectionTable ||
                                    draft.collectionUri) && (
                                    <button
                                      type="button"
                                      disabled={syncingDB}
                                      onClick={syncCategoriesAndFlowFromDB}
                                      className="inline-flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer shadow-xs"
                                      title="Fetch categories from your database"
                                    >
                                      <Sparkles className="h-3 w-3" />
                                      {syncingDB ? "Syncing..." : "Sync from DB"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const newCatName = "New Category";
                                      const isServiceBooking = isServiceBookingFlowJson(
                                        draft.trainingFlow,
                                      );
                                      setDraft((prev) => {
                                        const currentList = [
                                          ...new Set([
                                            ...(prev.trainingSheetServices || []),
                                            ...(prev.extractedServices || []),
                                          ]),
                                        ];
                                        const updated = [...currentList, newCatName];
                                        const flowStr = prev.trainingFlow || "{}";
                                        let flowObj: any = {};
                                        try {
                                          flowObj = JSON.parse(flowStr);
                                        } catch {}
                                        // Service-booking bots get a service-style placeholder
                                        // (the runtime AI expands each chosen service anyway);
                                        // e-commerce bots keep the product/quantity flow.
                                        // Build category-specific flow
                                        const catFlow = isServiceBooking
                                          ? {
                                              steps: [
                                                {
                                                  id: "step_1",
                                                  title: "Choose a Service",
                                                  type: "selection",
                                                  fields: [
                                                    {
                                                      name: "service",
                                                      label: "Service",
                                                      type: "text",
                                                      options: ["Basic", "Standard", "Premium"],
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_2",
                                                  title: "Pick a Slot",
                                                  type: "selection",
                                                  fields: [
                                                    {
                                                      name: "slot",
                                                      label: "Slot",
                                                      type: "text",
                                                      options: [
                                                        "Today 3:00 PM",
                                                        "Tomorrow 10:00 AM",
                                                        "Friday 4:30 PM",
                                                      ],
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_3",
                                                  title: "Your Name",
                                                  type: "form",
                                                  fields: [
                                                    {
                                                      name: "fullName",
                                                      label: "Full Name",
                                                      type: "text",
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_4",
                                                  title: "Phone Number",
                                                  type: "form",
                                                  fields: [
                                                    {
                                                      name: "phone",
                                                      label: "Phone Number",
                                                      type: "tel",
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_5",
                                                  title: "Payment Method",
                                                  type: "selection",
                                                  fields: [
                                                    {
                                                      name: "paymentMethod",
                                                      label: "Payment Method",
                                                      type: "checkbox",
                                                      options: [
                                                        "Cash on Delivery",
                                                        "Online Payment",
                                                      ],
                                                      required: true,
                                                      allowSkip: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_6",
                                                  title: "Confirmation",
                                                  type: "confirmation",
                                                  fields: [],
                                                },
                                              ],
                                            }
                                          : {
                                              steps: [
                                                {
                                                  id: "step_1",
                                                  title: "Order Details",
                                                  type: "form",
                                                  fields: [
                                                    {
                                                      name: "product",
                                                      label: "Product Name",
                                                      type: "text",
                                                      required: true,
                                                    },
                                                    {
                                                      name: "quantity",
                                                      label: "Quantity",
                                                      type: "number",
                                                      required: true,
                                                    },
                                                    {
                                                      name: "price",
                                                      label: "Price",
                                                      type: "number",
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_2",
                                                  title: "Customer Details",
                                                  type: "form",
                                                  fields: [
                                                    {
                                                      name: "fullName",
                                                      label: "Full Name",
                                                      type: "text",
                                                      required: true,
                                                    },
                                                    {
                                                      name: "phone",
                                                      label: "Phone Number",
                                                      type: "tel",
                                                      required: true,
                                                    },
                                                    {
                                                      name: "email",
                                                      label: "Email Address",
                                                      type: "email",
                                                      required: true,
                                                    },
                                                    {
                                                      name: "address",
                                                      label: "Full Address",
                                                      type: "text",
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_3",
                                                  title: "Payment Method",
                                                  type: "selection",
                                                  fields: [
                                                    {
                                                      name: "paymentMethod",
                                                      label: "Payment Method",
                                                      type: "checkbox",
                                                      options: [
                                                        "Cash on Delivery",
                                                        "Online Payment",
                                                      ],
                                                      required: true,
                                                    },
                                                  ],
                                                },
                                                {
                                                  id: "step_4",
                                                  title: "Confirmation",
                                                  type: "confirmation",
                                                  fields: [],
                                                },
                                              ],
                                            };
                                        // Add to multi-category flows or convert legacy format
                                        if (flowObj.steps) {
                                          // Legacy single flow → convert to multi-flow
                                          flowObj = {};
                                        }
                                        flowObj[newCatName] = catFlow;
                                        return {
                                          ...prev,
                                          trainingSheetServices: updated,
                                          extractedServices: updated,
                                          trainingFlow: JSON.stringify(flowObj, null, 2),
                                        };
                                      });
                                      // Try to auto-generate via API for better flow
                                      try {
                                        const res = await fetch("/api/orders/generate-flow", {
                                          method: "POST",
                                          headers: getAuthHeaders(),
                                          body: JSON.stringify({
                                            category: newCatName,
                                            services: [newCatName],
                                            flowHint: isServiceBooking ? "service" : undefined,
                                          }),
                                        });
                                        if (res.ok) {
                                          const data = await res.json();
                                          if (data.flow) {
                                            setDraft((prev) => {
                                              let flowObj: any = {};
                                              try {
                                                flowObj = JSON.parse(prev.trainingFlow || "{}");
                                              } catch {}
                                              flowObj[newCatName] = data.flow;
                                              return {
                                                ...prev,
                                                trainingFlow: JSON.stringify(flowObj, null, 2),
                                              };
                                            });
                                          }
                                        }
                                      } catch {}
                                      toast.success(`Flow auto-generated for "${newCatName}"`);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                                  >
                                    + Add Category
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {[
                                  ...new Set([
                                    ...(draft.trainingSheetServices || []),
                                    ...(draft.extractedServices || []),
                                  ]),
                                ].map((catName, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-extrabold text-muted-foreground border">
                                      {idx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={catName}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const oldName = catName;
                                        setDraft((prev) => {
                                          const currentList = [
                                            ...new Set([
                                              ...(prev.trainingSheetServices || []),
                                              ...(prev.extractedServices || []),
                                            ]),
                                          ];
                                          currentList[idx] = val;
                                          // Also rename the flow key
                                          let flowObj: any = {};
                                          try {
                                            flowObj = JSON.parse(prev.trainingFlow || "{}");
                                          } catch {}
                                          if (flowObj[oldName] && oldName !== val) {
                                            flowObj[val] = flowObj[oldName];
                                            delete flowObj[oldName];
                                          }
                                          return {
                                            ...prev,
                                            trainingSheetServices: currentList,
                                            extractedServices: currentList,
                                            trainingFlow: JSON.stringify(flowObj, null, 2),
                                          };
                                        });
                                      }}
                                      className="h-9 flex-1 rounded-xl border border-border bg-card px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraft((prev) => {
                                          const currentList = [
                                            ...new Set([
                                              ...(prev.trainingSheetServices || []),
                                              ...(prev.extractedServices || []),
                                            ]),
                                          ];
                                          const removedCat = currentList[idx];
                                          currentList.splice(idx, 1);
                                          // Also remove its flow from trainingFlow
                                          let flowObj: any = {};
                                          try {
                                            flowObj = JSON.parse(prev.trainingFlow || "{}");
                                          } catch {}
                                          if (flowObj[removedCat]) {
                                            delete flowObj[removedCat];
                                          }
                                          return {
                                            ...prev,
                                            trainingSheetServices: currentList,
                                            extractedServices: currentList,
                                            trainingFlow: JSON.stringify(flowObj, null, 2),
                                          };
                                        });
                                      }}
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                                      title="Remove Category"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {[
                                  ...new Set([
                                    ...(draft.trainingSheetServices || []),
                                    ...(draft.extractedServices || []),
                                  ]),
                                ].length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">
                                    No file categories found. Click "+ Add Category" to create one.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ── Flow Builder ── */}
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" /> Visual Flow Builder
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Customize journey steps or auto-generate with Groq / Gemini AI
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={generatingFlow}
                                onClick={generateAIFlowWithGroqGemini}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                {generatingFlow ? "Generating Flow..." : "AI Auto-Generate Flow"}
                              </button>
                            </div>
                            <FlowBuilder
                              trainingFlow={draft.trainingFlow}
                              onChange={(json) => setDraft((p) => ({ ...p, trainingFlow: json }))}
                              onServiceOptionsChange={(opts) =>
                                setDraft((p) => ({
                                  ...p,
                                  trainingSheetServices: opts,
                                  extractedServices: opts,
                                }))
                              }
                            />
                          </div>

                          <details className="group rounded-xl border border-border/60 bg-card/40 p-3">
                            <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition list-none">
                              <Braces className="h-4 w-4" />
                              <span>Advanced Flow JSON &amp; Raw Schema</span>
                              <ChevronRight className="h-3.5 w-3.5 ml-auto transition-transform group-open:rotate-90" />
                            </summary>
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={draft.trainingFlow}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, trainingFlow: e.target.value }))
                                }
                                placeholder="Paste or edit flow JSON here..."
                                rows={6}
                                className="min-h-[140px] w-full rounded-xl border border-border bg-card p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                              />
                              <p className="text-[11px] text-muted-foreground">
                                Direct edits to this JSON are synced instantly to the visual
                                builder.
                              </p>
                            </div>
                          </details>
                        </>
                      )}
                    </>
                  )}
                  {editStep === 5 && (
                    <>
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Bot Details</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Chatbot Name
                            </label>
                            <input
                              value={draft.name}
                              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Welcome Message
                            </label>
                            <input
                              value={draft.welcome}
                              onChange={(e) => setDraft((p) => ({ ...p, welcome: e.target.value }))}
                              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>

                        {/* ── Display Currency Dropdown Selection ── */}
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <label className="text-xs font-bold text-foreground">
                              Chatbot Display Currency
                            </label>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Select the currency to format product prices shown in the chatbot window
                            (e.g. USD $, PKR Rs, EUR €, GBP £, AED, SAR).
                          </p>
                          <select
                            value={draft.currency}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = CURRENCY_LIST.find(
                                (c) => c.name === val || c.code === val,
                              );
                              setDraft((p) => ({
                                ...p,
                                currency: val,
                                currencySymbol: matched?.symbol || "$",
                              }));
                            }}
                            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {CURRENCY_LIST.map((c) => (
                              <option key={c.code} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {draft.orderSystemEnabled && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Agency Email 1
                                </label>
                                <input
                                  type="email"
                                  value={draft.agencyEmail1 || ""}
                                  onChange={(e) =>
                                    setDraft((p) => ({ ...p, agencyEmail1: e.target.value }))
                                  }
                                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Agency Email 2
                                </label>
                                <input
                                  type="email"
                                  value={draft.agencyEmail2 || ""}
                                  onChange={(e) =>
                                    setDraft((p) => ({ ...p, agencyEmail2: e.target.value }))
                                  }
                                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Order emails will be received on these emails in any order. You can
                              add any other email of your choice — except the email used to create
                              this account, which already receives orders.
                            </p>
                          </>
                        )}
                        <details className="group">
                          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                            <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                            Advanced: Custom Design
                          </summary>
                          <div className="mt-4 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Header style
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {["gradient", "solid", "glass"].map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() =>
                                        setDraft((p) => ({ ...p, headerStyle: s as any }))
                                      }
                                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.headerStyle === s ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Message size
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { v: "sm", l: "Small" },
                                    { v: "md", l: "Medium" },
                                    { v: "lg", l: "Large" },
                                  ].map((s) => (
                                    <button
                                      key={s.v}
                                      type="button"
                                      onClick={() =>
                                        setDraft((p) => ({ ...p, messageFontSize: s.v as any }))
                                      }
                                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.messageFontSize === s.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
                                    >
                                      {s.l}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Bot bubble color
                                </label>
                                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                                  <input
                                    type="color"
                                    value={draft.botBubbleColor}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, botBubbleColor: e.target.value }))
                                    }
                                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                                  />
                                  <input
                                    value={draft.botBubbleColor}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, botBubbleColor: e.target.value }))
                                    }
                                    className="flex-1 bg-transparent text-sm focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Bot text color
                                </label>
                                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                                  <input
                                    type="color"
                                    value={draft.botTextColor}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, botTextColor: e.target.value }))
                                    }
                                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                                  />
                                  <input
                                    value={draft.botTextColor}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, botTextColor: e.target.value }))
                                    }
                                    className="flex-1 bg-transparent text-sm focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Show avatar
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={draft.showAvatar}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, showAvatar: e.target.checked }))
                                    }
                                    className="rounded border-border"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    Display bot avatar
                                  </span>
                                </label>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Header subtitle
                                </label>
                                <input
                                  value={draft.headerSubtitle}
                                  onChange={(e) =>
                                    setDraft((p) => ({ ...p, headerSubtitle: e.target.value }))
                                  }
                                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                Text style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: "default" as const, l: "Default" },
                                  { id: "bold" as const, l: "Bold" },
                                  { id: "italic" as const, l: "Italic" },
                                  { id: "romantic" as const, l: "Romantic" },
                                  { id: "playful" as const, l: "Playful" },
                                  { id: "elegant" as const, l: "Elegant" },
                                ].map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setDraft((p) => ({ ...p, textStyle: s.id }))}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${draft.textStyle === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                                  >
                                    {s.l}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </details>
                        <details className="group">
                          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                            <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                            Widget Behaviour (launcher, position, open mode)
                          </summary>
                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                Launcher style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { v: "icon" as const, l: "Icon only" },
                                  { v: "button" as const, l: "Text button" },
                                ].map((s) => (
                                  <button
                                    key={s.v}
                                    type="button"
                                    onClick={() => setDraft((p) => ({ ...p, widgetLauncher: s.v }))}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.widgetLauncher === s.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
                                  >
                                    {s.l}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {draft.widgetLauncher === "button" && (
                              <div>
                                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                  Button text
                                </label>
                                <input
                                  value={draft.widgetLauncherText}
                                  onChange={(e) =>
                                    setDraft((p) => ({ ...p, widgetLauncherText: e.target.value }))
                                  }
                                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  placeholder="Chat with us"
                                />
                                <div className="mt-3">
                                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                    Button style
                                  </label>
                                  <div className="grid grid-cols-4 gap-2">
                                    {(["rounded", "pill", "square", "soft"] as const).map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() =>
                                          setDraft((p) => ({ ...p, widgetLauncherStyle: st }))
                                        }
                                        className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition ${draft.widgetLauncherStyle === st ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-4">
                                  <div
                                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all"
                                    style={{
                                      background: `linear-gradient(135deg, ${draft.primary || "#7c3aed"}, ${draft.secondary || "#db2777"})`,

                                      borderRadius:
                                        draft.widgetLauncherStyle === "pill"
                                          ? 999
                                          : draft.widgetLauncherStyle === "square"
                                            ? 6
                                            : draft.widgetLauncherStyle === "soft"
                                              ? 18
                                              : 12,
                                    }}
                                  >
                                    {draft.widgetLauncherText || "Chat with us"}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                Launcher position
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {(
                                  ["bottom-right", "bottom-left", "top-right", "top-left"] as const
                                ).map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setDraft((d) => ({ ...d, widgetPosition: p }))}
                                    className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition ${draft.widgetPosition === p ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                                  >
                                    {p.replace("-", " ")}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                Open mode
                              </label>
                              <div className="grid gap-2 md:grid-cols-2">
                                {[
                                  {
                                    v: "overlay" as const,
                                    l: "Popup window",
                                    d: "Floats over the page",
                                  },
                                  {
                                    v: "sidebar" as const,
                                    l: "Side panel",
                                    d: "Page shrinks, panel slides from side",
                                  },
                                  {
                                    v: "fullscreen" as const,
                                    l: "Fullscreen",
                                    d: "Covers the whole screen",
                                  },
                                  {
                                    v: "newtab" as const,
                                    l: "New tab",
                                    d: "Opens chat in a new tab",
                                  },
                                ].map((s) => (
                                  <button
                                    key={s.v}
                                    type="button"
                                    onClick={() => setDraft((p) => ({ ...p, widgetOpenMode: s.v }))}
                                    className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${draft.widgetOpenMode === s.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                                  >
                                    <span className="block font-semibold">{s.l}</span>
                                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                      {s.d}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.widgetSmartPosition}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, widgetSmartPosition: e.target.checked }))
                                }
                                className="rounded border-border"
                              />
                              Smart opening direction (panel opens towards the free space
                              automatically)
                            </label>
                            {draft.widgetOpenMode === "overlay" && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                    Panel width — {draft.widgetWidth}px
                                  </label>
                                  <input
                                    type="range"
                                    min={280}
                                    max={700}
                                    value={draft.widgetWidth}
                                    onChange={(e) =>
                                      setDraft((p) => ({
                                        ...p,
                                        widgetWidth: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                    Panel height — {draft.widgetHeight}px
                                  </label>
                                  <input
                                    type="range"
                                    min={360}
                                    max={900}
                                    value={draft.widgetHeight}
                                    onChange={(e) =>
                                      setDraft((p) => ({
                                        ...p,
                                        widgetHeight: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                                Custom CSS (advanced)
                              </label>
                              <textarea
                                value={draft.widgetCustomCss}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, widgetCustomCss: e.target.value }))
                                }
                                className="min-h-20 w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                placeholder={
                                  "/** Move / resize the widget from your site **/\n#rover-chatbot-frame { width: 480px; height: 640px; }\n#rover-chatbot-bubble { bottom: 80px; right: 40px; }"
                                }
                              />
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                These styles are injected with the widget script — no extra CSS
                                needed on your site.
                              </p>
                            </div>
                          </div>
                        </details>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Description
                          </label>
                          <textarea
                            value={draft.description}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((p) => ({
                                ...p,
                                description: v,
                                extractedServices: p.extractedServices?.length
                                  ? p.extractedServices
                                  : parseServicesFromDescription(v),
                              }));
                            }}
                            rows={3}
                            className="min-h-[88px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        {!isTemplateBot && (
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Logo
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              {defaultIcons.map((icon, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setDraft((p) => ({ ...p, logo: icon }))}
                                  className={`overflow-hidden rounded-xl border-2 transition-all hover:scale-105 ${draft.logo === icon ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}
                                >
                                  <img
                                    src={icon}
                                    alt={`Default ${i}`}
                                    className="h-10 w-10 object-cover"
                                  />
                                </button>
                              ))}
                              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground hover:bg-muted/70 flex-1">
                                {draft.logo && !defaultIcons.includes(draft.logo) ? (
                                  <img
                                    src={draft.logo}
                                    alt=""
                                    className="h-14 w-14 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-soft text-primary">
                                    <Upload className="h-5 w-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-foreground">Upload logo</div>
                                  <div className="text-xs">PNG, JPG or SVG</div>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Theme</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Primary color
                            </label>
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                              <input
                                type="color"
                                value={draft.primary}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, primary: e.target.value }))
                                }
                                className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                              />
                              <input
                                value={draft.primary}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, primary: e.target.value }))
                                }
                                className="flex-1 bg-transparent text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Secondary color
                            </label>
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                              <input
                                type="color"
                                value={draft.secondary}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, secondary: e.target.value }))
                                }
                                className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                              />
                              <input
                                value={draft.secondary}
                                onChange={(e) =>
                                  setDraft((p) => ({ ...p, secondary: e.target.value }))
                                }
                                className="flex-1 bg-transparent text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Font
                            </label>
                            <select
                              value={draft.font}
                              onChange={(e) => setDraft((p) => ({ ...p, font: e.target.value }))}
                              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {fonts.map((f) => (
                                <option key={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                              Border radius — {draft.radius}px
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={32}
                              value={draft.radius}
                              onChange={(e) =>
                                setDraft((p) => ({ ...p, radius: Number(e.target.value) }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Bubble style
                          </label>
                          <div className="flex gap-2">
                            {bubbles.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setDraft((p) => ({ ...p, bubble: b.id }))}
                                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${draft.bubble === b.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                              >
                                {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Template
                          </label>
                          <select
                            value={draft.template}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, template: e.target.value as Template }))
                            }
                            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {[
                              "Modern Glass UI",
                              "Minimal AI Assistant",
                              "Floating Support Widget",
                              "Rounded Messenger Style",
                              "Neon AI Interface",
                              "Custom",
                            ].map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {editStep === 6 && (
                    <>
                      {!isTemplateBot && (
                        <div className="space-y-6">
                          <h2 className="text-lg font-semibold">Training Knowledge</h2>

                          {/* ── Existing Knowledge Files ── */}
                          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <h3 className="text-sm font-semibold mb-2">General Knowledge Files</h3>
                            {draft.knowledgeFiles.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {draft.knowledgeFiles.map((f, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                                  >
                                    <button
                                      onClick={() => setSelectedFileForView(f)}
                                      className="min-w-0 flex-1 truncate text-left text-xs font-mono hover:text-primary"
                                    >
                                      {f.name}
                                    </button>
                                    <button
                                      onClick={() => removeKnowledgeFile(idx)}
                                      className="shrink-0 text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                value={manualKnowledgeName}
                                onChange={(e) => setManualKnowledgeName(e.target.value)}
                                placeholder="File name"
                                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                onClick={addManualKnowledge}
                                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                              >
                                Add
                              </button>
                            </div>
                            <textarea
                              value={manualKnowledgeContent}
                              onChange={(e) => setManualKnowledgeContent(e.target.value)}
                              placeholder="Paste knowledge content here…"
                              rows={3}
                              className="mt-2 min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground hover:bg-muted/70">
                              <Upload className="h-4 w-4" /> Upload PDF, DOCX, or TXT files
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.json"
                                className="hidden"
                                onChange={(e) => addKnowledgeFiles(e.target.files)}
                              />
                            </label>
                          </div>

                          {/* ── Knowledge Base ── */}
                          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <h3 className="text-sm font-semibold mb-2">Knowledge Base Files</h3>
                            {draft.knowledgeBase.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {draft.knowledgeBase.map((f, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                                  >
                                    <span className="flex-1 truncate text-xs font-mono">
                                      {f.name}
                                    </span>
                                    <button
                                      onClick={() => handleViewFile(f)}
                                      className="shrink-0 text-muted-foreground hover:text-primary"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeEditFileType(idx, "knowledgeBase")}
                                      className="shrink-0 text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                value={manualKBName}
                                onChange={(e) => setManualKBName(e.target.value)}
                                placeholder="File name"
                                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                onClick={() => addManualEditFileType("knowledgeBase")}
                                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                              >
                                Add
                              </button>
                            </div>
                            <textarea
                              value={manualKBContent}
                              onChange={(e) => setManualKBContent(e.target.value)}
                              placeholder="Paste knowledge base content here…"
                              rows={3}
                              className="mt-2 min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground hover:bg-muted/70">
                              <Upload className="h-4 w-4" /> Upload PDF, DOCX, or TXT files
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.json"
                                className="hidden"
                                onChange={(e) =>
                                  uploadEditFileType(e.target.files, "knowledgeBase")
                                }
                              />
                            </label>
                          </div>

                          {/* ── Training Knowledge ── */}
                          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <h3 className="text-sm font-semibold mb-2">Training Knowledge Files</h3>
                            {draft.trainingKnowledge.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {draft.trainingKnowledge.map((f, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                                  >
                                    <span className="flex-1 truncate text-xs font-mono">
                                      {f.name}
                                    </span>
                                    <button
                                      onClick={() => handleViewFile(f)}
                                      className="shrink-0 text-muted-foreground hover:text-primary"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeEditFileType(idx, "trainingKnowledge")}
                                      className="shrink-0 text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                value={manualTKName}
                                onChange={(e) => setManualTKName(e.target.value)}
                                placeholder="File name"
                                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                onClick={() => addManualEditFileType("trainingKnowledge")}
                                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                              >
                                Add
                              </button>
                            </div>
                            <textarea
                              value={manualTKContent}
                              onChange={(e) => setManualTKContent(e.target.value)}
                              placeholder="Paste training knowledge content here…"
                              rows={3}
                              className="mt-2 min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground hover:bg-muted/70">
                              <Upload className="h-4 w-4" /> Upload PDF, DOCX, or TXT files
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.json"
                                className="hidden"
                                onChange={(e) =>
                                  uploadEditFileType(e.target.files, "trainingKnowledge")
                                }
                              />
                            </label>
                          </div>

                          {/* ── Training Sheet ── */}
                          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                            <h3 className="text-sm font-semibold mb-2">Training Sheet Files</h3>
                            {draft.trainingSheet.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {draft.trainingSheet.map((f, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                                  >
                                    <span className="flex-1 truncate text-xs font-mono">
                                      {f.name}
                                    </span>
                                    <button
                                      onClick={() => handleViewFile(f)}
                                      className="shrink-0 text-muted-foreground hover:text-primary"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeEditFileType(idx, "trainingSheet")}
                                      className="shrink-0 text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* ── Interactive File Categories Editor ── */}
                            <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  File Categories (
                                  {
                                    [
                                      ...new Set([
                                        ...(draft.trainingSheetServices || []),
                                        ...(draft.extractedServices || []),
                                      ]),
                                    ].length
                                  }
                                  )
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraft((prev) => {
                                      const currentList = [
                                        ...new Set([
                                          ...(prev.trainingSheetServices || []),
                                          ...(prev.extractedServices || []),
                                        ]),
                                      ];
                                      const updated = [...currentList, "New Category"];
                                      return {
                                        ...prev,
                                        trainingSheetServices: updated,
                                        extractedServices: updated,
                                      };
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                >
                                  + Add Category
                                </button>
                              </div>

                              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                {[
                                  ...new Set([
                                    ...(draft.trainingSheetServices || []),
                                    ...(draft.extractedServices || []),
                                  ]),
                                ].map((svc, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-[11px] font-extrabold text-primary border border-primary/20">
                                      {i + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={svc}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDraft((prev) => {
                                          const currentList = [
                                            ...new Set([
                                              ...(prev.trainingSheetServices || []),
                                              ...(prev.extractedServices || []),
                                            ]),
                                          ];
                                          currentList[i] = val;
                                          return {
                                            ...prev,
                                            trainingSheetServices: currentList,
                                            extractedServices: currentList,
                                          };
                                        });
                                      }}
                                      className="h-8 flex-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraft((prev) => {
                                          const currentList = [
                                            ...new Set([
                                              ...(prev.trainingSheetServices || []),
                                              ...(prev.extractedServices || []),
                                            ]),
                                          ];
                                          currentList.splice(i, 1);
                                          return {
                                            ...prev,
                                            trainingSheetServices: currentList,
                                            extractedServices: currentList,
                                          };
                                        });
                                      }}
                                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                                      title="Remove Category"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {[
                                  ...new Set([
                                    ...(draft.trainingSheetServices || []),
                                    ...(draft.extractedServices || []),
                                  ]),
                                ].length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">
                                    No file categories found. Click "+ Add Category" to create one.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                value={manualTSName}
                                onChange={(e) => setManualTSName(e.target.value)}
                                placeholder="File name"
                                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                onClick={() => addManualEditFileType("trainingSheet")}
                                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                              >
                                Add
                              </button>
                            </div>
                            <textarea
                              value={manualTSContent}
                              onChange={(e) => setManualTSContent(e.target.value)}
                              placeholder="Paste training sheet content here…"
                              rows={3}
                              className="mt-2 min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground hover:bg-muted/70">
                              <Upload className="h-4 w-4" /> Upload PDF, DOCX, or TXT files
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.json"
                                className="hidden"
                                onChange={(e) =>
                                  uploadEditFileType(e.target.files, "trainingSheet")
                                }
                              />
                            </label>
                          </div>

                          {uploading && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{uploadStatus}</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {editStep === 7 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Email Setup
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            Order &amp; booking emails
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Whenever an order or service request comes through this chatbot, the
                            notification emails follow this setup — no matter which website the
                            widget is installed on.
                          </p>
                        </div>

                        {/* 1) Owner notification email */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                            Add your email where you receive ALL order emails
                          </label>
                          <input
                            type="email"
                            value={draft.ownerEmail}
                            onChange={(e) =>
                              setDraft((p) => ({ ...p, ownerEmail: e.target.value }))
                            }
                            placeholder="orders@yourbusiness.com"
                            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Full details of every new order / booking will be delivered to this
                            inbox. Your account email always receives a copy too.
                          </p>
                        </div>

                        {/* 2) Customer confirmation toggle */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3">
                          <div>
                            <div className="text-sm font-semibold">
                              Send confirmation to the customer
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              The customer who placed the order / booking also receives a
                              confirmation email. Turn off to notify only you.
                            </div>
                          </div>
                          <Switch
                            checked={draft.customerConfirmation}
                            onCheckedChange={(v) =>
                              setDraft((p) => ({ ...p, customerConfirmation: v }))
                            }
                          />
                        </div>

                        {/* 3) Sender mode */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-foreground/80">
                            Do you want to add your own email for sending mail, or use this
                            platform&apos;s email?
                          </label>
                          <div className="grid gap-3 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, senderMode: "platform" }))}
                              className={`rounded-xl border p-4 text-left transition ${
                                draft.senderMode === "platform"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                  : "border-border/60 hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                <Shield className="h-4 w-4 text-primary" /> Use platform email
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Emails are sent from the Webotme system — no extra setup needed.
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft((p) => ({ ...p, senderMode: "own" }))}
                              className={`rounded-xl border p-4 text-left transition ${
                                draft.senderMode === "own"
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                  : "border-border/60 hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                <Mail className="h-4 w-4 text-primary" /> My own business email
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Emails are sent from one of your connected addresses — customers see
                                your brand.
                              </p>
                            </button>
                          </div>

                          {draft.senderMode === "own" &&
                            (connectedEmails.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-semibold text-foreground/80">
                                  Select which connected email this chatbot should send from:
                                </p>
                                {connectedEmails.map((cfg) => {
                                  const selected = draft.configId
                                    ? draft.configId === cfg.id
                                    : cfg.id === connectedEmails[0]?.id;
                                  return (
                                    <button
                                      key={cfg.id}
                                      type="button"
                                      onClick={() => setDraft((p) => ({ ...p, configId: cfg.id }))}
                                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                                        selected
                                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                          : "border-border/60 hover:border-primary/40"
                                      }`}
                                    >
                                      <div className="min-w-0 space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                          <span className="font-mono text-xs">
                                            {cfg.smtpUserMasked || cfg.fromEmail}
                                          </span>
                                          {cfg.verified ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                              <Check className="h-3 w-3" /> Verified
                                            </span>
                                          ) : (
                                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                              Not verified
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                          {cfg.type === "smtp" ? "Business SMTP" : "Resend API"}
                                          {cfg.fromName ? ` • ${cfg.fromName}` : ""}
                                        </div>
                                      </div>
                                      {selected && (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                      )}
                                    </button>
                                  );
                                })}
                                {!connectedEmails.some((c) => c.verified) && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    None of these are verified yet — test them in Settings → Email
                                    setup, otherwise the platform fallback is used.
                                  </p>
                                )}
                                <a
                                  href="/dashboard/settings?tab=email"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                >
                                  Manage saved emails <ArrowRight className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-2">
                                <p>
                                  First set up your email — you haven&apos;t connected any business
                                  email yet. Connect one, then select it here.
                                </p>
                                <a
                                  href="/dashboard/settings?tab=email"
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-500/25 dark:text-amber-400"
                                >
                                  First set up your email <ArrowRight className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                        </div>

                        <p className="rounded-xl border border-border/60 bg-card/70 p-3 text-[11px] text-muted-foreground">
                          💡 These settings apply only to this chatbot. For your other agency
                          chatbots, use the same step in each bot&apos;s editor.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <div className="sticky top-8">
                {draft.flowMode === "auto" && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Auto Flow bot — design &amp; theme preview only. The conversation runs live on
                      your website.
                    </span>
                  </div>
                )}
                <LiveBotPreview
                  name={draft.name || "Your Bot"}
                  welcome={draft.welcome}
                  primary={draft.primary}
                  secondary={draft.secondary}
                  bubble={draft.bubble}
                  radius={draft.radius}
                  template={draft.template}
                  logo={draft.logo}
                  preview={draft.preview}
                  headerStyle={draft.headerStyle}
                  textStyle={draft.textStyle}
                  botBubbleColor={draft.botBubbleColor}
                  botTextColor={draft.botTextColor}
                  showAvatar={draft.showAvatar}
                  messageFontSize={draft.messageFontSize}
                  inputStyle={draft.inputStyle}
                  headerSubtitle={draft.headerSubtitle}
                  extractedServices={draft.flowMode === "auto" ? [] : draft.extractedServices}
                  trainingSheetServices={
                    draft.flowMode === "auto" ? [] : draft.trainingSheetServices
                  }
                  currency={draft.currency}
                  currencySymbol={draft.currencySymbol}
                  widgetLauncher={draft.widgetLauncher}
                  widgetLauncherText={draft.widgetLauncherText}
                  widgetLauncherStyle={draft.widgetLauncherStyle}
                  widgetPosition={draft.widgetPosition}
                  widgetOpenMode={draft.widgetOpenMode}
                  widgetWidth={draft.widgetWidth}
                  widgetHeight={draft.widgetHeight}
                  trainingFlow={draft.flowMode === "auto" ? undefined : draft.trainingFlow}
                  orderSystemEnabled={draft.orderSystemEnabled}
                  catalogConnected={Boolean(draft.productConnected || draft.collectionConnected)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={closeEditor}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            {draft.type === "agency" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editStepIndex > 0) setEditStep(editSteps[editStepIndex - 1].n);
                  }}
                  disabled={editStepIndex <= 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {!isLastEditStep ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (editStepIndex >= 0 && editStepIndex < editSteps.length - 1) {
                        setEditStep(editSteps[editStepIndex + 1].n);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110 disabled:opacity-60"
                  >
                    {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110 disabled:opacity-60"
              >
                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this chatbot and its data. This action cannot be undone.
          </p>
          <DialogFooter className="mt-4 flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:brightness-110 disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Knowledge Content Dialog */}
      <Dialog
        open={!!selectedFileForView}
        onOpenChange={(open) => !open && setSelectedFileForView(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="h-4 w-4 text-primary" />
              {selectedFileForView?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {selectedFileForView?.content ||
            (selectedFileForView as any)?.contentPreview ||
            (selectedFileForView as any)?.text ? (
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Extracted File Knowledge
                </h5>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-foreground max-h-[400px] overflow-y-auto p-2 bg-background/50 rounded-lg border border-border/50">
                  {selectedFileForView?.content ||
                    (selectedFileForView as any)?.contentPreview ||
                    (selectedFileForView as any)?.text}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-6 text-center space-y-2">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  File Uploaded & Active in AI Knowledge Base
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  The document{" "}
                  <span className="font-semibold text-foreground">{selectedFileForView?.name}</span>{" "}
                  has been processed and indexed into vector embeddings for chatbot response
                  retrieval.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Tutorial Overlay */}
      {tourStep > 0 &&
        tourStep < 6 &&
        tourRect &&
        (() => {
          const steps = [
            {
              title: "Create Your First Chatbot",
              desc: "Click 'Use This Bot' on any ready-made template to instantly create a pre-loaded chatbot.",
            },
            {
              title: "Copy the Script",
              desc: "Click Copy to copy the embed script. Paste it into your website's HTML before the closing body tag.",
            },
            {
              title: "Regenerate Script",
              desc: "Click Regenerate to refresh the embed script if you change your bot's name or ID.",
            },
            {
              title: "Edit Your Bot",
              desc: "Click the pencil icon to open the editor. Change the name, description, theme, colors, and more.",
            },
            {
              title: "Preview Your Bot",
              desc: "Click the eye icon to see a live preview of how your chatbot looks and behaves.",
            },
          ];
          const idx = tourStep - 1;
          const s = steps[idx];
          const closeTour = () => {
            setTourStep(6);
            localStorage.setItem("scriptsTourDone", "true");
          };
          const next = () => {
            if (tourStep < 5) setTourStep(tourStep + 1);
            else closeTour();
          };
          const tooltipW = 280;
          const tooltipH = 180;
          const topArea = tourRect.top - 12;
          const bottomArea = window.innerHeight - tourRect.bottom - 12;
          const showAbove = bottomArea < tooltipH && topArea >= tooltipH;
          let tooltipTop: number;
          if (showAbove) {
            tooltipTop = Math.max(12, tourRect.top - tooltipH - 12);
          } else if (bottomArea >= tooltipH) {
            tooltipTop = tourRect.bottom + 12;
          } else {
            tooltipTop = 20;
          }
          tooltipTop = Math.min(tooltipTop, window.innerHeight - tooltipH - 12);
          const arrowDir = showAbove ? "below" : "above";
          return (
            <AnimatePresence mode="wait">
              <motion.div
                key={tourStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute z-10"
                  style={{
                    left: tourRect.left - 6,
                    top: tourRect.top - 6,
                    width: tourRect.width + 12,
                    height: tourRect.height + 12,
                    pointerEvents: "auto",
                    borderRadius: 16,
                    boxShadow:
                      "0 0 0 3px #D94A2D, 0 0 30px rgba(217,74,45,0.4), 0 0 0 9999px rgba(0,0,0,0.55)",
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: showAbove ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
                  className="fixed z-20 rounded-xl bg-card p-4 shadow-2xl border border-border/80"
                  style={{
                    width: tooltipW,
                    left: Math.max(
                      12,
                      Math.min(
                        tourRect.left + tourRect.width / 2 - tooltipW / 2,
                        window.innerWidth - tooltipW - 12,
                      ),
                    ),
                    top: tooltipTop,
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 h-0 w-0 border-l-8 border-r-8 border-card ${arrowDir === "above" ? "-top-2 border-b-8 border-b-card" : "-bottom-2 border-t-8 border-t-card"}`}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Step {tourStep} of 5
                    </span>
                  </div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={next}
                      className="flex-1 rounded-lg bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110 transition-all"
                    >
                      {tourStep < 5 ? "Next →" : "Finish"}
                    </button>
                  </div>
                  {tourStep > 1 && (
                    <button
                      onClick={closeTour}
                      className="mt-2 w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Skip tour
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          );
        })()}

      {/* Help Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to use Generated Scripts</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  1
                </span>{" "}
                Create a chatbot
              </h3>
              <p className="mt-1 text-muted-foreground ml-8">
                Use a ready-made template by clicking "Use This Bot", or create a custom one from
                the Create Chatbot page. Each template comes with pre-loaded knowledge files.
              </p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  2
                </span>{" "}
                Generate the embed script
              </h3>
              <p className="mt-1 text-muted-foreground ml-8">
                After creating a bot, click <strong>Generate</strong> on its card. The embed script
                will appear inside the card.
              </p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  3
                </span>{" "}
                Copy the script
              </h3>
              <p className="mt-1 text-muted-foreground ml-8">
                Click <strong>Copy</strong> to copy the script to your clipboard. The script is a
                single{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">&lt;script&gt;</code>{" "}
                tag.
              </p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  4
                </span>{" "}
                Add to your website
              </h3>
              <p className="mt-1 text-muted-foreground ml-8">
                Paste the copied script just before the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">&lt;/body&gt;</code>{" "}
                tag in your HTML.
              </p>
              <div className="mt-2 ml-8 space-y-2">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="font-medium text-xs">WordPress</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Go to <strong>Appearance → Theme File Editor</strong> →{" "}
                    <strong>footer.php</strong>, paste the script before{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                      &lt;?php wp_footer(); ?&gt;
                    </code>
                    . Or use a plugin like "Insert Headers and Footers".
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="font-medium text-xs">Shopify</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Go to <strong>Online Store → Themes → Edit code</strong> →{" "}
                    <strong>theme.liquid</strong>, paste the script before{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">&lt;/body&gt;</code>.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="font-medium text-xs">Wix</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Go to <strong>Settings → Tracking & Analytics</strong>, click{" "}
                    <strong>+ New Tool</strong>, choose <strong>Custom</strong>, paste the script
                    and set it to load on <strong>All Pages</strong> in <strong>Body - end</strong>.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="font-medium text-xs">Custom HTML</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Simply paste the script before{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">&lt;/body&gt;</code>{" "}
                    in your HTML file.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  5
                </span>{" "}
                Customize your bot
              </h3>
              <p className="mt-1 text-muted-foreground ml-8">
                Click the <strong>pencil (Edit)</strong> icon to change the bot name, welcome
                message, theme colors, font, bubble style, and more. Changes apply in real-time.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
