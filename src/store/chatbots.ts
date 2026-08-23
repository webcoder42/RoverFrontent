import { create } from "zustand";

export type Template = "Modern Glass UI" | "Minimal AI Assistant" | "Floating Support Widget" | "Rounded Messenger Style" | "Neon AI Interface" | "Custom";

export type BotType = "simple" | "agency";

export interface Chatbot {
  id: string;
  type: BotType;
  category?: string;
  useOwnDb?: boolean;
  name: string;
  template: Template;
  description: string;
  welcome: string;
  primary: string;
  secondary: string;
  font: string;
  radius: number;
  bubble: "rounded" | "square" | "soft";
  logo?: string;
  currency?: string;
  currencySymbol?: string;
  createdAt: string;
  installs: number;
  embedScript?: string;
  fromTemplate?: boolean;
  preview?: "light" | "dark";
  headerStyle?: "gradient" | "solid" | "glass";
  textStyle?: "default" | "bold" | "italic" | "romantic" | "playful" | "elegant";
  botBubbleColor?: string;
  botTextColor?: string;
  showAvatar?: boolean;
  messageFontSize?: "sm" | "md" | "lg";
  inputStyle?: "rounded" | "pill" | "minimal";
  headerSubtitle?: string;
  widgetLauncher?: "icon" | "button";
  widgetLauncherText?: string;
  widgetLauncherStyle?: "rounded" | "square" | "soft" | "pill";
  widgetPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetOpenMode?: "overlay" | "sidebar" | "fullscreen" | "newtab";
  widgetWidth?: number;
  widgetHeight?: number;
  widgetSmartPosition?: boolean;
  widgetCustomCss?: string;
  knowledgeFiles?: Array<{ name: string; content: string; url?: string }>;
  knowledgeBase?: Array<{ name: string; content: string; url?: string }>;
  trainingKnowledge?: Array<{ name: string; content: string; url?: string }>;
  trainingSheet?: Array<{ name: string; content: string; url?: string }>;
  collectionDb?: string;
  collectionUsername?: string;
  collectionPassword?: string;
  collectionHost?: string;
  collectionPort?: number;
  collectionTable?: string;
  collectionSsl?: boolean;
  collectionConnected?: boolean;
  collectionUri?: string;
  collectionStoreType?: "user_chat" | "all_orders" | "agent_contact" | "";
  databaseType?: "mysql" | "mongodb" | "postgresql" | "";
  databaseMode?: "full" | "collection" | "";
  agencyEmail1?: string;
  agencyEmail2?: string;
  ownerEmail?: string;
  customerConfirmation?: boolean;
  senderMode?: "platform" | "own";
  configId?: string;
  extractedServices?: string[];
  trainingSheetServices?: string[];
  trainingFlow?: string;
  orderSystemEnabled?: boolean;
  productType?: string;
  productCollection?: {
    dbType?: "mysql" | "mongodb" | "postgresql" | "";
    uri?: string;
    db?: string;
    table?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    ssl?: boolean;
    connected?: boolean;
    mapping?: {
      titleField?: string;
      priceField?: string;
      categoryField?: string;
      imageField?: string;
      descriptionField?: string;
    };
  };
  dbCollection?: {
    db?: string;
    username?: string;
    password?: string;
    host?: string;
    port?: number;
    table?: string;
    ssl?: boolean;
    connected?: boolean;
  };
  planRestricted?: boolean;
  planRestrictionReason?: string;
}

interface State {
  chatbots: Chatbot[];
  add: (c: Chatbot) => void;
  update: (id: string, patch: Partial<Chatbot>) => void;
  remove: (id: string) => void;
  setChatbots: (list: Chatbot[]) => void;
}

export const useChatbotsStore = create<State>((set) => ({
  chatbots: [],
  add: (c) => set((s) => ({ chatbots: [c, ...s.chatbots] })),
  update: (id, patch) =>
    set((s) => ({
      chatbots: s.chatbots.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  remove: (id) => set((s) => ({ chatbots: s.chatbots.filter((c) => c.id !== id) })),
  setChatbots: (list) => set({ chatbots: list }),
}));
