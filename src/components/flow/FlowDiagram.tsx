/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState, useEffect } from "react";
import dagre from "dagre";
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
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  GraduationCap,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { FlowDataSourceKind, FlowStepDataSpec } from "@/lib/ecommerceFlow";

export interface FlowStepInfo {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export interface FlowLink {
  source: string;
  target: string;
  label: string;
}

export interface FlowDef {
  id: string;
  name: string;
  tagline?: string;
  icon: LucideIcon;
  tone: string;
  steps: FlowStepInfo[];
  links: FlowLink[];
  spec?: Record<string, FlowStepDataSpec>;
}

export const FLOW_SLUG_ICONS: Record<string, LucideIcon> = {
  ecommerce: ShoppingBag,
  service: Wrench,
  table: UtensilsCrossed,
  ride: Car,
  ticket: Ticket,
  hotel: BedDouble,
  session: GraduationCap,
  default: Sparkles,
};

export const flowIconForSlug = (slug?: string): LucideIcon =>
  (slug && FLOW_SLUG_ICONS[slug]) || Sparkles;

export const stepIconFor = (s: { id?: string; type?: string; title?: string }): LucideIcon => {
  const t = String(s.type || "").toLowerCase();
  const title = String(s.title || "").toLowerCase();
  const id = String(s.id || "").toLowerCase();
  if (t === "confirmation" || /confirm/.test(title) || /confirm/.test(id)) return CheckCircle2;
  if (t === "selection" && (/payment|pay/.test(title) || /payment|pay/.test(id))) return CreditCard;
  if (t === "selection") return ShoppingBag;
  if (/date|slot|time|check-in|checkin|check-out|checkout/.test(title)) return CalendarDays;
  if (t === "form") return FileText;
  return Sparkles;
};

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

export function FlowDiagram({ flow, height = 400 }: { flow: FlowDef; height?: number }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { nodes, edges, total } = useFlowElements(flow, step);
  const nodeTypes = useMemo<NodeTypes>(() => ({ step: FlowStepNode }), []);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [flow.id]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % total);
    }, 1150);
    return () => clearInterval(t);
  }, [playing, total]);

  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <div>
      <style>{`
        .flow-builder-demo .react-flow__handle { background: #fff; border: 2px solid var(--primary); width: 10px; height: 10px; }
        .flow-builder-demo .react-flow__handle:hover { background: var(--primary); }
        .flow-builder-demo .react-flow__edge-text { font-size: 10px; font-weight: 600; }
        .flow-builder-demo .react-flow__controls { border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border); }
        .flow-builder-demo .react-flow__controls-button { border-color: var(--color-border); background: var(--color-card); color: var(--color-foreground); }
        .flow-builder-demo .react-flow__controls-button:hover { background: var(--color-accent); }
        .flow-builder-demo .react-flow__attribution { background: transparent; }
      `}</style>

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
              Step {Math.min(step + 1, total)} of {total}
              {flow.tagline ? ` · ${flow.tagline}` : ""}
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
          <span className="text-xs font-bold tabular-nums text-muted-foreground">{progress}%</span>
        </div>
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

      <div
        className="flow-builder-demo relative mt-3 overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-soft"
        style={{ height }}
      >
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
    </div>
  );
}
