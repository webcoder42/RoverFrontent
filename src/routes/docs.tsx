import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Server,
  Smartphone,
  Terminal,
  Braces,
  Package,
  LayoutDashboard,
  KeyRound,
  QrCode,
} from "lucide-react";
import { config } from "@/lib/config";
import { toast } from "sonner";
import logo from "@/asset/logo.png";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Docs — Webotme API Keys" }] }),
  component: DocsPage,
});

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Globe },
  { id: "create-key", label: "1. Create an API key", icon: Terminal },
  { id: "widget", label: "2. Install the widget", icon: Smartphone },
  { id: "call-api", label: "3. Call the API from your backend", icon: Server },
  { id: "node", label: "Node.js", icon: Braces },
  { id: "python", label: "Python", icon: Braces },
  { id: "php", label: "PHP", icon: Braces },
  { id: "curl", label: "cURL", icon: Terminal },
  { id: "verify", label: "Verify bot data", icon: Check },
  { id: "native", label: "4. Native & mobile apps", icon: Package },
] as const;

function DocsPage() {
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, []);

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1600);
    toast.success("Copied");
  };

  const widget = `<script async src="${config.apiBaseUrl}/static/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-api-host="${config.apiBaseUrl}"
  data-chat-host="${config.chatBaseUrl}">
</script>`;

  const node = `// Node.js 18+ (native fetch) — keep the key on your server
const API_KEY = "YOUR_API_KEY";
const res = await fetch("${config.apiBaseUrl}/api/sdk/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${API_KEY}\`
  },
  body: JSON.stringify({
    botId: "YOUR_BOT_ID",
    message: "Hello!",
    sessionId: "user-123",
    userId: "user-123"
  })
});
const data = await res.json();
console.log(data.reply); // the bot's reply`;

  const nativeDiscover = `# Which version does this server speak, and what can it do?
curl ${config.apiBaseUrl}/api/chatbot/public/YOUR_BOT_ID/native-chat/v1

# {
#   "version": "v1",
#   "botId": "YOUR_BOT_ID",
#   "endpoints": { "chat": "...", "settings": "...", "sessions": "...", "sessionNew": "..." },
#   "capabilities": { "chat": true, "screenContext": true, "autoFlow": true,
#                     "fileUpload": false, "voice": false }
# }`;

  const nativeChat = `# Native chat — bot ID only, no API key
curl -X POST ${config.apiBaseUrl}/api/chatbot/public/YOUR_BOT_ID/native-chat/v1 \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello!",
    "sessionId": "app-user-123",
    "userId": "app-user-123"
  }'

# 200 OK
# {
#   "reply": "Hi! How can I help?",
#   "text": "Hi! How can I help?",   <- always present, use this
#   "type": "message",
#   "provider": "gemini",
#   "version": "v1"
# }`;

  const nativeScreen = `# Tell AutoFlow which screen the user is on, so it can guide them
curl -X POST ${config.apiBaseUrl}/api/chatbot/public/YOUR_BOT_ID/native-chat/v1 \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "How do I upgrade?",
    "sessionId": "app-user-123",
    "screenContext": {
      "name": "pricing",
      "title": "Plans",
      "visibleText": ["Free", "Pro", "Business"],
      "buttons": [
        { "id": "buy_pro", "text": "Buy Pro" },
        { "id": "compare",  "text": "Compare plans" }
      ],
      "forms": [
        { "id": "email", "label": "Email", "type": "email", "required": true }
      ],
      "links": [ { "id": "faq", "text": "Read FAQ", "route": "/faq" } ]
    }
  }'

# screenContext is optional. Send it only when a screen is actually in view —
# it changes what AutoFlow replies with, because the engine can now see the
# buttons, fields and links the user actually has on screen.`;

  const nativeErrors = `# Every failure uses the same shape
{ "code": "PLAN_LIMIT_REACHED", "message": "Daily limit reached", "version": "v1" }`;

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

  const nativeReactNative = `// Option A — WebView on the standalone shareable page (no API key)
import { WebView } from 'react-native-webview';

const CHAT_HOST = "https://your-domain.com";   // never localhost on a device
const BOT_ID = "YOUR_BOT_ID";

<WebView
  source={{ uri: \`\${CHAT_HOST}/chat/\${BOT_ID}\` }}
  style={{ flex: 1 }}
  allowsInlineMediaPlayback
  mediaPlaybackRequiresUserAction={false}
/>

// Option B — call the native contract directly and render your own UI
const res = await fetch(\`\${CHAT_HOST}/api/chatbot/public/\${BOT_ID}/native-chat/v1\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Hello!",
    sessionId: sessionId,
    screenContext: {
      name: "home",
      buttons: [{ id: "plans", text: "See plans" }],
    },
  }),
});

const data = await res.json();
if (!res.ok) {
  // data.code is one of the documented error codes
  console.warn(data.code, data.message);
} else {
  setMessages((m) => [...m, { from: "bot", text: data.text }]);
}`;

  const python = `# Python 3 — pip install requests (or use httpx)
import requests

API_KEY = "YOUR_API_KEY"
res = requests.post(
    "${config.apiBaseUrl}/api/sdk/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    },
    json={
        "botId": "YOUR_BOT_ID",
        "message": "Hello!",
        "sessionId": "user-123",
        "userId": "user-123",
    },
)
print(res.json()["reply"])`;

  const php = `<?php
// PHP 8+ — cURL
$API_KEY = "YOUR_API_KEY";
$ch = curl_init("${config.apiBaseUrl}/api/sdk/chat");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer $API_KEY",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "botId" => "YOUR_BOT_ID",
        "message" => "Hello!",
        "sessionId" => "user-123",
        "userId" => "user-123",
    ]),
]);
$data = json_decode(curl_exec($ch), true);
echo $data["reply"];
?>`;

  const curl = `curl -X POST "${config.apiBaseUrl}/api/sdk/chat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "botId": "YOUR_BOT_ID",
    "message": "Hello!",
    "sessionId": "user-123",
    "userId": "user-123"
  }'`;

  const verify = `curl "${config.apiBaseUrl}/api/sdk/bot" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

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

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Full-screen sticky header — the docs' own top bar */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Webotme" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/scripts"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" /> API Keys
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Docs sidebar — steps (its own sidebar) */}
          <nav className="top-24 hidden h-fit rounded-2xl border border-border/60 bg-card p-3 shadow-soft lg:sticky lg:block">
            <div className="mb-2 flex items-center gap-2 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              On this page
            </div>
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <s.icon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <article className="min-w-0 space-y-10">
            <section id="overview" className="scroll-mt-24">
              <h1 className="text-2xl font-bold text-foreground">API Keys — Documentation</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Webotme API keys let your own backend talk to a chatbot through your account's{" "}
                <Link
                  to="/dashboard/scripts"
                  className="mx-1 inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                >
                  Generated Scripts
                </Link>
                .
              </p>
            </section>

            <Section id="create-key" title="1. Create an API key">
              <p className="text-sm leading-6 text-muted-foreground">
                Open the chatbot's API Keys page, press{" "}
                <b className="text-foreground">Create Key</b>, give it a name, and copy the
                generated key. You'll see it only once — store it in your server's environment
                variables. You can always reveal or revoke it again from the same page.
              </p>
            </Section>

            <Section id="widget" title="2. Install the widget (no key needed)">
              <p className="text-sm leading-6 text-muted-foreground">
                If a website just needs the chat bubble, paste this script into the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  &lt;body&gt;
                </code>
                :
              </p>
              <CodeBlock code={widget} id="widget" />
            </Section>

            <Section id="call-api" title="3. Call the API from your backend">
              <p className="text-sm leading-6 text-muted-foreground">
                Send the user's message with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  POST {config.apiBaseUrl}/api/sdk/chat
                </code>
                . Authenticate with the API key via the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  Authorization: Bearer &lt;KEY&gt;
                </code>{" "}
                header (or the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">x-api-key</code>{" "}
                header). The response contains the bot's reply and works exactly like the widget —
                including training data, plans, and usage limits.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Request body:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">botId</code>,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">message</code>,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">sessionId</code>,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">userId</code>.
              </p>
            </Section>

            <Section id="node" title="Node.js">
              <p className="text-sm leading-6 text-muted-foreground">
                Node.js 18+ ships with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">fetch</code>{" "}
                built in — no extra package needed.
              </p>
              <CodeBlock code={node} id="node" />
            </Section>

            <Section id="python" title="Python">
              <p className="text-sm leading-6 text-muted-foreground">
                Use the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">requests</code>{" "}
                library.
              </p>
              <CodeBlock code={python} id="python" />
            </Section>

            <Section id="php" title="PHP">
              <p className="text-sm leading-6 text-muted-foreground">
                PHP's built-in cURL extension.
              </p>
              <CodeBlock code={php} id="php" />
            </Section>

            <Section id="curl" title="cURL">
              <p className="text-sm leading-6 text-muted-foreground">
                Quick test from the terminal:
              </p>
              <CodeBlock code={curl} id="curl" />
            </Section>

            <Section id="verify" title="Verify your bot data">
              <p className="text-sm leading-6 text-muted-foreground">
                Want the bot's config (name, template, welcome, flow mode)?
              </p>
              <CodeBlock code={verify} id="verify" />
            </Section>

            <Section id="native" title="Native & mobile apps">
              <p className="text-sm leading-6 text-muted-foreground">
                Mobile apps cannot use the embed script (there is no{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  &lt;script&gt;
                </code>{" "}
                at runtime). Use the native contract instead — it needs only the bot ID, never an
                API key, so it is safe to ship inside an app.
              </p>

              <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Do not ship your API key in a mobile app
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Apps can be decompiled, so a bundled key is a public key. Native apps authenticate
                  with the bot ID only. Keep the API key on your own server and use{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    /api/sdk/chat
                  </code>{" "}
                  there.
                </p>
              </div>

              <h3 className="mt-5 text-sm font-semibold">Check the contract</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Feature-detect before you send anything. The response tells you which version your
                server speaks and what it supports.
              </p>
              <CodeBlock code={nativeDiscover} id="native-discover" />

              <h3 className="mt-5 text-sm font-semibold">Send a message</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">message</code>{" "}
                is required.{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  sessionId
                </code>{" "}
                keeps the conversation. Every success response includes{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">text</code>{" "}
                (with{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">reply</code> as
                an alias) plus the contract{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">version</code>.
              </p>
              <CodeBlock code={nativeChat} id="native-chat" />

              <h3 className="mt-5 text-sm font-semibold">Drive AutoFlow from a screen</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Web AutoFlow reads the page DOM. Native apps have no DOM, so send a{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  screenContext
                </code>{" "}
                snapshot instead — the same AutoFlow engine then answers using your real screen
                state.
              </p>
              <CodeBlock code={nativeScreen} id="native-screen" />

              <h3 className="mt-5 text-sm font-semibold">Error codes</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Every error returns the same shape, so you never have to parse messages.
              </p>
              <CodeBlock code={nativeErrors} id="native-errors" />
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
                        <td className="py-2 pr-3 font-mono text-muted-foreground">{row.status}</td>
                        <td className="py-2 pr-3 font-mono">{row.code}</td>
                        <td className="py-2 text-muted-foreground">{row.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-5 text-sm font-semibold">React Native</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The quickest path is a WebView pointed at the standalone shareable page — same bot,
                same training, no API key in the app.
              </p>
              <CodeBlock code={nativeReactNative} id="native-rn" />

              <div className="mt-4 rounded-xl border border-border/60 bg-card p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  Standalone chat page
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  A shareable, non-iframe version of your chat. Generate the link and QR for any bot
                  from{" "}
                  <Link
                    to="/dashboard/scripts"
                    className="font-semibold text-primary hover:underline"
                  >
                    Generated Scripts → App
                  </Link>
                  .
                </p>
                <code className="mt-2 block break-all rounded-lg bg-muted/40 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                  {config.chatBaseUrl}/chat/YOUR_BOT_ID
                </code>
              </div>
            </Section>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Works with any framework</p>
                    <p className="text-xs text-muted-foreground">
                      Node.js, Python, PHP, cURL, or any HTTP client — just use{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                        {config.apiBaseUrl}
                      </code>
                    </p>
                  </div>
                </div>
                <a
                  href={`${config.apiBaseUrl}/api/sdk/bot`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Try the endpoint
                </a>
              </div>
            </div>

            <a
              href="#overview"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to top
            </a>
          </article>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Package className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
