import { useEffect, useMemo, useRef, useState } from "react";
import dagre from "dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  FileText,
  GitFork,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

const NODE_W = 240;
const NODE_H = 116;

const STEP_TYPES = ["selection", "form", "confirmation"] as const;
const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "tel",
  "date",
  "textarea",
  "select",
  "checkbox",
] as const;

const STEP_TYPE_META: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  selection: {
    label: "Choose Option",
    icon: ShoppingBag,
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-600",
  },
  form: {
    label: "Fill Details",
    icon: FileText,
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-600",
  },
  confirmation: {
    label: "Confirmation",
    icon: CheckCircle2,
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  },
};

interface FieldsValue {
  name?: string;
  label?: string;
  type?: string;
  options?: string[];
  required?: boolean;
  fetchProducts?: boolean;
  allowSkip?: boolean;
  allowOther?: boolean;
  optionRoutes?: Record<string, string>;
}

interface StepValue {
  id?: string;
  title?: string;
  type?: string;
  fields?: FieldsValue[];
  forOption?: string | string[];
  condition?: {
    field?: string;
    operator?: string;
    value?: string | string[];
  };
  nextStepId?: string;
  allowOther?: boolean;
}

type FlowObj = Record<string, unknown> & { steps?: StepValue[] };

interface BuilderNodeData {
  title: string;
  type: string;
  desc: string;
  index: number;
  tone: string;
  forOption?: string | string[];
  allowOther?: boolean;
  isSelected: boolean;
  onSelect: (i: number) => void;
  onDelete: (i: number) => void;
}

function BuilderStepNode({ data }: NodeProps) {
  const d = data as unknown as BuilderNodeData;
  const meta = STEP_TYPE_META[d.type] || STEP_TYPE_META.selection;

  return (
    <div className="flow-builder-node relative group">
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-[2px]" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          d.onDelete(d.index);
        }}
        className="nodrag absolute -right-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-soft group-hover:flex"
        title="Delete step"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <div
        onClick={() => d.onSelect(d.index)}
        className={cn(
          "relative w-[240px] cursor-pointer rounded-2xl border p-3.5 shadow-soft transition-all",
          d.isSelected
            ? "border-primary bg-card ring-2 ring-primary/25"
            : "border-border/60 bg-card hover:border-primary/40",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-soft",
              d.tone,
            )}
          >
            <meta.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {d.title || `Step ${d.index + 1}`}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  meta.badge,
                )}
              >
                {meta.label}
              </span>
              {d.forOption && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                  <GitFork className="h-2.5 w-2.5" /> {Array.isArray(d.forOption) ? d.forOption.join(", ") : d.forOption}
                </span>
              )}
              {d.allowOther && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-blue-500/25 bg-blue-500/10 px-1 py-0.5 text-[8px] font-semibold text-blue-600 dark:text-blue-400">
                  + Other
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-muted-foreground">
            {String(d.index + 1).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{d.desc}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-[2px]" />
    </div>
  );
}

const parseFlow = (raw?: string): FlowObj => {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as FlowObj;
    if (typeof o !== "object" || o === null) return {};
    return o;
  } catch {
    return {};
  }
};

const uid = () => `step-${Math.random().toString(36).slice(2, 8)}`;

const defaultFields = (type: string): FieldsValue[] =>
  type === "selection"
    ? [{ name: "choice", label: "Choose an option", type: "text", options: [], required: true }]
    : type === "confirmation"
      ? []
      : [{ name: "detail", label: "Detail", type: "text", required: true }];

const stepDesc = (s: StepValue): string => {
  if (s.type === "form")
    return `Ask: ${
      (s.fields || [])
        .map((f) => f.label || f.name)
        .filter(Boolean)
        .join(", ") || "enter details"
    }`;
  if (s.type === "confirmation") return "Review the summary & confirm";
  if (s.type === "selection") {
    const opts = (s.fields || []).flatMap((f) => f.options || []);
    return opts.length > 0
      ? `Options: ${opts.join(" · ")}`
      : (s.fields || []).some((f) => f.fetchProducts)
        ? "Fetch products from the connected DB"
        : "Choose an option";
  }
  return "Continue with the next step";
};

