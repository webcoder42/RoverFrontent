import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import dagre from "dagre";
import {
  BedDouble,
  Bell,
  Braces,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Database,
  Film,
  FileText,
  GraduationCap,
  Headphones,
  MapPin,
  MessageCircle,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Users,
  Video,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  ECOMMERCE_STEP_SPEC,
  ECOMMERCE_TRAINING_FLOW,
  type FlowStepDataSpec,
  type FlowDataSourceKind,
} from "@/lib/ecommerceFlow";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PageTransition } from "@/components/common/PageTransition";
import { cn } from "@/lib/utils";
import { LiveBotPreview } from "@/components/create/LiveBotPreview";
import { demoDataForFlow, FLOW_TONE_HEX } from "@/lib/flowDemoData";

export const Route = createFileRoute("/admin/flows")({
  head: () => ({ meta: [{ title: "Flow Builder — Admin" }] }),
  component: AdminFlows,
});

interface FlowStepInfo {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

interface FlowLink {
  source: string;
  target: string;
  label: string;
}

interface FlowDef {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  tone: string;
  steps: FlowStepInfo[];
  links: FlowLink[];
  /** Per-step data-source annotations (id → spec). Only rendered when present. */
  spec?: Record<string, FlowStepDataSpec>;
}

const FLOWS: FlowDef[] = [
  {
    id: "ecommerce",
    name: "E-Commerce",
    tagline: "Shop, cart, checkout & payment",
    icon: ShoppingBag,
    tone: "from-rose-500 to-purple-600",
    steps: [
      { id: "start", label: "Start", desc: "Order now / shop opens", icon: Sparkles },
      {
        id: "category",
        label: "Choose Category",
        desc: "Electronics, Fashion...",
        icon: ShoppingBag,
      },
      {
        id: "products",
        label: "Products from DB",
        desc: "Category catalog shown as cards",
        icon: Database,
      },
      {
        id: "cart",
        label: "Pick Product & Qty",
        desc: "Tap a product, then quantity",
        icon: ShoppingCart,
      },
      {
        id: "checkout",
        label: "Checkout",
        desc: "Enter shipping & billing details",
        icon: FileText,
      },
      { id: "payment", label: "Payment", desc: "Stripe / PayPal / Paddle", icon: CreditCard },
      {
        id: "confirm",
        label: "Order Confirmed",
        desc: "Order saved, receipt & tracking sent",
        icon: CheckCircle2,
      },
      { id: "support", label: "Live Support", desc: "Talk to an agent", icon: Headphones },
    ],
    links: [
      { source: "start", target: "category", label: "order now" },
      { source: "start", target: "products", label: "or type a name" },
      { source: "category", target: "products", label: "Browse" },
      { source: "products", target: "cart", label: "Tap product" },
      { source: "products", target: "support", label: "Need help?" },
      { source: "support", target: "cart", label: "Back" },
      { source: "cart", target: "checkout", label: "Proceed" },
      { source: "checkout", target: "payment", label: "Pay now" },
      { source: "payment", target: "confirm", label: "Success" },
    ],
    spec: ECOMMERCE_STEP_SPEC,
  },
  {
    id: "service",
    name: "Service Booking",
    tagline: "Book a service, pick a slot",
    icon: Wrench,
    tone: "from-sky-500 to-cyan-500",
    steps: [
      { id: "start", label: "Start", desc: "Customer opens booking flow", icon: Sparkles },
      {
        id: "service",
        label: "Choose Service",
        desc: "Pick from available services",
        icon: Wrench,
      },
      {
        id: "slot",
        label: "Pick Date & Time",
        desc: "Select an available slot",
        icon: CalendarDays,
      },
      {
        id: "details",
        label: "Add Details",
        desc: "Location, notes & contact info",
        icon: FileText,
      },
      { id: "confirm", label: "Confirm & Pay", desc: "Review booking & pay", icon: CreditCard },
      {
        id: "done",
        label: "Booking Confirmed",
        desc: "Confirmation & reminder sent",
        icon: CheckCircle2,
      },
      { id: "resched", label: "Reschedule", desc: "Change or cancel booking", icon: RotateCcw },
    ],
    links: [
      { source: "start", target: "service", label: "Continue" },
      { source: "service", target: "slot", label: "Select slot" },
      { source: "slot", target: "details", label: "Continue" },
      { source: "details", target: "confirm", label: "Confirm" },
      { source: "confirm", target: "done", label: "Booked" },
      { source: "confirm", target: "resched", label: "Change?" },
      { source: "resched", target: "slot", label: "Re-pick" },
    ],
  },
  {
    id: "table",
    name: "Book a Table",
    tagline: "Restaurant reservation",
    icon: UtensilsCrossed,
    tone: "from-orange-500 to-amber-500",
    steps: [
      { id: "start", label: "Start", desc: "Guest starts reservation", icon: Sparkles },
      {
        id: "restaurant",
        label: "Pick Restaurant",
        desc: "Choose restaurant & branch",
        icon: UtensilsCrossed,
      },
      { id: "time", label: "Date & Time", desc: "When do you want to dine?", icon: CalendarDays },
      { id: "party", label: "Party Size", desc: "Number of guests", icon: Users },
      { id: "request", label: "Special Request", desc: "Window seat, cake, etc.", icon: Bell },
      {
        id: "confirm",
        label: "Confirm Booking",
        desc: "Review & reserve the table",
        icon: CreditCard,
      },
      { id: "done", label: "Table Reserved", desc: "Reservation confirmed", icon: CheckCircle2 },
    ],
    links: [
      { source: "start", target: "restaurant", label: "Continue" },
      { source: "restaurant", target: "time", label: "Next" },
      { source: "time", target: "party", label: "Guests" },
      { source: "party", target: "request", label: "Optional" },
      { source: "request", target: "confirm", label: "Reserve" },
      { source: "confirm", target: "done", label: "Confirmed" },
    ],
  },
  {
    id: "ride",
    name: "Book a Ride",
    tagline: "Ride-hailing like Careem / Uber",
    icon: Car,
    tone: "from-emerald-500 to-teal-500",
    steps: [
      { id: "start", label: "Start", desc: "Rider opens the app", icon: Sparkles },
      { id: "pickup", label: "Set Pickup", desc: "Current or chosen location", icon: MapPin },
      { id: "dropoff", label: "Set Drop-off", desc: "Destination address", icon: Navigation },
      { id: "choose", label: "Choose Ride", desc: "Go / X / XL fares", icon: Car },
      {
        id: "driver",
        label: "Driver On the Way",
        desc: "Track your driver in real-time",
        icon: Navigation,
      },
      {
        id: "done",
        label: "Ride Complete",
        desc: "Trip finished & payment done",
        icon: CheckCircle2,
      },
    ],
    links: [
      { source: "start", target: "pickup", label: "Continue" },
      { source: "pickup", target: "dropoff", label: "Next" },
      { source: "dropoff", target: "choose", label: "Fares" },
      { source: "choose", target: "driver", label: "Book" },
      { source: "driver", target: "done", label: "Complete" },
    ],
  },
  {
    id: "ticket",
    name: "Book a Ticket",
    tagline: "Movie, flight & bus tickets",
    icon: Ticket,
    tone: "from-fuchsia-500 to-pink-500",
    steps: [
      { id: "start", label: "Start", desc: "Customer starts booking", icon: Sparkles },
      { id: "show", label: "Pick Movie / Route", desc: "Choose show or travel route", icon: Film },
      { id: "seat", label: "Select Seat", desc: "Pick your preferred seat", icon: Ticket },
      { id: "pay", label: "Payment", desc: "Card, wallet or bank", icon: CreditCard },
      {
        id: "done",
        label: "E-Ticket Issued",
        desc: "Ticket sent via SMS / email",
        icon: CheckCircle2,
      },
    ],
    links: [
      { source: "start", target: "show", label: "Browse" },
      { source: "show", target: "seat", label: "Select" },
      { source: "seat", target: "pay", label: "Pay" },
      { source: "pay", target: "done", label: "Send ticket" },
    ],
  },
  {
    id: "hotel",
    name: "Book a Room",
    tagline: "Hotel rooms & stays",
    icon: BedDouble,
    tone: "from-indigo-500 to-violet-500",
    steps: [
      { id: "start", label: "Start", desc: "Guest starts hotel booking", icon: Sparkles },
      { id: "hotel", label: "Select Hotel", desc: "Search ratings & amenities", icon: BedDouble },
      { id: "dates", label: "Check-in / Out", desc: "Pick your stay dates", icon: CalendarDays },
      { id: "room", label: "Room Type", desc: "Standard, Deluxe, Suite", icon: BedDouble },
      { id: "pay", label: "Payment", desc: "Prepay or pay at hotel", icon: CreditCard },
      { id: "done", label: "Room Booked", desc: "Booking voucher sent", icon: CheckCircle2 },
    ],
    links: [
      { source: "start", target: "hotel", label: "Continue" },
      { source: "hotel", target: "dates", label: "Dates" },
      { source: "dates", target: "room", label: "Rooms" },
      { source: "room", target: "pay", label: "Pay" },
      { source: "pay", target: "done", label: "Booked" },
    ],
  },
  {
    id: "session",
    name: "Book a Session",
    tagline: "Consultations & classes",
    icon: GraduationCap,
    tone: "from-teal-500 to-emerald-500",
    steps: [
      { id: "start", label: "Start", desc: "Client starts booking", icon: Sparkles },
      {
        id: "session",
        label: "Choose Session",
        desc: "Consultation, class, etc.",
        icon: GraduationCap,
      },
      { id: "slot", label: "Pick a Slot", desc: "Select date & time", icon: Clock },
      { id: "pay", label: "Book & Pay", desc: "Secure the session", icon: CreditCard },
      { id: "reminder", label: "Join Reminder", desc: "SMS & email reminder sent", icon: Bell },
      { id: "done", label: "Join Session", desc: "Enter the video call", icon: Video },
    ],
    links: [
      { source: "start", target: "session", label: "Continue" },
      { source: "session", target: "slot", label: "Slot" },
      { source: "slot", target: "pay", label: "Pay" },
      { source: "pay", target: "reminder", label: "Remind" },
      { source: "reminder", target: "done", label: "Join" },
    ],
  },
];

const NODE_W = 240;
const NODE_H = 106;

type NodeStatus = "idle" | "active" | "visited";

interface FlowNodeData {
  label: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
  stepNo: number;
  total: number;
  status: NodeStatus;
  dbKind?: FlowDataSourceKind;
}

const KIND_META: Record<
  FlowDataSourceKind,
  { label: string; icon: LucideIcon; chip: string; dot: string }
> = {
  "db-read": {
    label: "DB Read",
    icon: Database,
    chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    dot: "bg-emerald-500",
  },
  "db-write": {
    label: "DB Write",
    icon: Database,
    chip: "border-amber-500/20 bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  api: {
    label: "Payment API",
    icon: CreditCard,
    chip: "border-sky-500/20 bg-sky-500/10 text-sky-600",
    dot: "bg-sky-500",
  },
  agent: {
    label: "Agent Handoff",
    icon: Headphones,
    chip: "border-purple-500/20 bg-purple-500/10 text-purple-600",
    dot: "bg-purple-500",
  },
  none: {
    label: "No DB call",
    icon: Sparkles,
    chip: "border-border/60 bg-muted text-muted-foreground",
    dot: "bg-border",
  },
};

function graphOrder(flow: FlowDef): string[] {
  const targets = new Set(flow.links.map((l) => l.target));
  const start = flow.steps.find((s) => !targets.has(s.id))?.id ?? flow.steps[0].id;
  const ordered: string[] = [];
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    ordered.push(cur);
    flow.links
      .filter((l) => l.source === cur)
      .forEach((l) => {
        if (!seen.has(l.target)) {
          seen.add(l.target);
          queue.push(l.target);
        }
      });
  }
  flow.steps.forEach((s) => {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      ordered.push(s.id);
    }
  });
  return ordered;
}

