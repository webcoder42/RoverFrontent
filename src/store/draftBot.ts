import { create } from "zustand";
import type { Template } from "./chatbots";

interface Draft {
  type: "agency" | "simple";
  name: string;
  description: string;
  welcome: string;
  logo?: string;
  knowledgeFiles: Array<{ name: string; content: string; url?: string }>;
  knowledgeBase: Array<{ name: string; content: string; url?: string }>;
  trainingKnowledge: Array<{ name: string; content: string; url?: string }>;
  trainingSheet: Array<{ name: string; content: string; url?: string }>;
  extractedServices: string[];
  trainingSheetServices: string[];
  primary: string;
  secondary: string;
  font: string;
  radius: number;
  bubble: "rounded" | "square" | "soft";
  preview: "light" | "dark";
  template: Template;
  headerStyle: "gradient" | "solid" | "glass";
  botBubbleColor: string;
  botTextColor: string;
  showAvatar: boolean;
  messageFontSize: "sm" | "md" | "lg";
  inputStyle: "rounded" | "pill" | "minimal";
  headerSubtitle: string;
  textStyle: "default" | "bold" | "italic" | "romantic" | "playful" | "elegant";
  widgetLauncher: "icon" | "button";
  widgetLauncherText: string;
  widgetLauncherStyle: "rounded" | "square" | "soft" | "pill";
  widgetPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetOpenMode: "overlay" | "sidebar" | "fullscreen" | "newtab";
  widgetWidth: number;
  widgetHeight: number;
  widgetSmartPosition: boolean;
  widgetCustomCss: string;
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
  agencyEmail1: string;
  agencyEmail2: string;
  databaseType: "mysql" | "mongodb" | "postgresql" | "";
  databaseMode: "full" | "collection" | "";
  trainingFlow: string;
  category: string;
  useOwnDb: boolean;
  orderSystemEnabled: boolean;
  productType: string;
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
  productMapping: {
    titleField: string;
    priceField: string;
    categoryField: string;
    imageField: string;
    descriptionField: string;
  };
  onlyKnowledge: boolean;
  answerAnyQuestion: boolean;
  set: (patch: Partial<Omit<Draft, "set" | "reset">>) => void;
  reset: () => void;
}

const initial = {
  type: "agency" as const,
  name: "My Chatbot",
  description: "A helpful AI assistant for my site.",
  welcome: "Hi 👋 How can I help you today?",
  logo: undefined as string | undefined,
  knowledgeFiles: [] as Array<{ name: string; content: string; url?: string }>,
  knowledgeBase: [] as Array<{ name: string; content: string; url?: string }>,
  trainingKnowledge: [] as Array<{ name: string; content: string; url?: string }>,
  trainingSheet: [] as Array<{ name: string; content: string; url?: string }>,
  extractedServices: [] as string[],
  trainingSheetServices: [] as string[],
  primary: "#D94A2D",
  secondary: "#1C1C2E",
  font: "Inter",
  radius: 16,
  bubble: "rounded" as const,
  preview: "light" as const,
  template: "Modern Glass UI" as Template,
  headerStyle: "gradient" as const,
  botBubbleColor: "#f1f5f9",
  botTextColor: "#0f172a",
  showAvatar: true,
  messageFontSize: "md" as const,
  inputStyle: "rounded" as const,
  headerSubtitle: "Online",
  textStyle: "default" as const,
  widgetLauncher: "icon" as const,
  widgetLauncherText: "Chat with us",
  widgetLauncherStyle: "rounded" as const,
  widgetPosition: "bottom-right" as const,
  widgetOpenMode: "overlay" as const,
  widgetWidth: 400,
  widgetHeight: 540,
  widgetSmartPosition: true,
  widgetCustomCss: "",
  collectionDb: "",
  collectionUsername: "",
  collectionPassword: "",
  collectionHost: "",
  collectionPort: 3306,
  collectionTable: "",
  collectionSsl: false,
  collectionConnected: false,
  collectionUri: "",
  collectionStoreType: "" as "" | "user_chat" | "all_orders" | "agent_contact",
  agencyEmail1: "",
  agencyEmail2: "",
  category: "",
  useOwnDb: false,
  orderSystemEnabled: false,
  productType: "",
  currency: "United States Dollar (USD $)",
  currencySymbol: "$",
  productDbType: "" as "" | "mysql" | "mongodb" | "postgresql",
  productUri: "",
  productDb: "",
  productTable: "",
  productHost: "",
  productPort: 3306,
  productUsername: "",
  productPassword: "",
  productSsl: false,
  productConnected: false,
  productMapping: {
    titleField: "name",
    priceField: "price",
    categoryField: "category",
    imageField: "image",
    descriptionField: "description",
  },
  onlyKnowledge: false,
  answerAnyQuestion: false,
  databaseType: "" as "" | "mysql" | "mongodb" | "postgresql",
  databaseMode: "" as "" | "full" | "collection",
  trainingFlow: "",
};

export const useDraftBotStore = create<Draft>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
