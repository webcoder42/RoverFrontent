import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Link2, QrCode, Rocket, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { fetchEmbedKey } from "@/lib/embedKey";
import { MOBILE_APP_OPTIONS, type MobileAppId } from "@/lib/mobileSetup";

export function MobileAppSetup({
  botName,
  botId,
  selectedApp,
  onSelectApp,
}: {
  botName: string;
  botId: string;
  selectedApp: MobileAppId | null;
  onSelectApp: (app: MobileAppId) => void;
}) {
  const selectedOption = MOBILE_APP_OPTIONS.find((option) => option.id === selectedApp) || null;
  const [qr, setQr] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Standalone (non-iframe) chat URL that can be shared, QR'd or deep-linked.
  // It carries the embed key (?k=) so a pasted link opens a working chat
  // without the widget loader ever being involved.
  const baseChatUrl = `${config.chatBaseUrl}/chat/${botId}`;
  const [chatUrl, setChatUrl] = useState("");

  useEffect(() => {
    let active = true;
    fetchEmbedKey(botId)
      .then((key) => {
        if (active) setChatUrl(`${baseChatUrl}?k=${encodeURIComponent(key)}`);
      })
      .catch(() => {
        if (active) setChatUrl(baseChatUrl);
      });
    return () => {
      active = false;
    };
  }, [botId, baseChatUrl]);

  useEffect(() => {
    let active = true;
    if (!chatUrl) return;
    QRCode.toDataURL(chatUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr(null);
      });
    return () => {
      active = false;
    };
  }, [chatUrl]);

  const copyChatLink = async () => {
    if (!chatUrl) {
      toast.error("Preparing the chat link…");
      return;
    }
    try {
      await navigator.clipboard.writeText(chatUrl);
    } catch {
      window.prompt("Copy this link", chatUrl);
      return;
    }
    setLinkCopied(true);
    toast.success("Chat link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      window.prompt("Copy this", text);
    }
  };

  const NATIVE_ENDPOINT = "/api/chatbot/public/" + botId + "/native-chat/v1";

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-500/[0.07] via-violet-500/[0.03] to-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
            App integration
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Connect {botName} to your mobile app � one codebase for Android &amp; iOS.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[9px] font-semibold text-violet-600">
          <Smartphone className="h-2.5 w-2.5" /> React Native SDK
        </span>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {MOBILE_APP_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const selected = selectedApp === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectApp(option.id)}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                selected
                  ? "border-violet-500/60 bg-violet-500/10 shadow-soft"
                  : "border-border/70 bg-card hover:border-violet-500/40 hover:bg-accent/30",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                    selected
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-soft"
                      : "bg-muted text-muted-foreground group-hover:text-violet-600",
                  )}
                >
                  <OptionIcon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{option.title}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {option.framework}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                    selected
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-border text-transparent",
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
              </span>
              <span className="text-[10px] leading-4 text-muted-foreground">
                {option.description}
              </span>
              <span className="flex flex-wrap gap-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  {option.language}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  {option.platform}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedOption ? (
        <div className="mt-3 rounded-xl border border-border/60 bg-card p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-soft">
                <selectedOption.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{selectedOption.title} setup</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {selectedOption.framework}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-semibold text-violet-600">
                {selectedOption.language}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-semibold text-muted-foreground">
                {selectedOption.platform}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/[0.07] px-2.5 py-2">
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-violet-600">
              Bot ID
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/80">
              {botId}
            </code>
            <button
              onClick={() => copyText(botId)}
              className="shrink-0 rounded-md bg-muted px-2 py-1 text-[9px] font-semibold text-foreground transition-colors hover:bg-muted/70"
            >
              Copy
            </button>
          </div>

          <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
            <Link
              to="/docs"
              hash="setup-webview"
              className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-left transition-colors hover:bg-violet-500/15"
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold text-violet-600">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-500 text-white">
                  <Smartphone className="h-3 w-3" />
                </span>
                WebView setup
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-violet-600" />
            </Link>

            <Link
              to="/docs"
              hash="setup-sdk"
              className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-left transition-colors hover:bg-violet-500/15"
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold text-violet-600">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-500 text-white">
                  <Rocket className="h-3 w-3" />
                </span>
                WebotMe SDK setup
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-violet-600" />
            </Link>
          </div>

          <div className="mt-3.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.06] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-violet-600">Native endpoint</p>
              <button
                onClick={() => copyText("POST " + NATIVE_ENDPOINT)}
                className="rounded-md bg-muted px-2 py-0.5 text-[9px] font-semibold text-foreground transition-colors hover:bg-muted/70"
              >
                Copy
              </button>
            </div>
            <code className="mt-1 block break-all text-[10px] leading-4 text-foreground/80">
              POST {NATIVE_ENDPOINT}
            </code>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Send message, sessionId and screenContext. The response always carries a{" "}
              <code className="font-mono">text</code> field plus a{" "}
              <code className="font-mono">version</code>, and errors use a stable{" "}
              <code className="font-mono">code</code>/<code className="font-mono">message</code>{" "}
              shape. Call the unversioned path only for older builds.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-card/60 px-3 py-3 text-[10px] leading-4 text-muted-foreground">
          <Smartphone className="h-4 w-4 shrink-0 text-violet-500" />
          Pick React Native or Expo above to see the step-by-step setup for {botName}.
        </div>
      )}

      <div className="mt-3 rounded-xl border border-border/60 bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Link2 className="h-3.5 w-3.5 text-violet-500" />
              Shareable chat link
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
              Standalone page (no iframe). Use it for QR codes, WhatsApp shares or deep links from
              your app.
            </p>
          </div>
          <button
            onClick={copyChatLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {linkCopied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {linkCopied ? "Copied" : "Copy link"}
          </button>
        </div>

        <code className="mt-2 block break-all rounded-lg bg-muted/40 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
          {chatUrl}
        </code>

        {qr ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="rounded-xl border border-border bg-white p-2">
              <img src={qr} alt={`QR code for ${botName}`} className="h-36 w-36" />
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              Scan to open the {botName} chat
            </p>
            <a
              href={qr}
              download={`${botName.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-soft hover:brightness-110"
            >
              <QrCode className="h-3.5 w-3.5" /> Download QR
            </a>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-[10px] text-muted-foreground">
            <QrCode className="h-4 w-4" /> Generating QR…
          </div>
        )}
      </div>
    </div>
  );
}