function layoutFlow(flow: FlowDef): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 52, ranksep: 96, marginx: 24, marginy: 24 });
  flow.steps.forEach((s) => g.setNode(s.id, { width: NODE_W, height: NODE_H }));
  flow.links.forEach((l) => g.setEdge(l.source, l.target));
  dagre.layout(g);
  const out: Record<string, { x: number; y: number }> = {};
  flow.steps.forEach((s) => {
    const n = g.node(s.id);
    out[s.id] = { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 };
  });
  return out;
}

function useFlowElements(flow: FlowDef, step: number) {
  return useMemo(() => {
    const order = graphOrder(flow);
    const positions = layoutFlow(flow);

    const nodes: Node[] = flow.steps.map((s) => {
      const idx = order.indexOf(s.id);
      const status: NodeStatus =
        idx === -1 ? "idle" : idx === step ? "active" : idx < step ? "visited" : "idle";
      return {
        id: s.id,
        type: "step",
        position: positions[s.id],
        draggable: false,
        data: {
          label: s.label,
          desc: s.desc,
          icon: s.icon,
          tone: flow.tone,
          stepNo: idx + 1,
          total: order.length,
          status,
          dbKind: flow.spec?.[s.id]?.kind,
        } satisfies FlowNodeData,
      };
    });

    const edges: Edge[] = flow.links.map((l, i) => {
      const si = order.indexOf(l.source);
      const ti = order.indexOf(l.target);
      const maxI = Math.max(si, ti);
      const traversed = step >= maxI;
      const current = traversed && step === ti;
      const stroke = current
        ? "var(--primary)"
        : traversed
          ? "color-mix(in oklab, var(--primary) 45%, transparent)"
          : "var(--color-border)";
      return {
        id: `e-${i}-${l.source}-${l.target}`,
        source: l.source,
        target: l.target,
        animated: traversed,
        label: l.label,
        labelStyle: {
          fontSize: 10,
          fontWeight: 600,
          fill: current ? "var(--primary)" : "var(--color-muted-foreground)",
        },
        style: { stroke, strokeWidth: current ? 3 : 1.75 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: stroke },
      };
    });

    return { nodes, edges, total: order.length };
  }, [flow, step]);
}

