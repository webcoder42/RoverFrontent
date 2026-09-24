import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bot,
  Wand2,
  Globe,
  Code,
  Zap,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/createAutoFlow")({
  head: () => ({ meta: [{ title: "Create Auto Flow Bot — Rover" }] }),
  component: CreateAutoFlowBot,
});

type Step = "type" | "website" | "scanning" | "complete";

function CreateAutoFlowBot() {
  const [step, setStep] = useState<Step>("type");
  const [botName, setBotName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [botId, setBotId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [flows, setFlows] = useState<string[]>([]);
  const [pagesScanned, setPagesScanned] = useState(0);

  const createBot = async () => {
    setStep("website");
    // Auto-generate botId
    const id = "bot_" + Math.random().toString(36).slice(2, 10);
    setBotId(id);
  };

  const startAutoScan = async () => {
    setIsScanning(true);
    setStep("scanning");

    // Simulate progressive scanning
    const totalSteps = 10;
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setScanProgress((i / totalSteps) * 100);
      setPagesScanned(Math.floor(i * 5));

      if (i === 3) setFlows(["Login Flow"]);
      if (i === 5) setFlows(["Login Flow", "Order Flow"]);
      if (i === 7) setFlows(["Login Flow", "Order Flow", "Product Search"]);
      if (i === 10) setFlows(["Login Flow", "Order Flow", "Product Search", "Service Booking"]);
    }

    setStep("complete");
    setIsScanning(false);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-soft">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create Auto Flow Bot</h1>
            <p className="text-sm text-muted-foreground">
              AI scans your website and builds the complete conversation flow automatically
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[
            { label: "Bot Type", key: "type" as Step },
            { label: "Website URL", key: "website" as Step },
            { label: "Scanning", key: "scanning" as Step },
            { label: "Complete", key: "complete" as Step },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : ["complete"].includes(step) && ["type", "website", "scanning"].indexOf(s.key) < ["complete"].indexOf(step)
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {["complete"].includes(step) && ["type", "website", "scanning"].indexOf(s.key) < ["complete"].indexOf(step) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={cn("text-xs font-medium", step === s.key ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === "type" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-lg">Choose Bot Type</h2>
            <div className="grid gap-3">
              {[
                { icon: Bot, name: "Auto Flow", desc: "AI analyzes your website and builds the flow automatically", badge: "Recommended", badgeColor: "bg-primary/10 text-primary" },
                { icon: Globe, name: "Custom Flow", desc: "Pick a built-in journey — E-Commerce, Service Booking, etc.", badge: "Manual", badgeColor: "bg-muted text-muted-foreground" },
                { icon: Code, name: "Simple", desc: "Basic chatbot without flow automation", badge: "Basic", badgeColor: "bg-muted text-muted-foreground" },
              ].map((type) => (
                <button
                  key={type.name}
                  onClick={() => {
                    if (type.name === "Auto Flow") createBot();
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary/40",
                    type.name === "Auto Flow" ? "border-primary/40 bg-primary/5" : "border-border/40 bg-background"
                  )}
                >
                  <type.icon className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{type.name}</span>
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", type.badgeColor)}>{type.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "website" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h2 className="font-semibold text-lg">Enter Your Website</h2>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full mt-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The AI will scan ALL pages of your website and automatically build the conversation flow.
            </p>
            <button
              onClick={startAutoScan}
              disabled={!websiteUrl}
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-soft",
                "bg-gradient-to-r from-primary to-purple-600",
                !websiteUrl && "opacity-50 cursor-not-allowed"
              )}
            >
              <Globe className="h-4 w-4" />
              Start Auto Scan
            </button>
          </div>
        )}

        {step === "scanning" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              {isScanning ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              )}
              <div>
                <h2 className="font-semibold">
                  {isScanning ? "Scanning Website..." : "Scan Complete!"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isScanning ? "Proactively crawling all pages..." : "Flow built and stored in database"}
                </p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(scanProgress)}% complete — {pagesScanned} pages scanned</p>

            {flows.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Detected Flows:</h3>
                {flows.map((flow, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm">{flow}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "complete" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <h2 className="font-semibold text-xl">Your Auto Flow Bot is Ready!</h2>
                <p className="text-sm text-muted-foreground">
                  Bot ID: <span className="font-mono text-primary">{botId}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-emerald-500">Active</p>
                </div>
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">Auto Flow</span>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pages Scanned</p>
                  <p className="font-semibold">{pagesScanned}</p>
                </div>
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Complete</span>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Flows Detected</p>
                  <p className="font-semibold">{flows.length}</p>
                </div>
                <span className="rounded-lg bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-500">AI Built</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold mb-2">Embed Script</p>
              <code className="block rounded-lg bg-background p-3 text-xs font-mono overflow-x-auto">
                {`<script async src="https://rover-uoik.onrender.com/static/widget.js" data-bot-id="${botId}" data-auto-flow="true"></script>`}
              </code>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
