import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Database,
  Bot,
  HardDrive,
  Brain,
  Building2,
  DollarSign,
  Check,
  X,
  Pencil,
  Headphones,
  Globe,
  CalendarClock,
  Citrus,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { GradientButton } from "@/components/common/GradientButton";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — Admin" }] }),
  component: AdminPlans,
});

interface Plan {
  _id: string;
  name: string;
  price: number;
  totalChatbots: number;
  bookingAgency: number;
  databaseAccess: boolean;
  databaseCollections: number;
  apiRequests: string;
  trainingStorage: number;
  ragModel: boolean;
  support: string;
  apiAccess: boolean;
  expiresInDays: number;
  lemonSqueezyVariantId?: string | null;
  createdAt: string;
}

function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalChatbots, setTotalChatbots] = useState("1");
  const [bookingAgency, setBookingAgency] = useState("0");
  const [databaseAccess, setDatabaseAccess] = useState(false);
  const [databaseCollections, setDatabaseCollections] = useState("0");
  const [apiRequests, setApiRequests] = useState("100");
  const [apiCustom, setApiCustom] = useState(false);
  const [trainingStorage, setTrainingStorage] = useState("0");
  const [ragModel, setRagModel] = useState(false);
  const [emailSupport, setEmailSupport] = useState(false);
  const [emailLimit, setEmailLimit] = useState("0");
  const [apiAccess, setApiAccess] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [lemonSqueezyVariantId, setLemonSqueezyVariantId] = useState("");

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const fetchPlans = () => {
    fetch("/api/plans", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setName("");
    setPrice("");
    setTotalChatbots("1");
    setBookingAgency("0");
    setDatabaseAccess(false);
    setDatabaseCollections("0");
    setApiRequests("100");
    setApiCustom(false);
    setTrainingStorage("0");
    setRagModel(false);
    setEmailSupport(false);
    setEmailLimit("0");
    setApiAccess(false);
    setExpiresInDays("30");
    setLemonSqueezyVariantId("");
    setEditingId(null);
  };

  const handleEdit = (plan: Plan) => {
    setName(plan.name);
    setPrice(String(plan.price));
    setTotalChatbots(String(plan.totalChatbots));
    setBookingAgency(String(plan.bookingAgency));
    setDatabaseAccess(plan.databaseAccess);
    setDatabaseCollections(String((plan as any).databaseCollections ?? 0));
    const apiVal = (plan as any).apiRequests ?? "100";
    setApiRequests(apiVal);
    setApiCustom(!["100", "500", "1000", "5000", "Unlimited"].includes(apiVal));
    setTrainingStorage(String(plan.trainingStorage));
    setRagModel(plan.ragModel);
    setEmailSupport((plan as any).emailSupport ?? false);
    setEmailLimit(String((plan as any).emailLimit ?? 0));
    setApiAccess((plan as any).apiAccess ?? false);
    setExpiresInDays(String((plan as any).expiresInDays ?? 30));
    setLemonSqueezyVariantId((plan as any).lemonSqueezyVariantId ?? "");
    setEditingId(plan._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const body = JSON.stringify({
        name,
        price: Number(price),
        totalChatbots: Number(totalChatbots),
        bookingAgency: Number(bookingAgency),
        databaseAccess,
        databaseCollections: Number(databaseCollections),
        apiRequests,
        trainingStorage: Number(trainingStorage),
        ragModel,
        emailSupport,
        emailLimit: Number(emailLimit),
        apiAccess,
        expiresInDays: Number(expiresInDays),
        lemonSqueezyVariantId: lemonSqueezyVariantId.trim() || null,
      });
      const res = editingId
        ? await fetch(`/api/plans/${editingId}`, { method: "PUT", headers, body })
        : await fetch("/api/plans", { method: "POST", headers, body });
      if (!res.ok) throw new Error("Failed to save plan");
      resetForm();
      setShowForm(false);
      fetchPlans();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await fetch(`/api/plans/${id}`, { method: "DELETE", headers });
      fetchPlans();
    } catch {}
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">Manage subscription plans and pricing.</p>
        </div>
        <GradientButton
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="h-10 px-4 text-sm"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" /> New Plan
            </>
          )}
        </GradientButton>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        >
          <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
            {editingId ? (
              <Pencil className="h-4 w-4 text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            {editingId ? "Edit Plan" : "Create New Plan"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Plan Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Pro Plan"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Price ($)
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="29.99"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            {Number(price) === 0 ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  <CalendarClock className="mr-1 inline h-3 w-3" />
                  Expires In (days)
                </span>
                <div className="flex h-10 w-full items-center rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                  Lifetime — never expires
                </div>
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    <CalendarClock className="mr-1 inline h-3 w-3" />
                    Expires In (days)
                  </span>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1"
                    placeholder="30"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    <Citrus className="mr-1 inline h-3 w-3" />
                    Lemon Squeezy Variant ID
                  </span>
                  <input
                    value={lemonSqueezyVariantId}
                    onChange={(e) => setLemonSqueezyVariantId(e.target.value)}
                    placeholder="e.g. 1974265"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    Set to the variant that charges the correct price (in your store's currency).
                    Empty = PayPal only.
                  </span>
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                <Bot className="mr-1 inline h-3 w-3" />
                Total Chatbots
              </span>
              <input
                type="number"
                value={totalChatbots}
                onChange={(e) => setTotalChatbots(e.target.value)}
                min="1"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                <Building2 className="mr-1 inline h-3 w-3" />
                Booking Agencies
              </span>
              <input
                type="number"
                value={bookingAgency}
                onChange={(e) => setBookingAgency(e.target.value)}
                min="0"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                <HardDrive className="mr-1 inline h-3 w-3" />
                Training Storage (GB)
              </span>
              <input
                type="number"
                value={trainingStorage}
                onChange={(e) => setTrainingStorage(e.target.value)}
                min="0"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="flex items-center gap-3 self-end pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                <Brain className="mr-1 inline h-3 w-3" />
                RAG Model
              </span>
              <button
                type="button"
                onClick={() => setRagModel(!ragModel)}
                className={`relative h-6 w-11 rounded-full transition-colors ${ragModel ? "bg-primary" : "bg-border"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${ragModel ? "translate-x-5" : ""}`}
                />
              </button>
            </label>
            <label className="flex items-center gap-3 self-end pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                <Database className="mr-1 inline h-3 w-3" />
                Database Access
              </span>
              <button
                type="button"
                onClick={() => setDatabaseAccess(!databaseAccess)}
                className={`relative h-6 w-11 rounded-full transition-colors ${databaseAccess ? "bg-primary" : "bg-border"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${databaseAccess ? "translate-x-5" : ""}`}
                />
              </button>
            </label>
            {databaseAccess && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    <Database className="mr-1 inline h-3 w-3" />
                    Collections
                  </span>
                  <input
                    type="number"
                    value={databaseCollections}
                    onChange={(e) => setDatabaseCollections(e.target.value)}
                    min="0"
                    placeholder="5"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    <Globe className="mr-1 inline h-3 w-3" />
                    API Requests / day
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["100", "500", "1000", "5000", "Unlimited"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setApiRequests(opt);
                          setApiCustom(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${!apiCustom && apiRequests === opt ? "bg-gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setApiCustom(true)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${apiCustom ? "bg-gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
                    >
                      Custom
                    </button>
                  </div>
                  {apiCustom && (
                    <input
                      type="number"
                      value={apiRequests}
                      onChange={(e) => setApiRequests(e.target.value)}
                      min="0"
                      placeholder="e.g. 250"
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                </label>
              </>
            )}
            <label className="flex items-center gap-3 self-end pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                <Headphones className="mr-1 inline h-3 w-3" />
                Email Support
              </span>
              <button
                type="button"
                onClick={() => setEmailSupport(!emailSupport)}
                className={`relative h-6 w-11 rounded-full transition-colors ${emailSupport ? "bg-primary" : "bg-border"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${emailSupport ? "translate-x-5" : ""}`}
                />
              </button>
            </label>
            {emailSupport && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email Limit (per day)
                </span>
                <input
                  type="number"
                  value={emailLimit}
                  onChange={(e) => setEmailLimit(e.target.value)}
                  min="0"
                  placeholder="100"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            )}
            <label className="flex items-center gap-3 self-end pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                <Globe className="mr-1 inline h-3 w-3" />
                Script API Access
              </span>
              <button
                type="button"
                onClick={() => setApiAccess(!apiAccess)}
                className={`relative h-6 w-11 rounded-full transition-colors ${apiAccess ? "bg-primary" : "bg-border"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${apiAccess ? "translate-x-5" : ""}`}
                />
              </button>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <GradientButton
              type="submit"
              disabled={saving || !name.trim() || !price}
              className="h-10 px-6 text-sm"
            >
              {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
            </GradientButton>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="h-10 rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      ) : plans.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground">
          No plans yet. Create your first plan.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="group relative rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-xs text-muted-foreground">
                      {plan.price > 0 ? `/${(plan as any).expiresInDays ?? 30} days` : "Lifetime"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bot className="h-4 w-4" />{" "}
                  <span>
                    {plan.totalChatbots} chatbot{plan.totalChatbots !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />{" "}
                  <span>
                    {plan.bookingAgency} booking agenc{plan.bookingAgency !== 1 ? "ies" : "y"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="h-4 w-4" />{" "}
                  <span>
                    Database:{" "}
                    {plan.databaseAccess ? (
                      <span className="text-emerald-500 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {(plan as any).databaseCollections || 0}{" "}
                        collections
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <X className="h-3 w-3" /> Not included
                      </span>
                    )}
                  </span>
                </div>
                {plan.databaseAccess && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />{" "}
                    <span>API: {(plan as any).apiRequests || "0"}/day</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-4 w-4" />{" "}
                  <span>{plan.trainingStorage} GB training storage</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="h-4 w-4" />{" "}
                  <span>
                    RAG Model:{" "}
                    {plan.ragModel ? (
                      <span className="text-emerald-500 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Available
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <X className="h-3 w-3" /> Not Available
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Headphones className="h-4 w-4" />{" "}
                  <span>
                    Email Support:{" "}
                    {(plan as any).emailSupport ? (
                      <span className="text-emerald-500 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {(plan as any).emailLimit || 0}/day
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <X className="h-3 w-3" /> Not included
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />{" "}
                  <span>
                    Script API:{" "}
                    {(plan as any).apiAccess ? (
                      <span className="text-emerald-500 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Available
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <X className="h-3 w-3" /> Not available
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Citrus className="h-4 w-4" />{" "}
                  <span>
                    Lemon Squeezy:{" "}
                    {plan.lemonSqueezyVariantId ? (
                      <span className="font-mono text-emerald-500">
                        #{plan.lemonSqueezyVariantId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No variant — PayPal only</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
