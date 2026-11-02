import { apiFetch } from "@/lib/apiFetch";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Code,
  Copy,
  CreditCard,
  Database,
  FileText,
  GitBranch,
  Globe,
  LayoutGrid,
  LayoutDashboard,
  Loader2,
  Menu,
  MessageSquare,
  Monitor,
  Package,
  PanelLeft,
  PanelLeftClose,
  Plug,
  QrCode,
  Rocket,
  Settings,
  Smartphone,
  Store,
  Terminal,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { config } from "@/lib/config";
import DEMO_CHATBOT_WIDGET from "@/lib/demo/ChatbotWidget.demo.txt?raw";
import { EMBED_KEY_PLACEHOLDER } from "@/lib/embedKey";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { seoHead } from "@/lib/seo";
import logo from "@/asset/logo.png";

export const Route = createFileRoute("/docs")({
  head: () =>
    seoHead({
      title: "Documentation — Webotme",
      description:
        "Complete Webotme documentation — how to create chatbots, design conversation flows, connect MongoDB/MySQL, set up SMTP email, install the embed widget and use the API.",
      path: "/docs",
    }),
  component: DocsPage,
});

interface DocsItem {
  id: string;
  label: string;
}

interface DocsItemWithIcon extends DocsItem {
  icon: LucideIcon;
  children?: DocsItem[];
}

interface DocsGroup {
  label: string;
  items: DocsItemWithIcon[];
}

const NAV: DocsGroup[] = [
  {
    label: "Getting Started",
    items: [{ id: "overview", label: "Overview", icon: Rocket }],
  },
  {
    label: "Website & App",
    items: [
      { id: "create-key", label: "Create an API key", icon: Terminal },
      { id: "widget", label: "Install the widget", icon: Code },
      {
        id: "native",
        label: "Native & mobile apps",
        icon: Smartphone,
        children: [
          { id: "native-contract", label: "Check the contract" },
          { id: "native-message", label: "Send a message" },
          { id: "native-screen", label: "Screen context (AutoFlow)" },
          { id: "native-errors", label: "Error codes" },
          { id: "native-rn", label: "React Native" },
        ],
      },
      {
        id: "setup-webview",
        label: "Setup · WebView app",
        icon: Smartphone,
        children: [
          { id: "wv-before", label: "Before you start" },
          { id: "wv-install", label: "1. Install WebView" },
          { id: "wv-screen", label: "2. Chat screen file" },
          { id: "wv-open", label: "3. Add a button" },
          { id: "wv-run", label: "4. Run & test" },
        ],
      },
      {
        id: "setup-sdk",
        label: "Setup · WebotMe SDK",
        icon: Rocket,
        children: [
          { id: "sdk-before", label: "Before you start" },
          { id: "sdk-install", label: "1. Install packages" },
          { id: "sdk-wrap", label: "2. Wrap your app (_layout)" },
          { id: "sdk-widget", label: "3. Chatbot widget file" },
          { id: "sdk-widget-demo", label: "3b. Full demo file" },
          { id: "sdk-ai", label: "3c. Full setup your file" },
          { id: "sdk-custom", label: "4. Custom chat file (no WebView)" },
          { id: "sdk-autoflow", label: "5. AutoFlow" },
          { id: "sdk-run", label: "6. Run & test" },
        ],
      },
    ],
  },
  {
    label: "Chatbot Types",
    items: [
      { id: "type-simple", label: "Simple chatbot", icon: Bot },
      { id: "type-custom-flow", label: "Custom flow chatbot", icon: GitBranch },
      { id: "type-auto-flow", label: "Auto flow chatbot", icon: Zap },
    ],
  },
  {
    label: "Platform Guide",
    items: [
      { id: "guide-dashboard", label: "Dashboard overview", icon: LayoutGrid },
      { id: "guide-scripts", label: "Generated Scripts", icon: FileText },
      { id: "guide-installer", label: "Installer", icon: Plug },
      { id: "guide-console", label: "Console (agency)", icon: Monitor },
      { id: "guide-store", label: "Storefront", icon: Store },
      {
        id: "guide-channels",
        label: "Messaging channels",
        icon: MessageSquare,
        children: [
          { id: "guide-whatsapp", label: "WhatsApp" },
          { id: "guide-telegram", label: "Telegram" },
          { id: "guide-facebook", label: "Facebook" },
          { id: "guide-instagram", label: "Instagram" },
        ],
      },
      { id: "guide-settings", label: "Settings", icon: Settings },
      { id: "guide-storage", label: "Storage & usage", icon: Database },
      { id: "guide-database", label: "Databases & collections", icon: Database },
      { id: "guide-payments", label: "Payments & Stripe", icon: CreditCard },
      { id: "guide-plans", label: "Plans & billing", icon: CreditCard },
    ],
  },
];

// Flat tab order (sidebar top-level items) — used for prev/next navigation.
const TAB_ORDER: DocsItemWithIcon[] = NAV.flatMap((g) => g.items);

// Sub-items (anchors) → which tab they belong to.
const CHILD_TO_TAB: Record<string, string> = {};
NAV.forEach((g) =>
  g.items.forEach((i) =>
    (i.children || []).forEach((c) => {
      CHILD_TO_TAB[c.id] = i.id;
    }),
  ),
);

// Read the current hash and map it to a tab (sub-anchors map to their parent).
function readHashId(): string {
  return typeof window !== "undefined" ? window.location.hash.slice(1) : "";
}

function resolveTabId(id: string): string {
  if (!id) return "overview";
  return CHILD_TO_TAB[id] ?? (TAB_ORDER.some((t) => t.id === id) ? id : "overview");
}

