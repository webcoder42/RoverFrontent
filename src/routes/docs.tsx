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
              <h1 className="text-2xl font-bold text-foreground">
                API Keys — Documentation
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Webotme API keys let your own backend talk to a chatbot through
                your account's{" "}
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
                <b className="text-foreground">Create Key</b>, give it a name, and
                copy the generated key. You'll see it only once — store it in your
                server's environment variables. You can always reveal or revoke it
                again from the same page.
              </p>
            </Section>

            <Section id="widget" title="2. Install the widget (no key needed)">
              <p className="text-sm leading-6 text-muted-foreground">
                If a website just needs the chat bubble, paste this script into
                the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">&lt;body&gt;</code>:
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
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  x-api-key
                </code>{" "}
                header). The response contains the bot's reply and works exactly
                like the widget — including training data, plans, and usage
                limits.
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
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  fetch
                </code>{" "}
                built in — no extra package needed.
              </p>
              <CodeBlock code={node} id="node" />
            </Section>

            <Section id="python" title="Python">
              <p className="text-sm leading-6 text-muted-foreground">
                Use the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  requests
                </code>{" "}
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

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Works with any framework
                    </p>
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