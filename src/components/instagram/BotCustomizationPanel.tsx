import { useEffect, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquareText,
  PlusCircle,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Power,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Workflow,
  Eye,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAuthHeaders } from "@/lib/auth";

export interface FlowStep {
  stepId: string;
  question: string;
  options: string[];
}

export interface ServiceFlow {
  id: string;
  name: string;
  flow: FlowStep[];
}

interface BotConfigData {
  botName: string;
  welcomeMessage: string;
  fallbackMessage: string;
  services: ServiceFlow[];
  emailNotification: { enabled: boolean; recipientEmail: string };
  aiEnabled: boolean;
  autoReplyComments: boolean;
  isActive: boolean;
}

interface BotCustomizationPanelProps {
  accountId: string | null;
}

const DEFAULT_CONFIG: BotConfigData = {
  botName: "Bot",
  welcomeMessage: "Hi 👋 Welcome! How can I help you today?",
  fallbackMessage: "Thanks for reaching out! Our team will get back to you soon. 🙏",
  services: [],
  emailNotification: { enabled: false, recipientEmail: "" },
  aiEnabled: false,
  autoReplyComments: false,
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export function BotCustomizationPanel({ accountId }: BotCustomizationPanelProps) {
  const [config, setConfig] = useState<BotConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    setError("");
    fetch(`/api/instagram/accounts/${accountId}/config`, {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setConfig({
            botName: data.config.botName ?? DEFAULT_CONFIG.botName,
            welcomeMessage: data.config.welcomeMessage ?? DEFAULT_CONFIG.welcomeMessage,
            fallbackMessage: data.config.fallbackMessage ?? DEFAULT_CONFIG.fallbackMessage,
            services: Array.isArray(data.config.services) ? data.config.services : [],
            emailNotification: data.config.emailNotification ?? DEFAULT_CONFIG.emailNotification,
            aiEnabled: Boolean(data.config.aiEnabled),
            autoReplyComments: Boolean(data.config.autoReplyComments),
            isActive: data.config.isActive !== false,
          });
        }
      })
      .catch(() => setError("Failed to load bot configuration"))
      .finally(() => setLoading(false));
  }, [accountId]);

  const handleSave = async () => {
    if (!accountId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/instagram/accounts/${accountId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeaders() as Record<string, string>),
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSuccess("Bot configuration saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlow = (index: number) => {
    setConfig((c) => ({ ...c, services: c.services.filter((_, i) => i !== index) }));
  };

  if (!accountId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 text-white shadow-soft">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Instagram Bot</h3>
            <p className="text-xs text-muted-foreground">
              Configure service booking flows and auto-replies.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Power className={`h-3.5 w-3.5 ${config.isActive ? "text-emerald-500" : ""}`} />
          <span>{config.isActive ? "Active" : "Paused"}</span>
          <Switch
            checked={config.isActive}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, isActive: v === true }))}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5">
        {/* Bot Name + Messages */}
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Bot className="h-3.5 w-3.5" /> Bot Name
            </Label>
            <Input
              value={config.botName}
              onChange={(e) => setConfig((c) => ({ ...c, botName: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Rovor Assistant"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <MessageSquareText className="h-3.5 w-3.5" /> Welcome message
              </Label>
              <Textarea
                value={config.welcomeMessage}
                onChange={(e) => setConfig((c) => ({ ...c, welcomeMessage: e.target.value }))}
                className={inputClass}
                placeholder="Sent when someone messages for the first time"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" /> Fallback message
              </Label>
              <Textarea
                value={config.fallbackMessage}
                onChange={(e) => setConfig((c) => ({ ...c, fallbackMessage: e.target.value }))}
                className={inputClass}
                placeholder="Sent when no flow matches"
              />
            </div>
          </div>
        </div>

        {/* Service Flows */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Workflow className="h-3.5 w-3.5" /> Service Flows
            </Label>
            <GradientButton
              onClick={() => setShowFlowModal(true)}
              className="px-3 py-1.5 text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add Bot Flow
            </GradientButton>
          </div>

          {config.services.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Workflow className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">
                No service flows yet. Click "Add Bot Flow" to create one.
              </p>
            </div>
          )}

          {config.services.map((svc, idx) => (
            <div key={svc.id || idx} className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setExpandedFlow(expandedFlow === svc.id ? null : svc.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{svc.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {svc.flow.length} steps
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFlow(idx); }}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-red-600"
                    title="Delete flow"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedFlow === svc.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedFlow === svc.id && (
                <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                  {svc.flow.map((step, sIdx) => (
                    <div key={step.stepId} className="rounded-lg bg-card p-2.5 text-xs">
                      <div className="font-semibold text-muted-foreground">Step {sIdx + 1}</div>
                      <div className="mt-1">{step.question}</div>
                      {step.options.length > 0 && (
                        <div className="mt-1 text-muted-foreground">
                          Options: {step.options.join(" | ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Email Notification */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs font-semibold">Email Notification</div>
                <p className="text-[11px] text-muted-foreground">
                  Get notified via email when a booking is completed.
                </p>
              </div>
            </div>
            <Switch
              checked={config.emailNotification.enabled}
              onCheckedChange={(v) =>
                setConfig((c) => ({
                  ...c,
                  emailNotification: { ...c.emailNotification, enabled: v },
                }))
              }
            />
          </div>
          {config.emailNotification.enabled && (
            <div className="mt-3">
              <Input
                value={config.emailNotification.recipientEmail}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    emailNotification: { ...c.emailNotification, recipientEmail: e.target.value },
                  }))
                }
                className={inputClass}
                placeholder="your@email.com"
                type="email"
              />
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold">AI-powered replies</div>
              <p className="text-[11px] text-muted-foreground">
                When no flow matches, AI writes the answer.
              </p>
            </div>
            <Switch
              checked={config.aiEnabled}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, aiEnabled: v === true }))}
            />
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold">Auto-reply to comments</div>
              <p className="text-[11px] text-muted-foreground">
                Privately DM everyone who comments.
              </p>
            </div>
            <Switch
              checked={config.autoReplyComments}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, autoReplyComments: v === true }))}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-600">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <GradientButton onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Save configuration</>
          )}
        </GradientButton>
      </div>

      {/* Flow Builder Modal */}
      {showFlowModal && (
        <FlowBuilderModal
          onClose={() => setShowFlowModal(false)}
          onSave={(flow) => {
            setConfig((c) => ({ ...c, services: [...c.services, flow] }));
            setShowFlowModal(false);
          }}
          botName={config.botName}
          welcomeMessage={config.welcomeMessage}
        />
      )}
    </div>
  );
}

// ─── Flow Builder Modal ──────────────────────────────────────────────────────

interface FlowBuilderModalProps {
  onClose: () => void;
  onSave: (flow: ServiceFlow) => void;
  botName: string;
  welcomeMessage: string;
}

function FlowBuilderModal({ onClose, onSave, botName, welcomeMessage }: FlowBuilderModalProps) {
  const [serviceName, setServiceName] = useState("");
  const [steps, setSteps] = useState<FlowStep[]>([
    { stepId: `step_${Date.now()}_0`, question: "", options: [] },
  ]);
  const [newOption, setNewOption] = useState("");
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [previewInput, setPreviewInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<Array<{ from: "bot" | "user"; text: string }>>([]);

  const addStep = () => {
    const id = `step_${Date.now()}_${steps.length}`;
    setSteps((s) => [...s, { stepId: id, question: "", options: [] }]);
    setActiveStepIdx(steps.length);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps((s) => s.filter((_, i) => i !== idx));
    if (activeStepIdx >= steps.length - 1) setActiveStepIdx(Math.max(0, steps.length - 2));
  };

  const updateStep = (idx: number, patch: Partial<FlowStep>) => {
    setSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setSteps((s) =>
      s.map((st, i) =>
        i === activeStepIdx ? { ...st, options: [...st.options, newOption.trim()] } : st,
      ),
    );
    setNewOption("");
  };

  const removeOption = (stepIdx: number, optIdx: number) => {
    setSteps((s) =>
      s.map((st, i) =>
        i === stepIdx ? { ...st, options: st.options.filter((_, j) => j !== optIdx) } : st,
      ),
    );
  };

  const simulateFlow = () => {
    const msgs: Array<{ from: "bot" | "user"; text: string }> = [];
    msgs.push({ from: "bot", text: welcomeMessage });
    msgs.push({ from: "bot", text: `Please choose a service:\n\n1. ${serviceName || "Service Name"}\n\nType the number or name.` });
    msgs.push({ from: "user", text: serviceName || "1" });
    msgs.push({ from: "bot", text: `Great! You selected: ${serviceName || "Service"}` });

    for (const step of steps) {
      if (!step.question) continue;
      let q = step.question;
      if (step.options.length > 0) {
        q += `\n\nOptions:\n${step.options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
      }
      msgs.push({ from: "bot", text: q });
      if (step.options.length > 0) {
        msgs.push({ from: "user", text: step.options[0] });
      } else {
        msgs.push({ from: "user", text: "[user answer]" });
      }
    }

    msgs.push({ from: "bot", text: `✅ Booking request received!\n\n📋 Service: ${serviceName || "Service"}\n\nOur team will contact you soon! 🙏` });
    setPreviewMessages(msgs);
  };

  const handleSave = () => {
    if (!serviceName.trim()) return;
    const validSteps = steps.filter((s) => s.question.trim());
    if (validSteps.length === 0) return;
    onSave({
      id: `svc_${Date.now()}`,
      name: serviceName.trim(),
      flow: validSteps,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-border bg-card shadow-2xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Builder */}
        <div className="flex-1 overflow-y-auto p-6 lg:max-w-[55%]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Add Bot Flow</h2>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Service Name */}
          <div className="mb-4 grid gap-1.5">
            <Label className="text-xs font-semibold">Service Name</Label>
            <Input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Web Development, SEO, Design"
            />
          </div>

          {/* Steps */}
          <div className="mb-4 grid gap-2">
            <Label className="text-xs font-semibold">Flow Steps</Label>
            {steps.map((step, idx) => (
              <div
                key={step.stepId}
                className={`rounded-xl border p-3 ${
                  idx === activeStepIdx
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => setActiveStepIdx(idx)}
                >
                  <span className="text-xs font-semibold">Step {idx + 1}</span>
                  {steps.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeStep(idx); }}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {idx === activeStepIdx && (
                  <div className="mt-2 space-y-2">
                    <Input
                      value={step.question}
                      onChange={(e) => updateStep(idx, { question: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. What type of web do you need?"
                    />
                    <div className="grid gap-1.5">
                      <Label className="text-[11px] text-muted-foreground">Options (optional)</Label>
                      {step.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{oIdx + 1}.</span>
                          <span className="flex-1 text-xs">{opt}</span>
                          <button
                            onClick={() => removeOption(idx, oIdx)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addOption()}
                          className={`${inputClass} text-xs`}
                          placeholder="Add option..."
                        />
                        <button
                          onClick={addOption}
                          className="shrink-0 rounded-lg bg-primary/10 px-2 text-xs font-semibold text-primary hover:bg-primary/20"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addStep}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border p-2.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add Step
            </button>
          </div>

          {/* Preview + Save */}
          <div className="flex gap-2">
            <button
              onClick={simulateFlow}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border p-2.5 text-xs font-semibold hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" /> Preview Flow
            </button>
            <GradientButton
              onClick={handleSave}
              disabled={!serviceName.trim() || steps.every((s) => !s.question.trim())}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4" /> Save Flow
            </GradientButton>
          </div>
        </div>

        {/* Right: Instagram Preview */}
        <div className="flex items-center justify-center border-t border-border bg-muted/20 p-6 lg:w-[45%] lg:border-l lg:border-t-0">
          <div className="w-full max-w-[320px]">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Instagram Preview</span>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
              {/* Phone header */}
              <div className="border-b border-border bg-gray-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500" />
                  <div>
                    <div className="text-xs font-bold">{botName || "Bot"}</div>
                    <div className="text-[10px] text-green-500">● Active</div>
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex h-[400px] flex-col gap-2 overflow-y-auto bg-[#f0f2f5] p-3">
                {previewMessages.length === 0 && (
                  <div className="flex flex-1 items-center justify-center text-[11px] text-gray-400">
                    Click "Preview Flow" to see conversation
                  </div>
                )}
                {previewMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.from === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      {msg.text.split("\n").map((line, j) => (
                        <span key={j}>
                          {line}
                          {j < msg.text.split("\n").length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div className="border-t border-border bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    value={previewInput}
                    onChange={(e) => setPreviewInput(e.target.value)}
                    className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs"
                    placeholder="Message..."
                    readOnly
                  />
                  <div className="text-[10px] font-semibold text-blue-500">Send</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