function FlowStepNode({ data }: NodeProps) {
  const d = data as unknown as FlowNodeData;
  const active = d.status === "active";
  const visited = d.status === "visited";
  const dbMeta = d.dbKind ? KIND_META[d.dbKind] : null;

  return (
    <div className="flow-node relative">
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-[2px]" />
      <motion.div
        initial={false}
        animate={active ? { scale: 1.045 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className={cn(
          "relative w-[240px] rounded-2xl border p-3.5 shadow-soft transition-colors duration-500",
          active
            ? "border-primary/60 bg-card ring-2 ring-primary/20"
            : visited
              ? "border-border/70 bg-card"
              : "border-border/40 bg-muted/30",
          !active && !visited && "opacity-50",
        )}
      >
        {active && (
          <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-rose-500/25 to-purple-600/25 blur-lg" />
        )}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-all duration-500",
              d.tone,
              active ? "scale-110" : visited ? "saturate-75" : "saturate-0",
            )}
          >
            <d.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold leading-tight">{d.label}</p>
              {visited && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {d.desc}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {String(d.stepNo).padStart(2, "0")}/{String(d.total).padStart(2, "0")}
          </span>
        </div>
        {dbMeta && (
          <div
            className={cn(
              "mt-2.5 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider",
              dbMeta.chip,
            )}
          >
            <dbMeta.icon className="h-3 w-3" />
            <span className="truncate">{dbMeta.label}</span>
          </div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-[2px]" />
    </div>
  );
}

function AdminFlows() {
  const [flowId, setFlowId] = useState(FLOWS[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const flow = FLOWS.find((f) => f.id === flowId) ?? FLOWS[0];
  const flowDemo = demoDataForFlow(flow.id);
  const hex = FLOW_TONE_HEX[flow.tone] ?? { primary: "#6366f1", secondary: "#8b5cf6" };
  const { nodes, edges, total } = useFlowElements(flow, step);
  const nodeTypes = useMemo<NodeTypes>(() => ({ step: FlowStepNode }), []);

  const copyFlowJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(ECOMMERCE_TRAINING_FLOW, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % total);
    }, 1150);
    return () => clearInterval(t);
  }, [playing, total]);

  const selectFlow = (f: FlowDef) => {
    setFlowId(f.id);
    setStep(0);
    setPlaying(false);
  };

  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <PageTransition>
      <style>{`
        .flow-builder-demo .react-flow__handle { background: #fff; border: 2px solid var(--primary); width: 10px; height: 10px; }
        .flow-builder-demo .react-flow__handle:hover { background: var(--primary); }
        .flow-builder-demo .react-flow__edge-text { font-size: 10px; font-weight: 600; }
        .flow-builder-demo .react-flow__controls { border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border); }
        .flow-builder-demo .react-flow__controls-button { border-color: var(--color-border); background: var(--color-card); color: var(--color-foreground); }
        .flow-builder-demo .react-flow__controls-button:hover { background: var(--color-accent); }
        .flow-builder-demo .react-flow__attribution { background: transparent; }
      `}</style>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Workflow className="h-3.5 w-3.5" /> Flow Setup
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              Demo UI
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Flow Builder</h1>
          <p className="text-sm text-muted-foreground">
            Default flows saved for every chatbot — visually explore the journey step by step.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1 shadow-soft">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={playing || step === 0}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              title="Previous step"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setStep((s) => (s + 1) % total);
              }}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Next step"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setPlaying((p) => !p);
                if (!playing && step >= total - 1) setStep(0);
              }}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white shadow-soft transition-all",
                playing
                  ? "bg-gradient-to-r from-rose-500 to-purple-600"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600",
              )}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Auto Play"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
          <div className="px-1 pb-1 pt-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Default Flows
            </h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {FLOWS.length} templates built-in
            </p>
          </div>
          {FLOWS.map((f) => {
            const active = f.id === flow.id;
            return (
              <button
                key={f.id}
                onClick={() => selectFlow(f)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-300",
                  active
                    ? "border-primary/40 bg-gradient-to-r from-rose-500/10 to-purple-600/10 shadow-soft"
                    : "border-transparent hover:border-border/60 hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-105",
                    f.tone,
                  )}
                >
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn("truncate text-sm font-semibold", active ? "text-rose-600" : "")}
                  >
                    {f.name}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">{f.tagline}</div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {f.steps.length} steps
                </span>
              </button>
            );
          })}
        </aside>

        <main className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft",
                  flow.tone,
                )}
              >
                <flow.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold">{flow.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Step {Math.min(step + 1, total)} of {total} · {flow.tagline}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-border" /> Upcoming
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Visited
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Active
                </span>
              </div>
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-purple-600"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>

          <div className="flow-builder-demo relative h-[520px] overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-soft">
            <ReactFlow
              key={flow.id}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              nodesConnectable={false}
              elementsSelectable={false}
              nodesDraggable={false}
              minZoom={0.35}
              maxZoom={1.6}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1.2}
                color="var(--color-border)"
              />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
            <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft",
                    flow.tone,
                  )}
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    Chat Preview — how it looks to your customers
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      auto-playing demo
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    This widget simulates the {flow.name} journey end-to-end on dummy data — watch a
                    real order/book get placed, step by step, exactly like the engine runs it.
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {[
                  "The bot greets, collects each answer, and finishes with a confirmation summary.",
                  "Tappable option chips, product cards and an Order button — just like the live widget.",
                  flow.id === "ecommerce"
                    ? "Path A: tap a category then a product card \u2192 Order Now. Path B: type a product name directly (browse is auto-skipped)."
                    : "Try the option buttons, or type your own answer — the reply advances the flow.",
                  flow.id === "ecommerce"
                    ? "Pick \u201CPay Online\u201D and the bot collects the card number, expiry & CVV right inside the chat before confirming."
                    : "",
                  "Hit the reset icon in the widget header to replay the demo.",
                ]
                  .filter(Boolean)
                  .map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{tip}</span>
                    </li>
                  ))}
              </ul>

              <p className="mt-auto pt-4 text-[10px] text-muted-foreground">
                Runs purely on dummy data — when you save the{" "}
                <span className="font-mono">knowledge.trainingFlow</span> JSON above, the widget
                reads your real connected catalog instead (Path B searches it directly).
              </p>
            </div>

            <LiveBotPreview
              key={flow.id}
              name={flow.name}
              welcome={flowDemo.welcome}
              trainingFlow={flowDemo.trainingFlow}
              primary={hex.primary}
              secondary={hex.secondary}
              radius={16}
              bubble="soft"
              headerSubtitle="Online · Demo"
              preview="light"
              showAvatar
              autoDemo
              demoScript={flowDemo.script}
            />
          </div>

          {flow.spec && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Data &amp; DB calls — {flow.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Exactly when the bot reads from / writes to your database, and where payments
                      hit.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.values(KIND_META).map((m) => (
                    <span
                      key={m.label}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {flow.steps.map((s) => {
                  const spec = flow.spec?.[s.id];
                  if (!spec) return null;
                  const meta = KIND_META[spec.kind];
                  return (
                    <div
                      key={s.id}
                      className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <div
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                          meta.chip,
                        )}
                      >
                        <meta.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold">{s.label}</span>
                          <span
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider",
                              meta.chip,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {spec.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {flow.id === "ecommerce" && (
                <div className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Braces className="h-3.5 w-3.5 text-primary" />
                      knowledge.trainingFlow JSON
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-primary">
                        ready to save
                      </span>
                    </div>
                    <button
                      onClick={copyFlowJson}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-soft transition-transform hover:scale-105"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy flow JSON"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Paste this into a chatbot&apos;s knowledge.trainingFlow — the chat engine
                    executes it from <span className="font-mono">flowManager.ts</span>. It uses the
                    multi-category format: one order pipeline per category, so Path A (category menu
                    → DB catalog) and Path B (typing a product name skips straight to quantity)
                    converge here. Start = the &quot;order now&quot; trigger, Live Support =
                    post-order handoff — those exist only in the demo journey above.
                  </p>
                  <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-background/70 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(ECOMMERCE_TRAINING_FLOW, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Workflow className="h-3.5 w-3.5" />
            Press <span className="font-semibold text-foreground">Auto Play</span> to walk through
            the journey — animated edges light up as steps complete.
          </p>
        </main>
      </div>
    </PageTransition>
  );
}