function DocsPage() {
  const [copied, setCopied] = useState("");
  // Sidebar open/close — starts open on desktop, closed as a drawer on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  // One state = the currently open tab (each sidebar item is its own page).
  // Re-read the hash on every mount so deep links like /docs#setup-sdk work
  // even when the docs module is already loaded.
  const [activeTab, setActiveTab] = useState(() => resolveTabId(readHashId()));
  // Highlighted sub-anchor inside the open tab.
  const [activeId, setActiveId] = useState(() => {
    const raw = readHashId();
    return CHILD_TO_TAB[raw] ? raw : resolveTabId(raw);
  });
  const pendingScroll = useRef<string | null>(readHashId() || null);

  // On tab change (and on first load): scroll to the sub-anchor or to the top.
  useEffect(() => {
    const target = pendingScroll.current;
    pendingScroll.current = null;
    const t = setTimeout(() => {
      if (target && CHILD_TO_TAB[target]) {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Scroll spy — only the sub-anchors of the open tab.
  useEffect(() => {
    const item = TAB_ORDER.find((t) => t.id === activeTab);
    const ids = item?.children?.map((c) => c.id) ?? [];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) {
      setActiveId(activeTab);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  // Sidebar navigation: switch tab (top-level) or scroll inside the tab (child).
  const goTo = (id: string) => {
    const tab = CHILD_TO_TAB[id] ?? id;
    if (tab === activeTab) {
      if (CHILD_TO_TAB[id]) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      pendingScroll.current = id;
      setActiveTab(tab);
    }
    window.history.replaceState(null, "", `#${id}`);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1600);
    toast.success("Copied");
  };

  const widget = `<script async src="${config.apiBaseUrl}/static/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-key="${EMBED_KEY_PLACEHOLDER}">
</script>`;

  // ── App setup (native) — the copyable code behind the two setup pages ────
  const SETUP_INSTALL = `# 1) WebotMe SDK - always the latest version
npm install @webotme/react-native@latest

# 2) Optional - voice: let the bot speak and listen
npx expo install expo-speech expo-speech-recognition`;

  // WebView is an optional peer - only the built-in *web* chat window needs it.
  const SETUP_WEBVIEW_INSTALL = `# Only if you keep the built-in web chat window (variant="web")
npx expo install react-native-webview`;

  const SETUP_LAYOUT = `// app/_layout.tsx - root of an Expo Router app
import { Stack } from "expo-router";
import { WebotMeProvider } from "@webotme/react-native";

const BOT_ID = "YOUR_BOT_ID";           // Generated Scripts -> App tab
const API_KEY = "wbm_YOUR_API_KEY";     // Dashboard -> API Keys (embed key)
const APP_ID = "com.yourcompany.app";   // your bundle id - pins the key

export default function RootLayout() {
  return (
    <WebotMeProvider botId={BOT_ID} apiKey={API_KEY} appId={APP_ID}>
      {/* Everything inside can now use the chat hooks */}
      <Stack />
    </WebotMeProvider>
  );
}`;

  const SETUP_LAYOUT_BARE = `// App.tsx - bare React Native (no Expo Router)
import { WebotMeProvider } from "@webotme/react-native";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <WebotMeProvider botId={BOT_ID} apiKey={API_KEY} appId={APP_ID}>
      <Navigation />
    </WebotMeProvider>
  );
}`;

  const SETUP_WIDGET = `// components/ChatbotWidget.tsx - the floating chat bubble
import { WebotMeLauncher } from "@webotme/react-native";

export default function ChatbotWidget() {
  return (
    <WebotMeLauncher
      position="bottom-right"   // "bottom-left" works too
      icon="💬"                  // any emoji or a single character
      label="Chat with us"      // accessibility label
      showBadge                 // red dot when the bot replied
      widgetProps={{
        // "native" - pure React Native chat window, no WebView needed.
        // "web"    - the full web chat page, needs react-native-webview.
        variant: "native",
      }}
    />
  );
}`;

  const SETUP_WIDGET_MOUNT = `// app/_layout.tsx - mount the bubble once, above the navigator
import { View } from "react-native";
import ChatbotWidget from "@/components/ChatbotWidget";

<WebotMeProvider botId={BOT_ID} apiKey={API_KEY} appId={APP_ID}>
  <View style={{ flex: 1 }}>
    <Stack />
    <ChatbotWidget />   {/* floating chat icon */}
  </View>
</WebotMeProvider>`;

  const SETUP_WIDGET_OWN = `// Prefer your own button? Drive the chat manually.
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { WebotMeWidget } from "@webotme/react-native";

export default function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <Text>💬 Chat</Text>
      </Pressable>

      <WebotMeWidget visible={open} onClose={() => setOpen(false)} />
    </>
  );
}`;

  const SETUP_AUTOFLOW = `// app/_layout.tsx - tell AutoFlow which screen is open
<WebotMeProvider
  botId={BOT_ID}
  apiKey={API_KEY}
  appId={APP_ID}
  screenContext={{
    name: "pricing",          // route / screen id
    title: "Plans",           // screen heading
    visibleText: ["Free", "Pro"],                       // what the user can read
    buttons: [{ id: "buy_pro", text: "Buy Pro" }],      // tappable buttons
    links: [{ id: "faq", text: "FAQ", route: "/faq" }], // navigable links
  }}
>

// Changed screen? The provider picks the new prop up on re-render, or push it
// the moment the screen mounts:
// updateChatScreenContext({ name: "profile", title: "My profile" });`;

  const SETUP_RUN = `npx expo start         # dev server + simulator / device
npx expo run:android   # full native build (run:ios on a Mac)
npx eas build --platform all   # cloud builds for the stores`;

  // WebView route — the chat link in a screen, no SDK.
  const SETUP_A_INSTALL = `npx expo install react-native-webview`;

  const SETUP_A_SCREEN = `// app/chat.tsx - Expo Router.
// Bare React Native: register this component as a "Chat" screen instead.
import { WebView } from "react-native-webview";

// The shareable chat link from Generated Scripts -> App.
// It already carries the embed key (?k=), so it opens a working chat as-is.
const CHAT_URL =
  "https://rover-frontent.vercel.app/chat/YOUR_BOT_ID?k=wbm_YOUR_API_KEY";

export default function Chat() {
  return <WebView source={{ uri: CHAT_URL }} style={{ flex: 1 }} />;
}`;

  const SETUP_A_OPEN = `// Open it from any screen with your normal navigation
import { Pressable, Text } from "react-native";
import { router } from "expo-router";

<Pressable onPress={() => router.push("/chat")}>
  <Text>💬 Chat with us</Text>
</Pressable>`;

  // Custom chat file - your own UI on top of the SDK, no WebView involved.
  const SETUP_CUSTOM_CHAT = `// components/MyChat.tsx - your own chat screen, pure React Native
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useWebotMeChat } from "@webotme/react-native";

export default function MyChat() {
  const { messages, send, sending } = useWebotMeChat();
  const [text, setText] = useState("");

  const submit = () => {
    const value = text.trim();
    if (!value || sending) return;
    setText("");
    void send(value);
  };

  return (
    <View style={s.root}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Text style={[s.line, item.from === "user" && s.mine]}>{item.text}</Text>
        )}
      />

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message"
        onSubmitEditing={submit}
        style={s.input}
      />

      <Pressable onPress={submit} disabled={sending} style={s.send}>
        <Text>{sending ? "…" : "Send"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, gap: 8, padding: 16 },
  line: { padding: 8, borderRadius: 8, backgroundColor: "#f1f5f9" },
  mine: { alignSelf: "flex-end", backgroundColor: "#e0e7ff" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  send: { alignItems: "center", padding: 10 },
});`;

  const NATIVE_ERROR_ROWS = [
    { status: "400", code: "INVALID_REQUEST", meaning: "Missing or malformed body" },
    { status: "401", code: "UNAUTHORIZED", meaning: "Authentication required" },
    { status: "403", code: "FORBIDDEN", meaning: "No access to this chatbot" },
    { status: "404", code: "BOT_NOT_FOUND", meaning: "Bot ID is wrong or deleted" },
    { status: "429", code: "PLAN_LIMIT_REACHED", meaning: "Plan quota or expiry hit" },
    { status: "429", code: "RATE_LIMITED", meaning: "Too many requests — slow down" },
    { status: "503", code: "AI_UNAVAILABLE", meaning: "AI provider not configured" },
    { status: "500", code: "INTERNAL_ERROR", meaning: "Server fault, safe to retry" },
  ];

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
      <button
        onClick={() => copyText(code, id)}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {copied === id ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied === id ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-5 text-foreground/85">
        {code}
      </pre>
    </div>
  );

  const QUICK_LINKS: {
    id: string;
    icon: LucideIcon;
    title: string;
    desc: string;
  }[] = [
    {
      id: "widget",
      icon: Code,
      title: "Install the widget",
      desc: "Add the chat bubble to any website.",
    },
    {
      id: "type-simple",
      icon: Bot,
      title: "Simple chatbot",
      desc: "The quickest way to build and publish a bot.",
    },
    {
      id: "native",
      icon: Smartphone,
      title: "Native & mobile apps",
      desc: "Wire a bot into React Native or Expo.",
    },
    {
      id: "guide-dashboard",
      icon: LayoutGrid,
      title: "Platform guide",
      desc: "Dashboard, channels, console & plans.",
    },
  ];

  const tabIdx = TAB_ORDER.findIndex((t) => t.id === activeTab);
  const prevTab = TAB_ORDER[tabIdx - 1];
  const nextTab = TAB_ORDER[tabIdx + 1];

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Full-width sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2.5 px-4 md:px-6">
          {/* Mobile: open/close drawer */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground lg:hidden"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {/* Desktop: collapse / expand sidebar */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground lg:inline-flex"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => goTo("overview")}
            className="flex items-center gap-2"
            aria-label="Docs home"
          >
            <img src={logo} alt="Webotme" className="h-9 w-auto object-contain" />
            <span className="hidden text-sm font-bold text-foreground sm:block">Docs</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="mx-auto flex w-full max-w-[1400px] items-start px-0 md:px-6">
        {/* Sidebar — full-height drawer on mobile, sticky panel on desktop */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen w-[280px] shrink-0 overflow-hidden border-r border-border/60 bg-sidebar/95 backdrop-blur-xl transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:transition-[width] lg:duration-300",
            sidebarOpen ? "lg:w-[280px]" : "lg:w-0 lg:border-r-0",
          )}
        >
          <div className="flex h-full w-[280px] shrink-0 flex-col">
            {/* Drawer header (mobile only) */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 lg:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Documentation
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grouped tabs + in-page anchors */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {NAV.map((group) => (
                <div key={group.label} className="mb-5 last:mb-0">
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            goTo(s.id);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                            activeTab === s.id
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <s.icon className="h-3.5 w-3.5 shrink-0" />
                          {s.label}
                        </a>
                        {s.children && activeTab === s.id && (
                          <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border/60 pl-2">
                            {s.children.map((c) => (
                              <li key={c.id}>
                                <a
                                  href={`#${c.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    goTo(c.id);
                                  }}
                                  className={cn(
                                    "block rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition",
                                    activeId === c.id
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                  )}
                                >
                                  {c.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-border/60 p-3">
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </aside>

        {/* Content — one tab at a time */}
        <main className="min-w-0 flex-1 px-4 py-8 md:px-0">
          <article className="mx-auto max-w-3xl space-y-10">
            {activeTab === "overview" && (
              <>
                <TabHeader
                  id="overview"
                  title="Webotme Documentation"
                  lead={
                    <>
                      Webotme is an AI chatbot platform. Build and train a chatbot once, then
                      publish it to your website, your mobile app, and your messaging channels — all
                      managed from one{" "}
                      <Link to="/dashboard" className="font-semibold text-primary hover:underline">
                        dashboard
                      </Link>
                      . Pick a topic below, or jump straight in:
                    </>
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  {QUICK_LINKS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => goTo(q.id)}
                      className="group rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition hover:border-primary/40"
                    >
                      <q.icon className="h-5 w-5 text-primary" />
                      <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {q.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{q.desc}</p>
                    </button>
                  ))}
                </div>

                <Section id="quick-start" title="Quick start" icon={Rocket}>
                  <Steps
                    items={[
                      <>
                        <b className="text-foreground">Create a chatbot</b> — run the builder (name,
                        theme, template, training) and launch.
                      </>,
                      <>
                        <b className="text-foreground">Publish it</b> — paste the widget script on
                        your website, or use the App tab for a mobile app.
                      </>,
                      <>
                        <b className="text-foreground">Pick the right type</b> — Simple, Custom flow
                        or Auto flow. See Chatbot Types below.
                      </>,
                    ]}
                  />
                </Section>

                <Section id="whats-inside" title="What's in this documentation" icon={FileText}>
                  <Bullets
                    items={[
                      <>
                        <b className="text-foreground">Website & App</b> — create an API key,
                        install the widget, and wire bots into native mobile apps.
                      </>,
                      <>
                        <b className="text-foreground">Chatbot Types</b> — how Simple, Custom flow
                        and Auto flow chatbots differ, and how to set each one up.
                      </>,
                      <>
                        <b className="text-foreground">Platform Guide</b> — every page of the
                        dashboard explained: scripts, installer, console, storefront, channels,
                        databases, payments, settings, storage and billing.
                      </>,
                    ]}
                  />
                </Section>

                <Section id="key-terms" title="Key terms" icon={Globe}>
                  <dl className="mt-3 space-y-3 text-sm leading-6">
                    <div>
                      <dt className="font-semibold text-foreground">Bot ID</dt>
                      <dd className="text-muted-foreground">
                        The chatbot's permanent identifier (<code className="font-mono">bot_…</code>
                        ). Used in embed scripts, native apps and API calls. Never secret.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Embed key</dt>
                      <dd className="text-muted-foreground">
                        The <code className="font-mono">data-key</code> value in the widget script —
                        your chatbot's API key. Keep it private.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">API key</dt>
                      <dd className="text-muted-foreground">
                        One key per chatbot, created on its API Keys page. Authenticates the widget
                        embed.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Registered website</dt>
                      <dd className="text-muted-foreground">
                        The first domain that uses a key gets pinned to it. Other public domains are
                        rejected until you rotate the key.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Native contract</dt>
                      <dd className="font-mono text-xs">
                        /api/chatbot/public/:botId/native-chat/v1
                      </dd>
                      <dd className="text-muted-foreground">
                        The keyless API mobile apps use — bot ID only.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">Console key</dt>
                      <dd className="text-muted-foreground">
                        A secret <code className="font-mono">wc_…</code> key that opens the agency
                        merchant Console.
                      </dd>
                    </div>
                  </dl>
                </Section>
              </>
            )}

            {activeTab === "create-key" && (
              <>
                <TabHeader
                  id="create-key"
                  title="Create an API key"
                  lead={
                    <>
                      Every chatbot has exactly one API key. It authenticates your widget embed —
                      and it locks itself to the first website that uses it.
                    </>
                  }
                />

                <Section id="where-keys-live" title="Where keys live" icon={Terminal}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Open{" "}
                    <Link
                      to="/dashboard/scripts"
                      className="font-semibold text-primary hover:underline"
                    >
                      Generated Scripts
                    </Link>{" "}
                    and press the arrow button on a chatbot card — it opens that bot's{" "}
                    <b className="text-foreground">API Keys</b> page. The status strip there shows
                    whether a key exists, its name, and when it was created.
                  </p>
                </Section>

                <Section id="create-key-steps" title="Create one in four steps" icon={Rocket}>
                  <Steps
                    items={[
                      <>Go to the bot's API Keys page (card arrow on Generated Scripts).</>,
                      <>
                        Open the <b className="text-foreground">create</b> tab, give the key a name
                        and an optional description.
                      </>,
                      <>
                        Press <b className="text-foreground">Create API Key</b>. This replaces any
                        existing key for that bot.
                      </>,
                      <>
                        Copy the key — a "just created" banner reminds you to save it. It is masked
                        afterwards; use Show/Hide, Copy, or Revoke & delete from the overview tab.
                      </>,
                    ]}
                  />
                  <Note kind="warn" title="Shown once">
                    Treat the key like a password. Save it somewhere safe — for example an
                    environment variable or a secrets manager. Never put it in a repo, a client
                    bundle, or a mobile app.
                  </Note>
                </Section>

                <Section id="domain-lock" title="Registered websites (domain lock)" icon={Globe}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The key pins itself to the first domain that actually uses it:
                  </p>
                  <Bullets
                    items={[
                      "First browser request (with an Origin/Referer header) registers that domain on the key.",
                      "After that, requests from other public domains get 403 — “This API key is not registered for this website”.",
                      "www.example.com and example.com count as the same site.",
                      "Gateway hosts and localhost are always allowed and are never pinned.",
                      "Requests without any Origin/Referer are allowed but pin nothing (plain backend-to-backend calls).",
                      "Rotate the key (Create Key) or revoke it to reset the list, then use the new key on your next site.",
                    ]}
                  />
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    See the pinned domains on the same page under{" "}
                    <b className="text-foreground">Registered websites</b>. Details in{" "}
                    <button
                      onClick={() => goTo("guide-installer")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Installer
                    </button>
                    .
                  </p>
                </Section>

                <Section id="key-safety" title="Safety rules" icon={Settings}>
                  <Bullets
                    items={[
                      "Keep the key private — read it from an environment variable or secrets manager.",
                      "Never ship it inside a mobile app or a browser script you host yourself.",
                      "The widget snippet is the only client-side place it appears, and only that one site may use it.",
                      "If a key leaks, Revoke & delete it and create a new one — the old value dies immediately.",
                      "Rotate (Create Key) when you add a second website for the same bot.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "widget" && (
              <>
                <TabHeader
                  id="widget"
                  title="Install the widget"
                  lead={
                    <>
                      The widget is a chat bubble for any website. One script tag carries your bot
                      ID and embed key — nothing else.
                    </>
                  }
                />

                <Section id="widget-snippet" title="The snippet" icon={Code}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Paste it into the{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      &lt;body&gt;
                    </code>{" "}
                    of every page where the bubble should appear. Both values are on{" "}
                    <Link
                      to="/dashboard/scripts"
                      className="font-semibold text-primary hover:underline"
                    >
                      Generated Scripts
                    </Link>{" "}
                    (Web tab).
                  </p>
                  <CodeBlock code={widget} id="widget" />
                </Section>

                <Section id="widget-where" title="Where to paste it" icon={FileText}>
                  <Bullets
                    items={[
                      "Directly before </body>, or in your CMS/.theme footer so it loads on every page.",
                      "React/Next/Vue: put it in your root template or a useEffect that injects the tag once.",
                      "WordPress/Shopify: a “custom HTML” / theme-code block works fine.",
                      "The script is async — it never blocks your page load.",
                    ]}
                  />
                </Section>

                <Section id="widget-values" title="Bot ID & embed key" icon={Terminal}>
                  <Bullets
                    items={[
                      "data-bot-id — the bot's ID, visible on the Generated Scripts card.",
                      "data-key — the bot's API key. The snippet ships a placeholder; copy the real key from the bot's API Keys page (card arrow on Generated Scripts) and paste it over once.",
                      "The snippet never contains a server address — only these two values.",
                    ]}
                  />
                </Section>

                <Section id="widget-customize" title="Customize the look" icon={Settings}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Each Generated Scripts card has a collapsible{" "}
                    <b className="text-foreground">CSS (customize)</b> block — copy it after the
                    script to change the launcher, colors, position and bubble styling without
                    touching the widget code. Your widget theme (from the builder's Theme/Template
                    steps) already controls the in-chat design.
                  </p>
                </Section>

                <Section id="widget-domains" title="Allowed domains" icon={Globe}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The first site that loads the widget pins your key to its domain. Add a second
                    site by rotating the key on the{" "}
                    <button
                      onClick={() => goTo("create-key")}
                      className="font-semibold text-primary hover:underline"
                    >
                      API key
                    </button>{" "}
                    page and pasting the new snippet there.
                  </p>
                </Section>

                <Section id="widget-troubleshooting" title="Troubleshooting" icon={Plug}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2 pr-3 font-semibold">Symptom</th>
                          <th className="py-2 font-semibold">Fix</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">No bubble appears</td>
                          <td className="py-2">
                            Check the script is inside &lt;body&gt; and the bot ID matches; look at
                            the browser console for a 404.
                          </td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">403 “not registered for this website”</td>
                          <td className="py-2">
                            The key is pinned to another domain — rotate the key or use it from the
                            registered site.
                          </td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">401 Unauthorized</td>
                          <td className="py-2">
                            Wrong or revoked key — copy a fresh one from the card.
                          </td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">Placeholder still in data-key</td>
                          <td className="py-2">
                            The snippet still has the placeholder — copy the key from the bot's API
                            Keys page (card arrow) and paste it over.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}

            {activeTab === "native" && (
              <>
                <TabHeader
                  id="native"
                  title="Native & mobile apps"
                  lead={
                    <>
                      Mobile apps cannot use the embed script (there is no{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                        &lt;script&gt;
                      </code>{" "}
                      at runtime). Use the native contract instead — it needs only the bot ID, never
                      an API key, so it is safe to ship inside an app.
                    </>
                  }
                />

                <Note kind="warn" title="Do not ship your API key in a mobile app">
                  Apps can be decompiled, so a bundled key is a public key. Native apps authenticate
                  with the bot ID only — never embed an API key inside the app.
                </Note>

                <Section id="native-how" title="How it works" icon={Smartphone}>
                  <Steps
                    items={[
                      "Your app sends a chat message to the native endpoint — the URL itself contains the bot ID, so no key is needed.",
                      "The bot replies with the answer text (same training, plans and limits as the widget).",
                      "A sessionId keeps the conversation going per user.",
                      "Optionally send a screenContext snapshot so AutoFlow can see what's on screen and guide the user.",
                    ]}
                  />
                </Section>

                <Section id="native-contract" title="Check the contract" icon={Smartphone}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Feature-detect first: open the bot's native endpoint in a GET request before
                    sending anything. The response tells you which contract version the server
                    speaks and what it supports.
                  </p>
                  <Bullets
                    items={[
                      "version — the contract version (for example v1).",
                      "botId — the bot you're talking to.",
                      "endpoints — where to send chat, settings and session requests.",
                      "capabilities — feature flags: chat, screenContext, autoFlow, fileUpload, voice. Only use what's true.",
                    ]}
                  />
                </Section>

                <Section id="native-message" title="Send a message" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Send a chat message to the native endpoint with a JSON body:
                  </p>
                  <Bullets
                    items={[
                      "message — required; the user's text.",
                      "sessionId — keeps the conversation per user.",
                      "userId — optional; identifies the user.",
                      "Response: text (always present — use this), reply (an alias of text), type, provider and version.",
                    ]}
                  />
                </Section>

                <Section id="native-screen" title="Drive AutoFlow from a screen" icon={Globe}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Web AutoFlow reads the page DOM. Native apps have no DOM, so send a{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      screenContext
                    </code>{" "}
                    snapshot instead — the same AutoFlow engine then answers using your real screen
                    state. Send it only when a screen is actually in view.
                  </p>
                  <Bullets
                    items={[
                      "name / title — which screen the user is on.",
                      "visibleText — the text currently on screen.",
                      "buttons — the tappable buttons with their ids.",
                      "forms — fields the user can fill (label, type, required).",
                      "links — navigable links with routes.",
                    ]}
                  />
                </Section>

                <Section id="native-errors" title="Error codes" icon={Plug}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Every error returns the same shape: a code, a message and the version — so you
                    never have to parse human-readable text.
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2 pr-3 font-semibold">HTTP</th>
                          <th className="py-2 pr-3 font-semibold">code</th>
                          <th className="py-2 font-semibold">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {NATIVE_ERROR_ROWS.map((row) => (
                          <tr key={row.code} className="border-b border-border/40">
                            <td className="py-2 pr-3 font-mono text-muted-foreground">
                              {row.status}
                            </td>
                            <td className="py-2 pr-3 font-mono">{row.code}</td>
                            <td className="py-2 text-muted-foreground">{row.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section id="native-rn" title="React Native" icon={Code}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Works the same in bare React Native and Expo. Two options:
                  </p>
                  <Bullets
                    items={[
                      "Option A (quickest) — a WebView pointed at the standalone chat link; the share link already carries the embed key (?k=). Walked through in Setup · WebView app.",
                      "Option B — the WebotMe SDK: provider, floating bubble, voice and native AutoFlow actions. Walked through in Setup · WebotMe SDK.",
                      "Option C (own UI) — call the native endpoint yourself (bot ID in the URL, message in the body) and render your own chat screen.",
                      "Either way the app only holds the bot id and the embed key — server secrets never ship.",
                    ]}
                  />

                  <div className="mt-4 rounded-xl border border-border/60 bg-card p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <QrCode className="h-3.5 w-3.5 text-primary" />
                      Standalone chat page
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      A shareable, non-iframe version of your chat. Generate the link and QR for any
                      bot from{" "}
                      <Link
                        to="/dashboard/scripts"
                        className="font-semibold text-primary hover:underline"
                      >
                        Generated Scripts → App
                      </Link>
                      .
                    </p>
                    <code className="mt-2 block break-all rounded-lg bg-muted/40 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                      {config.chatBaseUrl}/chat/YOUR_BOT_ID?k={EMBED_KEY_PLACEHOLDER}
                    </code>
                  </div>

                  <div className="mt-3 rounded-xl border border-border/60 bg-card p-3">
                    <p className="text-xs font-semibold">Step-by-step setup</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The App setup page walks through your chosen framework with copyable code and
                      the native endpoint — open it from Generated Scripts → App → “Setup your
                      chatbot”.
                    </p>
                  </div>
                </Section>
              </>
            )}

            {activeTab === "type-simple" && (
              <>
                <TabHeader
                  id="type-simple"
                  title="Simple chatbot"
                  lead={
                    <>
                      A straightforward AI assistant: it answers questions from your training data.
                      No flows, no store — the quickest bot you can launch.
                    </>
                  }
                />
                <Section id="type-simple-what" title="What it is" icon={Bot}>
                  <Bullets
                    items={[
                      "A Q&A bot trained on your content — documents, links, plain text.",
                      "Answers in natural language, in the same style as your widget theme.",
                      "Best for: FAQs, support deflection, “ask about my product” sites.",
                    ]}
                  />
                </Section>
                <Section id="type-simple-setup" title="Setup" icon={Rocket}>
                  <Steps
                    items={[
                      "Open the builder (New Chatbot) and pick Bot type → Simple.",
                      "Name & Description, then choose a Theme and a design Template.",
                      "Training — upload or paste the knowledge the bot should use.",
                      "Preview it live, then Review & Launch.",
                      "Publish: Generated Scripts → Web (widget) or App (mobile).",
                    ]}
                  />
                </Section>
                <Section id="type-simple-where" title="Where it runs" icon={Globe}>
                  <Bullets
                    items={[
                      "Website widget, standalone chat page, and native mobile apps.",
                      "Also works on messaging channels (WhatsApp, Telegram, Facebook, Instagram).",
                      "Your plan sets how many simple bots you can keep active — see Storage & usage.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "type-custom-flow" && (
              <>
                <TabHeader
                  id="type-custom-flow"
                  title="Custom flow chatbot"
                  lead={
                    <>
                      You design the conversation yourself, branch by branch, in the FlowBuilder.
                      The bot follows your exact paths instead of improvising.
                    </>
                  }
                />
                <Section id="type-custom-flow-what" title="What it is" icon={GitBranch}>
                  <Bullets
                    items={[
                      "A guided bot: menus, options and fixed branches you draw in the FlowBuilder.",
                      "Deterministic — the same question always goes down the same path.",
                      "Best for: support menus, lead capture, ordered selling flows.",
                      "This is the Agency bot's manual flow mode (Auto Flow vs manual flow).",
                    ]}
                  />
                </Section>
                <Section id="type-custom-flow-setup" title="Setup" icon={Rocket}>
                  <Steps
                    items={[
                      "Builder → Bot type → Agency → manual flow mode.",
                      "Bot details, Theme and Template as usual.",
                      "Pick an industry Category, then draw the Conversation Flow in the FlowBuilder.",
                      "Training for anything the bot should still answer freely.",
                      "Review & Launch — then connect the Product Catalog DB and Orders Storage DB if you're selling.",
                    ]}
                  />
                  <Note kind="info" title="Plan-gated">
                    Agency bots (and their databases) need a plan that includes booking/agency bots
                    — check Plans & Storage before you build.
                  </Note>
                </Section>
                <Section id="type-custom-flow-store" title="Selling with it" icon={Store}>
                  <Bullets
                    items={[
                      "The Product Catalog DB holds what you sell; the Orders Storage DB records orders.",
                      "Pair it with the Storefront for checkout (COD or Stripe) — see Payments & Stripe.",
                      "Orders and customers show up in the agency Console.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "type-auto-flow" && (
              <>
                <TabHeader
                  id="type-auto-flow"
                  title="Auto flow chatbot"
                  lead={
                    <>
                      An autonomous agent: instead of fixed branches it decides by itself how to
                      help — reading the page (web) or your screen (app) as it goes.
                    </>
                  }
                />
                <Section id="type-auto-flow-what" title="What it is" icon={Zap}>
                  <Bullets
                    items={[
                      "The Agency bot's Auto Flow mode — the bot acts on its own, not on drawn branches.",
                      "On the web it reads the page DOM (buttons, links, text) to understand where the user is.",
                      "In mobile apps you send a screenContext snapshot for the same effect.",
                      "Best for: guided selling and support that must adapt to whatever page the user is on.",
                    ]}
                  />
                </Section>
                <Section id="type-auto-flow-setup" title="Setup" icon={Rocket}>
                  <Steps
                    items={[
                      "Builder → Bot type → Agency → Auto Flow mode.",
                      "Bot details, Theme and Template.",
                      "Bot activation — turn Auto Flow on for this bot.",
                      "Training, then Review & Launch.",
                      "Install the widget on your site; the Installer scans show AutoFlow picking up each page.",
                    ]}
                  />
                </Section>
                <Section id="type-auto-flow-apps" title="In mobile apps" icon={Smartphone}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Apps have no DOM, so your app sends a screenContext snapshot (screen name,
                    visible text, buttons, forms, links) with each message — the same AutoFlow
                    engine then answers using the real screen state. Full details under{" "}
                    <button
                      onClick={() => goTo("native")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Native & mobile apps
                    </button>
                    .
                  </p>
                </Section>
              </>
            )}

            {activeTab === "guide-database" && (
              <>
                <TabHeader
                  id="guide-database"
                  title="Databases & collections"
                  lead={
                    <>
                      Structured storage attached to your account — the memory behind every selling
                      bot. This page explains what a database actually does for you, which bots need
                      one, how quotas work, and where everything lives.
                    </>
                  }
                />

                <Section id="guide-database-purpose" title="What they're for" icon={Database}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Collections are structured tables (rows and fields) the platform keeps for your
                    account. Two of them matter for selling:
                  </p>
                  <SubSection id="guide-database-catalog" title="Product Catalog DB">
                    <Bullets
                      items={[
                        "Holds every product your bot can sell: name, description, images, price and stock.",
                        "The chatbot reads the catalog to recommend and describe products inside a conversation.",
                        "The public Storefront renders the exact same catalog — one source of truth for chat and shop.",
                        "When you change a product here, both the bot and the store see the change.",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="guide-database-orders" title="Orders Storage DB">
                    <Bullets
                      items={[
                        "Records every order placed — through chat or through the storefront checkout.",
                        "Stores customer details, items, totals, payment method (COD or Stripe) and order status.",
                        "The agency Console → Orders reads straight from this collection, and Customers is built from the same data.",
                        "Order numbers shown to shoppers at confirmation come from here.",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="guide-database-other" title="Other collections">
                    <p className="text-sm leading-6 text-muted-foreground">
                      The platform also keeps bot and flow data (conversation flows, scan results,
                      catalog metadata) in collections you can see — but don't hand-edit — on the
                      Storage page.
                    </p>
                  </SubSection>
                </Section>

                <Section id="guide-database-how" title="How the bot uses them" icon={GitBranch}>
                  <Steps
                    items={[
                      "During the builder's manual-flow path you connect a Product Catalog DB and an Orders Storage DB to the bot.",
                      "While chatting, the bot pulls products from the catalog to answer questions, compare options and guide the purchase.",
                      "When the shopper confirms, an order row is written to the Orders DB — from chat or from the storefront cart.",
                      "You watch it all in the agency Console: Products, Orders and Customers tabs.",
                    ]}
                  />
                </Section>

                <Section id="guide-database-who" title="Who needs them" icon={Bot}>
                  <Bullets
                    items={[
                      "Custom flow and Auto flow (agency) bots that sell — they are the ones wired to catalog + orders.",
                      "Simple bots don't need any database at all — they just answer questions from training data.",
                      "Database Access is a paid feature: the Plans page lists it per tier, and the Storage page warns you when it isn't included.",
                      "Your plan also caps how many DB Connections you may use at once.",
                    ]}
                  />
                </Section>

                <Section
                  id="guide-database-where"
                  title="Where to see them & quotas"
                  icon={LayoutGrid}
                >
                  <Bullets
                    items={[
                      "Storage page → Database Collections grid: every collection with its row count, size and database type.",
                      "Storage page → DB Connections usage card: slots used against your plan's quota.",
                      "If your plan lacks database access, the grid shows an “access not included” upsell instead of live data.",
                      "Orders and Customers data itself is best consumed through the Console, not by reading raw rows.",
                    ]}
                  />
                </Section>

                <Section
                  id="guide-database-setup"
                  title="Setup path (main key points)"
                  icon={Rocket}
                >
                  <Steps
                    items={[
                      "Make sure your plan includes agency bots and Database Access (Plans & billing).",
                      "Build an agency bot and pick manual flow mode.",
                      "In the builder's later steps, attach the Product Catalog DB and Orders Storage DB.",
                      "Fill the catalog with products (Console → Products).",
                      "Activate the storefront (Console → Settings) so shoppers can check out too.",
                    ]}
                  />
                  <Note kind="info" title="Plan-gated">
                    Agency bots and their databases require a plan that includes booking/agency
                    bots. Check Plans & Storage before you build — the builder enforces the limits.
                  </Note>
                </Section>
              </>
            )}

            {activeTab === "guide-payments" && (
              <>
                <TabHeader
                  id="guide-payments"
                  title="Payments & Stripe"
                  lead={
                    <>
                      Money flows through Webotme in three separate places — customer payments, your
                      payouts, and your own subscription. This page explains what each one is for
                      and the main setup points.
                    </>
                  }
                />

                <Section
                  id="guide-payments-store"
                  title="1. Storefront checkout (your customers)"
                  icon={Store}
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    Shoppers on your public storefront (
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      /store/…
                    </code>
                    ) fill a cart and check out. Two payment methods are offered:
                  </p>
                  <Bullets
                    items={[
                      "Cash on Delivery — the shopper pays on arrival. No gateway needed; the order simply lands with status “pending”.",
                      "Online payment via Stripe — the shopper pays by card at checkout and is returned to the store with ?payment=success and an order number.",
                      "The same catalog powers chat selling and the store, so an order can also start inside the bot conversation.",
                      "Every order — COD or Stripe — is written to the Orders DB and appears in Console → Orders.",
                    ]}
                  />
                  <Steps
                    items={[
                      "Open the agency Console → Settings.",
                      "Press “Activate My Store” — this turns on the live catalog with COD + Stripe.",
                      "Style the sections (announcement bar, hero, trust badges, featured products) and publish.",
                      "Share the /store/… link; test a small order end-to-end before going live.",
                    ]}
                  />
                </Section>

                <Section
                  id="guide-payments-connect"
                  title="2. Stripe Connect (your payouts)"
                  icon={CreditCard}
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    Stripe Connect is how storefront earnings reach{" "}
                    <b className="text-foreground">you</b> — it is completely separate from the
                    shopper's card payment step.
                  </p>
                  <Bullets
                    items={[
                      "Link it in Settings → Connected accounts (Stripe Connect).",
                      "Do this before you go live with paid checkout — otherwise card payments have nowhere to settle.",
                      "Payouts, bank details and Stripe-side disputes are managed in your own Stripe dashboard.",
                      "Full walkthrough: Settings tab on this docs site.",
                    ]}
                  />
                  <button
                    onClick={() => goTo("guide-settings")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    Go to Settings docs →
                  </button>
                </Section>

                <Section
                  id="guide-payments-paddle"
                  title="3. Paddle (paying Webotme)"
                  icon={Rocket}
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    Your own plan subscription is a separate money flow: you pay Webotme through{" "}
                    <b className="text-foreground">Paddle</b>, our merchant of record for
                    subscriptions.
                  </p>
                  <Bullets
                    items={[
                      "Bought on the Plans page — monthly or yearly, whichever the toggle is set to.",
                      "Checkout, invoices and receipts are handled by Paddle.",
                      "Every transaction appears in Purchase History on the same page, with status and dates.",
                      "Upgrades, renewals and expired-plan recovery all run through this same flow.",
                    ]}
                  />
                </Section>

                <Section id="guide-payments-summary" title="Quick summary" icon={Globe}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2 pr-3 font-semibold">Flow</th>
                          <th className="py-2 pr-3 font-semibold">Who pays</th>
                          <th className="py-2 font-semibold">Where to set up</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">Storefront checkout</td>
                          <td className="py-2 pr-3">Your shoppers (COD / Stripe)</td>
                          <td className="py-2">Console → Settings → Activate My Store</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">Stripe Connect</td>
                          <td className="py-2 pr-3">Pays out to you</td>
                          <td className="py-2">Settings → Connected accounts</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3">Paddle</td>
                          <td className="py-2 pr-3">You pay Webotme</td>
                          <td className="py-2">Plans page checkout</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section id="guide-payments-trouble" title="If something goes wrong" icon={Plug}>
                  <Bullets
                    items={[
                      "Card payment failed at checkout — the shopper can retry or choose Cash on Delivery; no order is written until it succeeds.",
                      "Payment succeeded but no order visible — refresh Console → Orders; Stripe returns through ?payment=success, which can take a moment.",
                      "Plan not active after buying — check Purchase History status on the Plans page, then refresh; the Storage page's Current Plan card shows the truth.",
                      "Want a refund on a plan — see the Refunds page linked in the site footer.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "setup-webview" && (
              <>
                <TabHeader
                  id="setup-webview"
                  title="Setup · WebView app"
                  lead={
                    <>
                      The easy way in. Take the shareable chat link you already have from Generated
                      Scripts, open it in a screen of your own app, and you are done. One package,
                      one file, about five minutes, and there is nothing to configure because the
                      link carries the embed key with it.
                      <span className="mt-3 block">
                        This only gives you a chat page inside the app. If you also want the
                        floating bubble with its red badge, voice replies, or a bot that can tap
                        around your own screens, you want the{" "}
                        <button
                          onClick={() => goTo("setup-sdk")}
                          className="font-semibold text-primary hover:underline"
                        >
                          WebotMe SDK setup
                        </button>{" "}
                        instead. The two are separate installs, so pick the one you actually need.
                      </span>
                    </>
                  }
                />

                <Section id="wv-before" title="Before you start" icon={Smartphone}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Start with two things: an app and your chat link. That really is the whole list.
                  </p>
                  <Bullets
                    items={[
                      "An Expo app (npx create-expo-app MyApp) or a React Native CLI project. Any navigation library works.",
                      "Your shareable chat link, from Generated Scripts → App. It is the one behind the QR code, and it already ends with ?k=, so it opens and replies on its own.",
                      "Your bot ID, and only if you are building the URL yourself instead of pasting the ready-made link.",
                    ]}
                  />
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    No chatbot package, no provider, no API key. Nothing else gets installed in this
                    setup.
                  </p>
                </Section>

                <Section id="wv-install" title="1 · Install the one package" icon={Package}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Your chat is a web page, so the only thing the app needs is a view that can
                    render web pages:
                  </p>
                  <CodeBlock id="wv-install-code" code={SETUP_A_INSTALL} />
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    On a bare React Native project the command is{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      npm install react-native-webview
                    </code>
                    . That is the only package this page asks for.
                  </p>
                  <Note kind="warn" title="Development build, not Expo Go">
                    react-native-webview is a native module, so Expo Go cannot load it. Use npx expo
                    run:android / run:ios, or an EAS development build.
                  </Note>
                </Section>

                <Section id="wv-screen" title="2 · Create the chat screen" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    One file makes the whole screen. Paste your shareable chat link into CHAT_URL
                    and you are set:
                  </p>
                  <CodeBlock id="wv-screen-code" code={SETUP_A_SCREEN} />
                  <Bullets
                    items={[
                      "With Expo Router, the file above is already your /chat route.",
                      "On bare React Native, register the same component as a Chat screen in your navigator.",
                      "Shortcut: copy the link from Generated Scripts → App instead of typing the URL, since it already carries the ?k= key.",
                    ]}
                  />
                </Section>

                <Section id="wv-open" title="3 · Open it with a button" icon={Code}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Then push the route from wherever you want, in any screen:
                  </p>
                  <CodeBlock id="wv-open-code" code={SETUP_A_OPEN} />
                  <Bullets
                    items={[
                      "Any navigation library works, as long as you open the Chat screen by its route name.",
                      "Would rather have a floating icon? Keep the same Pressable and pin it to a corner of your root screen.",
                    ]}
                  />
                </Section>

                <Section id="wv-run" title="4 · Run & test" icon={Rocket}>
                  <CodeBlock id="wv-run-code" code={SETUP_RUN} />
                  <Steps
                    items={[
                      <>
                        <b className="text-foreground">Start the app</b> and open the chat screen.
                        The page loads on its own, though the first open takes a second.
                      </>,
                      <>
                        <b className="text-foreground">Send hello</b> and you should get your bot's
                        own training and flow mode back.
                      </>,
                      <>
                        <b className="text-foreground">Try the link on a real device</b> as well.
                        Generated Scripts → App → share link opens the very same chat.
                      </>,
                      <>
                        <b className="text-foreground">Ship it</b> with an EAS build for Expo, or
                        the usual Gradle and Xcode archives for a bare project.
                      </>,
                    ]}
                  />
                </Section>

                <Note kind="info" title="What this setup does not include">
                  This is your chat page inside the app, and nothing more. There is no floating
                  bubble, no red badge and no voice, and AutoFlow cannot move around your native
                  screens because it only ever sees the web page it lives in. All of that belongs to
                  the WebotMe SDK setup.
                </Note>
              </>
            )}

            {activeTab === "setup-sdk" && (
              <>
                <TabHeader
                  id="setup-sdk"
                  title="Setup · WebotMe SDK"
                  lead={
                    <>
                      The full setup. Your bot sits in the app as a chat icon with a red badge,
                      talks back with voice, and can open a screen, tap a button or fill in a form
                      by itself. Six steps, in order, each one a block you can copy.
                      <span className="mt-3 block">
                        The SDK is plain JavaScript, and WebView never gets installed unless you
                        pick the web chat window. If all you wanted was a single chat screen, stop
                        and use the{" "}
                        <button
                          onClick={() => goTo("setup-webview")}
                          className="font-semibold text-primary hover:underline"
                        >
                          WebView setup
                        </button>
                        , which is shorter and a separate install as well.
                      </span>
                    </>
                  }
                />

                <Section id="sdk-before" title="Before you start" icon={Smartphone}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Start with an app: Expo (npx create-expo-app MyApp) or a React Native CLI
                    project, with any navigation library you like. Then pull three things out of the
                    dashboard, because you will paste each of them exactly once, in step 2.
                  </p>
                  <Bullets
                    items={[
                      "Your bot ID, from the Generated Scripts → App tab.",
                      "Your API key, from Dashboard → API Keys. It looks like wbm_…",
                      "Your app id, which is your bundle id, for example com.yourcompany.app. The first app id pins the key, so a different app id is refused.",
                    ]}
                  />
                </Section>

                <Section id="sdk-install" title="1 · Install the packages" icon={Package}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    One package, and no native configuration anywhere:
                  </p>
                  <CodeBlock id="sdk-install-code" code={SETUP_INSTALL} />
                  <Bullets
                    items={[
                      "On bare React Native it is the same command: npm install @webotme/react-native@latest.",
                      "Voice is optional, so drop line 2 if your bot never speaks.",
                      "react-native-webview is not part of this step. It is covered just below.",
                    ]}
                  />

                  <SubSection
                    id="sdk-webview"
                    title="react-native-webview — only if you use the web chat window"
                  >
                    <p className="text-xs leading-5 text-muted-foreground">
                      The SDK treats WebView as an optional peer and only loads it when you use the
                      built-in chat window in its default web form. Choose{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                        variant=&quot;native&quot;
                      </code>{" "}
                      in step 3, or write your own chat file in step 4, and you never install this
                      package at all.
                    </p>
                    <CodeBlock id="sdk-webview-code" code={SETUP_WEBVIEW_INSTALL} />
                    <Note kind="warn" title="Development build, not Expo Go">
                      This only matters if you do install WebView, because it is a native module and
                      Expo Go cannot load it. Without WebView the SDK runs in Expo Go as it is. Use
                      npx expo run:android / run:ios, or an EAS development build, when you want the
                      web window.
                    </Note>
                  </SubSection>
                </Section>

                <Section id="sdk-wrap" title="2 · Wrap your app (_layout.tsx)" icon={Code}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    One provider at the root and every screen below it can talk to the chat. This is
                    where the three things from the list above get pasted:
                  </p>
                  <CodeBlock id="setup-layout" code={SETUP_LAYOUT} />
                  <Bullets
                    items={[
                      "botId is your bot's ID. It is safe to ship inside the bundle.",
                      "apiKey is the wbm_… embed key. The server refuses the chat without it.",
                      "appId is your bundle id. One app id pins the key, a different one is rejected.",
                      "While mounting, the provider arms the screen scanner, the action executor, the safety gate, the navigation adapter and the voice phrases. There is nothing else to switch on.",
                    ]}
                  />
                  <SubSection id="sdk-layout-bare" title="Bare React Native (no Expo Router)">
                    <CodeBlock id="setup-layout-bare" code={SETUP_LAYOUT_BARE} />
                  </SubSection>
                </Section>

                <Section id="sdk-widget" title="3 · Chatbot widget file" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Create{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      components/ChatbotWidget.tsx
                    </code>
                    . The short version below is a floating icon with an emoji for a logo, and it is
                    all most apps need:
                  </p>
                  <CodeBlock id="setup-widget" code={SETUP_WIDGET} />
                  <Bullets
                    items={[
                      'variant="native" is a real React Native chat window, so no WebView and no Expo Go problem.',
                      'variant="web" puts the full web chat page inside the app. Install react-native-webview first, back in step 1.',
                      "Either way it reads the same bot, training, flow mode and AutoFlow.",
                    ]}
                  />
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Mount it once, inside the provider and above your navigator:
                  </p>
                  <CodeBlock id="setup-widget-mount" code={SETUP_WIDGET_MOUNT} />
                  <SubSection id="sdk-widget-own" title="Your own button instead of the bubble">
                    <CodeBlock id="setup-widget-own" code={SETUP_WIDGET_OWN} />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Want your own chat screen with your own layout instead of a window? That is
                      step 4 — the custom chat file.
                    </p>
                  </SubSection>

                  <SubSection id="sdk-widget-demo" title="3b. The full file, every line wired up">
                    <p className="text-sm leading-6 text-muted-foreground">
                      The two blocks above are the short version. Below is the same widget the way
                      it ships in a real Expo app: about two thousand lines with the whole flow in
                      there. The bubble can be dragged anywhere, the sheet slides up and down over
                      your screens, and behind it sit the screen scanner, the action executor, the
                      navigation adapter, two watchdogs that unstick a hung request, voice in and
                      out, and a row of quick replies. The chat is called WebotMe Demo and
                      everything is purple, so you can see at a glance which strings and colors are
                      yours to change.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      It only leans on steps 1 and 2, so you can copy it in as it is. The booking
                      services, the availability labels and the header avatar were stubbed out so
                      the file stands on its own; point them at your own data, rename your routes,
                      and you are done. If you skipped the voice packages, the mic button simply
                      tells you they are missing instead of crashing.
                    </p>
                    <DemoFileBlock code={DEMO_CHATBOT_WIDGET} name="components/ChatbotWidget.tsx" />
                  </SubSection>
                </Section>

                <Section id="sdk-ai" title="3c · Full setup your widget file" icon={Wand2}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Already have a widget file of your own, and you do not want to touch its design?
                    Paste it below. The AI reads the whole file and adds the WebotMe side of things:
                    the send button talks to the chat, the mic starts and stops voice, the badge
                    counts new replies, and the scanner and AutoFlow keep running. Everything you
                    wrote yourself, down to the last color and animation, comes back exactly as it
                    was.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Paste the real file you ship, not a cut-down version. A few hundred lines is the
                    comfortable zone, and a longer file still comes back whole, it just takes a
                    little longer. Steps 1 and 2 have to be done first, because the hooks it adds
                    expect the provider to be mounted.
                  </p>
                  <WidgetSetupTool />
                </Section>

                <Section
                  id="sdk-custom"
                  title="4 · Custom chat file (your own UI, no WebView)"
                  icon={Code}
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    Skip the window altogether. Keep the SDK for the session, the training and
                    AutoFlow, and draw the messages yourself. It is one file of plain React Native,
                    and none of the WebView step applies here:
                  </p>
                  <CodeBlock id="sdk-custom-code" code={SETUP_CUSTOM_CHAT} />
                  <Bullets
                    items={[
                      "useWebotMeChat() hands you { messages, send, sending, error, retry } on the same session the provider owns.",
                      "Every message carries from (user or bot), text, createdAt, plus any AutoFlow action the server attached.",
                      "AutoFlow keeps running while your own UI is on screen, the actions just happen in the background.",
                      "Custom flow bots need no extra code. The menu buttons arrive as ordinary chat messages.",
                    ]}
                  />
                  <Note kind="info" title="When to pick this">
                    Write your own chat file when the chat has to look like the rest of your app.
                    Take the widget file from step 3 when you just want a window you can drop in and
                    forget about.
                  </Note>
                </Section>

                <Section id="sdk-autoflow" title="5 · AutoFlow" icon={Zap}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    On the web, AutoFlow reads the page the bot is sitting on. An app has no page to
                    read, so you send it a{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      screenContext
                    </code>{" "}
                    snapshot instead: the text, buttons and links the user can see right now. The
                    server answers with an action (navigate, click, fill, checkout) and the provider
                    runs it:
                  </p>
                  <CodeBlock id="setup-autoflow" code={SETUP_AUTOFLOW} />
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    Once the provider is mounted, all of this runs for you:
                  </p>
                  <Bullets
                    items={[
                      "A screen scanner that refreshes the snapshot from your element tree every couple of seconds.",
                      "An action executor that runs whatever the server sends back and hands control to your app afterwards.",
                      "A safety gate that asks the user before a risky tap or form fill.",
                      "A navigation adapter that keeps track of the current route, so navigate and click land on the right screen.",
                    ]}
                  />
                  <SubSection id="sdk-autoflow-fns" title="Functions you can call yourself">
                    <Bullets
                      items={[
                        'chatWithUs("hello") → send a message from any file, no JSX needed.',
                        "updateChatScreenContext(ctx) → refresh the snapshot the moment a screen mounts.",
                        "executeAction(action) → run one action by hand (auto-run is the default).",
                        'navigateTo("/faq") → move the app when AutoFlow answers { type: "navigate" }.',
                        "resetChat() → wipe the transcript and start a new session.",
                        "useWebotMeChat() → { messages, send, sending, error } for your own chat UI.",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="sdk-autoflow-actions" title="Actions the bot can send">
                    <Bullets
                      items={[
                        '{ type: "navigate", route, label } → opens a screen.',
                        '{ type: "click", targetId, label } → taps the button with that id.',
                        '{ type: "fill", fieldId, value, label } → types into a field.',
                        '{ type: "checkout", url, label } → opens your payment page.',
                      ]}
                    />
                  </SubSection>
                </Section>

                <Section id="sdk-run" title="6 · Run & test" icon={Rocket}>
                  <CodeBlock id="sdk-run-code" code={SETUP_RUN} />
                  <Steps
                    items={[
                      <>
                        <b className="text-foreground">Start the app</b> and the chat icon should
                        sit in the corner of every screen, above your navigator.
                      </>,
                      <>
                        <b className="text-foreground">Send hello</b> and you should get your own
                        bot's training and flow mode back.
                      </>,
                      <>
                        <b className="text-foreground">Try it on a real device</b> as well. The
                        standalone link in Generated Scripts → App opens the same chat.
                      </>,
                      <>
                        <b className="text-foreground">Ship it</b> with an EAS build for Expo, or
                        the usual Gradle and Xcode archives for a bare project.
                      </>,
                    ]}
                  />
                </Section>

                <Note kind="info" title="What ships inside your app">
                  The bundle carries the bot id and the embed key (wbm_), and that is all. The key
                  is public, limited by quota and revocable from your dashboard, so there is nothing
                  to hide there. Server secrets and AI provider keys like OpenAI or Groq stay on the
                  backend where they belong.
                </Note>
              </>
            )}

            {activeTab === "guide-dashboard" && (
              <>
                <TabHeader
                  id="guide-dashboard"
                  title="Dashboard overview"
                  lead={
                    <>
                      The Overview page (<code className="font-mono text-xs">/dashboard</code>) is
                      your home base for the whole account — everything happening across your
                      chatbots in one screen.
                    </>
                  }
                />
                <Section id="guide-dashboard-stats" title="What you'll see" icon={LayoutGrid}>
                  <Bullets
                    items={[
                      "Welcome header with a New Chatbot shortcut straight into the builder.",
                      "Coupon banners for active promotions.",
                      "Stat cards: Total Chatbots, Active Templates, and Script Installs.",
                      "Conversations this week — an area chart of messages over time.",
                      "Installs by template — a bar chart of the last 30 days.",
                      "Recent chatbot activity and your most recently generated scripts.",
                      "Live preview of your latest bot without leaving the page.",
                    ]}
                  />
                </Section>
                <Section id="guide-dashboard-tips" title="Tips" icon={Rocket}>
                  <Bullets
                    items={[
                      "Start here after login — the charts tell you instantly if installs or chats dropped.",
                      "Recent generated scripts is the fastest way back to a widget you just embedded.",
                      "Use New Chatbot when you're adding a bot; the builder remembers your plan limits.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "guide-scripts" && (
              <>
                <TabHeader
                  id="guide-scripts"
                  title="Generated Scripts"
                  lead={
                    <>
                      Generated Scripts (
                      <code className="font-mono text-xs">/dashboard/scripts</code>) is where every
                      chatbot gets its integration code — for the web and for apps.
                    </>
                  }
                />
                <Section id="guide-scripts-web" title="Web tab" icon={Code}>
                  <Bullets
                    items={[
                      "The embed <script> snippet for the site — copy and paste.",
                      "The snippet ships a placeholder key — copy the real one from the bot's API Keys page (card arrow) and paste it over once.",
                      "A collapsible CSS (customize) block for launcher, colors and position.",
                      "Copy is plan-aware — locked options prompt you to upgrade.",
                    ]}
                  />
                </Section>
                <Section id="guide-scripts-app" title="App tab" icon={Smartphone}>
                  <Bullets
                    items={[
                      "Pick your framework: React Native (bare) or React Native Expo.",
                      "A shareable chat link plus QR code for instant testing.",
                      "Two setup buttons — “WebView setup” (quick, chat link only) and “WebotMe SDK setup” (full package, step by step), each opening its own docs page.",
                    ]}
                  />
                </Section>
                <Section id="guide-scripts-cards" title="Card actions" icon={FileText}>
                  <Bullets
                    items={[
                      "The arrow button (top-right of the card) opens that bot's API Keys page.",
                      "Search bots by name and filter by template above the grid.",
                      "“How to use this” dialog explains the two integration modes.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "guide-installer" && (
              <>
                <TabHeader
                  id="guide-installer"
                  title="Installer"
                  lead={
                    <>
                      The Installer (<code className="font-mono text-xs">/dashboard/inbox</code>)
                      tracks where your scripts actually run — “Manage chatbot installation scripts
                      and embedded websites”.
                    </>
                  }
                />
                <Section id="guide-installer-content" title="What's on the page" icon={Plug}>
                  <Bullets
                    items={[
                      "Search across your chatbots, then a card per bot.",
                      "Embed Script with quick copy — or a hint to generate one on Scripts first.",
                      "Installed Websites (n) — every site pinned to the bot's key, each removable with an X.",
                      "Scan-log viewer per site and AutoFlow scan / flow-step detail panels.",
                    ]}
                  />
                </Section>
                <Section id="guide-installer-statuses" title="Scan statuses" icon={Terminal}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="py-2 pr-3 font-semibold">Status</th>
                          <th className="py-2 font-semibold">Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3 font-mono">LIVE</td>
                          <td className="py-2">Site is serving the widget right now.</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3 font-mono">DONE</td>
                          <td className="py-2">Scan finished successfully.</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3 font-mono">FAILED</td>
                          <td className="py-2">Scan could not reach or read the site.</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3 font-mono">PARTIAL</td>
                          <td className="py-2">Some pages scanned, some unreachable.</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-3 font-mono">IDLE</td>
                          <td className="py-2">Queued or not scanned yet.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Section>
                <Section id="guide-installer-remove" title="Removing a site" icon={Globe}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Removing a site here clears it from the key's registered list, so its widget
                    stops authenticating. To re-add, use the key from that domain again — or{" "}
                    <button
                      onClick={() => goTo("create-key")}
                      className="font-semibold text-primary hover:underline"
                    >
                      rotate the key
                    </button>{" "}
                    to start clean.
                  </p>
                </Section>
              </>
            )}

            {activeTab === "guide-console" && (
              <>
                <TabHeader
                  id="guide-console"
                  title="Console (agency)"
                  lead={
                    <>
                      The Console is a merchant back office for agency chatbots — revenue, catalog,
                      orders and customers behind one secret key.
                    </>
                  }
                />
                <Note kind="info" title="Access: secret console key">
                  Enter your <code className="font-mono text-[11px]">wc_…</code> console key at{" "}
                  <code className="font-mono text-[11px]">/console</code> to open it. Only agency
                  chatbots qualify — everything else shows “Agency access required”.
                </Note>
                <Section id="guide-console-tabs" title="The tabs" icon={Monitor}>
                  <SubSection id="guide-console-dashboard" title="Dashboard">
                    <Bullets
                      items={[
                        "Stat cards: total revenue (30d), orders (30d), average order value and more.",
                        "Revenue Trend chart and a Recent Orders list.",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="guide-console-products" title="Products">
                    <Bullets
                      items={[
                        "Product grid with search and stock badges (In Stock / Only n left / Out of Stock).",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="guide-console-orders" title="Orders">
                    <Bullets
                      items={[
                        "Table with order number, customer, items, total and payment status.",
                      ]}
                    />
                  </SubSection>
                  <SubSection id="guide-console-customers" title="Customers">
                    <Bullets items={["Customer cards: contact, order count, last order date."]} />
                  </SubSection>
                  <SubSection id="guide-console-settings" title="Settings">
                    <Bullets
                      items={[
                        "“Activate My Store” turns on the live catalog with COD + Stripe and theme control.",
                        "Section toggles: announcement bar, hero banner, trust badges, featured products, category cards.",
                        "Edit texts and colors, then open the live /store/… storefront.",
                      ]}
                    />
                  </SubSection>
                </Section>
              </>
            )}

            {activeTab === "guide-store" && (
              <>
                <TabHeader
                  id="guide-store"
                  title="Storefront"
                  lead={
                    <>
                      The Storefront (<code className="font-mono text-xs">/store/…</code>) is the
                      public shop generated from a bot's product catalog — shareable like any other
                      page.
                    </>
                  }
                />
                <Section id="guide-store-page" title="What shoppers see" icon={Store}>
                  <Bullets
                    items={[
                      "Announcement bar, store header with search and cart.",
                      "Hero (title, subtitle, CTA) and trust badges you control.",
                      "Category chips, featured products and the product grid.",
                      "Product detail modal with Add to cart, and a cart drawer.",
                    ]}
                  />
                </Section>
                <Section id="guide-store-checkout" title="Checkout" icon={CreditCard}>
                  <Bullets
                    items={[
                      "Cash on Delivery or online payment via Stripe.",
                      "Order confirmation with an order number; Stripe returns through ?payment=success.",
                      "Stock and pricing come straight from the bot's catalog.",
                    ]}
                  />
                </Section>
                <Section id="guide-store-enable" title="Enabling it" icon={Rocket}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Activate the store from{" "}
                    <button
                      onClick={() => goTo("guide-console")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Console → Settings
                    </button>{" "}
                    (“Activate My Store”), then style the sections and publish. The store link lives
                    right there too.
                  </p>
                </Section>
              </>
            )}

            {activeTab === "guide-channels" && (
              <>
                <TabHeader
                  id="guide-channels"
                  title="Messaging channels"
                  lead={
                    <>
                      Beyond websites, the same trained bot can answer on messaging apps. Each
                      channel page lives in the dashboard sidebar and shows Account, Service Flows
                      and Status cards plus a customization panel.
                    </>
                  }
                />
                <Section id="guide-whatsapp" title="WhatsApp" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Connect a WhatsApp Business account and the bot auto-replies to every incoming
                    message, like a ManyChat-style autoresponder. The page shows your Account,
                    Service Flows and Status, plus a panel to customize the replies.
                  </p>
                </Section>
                <Section id="guide-telegram" title="Telegram" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Paste a Telegram bot token — Webotme verifies it, registers the webhook, and
                    routes every incoming message through your AI chatbot. All your connected bots
                    are listed on the same page.
                  </p>
                </Section>
                <Section id="guide-facebook" title="Facebook" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    OAuth-connect a Facebook Page so the bot auto-replies to Page messages and
                    comments. Account, Service Flows and Status cards show the connection at a
                    glance.
                  </p>
                </Section>
                <Section id="guide-instagram" title="Instagram" icon={MessageSquare}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    OAuth-connect an Instagram Business or Creator account so the bot auto-replies
                    to every DM and comment, with the same Account / Service Flows / Status layout
                    and reply customization.
                  </p>
                </Section>
              </>
            )}

            {activeTab === "guide-settings" && (
              <>
                <TabHeader
                  id="guide-settings"
                  title="Settings"
                  lead={
                    <>
                      Settings (<code className="font-mono text-xs">/dashboard/settings</code>)
                      manages the account itself, not individual bots. Everything here applies to
                      your whole Webotme account — five tabs, explained below.
                    </>
                  }
                />

                <Section id="guide-settings-profile" title="Profile" icon={Settings}>
                  <Bullets
                    items={[
                      "Your account basics — name, email and the details tied to your login.",
                      "Keep the email current: security alerts, receipts and plan notices all go there.",
                      "Changes here apply instantly across the dashboard; no bot needs reconfiguring.",
                    ]}
                  />
                </Section>

                <Section id="guide-settings-coupons" title="Coupons" icon={CreditCard}>
                  <Bullets
                    items={[
                      "Lists the promotional coupons available on your account.",
                      "Active coupons surface automatically as a banner on the Overview page, so you never miss a running offer.",
                      "Apply them during the plan checkout on the Plans page to discount your subscription.",
                      "Expired coupons stay in the list (greyed out) so you can see what you've used.",
                    ]}
                  />
                </Section>

                <Section
                  id="guide-settings-stripe"
                  title="Connected accounts (Stripe)"
                  icon={Store}
                >
                  <Bullets
                    items={[
                      "Stripe Connect — the account your storefront earnings are paid out to.",
                      "Link it once; after that every successful card order settles towards it.",
                      "Essential before you enable paid checkout — see Payments & Stripe for the full money-flow picture.",
                      "Payout schedules, bank details and disputes are managed inside your own Stripe dashboard, not here.",
                    ]}
                  />
                  <button
                    onClick={() => goTo("guide-payments")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    Go to Payments & Stripe docs →
                  </button>
                </Section>

                <Section id="guide-settings-email" title="Email setup" icon={MessageSquare}>
                  <Bullets
                    items={[
                      "Outgoing mail configuration — who the platform's emails appear to come from.",
                      "Covers the transactional mail Webotme sends on your behalf (notifications, digests, account mail).",
                      "Set it correctly the first time; a wrong sender address is the most common reason mail lands in spam.",
                      "If you rely on email for customers, verify the setup right after creating the account.",
                    ]}
                  />
                </Section>

                <Section id="guide-settings-notifications" title="Notifications" icon={Plug}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Three independent toggles — turn each on or off without affecting the others:
                  </p>
                  <Bullets
                    items={[
                      "Product updates — news about new features and platform changes.",
                      "Weekly digest — a summary of your account activity delivered once a week.",
                      "Security alerts — logins, key changes and other sensitive events. Strongly recommended to keep this one on.",
                    ]}
                  />
                </Section>

                <Section id="guide-settings-tips" title="Quick tips" icon={Rocket}>
                  <Bullets
                    items={[
                      "Settings is account-level — per-bot things (keys, scripts, training) live on their own pages.",
                      "Coupons + Plans are the two tabs you'll touch most often when upgrading.",
                      "Connected accounts + Payments & Stripe should be configured together before launch.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "guide-storage" && (
              <>
                <TabHeader
                  id="guide-storage"
                  title="Storage & usage"
                  lead={
                    <>
                      Storage (<code className="font-mono text-xs">/dashboard/storage</code>) shows
                      exactly where your plan stands — “Manage your storage, databases, and usage
                      limits”. Every card answers one question: how much of something am I using,
                      and what is my limit?
                    </>
                  }
                />

                <Section id="guide-storage-usage" title="The usage cards" icon={Database}>
                  <SubSection id="guide-storage-card-storage" title="Storage Used">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Files and training data your bots consume — uploaded documents, images and
                      knowledge bases all count. It only grows when you add training; deleting old
                      material frees it back up.
                    </p>
                  </SubSection>
                  <SubSection id="guide-storage-card-bots" title="Simple Chatbot / Agency Chatbot">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Two separate quotas: how many simple bots and how many agency bots you may
                      keep active at once. The builder checks these before letting you create
                      another bot.
                    </p>
                  </SubSection>
                  <SubSection id="guide-storage-card-db" title="DB Connections">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Database slots in use against your plan's quota. Selling bots (catalog +
                      orders) consume these — see Databases & collections.
                    </p>
                  </SubSection>
                  <SubSection id="guide-storage-card-api" title="API Calls / Day">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Daily chat quota across the widget, standalone page and mobile apps. It resets
                      every day; hitting it mid-day returns a plan-limit response to visitors until
                      it resets or you upgrade.
                    </p>
                  </SubSection>
                  <SubSection id="guide-storage-card-email" title="Emails / Day">
                    <p className="text-sm leading-6 text-muted-foreground">
                      How many outgoing emails the platform may send for your account per day — tied
                      to your Email setup in Settings.
                    </p>
                  </SubSection>
                  <Note kind="warn" title="Plan Limit Reached banner">
                    When any quota is hit, a banner appears automatically at the top of this page.
                    It tells you which limit stopped you and links straight to the fix (clean up or
                    upgrade).
                  </Note>
                </Section>

                <Section id="guide-storage-db" title="Databases & breakdown" icon={Database}>
                  <Bullets
                    items={[
                      "Database Collections grid — every collection with row count, size and database type.",
                      "Some collections are plan-gated: without Database Access the grid shows an “access not included” message instead of live rows.",
                      "Storage Breakdown — a visual split of what is eating your storage (training vs files vs data).",
                      "Plan Summary — total and active chatbots, scripts generated, and API calls used today.",
                    ]}
                  />
                </Section>

                <Section id="guide-storage-plan" title="Current plan card" icon={CreditCard}>
                  <Bullets
                    items={[
                      "Plan name, expiry date and how many days are left.",
                      "The full quota list for your tier — chatbots, storage, calls, emails, databases.",
                      "Upgrade / Manage / Renew buttons jump straight to the Plans page.",
                      "This card is the single source of truth for “what am I actually on?”.",
                    ]}
                  />
                </Section>

                <Section id="guide-storage-consumes" title="What consumes your quotas" icon={Plug}>
                  <Bullets
                    items={[
                      "Training uploads (documents, links, images) → Storage Used.",
                      "Each new bot → the matching bot quota (simple or agency).",
                      "Catalog + orders on an agency bot → DB Connections.",
                      "Every visitor chat (widget, app, channel) → API Calls / Day.",
                      "Platform emails (digests, notifications) → Emails / Day.",
                    ]}
                  />
                </Section>

                <Section id="guide-storage-limits" title="When you hit a limit" icon={Terminal}>
                  <Steps
                    items={[
                      "Read the Plan Limit Reached banner — it names the exact quota.",
                      "Quick win: delete unused bots, old training files or stale collections to free space immediately.",
                      "For daily call limits: wait for the daily reset, or upgrade for a bigger allowance.",
                      "For structural limits (bot counts, database access): upgrade on the Plans page — changes apply right away.",
                    ]}
                  />
                </Section>
              </>
            )}

            {activeTab === "guide-plans" && (
              <>
                <TabHeader
                  id="guide-plans"
                  title="Plans & billing"
                  lead={
                    <>
                      The pricing page (<code className="font-mono text-xs">/plans</code>) is
                      public: compare plans, buy or upgrade, and review everything you've purchased.
                      Your plan decides how many bots you can run, how much you can store, and which
                      features (like databases) are unlocked.
                    </>
                  }
                />

                <Section id="guide-plans-choose" title="Choosing a plan" icon={CreditCard}>
                  <Bullets
                    items={[
                      "The page opens with a Monthly / Yearly billing toggle — yearly costs less per month for the same features.",
                      "Tiers (for example Starter, Pro, Advanced — your live list may differ) are shown side by side as cards.",
                      "Your current plan carries a “Current Plan” badge so you always know what you're on before buying.",
                      "Each feature line has a help tooltip — hover it if a term (like RAG Model) is unfamiliar.",
                    ]}
                  />
                </Section>

                <Section
                  id="guide-plans-features"
                  title="What the listed features mean"
                  icon={FileText}
                >
                  <SubSection id="guide-plans-f-chatbots" title="Chatbots">
                    <p className="text-sm leading-6 text-muted-foreground">
                      How many bots you may keep active at once, split between simple and agency
                      types. The builder refuses to create one beyond the quota.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-agency" title="Booking Agencies">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Slots for agency bots — the selling bots with Console, storefront, catalog and
                      orders. Simple bots don't consume these.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-db" title="Database Access">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Unlocks the Product Catalog and Orders databases (and their quota on the
                      Storage page). Without it, selling features are closed.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-storage" title="Training Storage">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Room for documents, links and images you train your bots on — tracked live on
                      the Storage page.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-rag" title="RAG Model">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Retrieval-augmented answering — the bot pulls the most relevant snippets from
                      your training data instead of guessing. Higher tiers include it.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-support" title="Email Support">
                    <p className="text-sm leading-6 text-muted-foreground">
                      How you can reach us — response channel and priority depend on the tier.
                    </p>
                  </SubSection>
                  <SubSection id="guide-plans-f-script" title="Script API">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Access to the embed widget and key system — required for installing the chat
                      bubble anywhere.
                    </p>
                  </SubSection>
                </Section>

                <Section id="guide-plans-buy" title="Buying or upgrading" icon={Rocket}>
                  <Steps
                    items={[
                      "Open /plans and set the Monthly / Yearly toggle.",
                      "Pick the tier whose quotas match what you're trying to build.",
                      "Press the plan's buy/upgrade button — checkout runs through Paddle (card payments, receipts handled there).",
                      "Return to the dashboard; the Current Plan badge, sidebar status and Storage card all update to the new tier.",
                      "Upgrades apply immediately — no need to recreate bots or reinstall scripts.",
                    ]}
                  />
                </Section>

                <Section id="guide-plans-history" title="Purchase history" icon={FileText}>
                  <Bullets
                    items={[
                      "Below the plan cards, every transaction is listed with its status and dates.",
                      "The plan you're currently on is highlighted in the list.",
                      "Use it to confirm a payment went through before contacting support.",
                      "Receipts for each purchase are also available from Paddle.",
                    ]}
                  />
                </Section>

                <Section id="guide-plans-where" title="Where your plan shows up" icon={LayoutGrid}>
                  <Bullets
                    items={[
                      "Plans page — the Current Plan badge on your tier.",
                      "Dashboard sidebar — a status box: “Upgrade Plan”, “Plan Active” or “Plan Expired — Renew Now”.",
                      "Storage page — the Current Plan card with expiry, days left and full quota list.",
                      "Builder — bot types and steps are gated by what your plan includes.",
                      "Generated Scripts — copy actions can be plan-locked with an upgrade prompt.",
                    ]}
                  />
                </Section>

                <Section id="guide-plans-expiry" title="When your plan expires" icon={Plug}>
                  <Bullets
                    items={[
                      "The sidebar flips to “Plan Expired — Renew Now” and the Storage page banner appears.",
                      "New bot creation and locked script actions are blocked until you renew.",
                      "Daily quota overages return plan-limit responses to visitors (chat still fails soft with a clear code).",
                      "Renew from any of the plan entry points — Plans page, sidebar box or Storage card; your data stays intact while expired.",
                    ]}
                  />
                </Section>

                <Section id="guide-plans-refunds" title="Refunds & questions" icon={Globe}>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Refund requests follow the published Refunds policy (linked in the site footer).
                    For anything billing-related that looks wrong — a charge you don't recognise, a
                    plan that didn't activate — check Purchase History first, then contact support
                    with the transaction details.
                  </p>
                </Section>
              </>
            )}

            {/* Prev / Next — proper docs pagination */}
            <div className="flex items-stretch justify-between gap-3 border-t border-border/60 pt-5">
              {prevTab ? (
                <button
                  onClick={() => goTo(prevTab.id)}
                  className="group flex max-w-[45%] flex-col gap-0.5 rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition hover:border-primary/40"
                >
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <ArrowLeft className="h-3 w-3" /> Previous
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {prevTab.label}
                  </span>
                </button>
              ) : (
                <span />
              )}
              {nextTab ? (
                <button
                  onClick={() => goTo(nextTab.id)}
                  className="group flex max-w-[45%] flex-col gap-0.5 rounded-xl border border-border/60 bg-card px-4 py-3 text-right transition hover:border-primary/40"
                >
                  <span className="flex items-center justify-end gap-1 text-[11px] font-semibold text-muted-foreground">
                    Next <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {nextTab.label}
                  </span>
                </button>
              ) : (
                <span />
              )}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

function TabHeader({ id, title, lead }: { id: string; title: string; lead: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{lead}</p>
    </section>
  );
}

function Section({
  id,
  title,
  icon: Icon = Package,
  children,
}: {
  id: string;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SubSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mt-5 scroll-mt-24">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({
  kind,
  title,
  children,
}: {
  kind: "warn" | "info";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        kind === "warn"
          ? "border-amber-500/25 bg-amber-500/[0.06]"
          : "border-primary/25 bg-primary/[0.05]",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold",
          kind === "warn" ? "text-amber-700 dark:text-amber-400" : "text-primary",
        )}
      >
        {title}
      </p>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div>
    </div>
  );
}

function DemoFileBlock({ code, name }: { code: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="font-mono text-xs font-semibold text-foreground">{name}</span>
        <span className="text-[11px] text-muted-foreground">{code.split("\n").length} lines</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-md border border-border/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {open ? "Hide file" : "Show file"}
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy file"}
        </button>
      </div>
      {open && (
        <pre className="max-h-[75vh] overflow-auto p-4 font-mono text-[11px] leading-5 text-foreground/85">
          {code}
        </pre>
      )}
    </div>
  );
}

type WidgetSetupResponse = {
  code?: string;
  truncated?: boolean;
  message?: string;
};

/** Docs 3c: paste your own widget file, the server's AI wires WebotMe into it. */
function WidgetSetupTool() {
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const lineCount = source ? source.split("\n").length : 0;

  const run = async () => {
    const code = source.trim();
    if (!code || busy) return;
    setBusy(true);
    setResult(null);
    try {
      // A very long file comes back cut off, so keep asking for the rest and
      // stitch the pieces together - one round-trip at a time.
      let acc = "";
      let truncated = true;
      for (let round = 0; round < 4 && truncated; round += 1) {
        const res = await apiFetch("/api/docs/widget-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(round === 0 ? { code } : { code, resume: acc }),
        });
        const data = (await res.json().catch(() => null)) as WidgetSetupResponse | null;
        if (!res.ok || !data?.code) {
          toast.error(data?.message || "Could not set up the file. Please try again.");
          return;
        }
        acc = data.code;
        truncated = Boolean(data.truncated);
        setResult(acc);
      }
      if (truncated) {
        toast.error("The file came back cut off - press Setup once more and it will finish");
      } else {
        toast.success("Your file is ready to copy");
      }
    } catch {
      toast.error("Could not reach the setup service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-foreground">Your widget file</span>
        <span className="text-[11px] text-muted-foreground">
          {lineCount ? `${lineCount} lines` : "nothing pasted yet"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setSource(DEMO_CHATBOT_WIDGET);
              setResult(null);
            }}
            disabled={busy}
            className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Try the demo file
          </button>
          <button
            onClick={() => {
              setSource("");
              setResult(null);
            }}
            disabled={!source || busy}
            className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={() => void run()}
            disabled={!source.trim() || busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            {busy ? "Setting up…" : "Setup my file"}
          </button>
        </div>
      </div>

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        placeholder={
          "Paste your whole chatbot widget file here (Ctrl+V), then press Setup my file.\n\n" +
          "Your design stays exactly as it is: colors, layout, animations, strings. " +
          "Only the WebotMe calls get added - chat send, mic, badge, scanner, AutoFlow."
        }
        className="mt-2 h-72 w-full resize-y rounded-lg border border-border/60 bg-card p-3 font-mono text-[11px] leading-5 text-foreground/85 outline-none transition focus:border-primary"
      />

      {busy && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Reading your file and wiring it up. A big file takes a couple of passes, so leave this tab
          open until the copy box stops updating.
        </p>
      )}

      {result && (
        <div className="mt-4">
          <DemoFileBlock code={result} name="components/ChatbotWidget.tsx" />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Copy it straight over your file and run the app. If one button still does not fire, fix
            that spot by hand and paste it in again; whatever you change yourself stays, because the
            AI never rewrites your design.
          </p>
        </div>
      )}
    </div>
  );
}
