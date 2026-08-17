import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, Edit3, MessageSquareText, Plus,
  Search, Trash2, FileUp, CheckSquare, Square,
  Loader2, X, FileText,
} from "lucide-react";
import { useFaqStore, type Faq } from "@/store/faq";
import { useChatbotsStore, type Chatbot } from "@/store/chatbots";
import { PageTransition } from "@/components/common/PageTransition";
import { EmptyState } from "@/components/common/EmptyState";
import { GradientButton } from "@/components/common/GradientButton";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/faq")({
  head: () => ({ meta: [{ title: "FAQ Manager — Rover" }] }),
  component: FaqPage,
});

function getUserContext() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string };
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem("token") || "";
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Extracted pair with a selected flag ─────────────────────────────────────
interface ExtractedPair {
  question: string;
  answer: string;
  selected: boolean;
}

function FaqPage() {
  const { faqs, setFaqs, addFaq, updateFaq, removeFaq } = useFaqStore();
  const { chatbots, setChatbots } = useChatbotsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  // ── Manual add/edit dialog ──
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // ── PDF upload dialog ──
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [extractedPairs, setExtractedPairs] = useState<ExtractedPair[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedChatbotId, setSelectedChatbotId] = useState("");

  const selectedBot = useMemo(
    () => chatbots.find((bot) => bot.id === selectedChatbotId) ?? null,
    [chatbots, selectedChatbotId],
  );

  const filtered = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(q.toLowerCase()) ||
      faq.answer.toLowerCase().includes(q.toLowerCase()),
  );

  // ─── loaders ──────────────────────────────────────────────────────────────
  const loadChatbots = async (userId: string) => {
    const res = await fetch(`/api/chatbot/user/${userId}`, {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load chatbots");

    const mapped: Chatbot[] = data.chatbots.map((cb: any) => ({
      id: cb._id,
      name: cb.name,
      template: cb.template,
      description: cb.description,
      welcome: cb.welcome,
      primary: cb.primaryColor,
      secondary: cb.secondaryColor,
      font: cb.font,
      radius: cb.borderRadius,
      bubble: cb.bubbleStyle,
      logo: cb.logo ?? undefined,
      createdAt: cb.createdAt,
      installs: cb.installs,
      embedScript: cb.embedScript,
      preview: cb.previewMode,
    }));

    setChatbots(mapped);
    if (!selectedChatbotId && mapped.length > 0) setSelectedChatbotId(mapped[0].id);
    if (selectedChatbotId && !mapped.some((bot) => bot.id === selectedChatbotId)) {
      setSelectedChatbotId(mapped[0]?.id || "");
    }
  };

  const loadFaqs = async (userId: string) => {
    const query = selectedChatbotId
      ? `?userId=${userId}&chatbotId=${selectedChatbotId}`
      : `?userId=${userId}`;
    const res = await fetch(`/api/faqs${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load FAQs");

    setFaqs(
      data.faqs.map((faq: any) => ({
        id: faq._id,
        chatbotId: faq.chatbotId,
        question: faq.question,
        answer: faq.answer,
      })),
    );
  };

  useEffect(() => {
    const boot = async () => {
      const user = getUserContext();
      if (!user?.id) { setLoading(false); toast.error("Session expired."); return; }
      try {
        await loadChatbots(user.id);
        if (selectedChatbotId) await loadFaqs(user.id);
        else setFaqs([]);
      } catch (error: any) {
        toast.error(error.message || "Could not load FAQ data");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const user = getUserContext();
    if (!user?.id || !selectedChatbotId) return;
    loadFaqs(user.id).catch((err: any) => toast.error(err.message || "Could not refresh FAQs"));
  }, [selectedChatbotId]);

  // ─── Manual add/edit ──────────────────────────────────────────────────────
  const startNew = () => { setEditing(null); setQuestion(""); setAnswer(""); setOpen(true); };
  const startEdit = (faq: Faq) => { setEditing(faq); setQuestion(faq.question); setAnswer(faq.answer); setOpen(true); };

  const save = async () => {
    const user = getUserContext();
    if (!user?.id) { toast.error("Session expired."); return; }
    if (!selectedChatbotId) { toast.error("Select a chatbot first."); return; }
    if (!question.trim() || !answer.trim()) { toast.error("Question and answer are required."); return; }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/faqs/${editing.id}`, {
          method: "PUT",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, question, answer }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update FAQ");
        updateFaq(editing.id, { question, answer });
        toast.success("FAQ updated");
      } else {
        const res = await fetch("/api/faqs", {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, chatbotId: selectedChatbotId, question, answer }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add FAQ");
        addFaq({ id: data.faq._id, chatbotId: data.faq.chatbotId, question: data.faq.question, answer: data.faq.answer });
        toast.success("FAQ added");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Could not save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (faqId: string) => {
    const user = getUserContext();
    if (!user?.id) { toast.error("Session expired."); return; }
    try {
      const res = await fetch(`/api/faqs/${faqId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete FAQ");
      removeFaq(faqId);
      toast.success("FAQ deleted");
    } catch (error: any) {
      toast.error(error.message || "Could not delete FAQ");
    }
  };

  // ─── PDF upload & extraction ───────────────────────────────────────────────
  const handlePdfDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && pdfExtracting) {
      toast.message("Please wait while extraction is still running.");
      return;
    }
    setPdfOpen(nextOpen);
  };

  const openPdfDialog = () => {
    setPdfFile(null);
    setExtractedPairs([]);
    setPdfSaved(false);
    setPdfStatus("");
    setPdfOpen(true);
  };

  const handlePdfFile = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { toast.error("Please select a PDF file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File is too large. Max 10 MB."); return; }
    setPdfFile(file);
    setExtractedPairs([]);
    setPdfSaved(false);
    setPdfStatus("");
  };

  const extractPdfText = async (file: File) => {
    try {
      // @ts-ignore
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let text = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str ?? "").join(" ");
        text += `${pageText}\n\n`;
      }

      return text.trim();
    } catch (error) {
      console.error("PDF text extraction failed:", error);
      return null;
    }
  };

  const extractFromPdf = async () => {
    const user = getUserContext();
    if (!user?.id) { toast.error("Session expired."); return; }
    if (!selectedChatbotId) { toast.error("Select a chatbot first."); return; }
    if (!pdfFile) { toast.error("Please choose a PDF file."); return; }

    setPdfExtracting(true);
    setPdfSaved(false);
    setPdfStatus("Extracting questions from the PDF. Please keep this dialog open until the review list appears.");
    try {
      const formData = new FormData();
      const extractedText = await extractPdfText(pdfFile);

      if (extractedText && extractedText.length >= 50) {
        formData.append("text", extractedText);
      } else {
        formData.append("pdf", pdfFile);
      }

      formData.append("userId", user.id);
      formData.append("chatbotId", selectedChatbotId);

      const res = await fetch("/api/faqs/extract-pdf", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Extraction failed");

      if (!data.pairs || data.pairs.length === 0) {
        setPdfStatus("No Q&A pairs were found in this PDF.");
        toast.warning("No Q&A pairs found in this PDF.");
        return;
      }

      setExtractedPairs(
        data.pairs.map((p: { question: string; answer: string }) => ({ ...p, selected: true })),
      );
      setPdfStatus(`Extracted ${data.pairs.length} Q&A pairs. Review the list and choose which ones to add.`);
      toast.success(data.message || `${data.pairs.length} Q&A pairs extracted!`);
    } catch (error: any) {
      setPdfStatus("We could not extract Q&A pairs from this PDF. Please try again.");
      toast.error(error.message || "Could not extract from PDF");
    } finally {
      setPdfExtracting(false);
    }
  };

  const togglePair = (index: number) => {
    setExtractedPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)),
    );
  };

  const toggleAll = () => {
    const allSelected = extractedPairs.every((p) => p.selected);
    setExtractedPairs((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const bulkAdd = async () => {
    const user = getUserContext();
    if (!user?.id) { toast.error("Session expired."); return; }

    const selected = extractedPairs.filter((p) => p.selected);
    if (selected.length === 0) { toast.error("Select at least one Q&A pair."); return; }

    setBulkSaving(true);
    try {
      const res = await fetch("/api/faqs/bulk", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          chatbotId: selectedChatbotId,
          faqs: selected.map(({ question, answer }) => ({ question, answer })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add FAQs");

      // Add to local store
      data.faqs.forEach((faq: any) => {
        addFaq({ id: faq._id, chatbotId: faq.chatbotId, question: faq.question, answer: faq.answer });
      });

      setPdfSaved(false);
      setPdfStatus("");
      setExtractedPairs([]);
      toast.success(`${data.faqs.length} FAQs added successfully!`);
      setPdfOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Could not save FAQs");
    } finally {
      setBulkSaving(false);
    }
  };

  const selectedCount = extractedPairs.filter((p) => p.selected).length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">FAQ Manager</h1>
          <p className="text-sm text-muted-foreground">Train your chatbot with curated questions and answers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openPdfDialog}
            disabled={!selectedChatbotId || loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileUp className="h-4 w-4 text-primary" />
            Upload PDF
          </button>
          <GradientButton onClick={startNew} disabled={!selectedChatbotId || loading}>
            <Plus className="h-4 w-4" /> Add Question
          </GradientButton>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(260px,1fr)_auto] md:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">Select chatbot</span>
          <select
            value={selectedChatbotId}
            onChange={(e) => setSelectedChatbotId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading || chatbots.length === 0}
          >
            <option value="">Choose a chatbot</option>
            {chatbots.map((bot) => (
              <option key={bot.id} value={bot.id}>{bot.name}</option>
            ))}
          </select>
        </label>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search FAQs…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="mb-4 text-xs text-muted-foreground">{filtered.length} entries</div>

      {/* FAQ list / empty states */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-sm text-muted-foreground">
          Loading FAQs…
        </div>
      ) : chatbots.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-9 w-9" />}
          title="No chatbots yet"
          description="Create a chatbot first so you can train FAQs for it."
          action={
            <Link
              to="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              <Plus className="h-4 w-4" /> Create Chatbot
            </Link>
          }
        />
      ) : !selectedChatbotId ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-sm text-muted-foreground">
          Choose a chatbot to view and add FAQs.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-9 w-9" />}
          title={`No FAQs for ${selectedBot?.name || "this chatbot"}`}
          description="Add your first question or upload a PDF to auto-extract Q&A pairs."
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={openPdfDialog}
                className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                <FileUp className="h-4 w-4 text-primary" /> Upload PDF
              </button>
              <GradientButton onClick={startNew}><Plus className="h-4 w-4" /> Add Question</GradientButton>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-soft text-primary">
                      <MessageSquareText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm font-semibold">{faq.question}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(faq); }}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent"
                    >
                      <Edit3 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(faq.id); }}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="border-t border-border/60 bg-muted/30 px-5 py-4 text-sm text-foreground/80">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Manual Add/Edit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Selected chatbot</span>
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {selectedBot?.name || "Choose a chatbot"}
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Question</span>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What is your Umrah package price?"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Answer</span>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                placeholder="Type the answer here…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="h-10 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent">
              Cancel
            </button>
            <GradientButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add FAQ"}
            </GradientButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PDF Upload Dialog ── */}
      <Dialog open={pdfOpen} onOpenChange={handlePdfDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Upload PDF — Auto Extract Q&amp;A
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Step 1: File picker */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step 1 — Choose PDF file</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handlePdfFile(e.dataTransfer.files?.[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <FileText className="h-8 w-8 text-primary/60" />
                {pdfFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pdfFile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); setExtractedPairs([]); }}
                      className="grid h-5 w-5 place-items-center rounded-full hover:bg-destructive/20 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">Click or drag &amp; drop a PDF here</p>
                    <p className="text-xs text-muted-foreground">Max 10 MB · Text-based PDFs only</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdfFile(e.target.files?.[0])}
              />
            </div>

            {/* Extract button */}
            {pdfFile && extractedPairs.length === 0 && (
              <button
                onClick={extractFromPdf}
                disabled={pdfExtracting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {pdfExtracting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {pdfStatus || "Extracting Q&A pairs with AI…"}</>
                ) : (
                  <><FileUp className="h-4 w-4" /> Extract Q&amp;A Pairs</>
                )}
              </button>
            )}

            {pdfStatus && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm text-foreground">{pdfStatus}</p>
              </div>
            )}

            {/* Step 2: Preview extracted pairs */}
            {extractedPairs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step 2 — Review &amp; select pairs
                  </p>
                  <button
                    onClick={toggleAll}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {extractedPairs.every((p) => p.selected) ? (
                      <><CheckSquare className="h-3.5 w-3.5" /> Deselect all</>
                    ) : (
                      <><Square className="h-3.5 w-3.5" /> Select all</>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  {extractedPairs.map((pair, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => togglePair(index)}
                      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                        pair.selected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-muted/20 opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {pair.selected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold leading-snug">{pair.question}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pair.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => handlePdfDialogOpenChange(false)}
              disabled={pdfExtracting}
              className="h-10 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
            {extractedPairs.length > 0 && !pdfSaved && (
              <GradientButton onClick={bulkAdd} disabled={bulkSaving || selectedCount === 0}>
                {bulkSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  <>Add {selectedCount} FAQ{selectedCount !== 1 ? "s" : ""}</>
                )}
              </GradientButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
