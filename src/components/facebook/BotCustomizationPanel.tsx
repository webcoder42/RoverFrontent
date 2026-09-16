import { useEffect, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquareText,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Power,
  ChevronDown,
  ChevronUp,
  Mail,
  Workflow,
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

interface FacebookBotCustomizationPanelProps {
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

export function FacebookBotCustomizationPanel({ accountId }: FacebookBotCustomizationPanelProps) {
  const [config, setConfig] = useState<BotConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    setError("");
    fetch(`/api/facebook/accounts/${accountId}/config`, {
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
      const res = await fetch(`/api/facebook/accounts/${accountId}/config`, {
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

  const addServiceAndGenerate = async () => {
    const name = newServiceName.trim();
    if (!name) return;
    const svcId = `svc_${Date.now()}`;
    const newSvc: ServiceFlow = { id: svcId, name, flow: [] };
    setConfig((c) => ({ ...c, services: [...c.services, newSvc] }));
    setExpandedFlow(svcId);
    setNewServiceName("");
    setGeneratingFor(svcId);

    try {
      const res = await fetch("/api/facebook/generate-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders() as Record<string, string>,
        },
        body: JSON.stringify({ serviceName: name }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.steps)) {
        const generated: FlowStep[] = data.steps.map((s: { question: string; options: string[] }, i: number) => ({
          stepId: `step_${Date.now()}_${i}`,
          question: s.question || "",
          options: Array.isArray(s.options) ? s.options : [],
        }));
        setConfig((c) => ({
          ...c,
          services: c.services.map((svc) =>
            svc.id === svcId ? { ...svc, flow: generated } : svc,
          ),
        }));
      }
    } catch {
      // silent fail — user can still edit manually
    } finally {
      setGeneratingFor(null);
    }
  };

  const updateServiceStep = (svcId: string, stepIdx: number, question: string) => {
    setConfig((c) => ({
      ...c,
      services: c.services.map((svc) =>
        svc.id === svcId
          ? { ...svc, flow: svc.flow.map((st, i) => (i === stepIdx ? { ...st, question } : st)) }
          : svc,
      ),
    }));
  };

  const addManualStepToService = (svcId: string) => {
    setConfig((c) => ({
      ...c,
      services: c.services.map((svc) =>
        svc.id === svcId
          ? { ...svc, flow: [...svc.flow, { stepId: `step_${Date.now()}`, question: "", options: [] }] }
          : svc,
      ),
    }));
  };

  const removeStepFromService = (svcId: string, stepIdx: number) => {
    setConfig((c) => ({
      ...c,
      services: c.services.map((svc) =>
        svc.id === svcId
          ? { ...svc, flow: svc.flow.filter((_, i) => i !== stepIdx) }
          : svc,
      ),
    }));
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
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-soft">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Facebook Bot</h3>
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
        <div className="grid gap-3">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Workflow className="h-3.5 w-3.5" /> Service Flows
          </Label>

          {/* Add service input */}
          <div className="flex gap-2">
            <Input
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addServiceAndGenerate()}
              className={inputClass}
              placeholder="Type service name and press Enter, e.g. Web Development"
              disabled={!!generatingFor}
            />
            <button
              onClick={addServiceAndGenerate}
              disabled={!newServiceName.trim() || !!generatingFor}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:opacity-90 disabled:opacity-50"
            >
              {generatingFor ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Add
            </button>
          </div>

          {config.services.length === 0 && !generatingFor && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Workflow className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">
                No services yet. Type a service name above to get started.
              </p>
            </div>
          )}

          {config.services.map((svc) => (
            <div key={svc.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setExpandedFlow(expandedFlow === svc.id ? null : svc.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{svc.name}</span>
                  {generatingFor === svc.id ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Generating flow...
                    </span>
                  ) : svc.flow.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {svc.flow.length} steps
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      No flow yet
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = config.services.findIndex((s) => s.id === svc.id);
                      if (idx !== -1) handleDeleteFlow(idx);
                    }}
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
                  {svc.flow.length === 0 && generatingFor !== svc.id && (
                    <p className="text-[11px] text-muted-foreground">No questions yet.</p>
                  )}
                  {svc.flow.map((step, sIdx) => (
                    <div key={step.stepId} className="rounded-lg bg-card p-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {sIdx + 1}
                        </span>
                        <div className="flex-1">
                          <Input
                            value={step.question}
                            onChange={(e) => updateServiceStep(svc.id, sIdx, e.target.value)}
                            className={`${inputClass} text-xs`}
                            placeholder="Enter question..."
                          />
                          {step.options.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {step.options.map((opt, oIdx) => (
                                <span key={oIdx} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px]">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeStepFromService(svc.id, sIdx)}
                          className="mt-1 shrink-0 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addManualStepToService(svc.id)}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    + Add question
                  </button>
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
    </div>
  );
}
