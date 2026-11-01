import type { Chatbot } from "@/store/chatbots";
import { TEMPLATE_NAMES, TEMPLATE_KNOWLEDGE_FILES } from "./constants";

export const getUserContext = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string };
  } catch {
    return null;
  }
};

export const getAuthHeaders = () => {
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
export const isServiceBookingFlowJson = (raw: string | undefined | null): boolean => {
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

export const mapChatbot = (cb: any): Chatbot => {
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

export function syncCategoriesWithFlow(updatedCategories: string[], flowStr?: string): string {
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

export const isTemplateBotCheck = (bot: Chatbot): boolean => {
  if (bot.fromTemplate) return true;
  if (TEMPLATE_NAMES.has(bot.name)) return true;
  const files = bot.knowledgeFiles ?? [];
  if (files.length > 0 && files.every((f) => TEMPLATE_KNOWLEDGE_FILES.has(f.name))) return true;
  return false;
};
