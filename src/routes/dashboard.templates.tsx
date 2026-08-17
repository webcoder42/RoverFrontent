import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { LiveBotPreview } from "@/components/create/LiveBotPreview";
import type { Template } from "@/store/chatbots";

export const Route = createFileRoute("/dashboard/templates")({
  head: () => ({ meta: [{ title: "Templates — Rover" }] }),
  component: TemplatesPage,
});

const templates: { name: Template; desc: string; primary: string; secondary: string; bubble: "rounded"|"square"|"soft"; radius: number; tag: string }[] = [
  { name: "Modern Glass UI", desc: "Frosted glass with soft gradients and depth.", primary: "#D94A2D", secondary: "#1C1C2E", bubble: "rounded", radius: 18, tag: "Most popular" },
  { name: "Minimal AI Assistant", desc: "Clean monochrome layout — great for documentation.", primary: "#111827", secondary: "#374151", bubble: "square", radius: 8, tag: "Editorial" },
  { name: "Floating Support Widget", desc: "Bright, friendly bubble for SaaS support.", primary: "#0ea5e9", secondary: "#22d3ee", bubble: "soft", radius: 22, tag: "Support" },
  { name: "Rounded Messenger Style", desc: "Bubbly, playful conversation feel.", primary: "#10b981", secondary: "#34d399", bubble: "rounded", radius: 24, tag: "Conversational" },
  { name: "Neon AI Interface", desc: "Glowing futuristic AI playground.", primary: "#a855f7", secondary: "#ec4899", bubble: "rounded", radius: 14, tag: "Futuristic" },
];

function TemplatesPage() {
  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Gallery
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Chatbot Templates</h1>
        <p className="text-sm text-muted-foreground">Start from a polished design and customize from there.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">{t.tag}</span>
            </div>
            <div className="flex-1">
              <LiveBotPreview name={t.name} welcome="Hi there 👋" primary={t.primary} secondary={t.secondary} bubble={t.bubble} radius={t.radius} template={t.name} />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Link to="/dashboard/create" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110">
                <Check className="h-4 w-4" /> Select Template
              </Link>
              <Link to="/dashboard/create" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium hover:bg-accent">
                Preview <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );
}
