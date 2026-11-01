import type { Chatbot, Template } from "@/store/chatbots";
import type { MobileAppId } from "@/lib/mobileSetup";

export interface TemplateInfo {
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

export interface DefaultFlowOption {
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

export interface FlowStepMeta {
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

export type EditDraft = {
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

export type IntegrationPlatform = "web" | "mobile";

export interface CardIntegration {
  platform: IntegrationPlatform;
  appId: MobileAppId | null;
}