export function FlowBuilder({
  trainingFlow,
  onChange,
  onServiceOptionsChange,
  tone = "from-rose-500 to-purple-600",
}: {
  trainingFlow: string;
  onChange: (next: string) => void;
  onServiceOptionsChange?: (options: string[]) => void;
  tone?: string;
}) {
  const [flowObj, setFlowObj] = useState<FlowObj>(() => parseFlow(trainingFlow));
  const flowObjRef = useRef(flowObj);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [catName, setCatName] = useState("");

  useEffect(() => {
    flowObjRef.current = flowObj;
  }, [flowObj]);

  useEffect(() => {
    const next = parseFlow(trainingFlow);
    if (JSON.stringify(next) !== JSON.stringify(flowObjRef.current)) {
      setFlowObj(next);
      setSelectedCat(null);
      setActiveIndex(null);
    }
  }, [trainingFlow]);

  const isMulti =
    !Array.isArray(flowObj.steps) && typeof flowObj === "object" && Object.keys(flowObj).length > 0;

  const catList: string[] = isMulti ? Object.keys(flowObj) : [];

  const activeCat = isMulti ? selectedCat || catList[0] || null : null;

  const currentSteps: StepValue[] = isMulti
    ? (flowObj[activeCat || ""] as { steps?: StepValue[] } | undefined)?.steps || []
    : Array.isArray(flowObj.steps)
      ? flowObj.steps
      : [];

  useEffect(() => {
    if (!isMulti) setCatName("");
    if (isMulti && catList.length > 0 && !catList.includes(selectedCat || "")) {
      setSelectedCat(catList[0]);
      setCatName(catList[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMulti, catList.join("|")]);

  const commit = (obj: FlowObj) => {
    setFlowObj({ ...obj });
    onChange(JSON.stringify(obj, null, 2));

    if (onServiceOptionsChange) {
      const steps = Array.isArray(obj.steps) ? obj.steps : [];
      const serviceStep = steps.find(
        (s) =>
          s.type === "selection" &&
          s.fields?.some(
            (f) =>
              f.name === "service" ||
              f.name === "category" ||
              f.name === "serviceType" ||
              f.label?.toLowerCase().includes("service"),
          ),
      );
      if (serviceStep) {
        const allOpts: string[] = [];
        for (const f of serviceStep.fields || []) {
          for (const o of f.options || []) {
            if (o && typeof o === "string" && o.trim() && !allOpts.includes(o.trim())) {
              allOpts.push(o.trim());
            }
          }
        }
        if ((serviceStep as any).options && Array.isArray((serviceStep as any).options)) {
          for (const o of (serviceStep as any).options) {
            if (o && typeof o === "string" && o.trim() && !allOpts.includes(o.trim())) {
              allOpts.push(o.trim());
            }
          }
        }
        if (allOpts.length > 0) {
          onServiceOptionsChange(allOpts);
        }
      }
    }
  };

  const setCatSteps = (steps: StepValue[]) => {
    const obj = JSON.parse(JSON.stringify(flowObjRef.current)) as FlowObj;
    if (isMulti) {
      const cat = activeCat || catList[0];
      if (!cat) return;
      obj[cat] = { steps } as unknown as FlowObj[keyof FlowObj];
    } else {
      obj.steps = steps;
    }
    commit(obj);
  };


  // ── Graph layout ──────────────────────────────────────────────────────────
  const stepKey = currentSteps
    .map(
      (s) =>
        `${s.id || s.title || ""}:${s.forOption || ""}:${(s.fields || [])
          .map((f) => `${f.options?.join(",") || ""}:${f.allowOther ? "1" : "0"}`)
          .join(";")}`,
    )
    .join("|");

  const layout = useMemo(() => {
    if (currentSteps.length === 0) return { nodes: [], edges: [] };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "LR", nodesep: 56, ranksep: 110, marginx: 24, marginy: 24 });
    currentSteps.forEach((s) =>
      g.setNode(s.id || s.title || "", { width: NODE_W, height: NODE_H }),
    );

    const edgesArr: Edge[] = [];
    const addedEdgeKeys = new Set<string>();

    const addEdgeSafe = (
      src: string,
      tgt: string,
      label?: string,
      isConditional = false,
    ) => {
      const key = `${src}->${tgt}`;
      if (addedEdgeKeys.has(key) || src === tgt) return;
      addedEdgeKeys.add(key);

      try {
        g.setEdge(src, tgt);
      } catch {}

      edgesArr.push({
        id: `e-${src}-${tgt}`,
        source: src,
        target: tgt,
        label,
        animated: isConditional,
        style: {
          stroke: isConditional ? "#f59e0b" : "var(--color-border)",
          strokeWidth: isConditional ? 2 : 1.75,
        },
        labelStyle: isConditional
          ? { fill: "#d97706", fontWeight: 700, fontSize: 10 }
          : undefined,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isConditional ? "#f59e0b" : "var(--color-border)",
        },
      });
    };

    // 1. Process explicit option routes and forOption branch conditions
    for (let i = 0; i < currentSteps.length; i++) {
      const s = currentSteps[i];
      const sId = s.id || s.title || `step-${i}`;

      // Check option routes from this step
      for (const f of s.fields || []) {
        if (f.optionRoutes) {
          for (const [opt, targetId] of Object.entries(f.optionRoutes)) {
            if (targetId) {
              addEdgeSafe(sId, targetId, opt, true);
            }
          }
        }
      }

      // Check if this step has forOption (incoming branch)
      if (s.forOption) {
        const forOpts = Array.isArray(s.forOption) ? s.forOption : [s.forOption];
        for (const optStr of forOpts) {
          let parentFound = false;
          for (let p = i - 1; p >= 0; p--) {
            const ps = currentSteps[p];
            const hasOpt = (ps.fields || []).some((f) =>
              (f.options || []).some(
                (o) => o.toLowerCase().trim() === optStr.toLowerCase().trim(),
              ),
            );
            if (hasOpt) {
              const pId = ps.id || ps.title || `step-${p}`;
              addEdgeSafe(pId, sId, optStr, true);
              parentFound = true;
              break;
            }
          }
          if (!parentFound && i > 0) {
            const pId = currentSteps[i - 1].id || currentSteps[i - 1].title || `step-${i - 1}`;
            addEdgeSafe(pId, sId, optStr, true);
          }
        }
      }
    }

    // 2. Connect steps that don't have incoming edges yet
    for (let i = 1; i < currentSteps.length; i++) {
      const s = currentSteps[i];
      const sId = s.id || s.title || `step-${i}`;
      const hasIncoming = edgesArr.some((e) => e.target === sId);

      if (!hasIncoming) {
        const prev = currentSteps[i - 1];
        const prevId = prev.id || prev.title || `step-${i - 1}`;

        if (prev.forOption) {
          for (let b = i - 1; b >= 0; b--) {
            if (currentSteps[b].forOption) {
              const bId = currentSteps[b].id || currentSteps[b].title || `step-${b}`;
              addEdgeSafe(bId, sId);
            } else {
              break;
            }
          }
        } else {
          addEdgeSafe(prevId, sId);
        }
      }
    }

    dagre.layout(g);

    const nodesArr: Node[] = currentSteps.map((s, i) => {
      const id = s.id || s.title || `step-${i}`;
      const pos = g.node(id) || { x: i * 260, y: 100 };
      return {
        id,
        type: "bstep",
        position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
        draggable: true,
        data: {
          title: s.title || `Step ${i + 1}`,
          type: s.type || "selection",
          desc: stepDesc(s),
          index: i,
          tone,
          forOption: s.forOption,
          allowOther: (s.fields || []).some((f) => f.allowOther),
          isSelected: activeIndex === i,
          onSelect: (idx: number) => setActiveIndex(idx),
          onDelete: (idx: number) => {
            const next = currentSteps.slice();
            next.splice(idx, 1);
            setCatSteps(next);
            setActiveIndex((a) => (a === idx ? null : a));
          },
        } as unknown as Node["data"],
      };
    });

    return { nodes: nodesArr, edges: edgesArr };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, tone, activeIndex]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout.nodes, layout.edges]);

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onConnect = (conn: Connection) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return;
    const sIdx = currentSteps.findIndex((s) => (s.id || s.title) === conn.source);
    const tIdx = currentSteps.findIndex((s) => (s.id || s.title) === conn.target);
    if (sIdx < 0 || tIdx < 0 || sIdx === tIdx) return;
    const next = currentSteps.slice();
    const [moved] = next.splice(tIdx, 1);
    next.splice(sIdx + 1, 0, moved);
    setCatSteps(next);
  };

  const addStep = (type: (typeof STEP_TYPES)[number]) => {
    setCatSteps([
      ...currentSteps,
      {
        id: uid(),
        title:
          type === "selection" ? "Choose Option" : type === "form" ? "Fill Details" : "Confirm",
        type,
        fields: defaultFields(type),
      },
    ]);
    setActiveIndex(currentSteps.length);
  };

  const updateNode = (idx: number, patch: Partial<StepValue>) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    if (!steps[idx]) return;
    steps[idx] = { ...steps[idx], ...patch };
    setCatSteps(steps);
  };

  const updateField = (idx: number, fi: number, patch: Partial<FieldsValue>) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const step = steps[idx];
    if (!step) return;
    step.fields = step.fields || [];
    step.fields[fi] = { ...step.fields[fi], ...patch };
    setCatSteps(steps);
  };

  const addField = (idx: number) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const step = steps[idx];
    if (!step) return;
    step.fields = step.fields || [];
    const base = step.fields.length ? `field${step.fields.length + 1}` : "detail";
    step.fields.push({ name: base, label: base, type: "text", required: true });
    setCatSteps(steps);
  };

  const deleteField = (idx: number, fi: number) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const step = steps[idx];
    if (!step) return;
    step.fields = (step.fields || []).filter((_, n) => n !== fi);
    setCatSteps(steps);
  };

  const setOption = (idx: number, fi: number, oi: number, val: string) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const f = steps[idx]?.fields?.[fi];
    if (!f) return;
    f.options = f.options || [];
    f.options[oi] = val;
    setCatSteps(steps);
  };

  const addOption = (idx: number, fi: number) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const f = steps[idx]?.fields?.[fi];
    if (!f) return;
    f.options = f.options || [];
    f.options.push("New Option");
    setCatSteps(steps);
  };

  const deleteOption = (idx: number, fi: number, oi: number) => {
    const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
    const f = steps[idx]?.fields?.[fi];
    if (!f) return;
    f.options = (f.options || []).filter((_, n) => n !== oi);
    setCatSteps(steps);
  };

  const addCategory = () => {
    const obj = JSON.parse(JSON.stringify(flowObjRef.current)) as FlowObj;
    const name = catName.trim() || "New Category";
    obj[name] = {
      steps: [
        {
          id: uid(),
          title: `Browse ${name}`,
          type: "selection",
          fields: [
            {
              name: "productChoice",
              label: `Choose a ${name} product`,
              type: "text",
              options: [],
              required: true,
              fetchProducts: true,
            },
          ],
        },
        {
          id: uid(),
          title: "Quantity",
          type: "form",
          fields: [{ name: "quantity", label: "Quantity", type: "number", required: true }],
        },
        {
          id: uid(),
          title: "Confirm Order",
          type: "confirmation",
          fields: [],
        },
      ],
    } as unknown as FlowObj[keyof FlowObj];
    commit(obj);
    setSelectedCat(name);
    setCatName("");
  };

  const renameCategory = (target: string, name: string) => {
    const clean = name.trim();
    if (!clean || clean === target) return;
    const obj = JSON.parse(JSON.stringify(flowObjRef.current)) as FlowObj;
    obj[clean] = obj[target];
    delete obj[target];
    commit(obj);
    setSelectedCat(clean);
  };

  const deleteCategory = (target: string) => {
    if (catList.length <= 1) return;
    const obj = JSON.parse(JSON.stringify(flowObjRef.current)) as FlowObj;
    delete obj[target];
    commit(obj);
    setSelectedCat(null);
  };

  const activeStep =
    activeIndex !== null && currentSteps[activeIndex] ? currentSteps[activeIndex] : null;

  const availablePreviousOptions = useMemo(() => {
    if (activeIndex === null || activeIndex <= 0) return [];
    const list: { stepIndex: number; stepTitle: string; fieldName: string; value: string }[] = [];
    for (let i = 0; i < activeIndex; i++) {
      const s = currentSteps[i];
      if (!s) continue;
      for (const f of s.fields || []) {
        const fieldName = f.name || "choice";
        for (const opt of f.options || []) {
          if (opt && opt.trim()) {
            list.push({
              stepIndex: i,
              stepTitle: s.title || `Step ${i + 1}`,
              fieldName,
              value: opt.trim(),
            });
          }
        }
      }
    }
    return list;
  }, [activeIndex, currentSteps]);

  const nodeTypes = useMemo<NodeTypes>(() => ({ bstep: BuilderStepNode }), []);

  return (
    <div className="space-y-3">
      <style>{`
        .flow-editor .react-flow__handle { background: #fff; border: 2px solid var(--primary); width: 10px; height: 10px; }
        .flow-editor .react-flow__handle:hover { background: var(--primary); }
        .flow-editor .react-flow__controls { border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border); }
        .flow-editor .react-flow__controls-button { border-color: var(--color-border); background: var(--color-card); color: var(--color-foreground); }
        .flow-editor .react-flow__controls-button:hover { background: var(--color-accent); }
        .flow-editor .react-flow__attribution { background: transparent; }
      `}</style>

      {/* Category bar */}
      {isMulti && catList.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categories
            </span>
            {catList.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedCat(c);
                  setActiveIndex(null);
                  setCatName("");
                }}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  activeCat === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {activeCat && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2 py-1">
                <Pencil className="h-3 w-3 text-muted-foreground" />
                <input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  onBlur={() =>
                    catName.trim() !== "" &&
                    catName.trim() !== activeCat &&
                    renameCategory(activeCat, catName)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && catName.trim() !== "" && catName.trim() !== activeCat)
                      renameCategory(activeCat, catName);
                    if (e.key === "Escape") window.dispatchEvent(new Event("resetcatname"));
                  }}
                  placeholder={activeCat}
                  className="w-36 bg-transparent text-xs font-medium outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="button"
                onClick={() => setCatName("")}
                className="rounded-lg border border-border/60 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </button>
              <button
                type="button"
                onClick={addCategory}
                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/15"
              >
                <Plus className="h-3 w-3" /> New Category
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(activeCat)}
                disabled={catList.length <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-500/15 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Flow Builder
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {STEP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addStep(t)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-bold hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> {STEP_TYPE_META[t].label} Step
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Click a box to edit · drag handles to re-order · drag boxes to move
        </span>
      </div>

      <div className="relative">
        {/* Canvas */}
        <div className="flow-editor relative h-[560px] overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-soft">
          {currentSteps.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No steps yet — add your first step above.
                </p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onConnect={onConnect}
              nodesConnectable
              elementsSelectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.35}
              maxZoom={1.6}
              deleteKeyCode={null}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1.2}
                color="var(--color-border)"
              />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}

          {activeStep && (
            <aside className="absolute right-3 top-3 bottom-3 z-30 flex w-[min(330px,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-soft backdrop-blur">
              <div className="overflow-y-auto p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5 text-primary" /> Edit Step {activeIndex! + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(null)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                      title="Close editor"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      Title
                    </label>
                    <input
                      value={activeStep.title || ""}
                      onChange={(e) => updateNode(activeIndex!, { title: e.target.value })}
                      className="w-full rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      Type
                    </label>
                    <div className="flex gap-1.5">
                      {STEP_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            updateNode(activeIndex!, {
                              type: t,
                              fields: activeStep.fields?.length
                                ? activeStep.fields
                                : defaultFields(t),
                            })
                          }
                          className={cn(
                            "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition",
                            activeStep.type === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {STEP_TYPE_META[t].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Branch Condition (Run only if previous choice is...) */}
                  {availablePreviousOptions.length > 0 && (
                    <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <GitFork className="h-3.5 w-3.5 text-amber-500" /> Branch Condition
                        </label>
                        {activeStep.forOption && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            Conditional
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Only show this step when user clicked a specific option in an earlier step:
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateNode(activeIndex!, { forOption: undefined, condition: undefined })
                          }
                          className={cn(
                            "rounded-lg border px-2 py-1 text-[10px] font-semibold transition cursor-pointer",
                            !activeStep.forOption
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                              : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Always (All Choices)
                        </button>
                        {availablePreviousOptions.map((opt) => {
                          const currentForOpt = Array.isArray(activeStep.forOption)
                            ? activeStep.forOption
                            : activeStep.forOption
                              ? [activeStep.forOption]
                              : [];
                          const isSelected = currentForOpt.includes(opt.value);

                          return (
                            <button
                              key={`${opt.stepIndex}-${opt.value}`}
                              type="button"
                              onClick={() => {
                                const newOpts = isSelected
                                  ? currentForOpt.filter((x) => x !== opt.value)
                                  : [...currentForOpt, opt.value];

                                updateNode(activeIndex!, {
                                  forOption: newOpts.length > 0 ? newOpts : undefined,
                                  condition:
                                    newOpts.length > 0
                                      ? { field: opt.fieldName, value: newOpts }
                                      : undefined,
                                });
                              }}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition cursor-pointer",
                                isSelected
                                  ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <GitFork className="h-2.5 w-2.5" />
                              If: {opt.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step-level Allow "Other" toggle — ONLY for selection steps, exactly once */}
                  {activeStep.type === "selection" && (
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          ✏️ Allow "Other" (Custom Input)
                        </span>
                        <p className="text-[9px] text-muted-foreground leading-tight">
                          Adds an "Other" option in chat so visitors can type their own custom answer
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={
                          !!activeStep.allowOther ||
                          (activeStep.fields || []).some((f) => f.allowOther)
                        }
                        onChange={(e) => {
                          const val = e.target.checked;
                          const steps = JSON.parse(JSON.stringify(currentSteps)) as StepValue[];
                          if (!steps[activeIndex!]) return;
                          steps[activeIndex!].allowOther = val;
                          (steps[activeIndex!].fields || []).forEach((f) => {
                            f.allowOther = val;
                          });
                          setCatSteps(steps);
                        }}
                        className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Fields
                      </label>
                      <button
                        type="button"
                        onClick={() => addField(activeIndex!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/15"
                      >
                        <Plus className="h-3 w-3" /> Add Field
                      </button>
                    </div>

                    {(activeStep.fields || []).map((f, fi) => (
                      <div
                        key={fi}
                        className="rounded-xl border border-border/60 bg-card p-2.5 space-y-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            value={f.label || ""}
                            onChange={(e) =>
                              updateField(activeIndex!, fi, { label: e.target.value })
                            }
                            placeholder="Label (shown to user)"
                            className="w-full rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => deleteField(activeIndex!, fi)}
                            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                            title="Delete field"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            value={f.name || ""}
                            onChange={(e) =>
                              updateField(activeIndex!, fi, { name: e.target.value })
                            }
                            placeholder="name (key)"
                            className="w-1/2 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-mono outline-none focus:border-primary"
                          />
                          <select
                            value={f.type || "text"}
                            onChange={(e) =>
                              updateField(activeIndex!, fi, { type: e.target.value })
                            }
                            className="w-1/2 rounded-lg border border-border/60 bg-card px-1.5 py-1 text-[11px] outline-none focus:border-primary"
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft} value={ft}>
                                {ft}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={!!f.required}
                              onChange={(e) =>
                                updateField(activeIndex!, fi, { required: e.target.checked })
                              }
                            />
                            Required
                          </label>
                          {activeStep.type === "selection" && (
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={!!f.fetchProducts}
                                onChange={(e) =>
                                  updateField(activeIndex!, fi, { fetchProducts: e.target.checked })
                                }
                              />
                              Fetch DB products
                            </label>
                          )}
                          {(f.name === "paymentMethod" ||
                            /payment|pay/i.test(activeStep.title || "")) && (
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={!!f.allowSkip}
                                onChange={(e) =>
                                  updateField(activeIndex!, fi, { allowSkip: e.target.checked })
                                }
                              />
                              Allow skip
                            </label>
                          )}
                        </div>

                        {(activeStep.type === "selection" || f.type === "select") && (
                          <div className="space-y-2 pt-1 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Step Options / Choices
                              </label>
                              <button
                                type="button"
                                onClick={() => addOption(activeIndex!, fi)}
                                className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground hover:text-primary cursor-pointer"
                              >
                                <Plus className="h-2.5 w-2.5" /> Add Option
                              </button>
                            </div>

                            {(f.options || []).map((opt, oi) => (
                              <div
                                key={oi}
                                className="space-y-1 rounded-lg border border-border/40 bg-muted/20 p-1.5"
                              >
                                <div className="flex items-center gap-1.5">
                                  <input
                                    value={opt || ""}
                                    onChange={(e) => setOption(activeIndex!, fi, oi, e.target.value)}
                                    placeholder={`Option ${oi + 1}`}
                                    className="w-full rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] font-medium outline-none focus:border-primary"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => deleteOption(activeIndex!, fi, oi)}
                                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-rose-500"
                                    title="Delete option"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                  <span>Target:</span>
                                  <select
                                    value={f.optionRoutes?.[opt] || ""}
                                    onChange={(e) => {
                                      const routes = { ...(f.optionRoutes || {}) };
                                      if (e.target.value) routes[opt] = e.target.value;
                                      else delete routes[opt];
                                      updateField(activeIndex!, fi, { optionRoutes: routes });
                                    }}
                                    className="rounded border border-border/60 bg-card px-1.5 py-0.5 text-[9px] outline-none"
                                  >
                                    <option value="">Auto (Next step)</option>
                                    {currentSteps.map(
                                      (s, si) =>
                                        si !== activeIndex && (
                                          <option key={s.id || si} value={s.id || `step-${si}`}>
                                            ➔ {s.title || `Step ${si + 1}`}
                                          </option>
                                        ),
                                    )}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(activeStep.fields || []).length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No fields yet — add one.</p>
                    )}
                  </div>

                  <div className="pt-2 space-y-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(null)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Save Step
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const idx = activeIndex!;
                        const next = currentSteps.slice();
                        next.splice(idx, 1);
                        setCatSteps(next);
                        setActiveIndex(null);
                      }}
                      className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete this step
                    </button>
                  </div>

                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Save indicator */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-500" />
        Every change is saved instantly to knowledge.trainingFlow
      </div>
    </div>
  );
}
