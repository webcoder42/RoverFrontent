import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Eye, FileText, Upload, Sun, Moon, Sparkles, Trash2, Database, Loader2, MessageSquareText, Building2, EyeIcon, Pencil, Save, ShoppingCart, Plane, Heart, BookOpen, Building, UtensilsCrossed, Scissors, Truck, Landmark, Car, Scale, Film, Settings, Mail } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { LiveBotPreview } from "@/components/create/LiveBotPreview";
import { GradientButton } from "@/components/common/GradientButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDraftBotStore } from "@/store/draftBot";
import { useChatbotsStore, type Template } from "@/store/chatbots";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/create")({
  head: () => ({ meta: [{ title: "Create Chatbot — Webotme" }] }),
  component: CreateBot,
});

type BotType = "simple" | "agency";

const templates: { name: Template; tag: string; desc: string; tone: string }[] = [
  { name: "Modern Glass UI", tag: "glassmorphism", desc: "Frosted glass with soft gradients.", tone: "from-violet-400 to-indigo-400" },
  { name: "Minimal AI Assistant", tag: "minimal", desc: "Clean monochrome layout for docs.", tone: "from-slate-400 to-slate-600" },
  { name: "Floating Support Widget", tag: "support", desc: "Friendly support widget for SaaS.", tone: "from-sky-400 to-cyan-400" },
  { name: "Rounded Messenger Style", tag: "messenger", desc: "Bubbly, playful conversation feel.", tone: "from-emerald-400 to-teal-400" },
  { name: "Neon AI Interface", tag: "futuristic", desc: "Glowing futuristic AI playground.", tone: "from-fuchsia-500 to-pink-500" },
  { name: "Custom", tag: "custom", desc: "Start from scratch with your own design.", tone: "from-gray-400 to-slate-500" },
];

const fonts = ["Inter", "Manrope", "Space Grotesk", "DM Sans"];
const bubbles = [{ id: "rounded", label: "Rounded" }, { id: "square", label: "Square" }, { id: "soft", label: "Soft" }] as const;

const categories = [
  { id: "ecommerce", label: "E-Commerce", icon: ShoppingCart, desc: "Products, orders, customer support" },
  { id: "travel", label: "Travel & Tourism", icon: Plane, desc: "Bookings, itineraries, travel info" },
  { id: "healthcare", label: "Healthcare", icon: Heart, desc: "Appointments, prescriptions, health info" },
  { id: "education", label: "Education", icon: BookOpen, desc: "Courses, enrollment, academic info" },
  { id: "realestate", label: "Real Estate", icon: Building, desc: "Property listings, tours, inquiries" },
  { id: "restaurant", label: "Restaurant & Food", icon: UtensilsCrossed, desc: "Menu, orders, table booking" },
  { id: "salon", label: "Salon & Spa", icon: Scissors, desc: "Services, appointments, pricing" },
  { id: "logistics", label: "Logistics & Courier", icon: Truck, desc: "Tracking, delivery, pickup" },
  { id: "hotel", label: "Hotel & Hospitality", icon: Building2, desc: "Room booking, amenities, services" },
  { id: "finance", label: "Finance & Banking", icon: Landmark, desc: "Accounts, transactions, support" },
  { id: "automotive", label: "Automotive", icon: Car, desc: "Vehicle sales, service, support" },
  { id: "legal", label: "Legal Services", icon: Scale, desc: "Consultations, document generation" },
  { id: "entertainment", label: "Entertainment", icon: Film, desc: "Events, tickets, showtimes" },
  { id: "fitness", label: "Fitness & Gym", icon: Sparkles, desc: "Memberships, classes, schedules" },
  { id: "other", label: "Other / Custom", icon: Settings, desc: "Custom category" },
];

const categoryQuestions: Record<string, { question: string; field: string }[]> = {
  ecommerce: [{ question: "Do you have your own database collection for products & orders?", field: "useOwnDb" }],
  travel: [{ question: "Do you have a database for bookings & itineraries?", field: "useOwnDb" }],
  healthcare: [{ question: "Do you have a patient/appointment database?", field: "useOwnDb" }],
  education: [{ question: "Do you have a database for courses & students?", field: "useOwnDb" }],
  realestate: [{ question: "Do you have a property listings database?", field: "useOwnDb" }],
  restaurant: [{ question: "Do you have a menu/orders database?", field: "useOwnDb" }],
  salon: [{ question: "Do you have a services/appointments database?", field: "useOwnDb" }],
  logistics: [{ question: "Do you have a shipments/tracking database?", field: "useOwnDb" }],
  hotel: [{ question: "Do you have a room booking database?", field: "useOwnDb" }],
  finance: [{ question: "Do you have a transactions/accounts database?", field: "useOwnDb" }],
  automotive: [{ question: "Do you have a vehicles/inventory database?", field: "useOwnDb" }],
  legal: [{ question: "Do you have a cases/clients database?", field: "useOwnDb" }],
  entertainment: [{ question: "Do you have an events/tickets database?", field: "useOwnDb" }],
  fitness: [{ question: "Do you have a members/schedules database?", field: "useOwnDb" }],
};

const defaultIcons = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%238b5cf6'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%230ea5e9'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 8V4H8'/%3E%3Crect width='16' height='12' x='4' y='8' rx='2'/%3E%3Cpath d='M2 14h2'/%3E%3Cpath d='M20 14h2'/%3E%3Cpath d='M15 13v2'/%3E%3Cpath d='M9 13v2'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%2310b981'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23f43f5e'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='16' height='16' x='4' y='4' rx='2'/%3E%3Crect width='6' height='6' x='9' y='9' rx='1'/%3E%3Cpath d='M15 2v2'/%3E%3Cpath d='M15 20v2'/%3E%3Cpath d='M2 15h2'/%3E%3Cpath d='M2 9h2'/%3E%3Cpath d='M20 15h2'/%3E%3Cpath d='M20 9h2'/%3E%3Cpath d='M9 2v2'/%3E%3Cpath d='M9 20v2'/%3E%3C/g%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%230f172a'/%3E%3Cg transform='translate(12, 12)' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Cpath d='M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z'/%3E%3Cpath d='M15.7 4.3c3.08-1.13 6.4-.27 7.4 1.8.98 2.07-1.42 5.6-5.4 7.9-3.97 2.33-8.4 3.2-9.38 1.14-1-2.07 1.4-5.6 5.4-7.9Z'/%3E%3Cpath d='M8.3 19.7c-3.08 1.13-6.4.27-7.4-1.8-.98-2.07 1.42-5.6 5.4-7.9 3.97-2.33 8.4-3.2 9.38-1.14 1 2.07-1.4 5.6-5.4 7.9Z'/%3E%3C/g%3E%3C/svg%3E",
];

function CreateBot() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [botType, setBotType] = useState<BotType | null>(null);
  const [manualKnowledgeName, setManualKnowledgeName] = useState("");
  const [manualKnowledgeContent, setManualKnowledgeContent] = useState("");
  const [manualKBName, setManualKBName] = useState("");
  const [manualKBContent, setManualKBContent] = useState("");
  const [manualTKName, setManualTKName] = useState("");
  const [manualTKContent, setManualTKContent] = useState("");
  const [manualTSName, setManualTSName] = useState("");
  const [manualTSContent, setManualTSContent] = useState("");
  const [selectedFileForView, setSelectedFileForView] = useState<{ name: string; content: string; url?: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customDesignerOpen, setCustomDesignerOpen] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [usage, setUsage] = useState<any>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const draft = useDraftBotStore();
  const add = useChatbotsStore((s) => s.add);
  const chatbots = useChatbotsStore((s) => s.chatbots);
  const setChatbots = useChatbotsStore((s) => s.setChatbots);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/storage/usage?minimal=1", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.storage) setUsage(data.storage);
        setUsageLoaded(true);
      })
      .catch(() => setUsageLoaded(true));
  }, []);

  useEffect(() => {
    if (chatbots.length === 0) {
      const rawUser = localStorage.getItem("user");
      const token = localStorage.getItem("token") || "";
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser) as { id: string };
          fetch(`/api/chatbot/user/${user.id}`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.chatbots) {
                const mapped = data.chatbots.map((cb: any) => {
                  const dbCol = cb.dbCollection || {};
                  return {
                    id: cb._id || cb.id,
                    type: cb.type || "simple",
                    isActive: !!cb.isActive,
                    collectionStoreType: dbCol.storeType || cb.collectionStoreType || "",
                  } as any;
                });
                setChatbots(mapped);
              }
            })
            .catch((err) => console.error("Failed to load chatbots in create page", err));
        } catch (e) {}
      }
    }
  }, [chatbots.length, setChatbots]);

  const usedStorageTargets = chatbots
    .map((b) => b.collectionStoreType)
    .filter(Boolean) as string[];

  const plan = usage?.planId || {};
  const simpleBotLimit = Math.max(0, plan.totalChatbots || 0);
  const agencyBotLimit = plan.bookingAgency || 0;
  const storeSimpleBots = chatbots.filter((b: any) => b.type === "simple").length;
  const storeAgencyBots = chatbots.filter((b: any) => b.type === "agency").length;
  const usedSimpleBots = usage?.totalSimpleChatbots ?? storeSimpleBots;
  const usedAgencyBots = usage?.totalAgencyChatbots ?? storeAgencyBots;
  const simpleReached = usedSimpleBots >= simpleBotLimit;
  const agencyUnavailable = agencyBotLimit <= 0;
  const agencyReached = agencyBotLimit > 0 && usedAgencyBots >= agencyBotLimit;
  const simpleAvailable = !simpleReached;
  const agencyAvailable = !agencyUnavailable && !agencyReached;

  const getSteps = (): string[] => {
    if (step === 0) return ["Bot type"];
    if (botType === "agency") {
      if (step === 1) return ["Bot type", "Category"];
      return ["Bot type", "Category", "Bot details", "Theme", "Template", "Training", "Review & Launch", "Product Catalog DB", "Orders Storage DB"];
    }
    return ["Bot type", "Name & Description", "Theme", "Template", "Training"];
  };

  const steps = getSteps();

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const parseServicesFromDescription = (desc: string): string[] => {
    const lines = desc.split("\n");
    const services: string[] = [];
    let capturing = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/services?\s*offered/i.test(trimmed)) {
        capturing = true;
        continue;
      }
      if (capturing) {
        const match = trimmed.match(/^\d+\.\s+(.+)$/);
        if (match) {
          services.push(match[1]);
        } else if (trimmed === "") {
          continue;
        } else {
          capturing = false;
        }
      }
    }
    return services;
  };

  const uploadToCloudinary = async (file: File, dataUrl: string) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extension);
    const uploadResourceType = isImage ? 'image' : 'raw';

    const signRes = await fetch('/api/chatbot/upload/cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceType: uploadResourceType }),
    });

    const signData = await signRes.json();
    if (!signRes.ok) throw new Error(signData.message || 'Failed to get upload signature');

    const { signature, timestamp, folder, apiKey, cloudName } = signData;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${uploadResourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
    }

    return (uploadData.secure_url || uploadData.url) as string;
  };

  const onLogo = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const url = await uploadToCloudinary(file, dataUrl);
      draft.set({ logo: url });
      toast.success('Logo uploaded to Cloudinary');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Logo upload failed');
    }
  };

  const parseKnowledgeFile = async (file: File, onProgress?: (pct: number) => void) => {
    const name = file.name;
    const extension = name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      // @ts-ignore
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += `${pageText}\n\n`;
        if (onProgress) onProgress(Math.round((pageNum / pdf.numPages) * 100));
      }
      return { text: text.trim(), pages: pdf.numPages };
    }

    if (extension === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (onProgress) onProgress(100);
      return { text: result.value.trim(), pages: null };
    }

    if (extension === 'doc') {
      toast.error('DOC files are not supported yet. Please upload PDF or DOCX.');
      return null;
    }

    if (extension === 'txt' || extension === 'md' || extension === 'json') {
      const text = await file.text();
      if (onProgress) onProgress(100);
      const lines = text.split('\n').length;
      return { text: text.trim(), pages: null, lines };
    }

    toast.error('Unsupported file type. Use PDF, DOCX, TXT, MD, or JSON.');
    return null;
  };

  const addKnowledgeFiles = async (files: FileList | null) => {
    if (!files) return;

    const existingNames = new Set(draft.knowledgeFiles.map(f => f.name));
    const newFiles: Array<{ name: string; content: string; url?: string }> = [];
    let combinedContent = "";
    const totalFiles = files.length;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      try {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size allowed is 10MB.`);
          continue;
        }

        if (existingNames.has(file.name)) {
          toast.error(`${file.name} already exists. Remove it first or rename the file.`);
          continue;
        }

        setUploadStatus(`Extracting ${file.name}... (0%)`);

        const result = await parseKnowledgeFile(file, (pct) => {
          const overallPct = Math.round(((i * 100 + pct * 0.7) / totalFiles));
          setUploadProgress(overallPct);
          setUploadStatus(`Extracting ${file.name}... (${pct}%)`);
        });

        if (!result) continue;

        const { text: content, pages, lines } = result;
        combinedContent += content + "\n\n";

        setUploadStatus(`Uploading ${file.name}...`);
        setUploadProgress(Math.round(((i * 100 + 70) / totalFiles)));

        const dataUrl = await readFileAsDataUrl(file);
        const url = await uploadToCloudinary(file, dataUrl);

        newFiles.push({ name: file.name, content, url });

        const details = pages ? `${pages} pages` : lines ? `${lines} lines` : `${content.length} chars`;
        setUploadStatus(`${file.name}: ${details} extracted ?`);

        setUploadProgress(Math.round(((i * 100 + 100) / totalFiles)));
      } catch (error: any) {
        console.error('Failed to process file', file.name, error);
        toast.error(`Failed to process ${file.name}: ${error?.message || error}`);
        setUploadStatus(`Failed: ${file.name}`);
      }
    }

    if (newFiles.length) {
      let newServices: string[] = [];
      let newDesc = draft.description;

      // Only extract services for Agency chatbots, not Simple ones
      if (botType === "agency") {
        setUploadStatus("Extracting services with AI...");
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/chatbot/extract-services", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: combinedContent.substring(0, 15000) }),
          });
          const data = await res.json();
          if (data.services && data.services.length > 0) {
            newServices = data.services;
          }
        } catch (e) {
          console.error("Extraction error", e);
        }

        if (newServices.length > 0) {
          newDesc += "\n\nServices Offered:\n" + newServices.map((s, i) => `${i + 1}. ${s}`).join("\n");
          toast.success("Services extracted and added to description!");
        }
      }

      draft.set({
        knowledgeFiles: [...draft.knowledgeFiles, ...newFiles],
        extractedServices: [...draft.extractedServices, ...newServices],
        description: newDesc,
      });
    }

    setUploading(false);
    setUploadProgress(100);
    setUploadStatus(`Done! ${newFiles.length} of ${totalFiles} file(s) processed.`);
    setTimeout(() => setUploadStatus(""), 3000);
  };

  const addManualKnowledge = () => {
    if (!manualKnowledgeName.trim() || !manualKnowledgeContent.trim()) {
      toast.error('Please provide a name and content for the knowledge file');
      return;
    }
    draft.set({
      knowledgeFiles: [
        ...draft.knowledgeFiles,
        { name: manualKnowledgeName.trim(), content: manualKnowledgeContent.trim() },
      ],
    });
    setManualKnowledgeName('');
    setManualKnowledgeContent('');
    toast.success('Knowledge content added');
  };

  const removeKnowledgeFile = (index: number) => {
    const next = [...draft.knowledgeFiles];
    next.splice(index, 1);
    draft.set({ knowledgeFiles: next });
  };

  const parseLinesFromText = (text: string): string[] => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const result: string[] = [];

    const tocLine = lines.find(l => /table\s+of\s+contents/i.test(l));
    if (tocLine) {
      const re = /\d+\.\s+([A-Za-z&][A-Za-z& \/-]+?)\s*\(\d+\s*products?\)/g;
      let m;
      while ((m = re.exec(tocLine)) !== null) {
        const name = m[1].trim();
        if (name && !result.includes(name)) result.push(name);
      }
    }

    if (result.length === 0) {
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+([A-Za-z].*?)(?:\s*\(.*?\))?(?:\s+(?:SKU|Price|—).*)?$/);
        if (m) {
          const name = m[1].trim();
          if (name.length < 80 && !result.includes(name)) result.push(name);
        }
      }
    }

    return result;
  };

  const uploadFileType = async (files: FileList | null, type: 'knowledgeBase' | 'trainingKnowledge' | 'trainingSheet') => {
    if (!files) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    const newFiles: Array<{ name: string; content: string; url?: string }> = [];
    let combinedContent = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadStatus(`Extracting ${file.name}...`);
        const result = await parseKnowledgeFile(file, (pct) => {
          setUploadProgress(Math.round(((i * 100 + pct * 0.7) / files.length)));
        });
        if (!result) continue;
        combinedContent += result.text + "\n\n";
        setUploadStatus(`Uploading ${file.name}...`);
        setUploadProgress(Math.round(((i * 100 + 70) / files.length)));
        const dataUrl = await readFileAsDataUrl(file);
        const url = await uploadToCloudinary(file, dataUrl);
        newFiles.push({ name: file.name, content: result.text, url });
        setUploadProgress(Math.round(((i * 100 + 100) / files.length)));
      } catch (err: any) {
        toast.error(`Failed to process ${file.name}`);
      }
    }
    if (newFiles.length) {
      const patch: any = { [type]: [...(draft as any)[type], ...newFiles] };
      if (type === 'trainingSheet' && botType === 'agency') {
        const lines = parseLinesFromText(combinedContent);
        if (lines.length > 0) {
          patch.trainingSheetServices = [...new Set([...draft.trainingSheetServices, ...lines])];
          toast.success(`Loaded ${lines.length} items from training sheet!`);
        }
      }
      draft.set(patch);
      toast.success(`${newFiles.length} file(s) uploaded`);
    }
    setUploading(false);
    setUploadProgress(100);
    setUploadStatus(`Done! ${newFiles.length} file(s) processed.`);
    setTimeout(() => setUploadStatus(""), 2000);
  };

  const addManualFileType = (type: 'knowledgeBase' | 'trainingKnowledge' | 'trainingSheet') => {
    let name: string, content: string, setName: (v: string) => void, setContent: (v: string) => void;
    if (type === 'knowledgeBase') {
      name = manualKBName; content = manualKBContent; setName = setManualKBName; setContent = setManualKBContent;
    } else if (type === 'trainingKnowledge') {
      name = manualTKName; content = manualTKContent; setName = setManualTKName; setContent = setManualTKContent;
    } else {
      name = manualTSName; content = manualTSContent; setName = setManualTSName; setContent = setManualTSContent;
    }
    if (!name.trim() || !content.trim()) {
      toast.error('Provide name and content');
      return;
    }
    draft.set({ [type]: [...(draft as any)[type], { name: name.trim(), content: content.trim() }] });
    setName('');
    setContent('');
    toast.success('Added');
  };

  const removeFileType = (index: number, type: 'knowledgeBase' | 'trainingKnowledge' | 'trainingSheet') => {
    const next = [...(draft as any)[type]];
    next.splice(index, 1);
    draft.set({ [type]: next });
  };

  const next = () => {
    if (step === 0 && !botType) return;
    if (step === 0 && botType === "agency" && !agencyAvailable) return;
    if (step === 0 && botType === "simple" && !simpleAvailable) return;
    if (step === 0 && botType === "agency") { setStep(1); return; }
    if (step === 0 && botType === "simple") { setStep(2); return; }
    if (step === 1 && botType === "agency" && !draft.category) return;
    if (step < maxStep) {
      setStep((s) => s + 1);
    }
  };
  const prev = () => {
    if (step === 2 && botType === "simple") { setStep(0); return; }
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    const user = JSON.parse(raw);
    const token = localStorage.getItem("token") || "";

    setSaving(true);
    try {
      const body: Record<string, any> = {
        type: botType,
        category: draft.category,
        useOwnDb: draft.useOwnDb,
        orderSystemEnabled: draft.orderSystemEnabled,
        productType: draft.productType,
        name: draft.name,
        welcome: draft.welcome,
        description: draft.description,
        logo: draft.logo ?? null,
        theme: {
          primaryColor: draft.primary,
          secondaryColor: draft.secondary,
          font: draft.font,
          borderRadius: draft.radius,
          bubbleStyle: draft.bubble,
          previewMode: draft.preview,
          template: draft.template,
          headerStyle: draft.headerStyle,
          textStyle: draft.textStyle,
          botBubbleColor: draft.botBubbleColor,
          botTextColor: draft.botTextColor,
          showAvatar: draft.showAvatar,
          messageFontSize: draft.messageFontSize,
          inputStyle: draft.inputStyle,
          headerSubtitle: draft.headerSubtitle,
        },
        widget: {
          launcher: draft.widgetLauncher,
          launcherText: draft.widgetLauncherText,
          launcherStyle: draft.widgetLauncherStyle,
          position: draft.widgetPosition,
          openMode: draft.widgetOpenMode,
          width: draft.widgetWidth,
          height: draft.widgetHeight,
          smartPosition: draft.widgetSmartPosition,
          customCss: draft.widgetCustomCss,
        },
        ai: {
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
        },
        knowledge: {
          files: draft.knowledgeFiles,
          knowledgeBase: draft.knowledgeBase,
          trainingKnowledge: draft.trainingKnowledge,
          trainingSheet: draft.trainingSheet,
          extractedServices: draft.extractedServices,
          trainingSheetServices: draft.trainingSheetServices,
          trainingFlow: draft.trainingFlow,
          onlyKnowledge: draft.onlyKnowledge,
          answerAnyQuestion: draft.answerAnyQuestion,
        },
        adminUserId: user.id,
      };

      if (botType === "agency") {
        body.agency = {
          email1: draft.agencyEmail1 || null,
          email2: draft.agencyEmail2 || null,
        };
      }

      if (draft.databaseType && draft.databaseMode) {
        const dbc: Record<string, any> = {
          type: draft.databaseType,
          mode: draft.databaseMode,
          db: draft.collectionDb || null,
          table: draft.collectionTable || null,
          connected: draft.collectionConnected,
        };
        if (draft.databaseType === "mongodb") {
          dbc.uri = draft.collectionUri || null;
        } else {
          dbc.username = draft.collectionUsername || null;
          dbc.password = draft.collectionPassword || null;
          dbc.host = draft.collectionHost || null;
          dbc.port = draft.collectionPort || (draft.databaseType === "mysql" ? 3306 : 5432);
          dbc.ssl = draft.collectionSsl;
        }
        if (draft.collectionStoreType) {
          dbc.storeType = draft.collectionStoreType;
        }
        if (draft.productMapping) {
          dbc.mapping = draft.productMapping;
        }
        body.dbCollection = dbc;
      }

      if (draft.orderSystemEnabled && draft.productDbType) {
        const prodDbc: Record<string, any> = {
          dbType: draft.productDbType,
          db: draft.productDb || null,
          table: draft.productTable || null,
          connected: draft.productConnected,
        };
        if (draft.productDbType === "mongodb") {
          prodDbc.uri = draft.productUri || null;
        } else {
          prodDbc.username = draft.productUsername || null;
          prodDbc.password = draft.productPassword || null;
          prodDbc.host = draft.productHost || null;
          prodDbc.port = draft.productPort || (draft.productDbType === "mysql" ? 3306 : 5432);
          prodDbc.ssl = draft.productSsl;
        }
        if (draft.productMapping) {
          prodDbc.mapping = draft.productMapping;
        }
        body.productCollection = prodDbc;
      }

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save chatbot");

      const cb = data.chatbot;
      const theme = cb.theme || {};
      const knowledge = cb.knowledge || {};
      const agency = cb.agency || {};
      const dbCol = cb.dbCollection || {};
      add({
        id: cb._id,
        type: cb.type || botType,
        name: cb.name,
        template: theme.template || cb.template || "Modern Glass UI",
        description: cb.description,
        welcome: cb.welcome,
        primary: theme.primaryColor || cb.primaryColor || "#D94A2D",
        secondary: theme.secondaryColor || cb.secondaryColor || "#1C1C2E",
        font: theme.font || cb.font || "Inter",
        radius: theme.borderRadius ?? cb.borderRadius ?? 16,
        bubble: theme.bubbleStyle || cb.bubbleStyle || "rounded",
        logo: cb.logo ?? undefined,
        createdAt: cb.createdAt,
        installs: cb.installs,
        embedScript: cb.embedScript,
        knowledgeFiles: knowledge.files ?? cb.knowledgeFiles ?? [],
        knowledgeBase: knowledge.knowledgeBase ?? cb.knowledgeBase ?? [],
        trainingKnowledge: knowledge.trainingKnowledge ?? cb.trainingKnowledge ?? [],
        trainingSheet: knowledge.trainingSheet ?? cb.trainingSheet ?? [],
        extractedServices: knowledge.extractedServices ?? cb.extractedServices ?? [],
        trainingSheetServices: knowledge.trainingSheetServices ?? cb.trainingSheetServices ?? [],
        agencyEmail1: agency.email1 ?? cb.agencyEmail1 ?? "",
        agencyEmail2: agency.email2 ?? cb.agencyEmail2 ?? "",
        collectionDb: dbCol.db ?? cb.collectionDb ?? "",
        collectionUsername: dbCol.username ?? cb.collectionUsername ?? "",
        collectionPassword: dbCol.password ?? cb.collectionPassword ?? "",
        collectionHost: dbCol.host ?? cb.collectionHost ?? "",
        collectionPort: dbCol.port ?? cb.collectionPort ?? 3306,
        collectionTable: dbCol.table ?? cb.collectionTable ?? "",
        collectionSsl: dbCol.ssl ?? cb.collectionSsl ?? false,
        collectionConnected: dbCol.connected ?? cb.collectionConnected ?? false,
      });

      toast.success("Chatbot saved to database!");
      draft.reset();
      navigate({ to: "/dashboard/scripts" });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const maxStep = botType === "agency" ? 8 : 5;
  const displayStep = botType === "agency" ? step : step === 0 ? 0 : step - 1;

  return (
    <PageTransition>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Builder
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Create Chatbot</h1>
          <p className="text-sm text-muted-foreground">Configure, theme, and embed your AI assistant in a few quick steps.</p>
        </div>
        <button onClick={() => setPreviewOpen(!previewOpen)}
          className={`hidden md:inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition shadow-soft ${
            previewOpen
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 bg-card hover:bg-accent"
          }`}>
          <EyeIcon className="h-4 w-4" /> {previewOpen ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <button
              onClick={() => { const go = botType === "agency" ? i : i === 0 ? 0 : i + 1; if (go <= step) setStep(go); }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                i === displayStep
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : i < displayStep
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i <= displayStep ? "bg-white/25" : "bg-background"}`}>
                {i < displayStep ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < maxStep - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${previewOpen ? 'lg:grid-cols-[1fr_22rem]' : ''}`}>
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Choose bot type</h2>
              <p className="text-sm text-muted-foreground">What kind of chatbot would you like to create?</p>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  disabled={!simpleAvailable}
                  onClick={() => setBotType("simple")}
                  className={`group relative rounded-2xl border bg-card p-6 text-left transition-all ${
                    botType === "simple" ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                  } ${simpleAvailable ? "hover:border-primary/40 hover:shadow-lg" : "opacity-60 cursor-not-allowed"}`}
                >
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-400/20">
                    <MessageSquareText className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">Simple Chatbot</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${simpleReached ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                      {!usageLoaded ? "…" : `${usedSimpleBots} / ${simpleBotLimit}`}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">A basic Q&A assistant. Name it, add training, and embed.</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Name &amp; description</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Theme &amp; template</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Training documents</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Embed script</li>
                  </ul>
                  {simpleReached && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
                      Simple chatbot limit reached ({usedSimpleBots}/{simpleBotLimit}). Upgrade your plan to create more.
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!agencyAvailable}
                  onClick={() => setBotType("agency")}
                  className={`group relative rounded-2xl border bg-card p-6 text-left transition-all ${
                    botType === "agency" ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                  } ${agencyAvailable ? "hover:border-primary/40 hover:shadow-lg" : "opacity-60 cursor-not-allowed"}`}
                >
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-400/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">Agency Chatbot</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${agencyAvailable ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                      {!usageLoaded ? "…" : agencyBotLimit > 0 ? `${usedAgencyBots} / ${agencyBotLimit}` : "Upgrade"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Full-featured booking assistant with agency integration and MySQL.</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Everything in Simple</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Agency emails</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> MySQL booking database</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Booking workflows</li>
                  </ul>
                  {!agencyAvailable && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
                      {agencyUnavailable
                        ? "Agency chatbots are not included in your current plan. Upgrade your plan to create one."
                        : `Agency chatbot limit reached (${usedAgencyBots}/${agencyBotLimit}). Upgrade your plan to create more.`}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 1 && botType === "agency" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">What is your chatbot for?</h2>
              <p className="text-sm text-muted-foreground">Select the category that best describes your business or use case.</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => draft.set({ category: draft.category === cat.id ? "" : cat.id, useOwnDb: false })}
                    className={`relative rounded-2xl border p-4 text-left transition-all hover:shadow-lg ${
                      draft.category === cat.id
                        ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                        : "border-border/60 hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className="mb-2 text-primary">{cat.icon ? <cat.icon className="h-6 w-6" /> : null}</div>
                    <div className="text-sm font-semibold">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
                    {draft.category === cat.id && (
                      <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {draft.category && categoryQuestions[draft.category] && (
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 space-y-4">
                  {categoryQuestions[draft.category].map((q, idx) => (
                    <div key={idx}>
                      <p className="text-sm font-medium mb-3">{q.question}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => draft.set({ useOwnDb: true })}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            draft.useOwnDb
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                              : "border-border/60 hover:border-primary/40 bg-card"
                          }`}
                        >
                          Yes, I have my own database
                        </button>
                        <button
                          onClick={() => draft.set({ useOwnDb: false })}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            !draft.useOwnDb
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                              : "border-border/60 hover:border-primary/40 bg-card"
                          }`}
                        >
                          No, I'll use Webotme's built-in
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && botType === "simple" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Name & Description</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chatbot Name">
                  <input value={draft.name} onChange={(e) => draft.set({ name: e.target.value })} className="input" />
                </Field>
                <Field label="Welcome Message">
                  <input value={draft.welcome} onChange={(e) => draft.set({ welcome: e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Logo / Icon">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {defaultIcons.map((icon, i) => (
                      <button key={i} type="button" onClick={() => draft.set({ logo: icon })}
                        className={`overflow-hidden rounded-xl border-2 transition-all hover:scale-105 ${draft.logo === icon ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}>
                        <img src={icon} alt={`Default ${i}`} className="h-10 w-10 object-cover" />
                      </button>
                    ))}
                    <div className="text-xs text-muted-foreground uppercase font-semibold ml-2">OR</div>
                  </div>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onLogo(f); }}
                    className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground hover:bg-muted/70 transition-colors"
                  >
                    {draft.logo && !defaultIcons.includes(draft.logo) ? (
                      <img src={draft.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-soft text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="text-foreground font-medium">Drop an image here or click to upload</div>
                      <div className="text-xs">PNG, JPG or SVG, up to 2MB</div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
                  </label>
                </div>
              </Field>
              <Field label="Launcher button">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {([
                      { v: "icon" as const, l: "Icon", d: "Logo icon" },
                      { v: "button" as const, l: "Button", d: "Text button" },
                    ]).map((s) => (
                      <button key={s.v} type="button" onClick={() => draft.set({ widgetLauncher: s.v })}
                        className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2.5 text-left transition ${draft.widgetLauncher === s.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                        <span className="block text-xs font-semibold">{s.l}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{s.d}</span>
                      </button>
                    ))}
                  </div>
                  {draft.widgetLauncher === "button" && (
                    <>
                      <input value={draft.widgetLauncherText} onChange={(e) => draft.set({ widgetLauncherText: e.target.value })} className="input" placeholder="Chat with us" />
                      <div className="grid grid-cols-4 gap-2">
                        {(["rounded", "pill", "square", "soft"] as const).map((st) => (
                          <button key={st} type="button" onClick={() => draft.set({ widgetLauncherStyle: st })}
                            className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition ${draft.widgetLauncherStyle === st ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${draft.primary || "#7c3aed"}, ${draft.secondary || "#db2777"})`,
                            borderRadius:
                              draft.widgetLauncherStyle === "pill"
                                ? 999
                                : draft.widgetLauncherStyle === "square"
                                  ? 6
                                  : draft.widgetLauncherStyle === "soft"
                                    ? 18
                                    : 12,
                          }}
                        >
                          {draft.widgetLauncherText || "Chat with us"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && botType === "agency" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Bot Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chatbot Name">
                  <input value={draft.name} onChange={(e) => draft.set({ name: e.target.value })} className="input" />
                </Field>
                <Field label="Welcome Message">
                  <input value={draft.welcome} onChange={(e) => draft.set({ welcome: e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Logo / Icon">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {defaultIcons.map((icon, i) => (
                      <button key={i} type="button" onClick={() => draft.set({ logo: icon })}
                        className={`overflow-hidden rounded-xl border-2 transition-all hover:scale-105 ${draft.logo === icon ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}>
                        <img src={icon} alt={`Default ${i}`} className="h-10 w-10 object-cover" />
                      </button>
                    ))}
                    <div className="text-xs text-muted-foreground uppercase font-semibold ml-2">OR</div>
                  </div>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onLogo(f); }}
                    className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground hover:bg-muted/70 transition-colors"
                  >
                    {draft.logo && !defaultIcons.includes(draft.logo) ? (
                      <img src={draft.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-soft text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="text-foreground font-medium">Drop an image here or click to upload</div>
                      <div className="text-xs">PNG, JPG or SVG, up to 2MB</div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
                  </label>
                </div>
              </Field>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Theme Customization</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Primary color">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                    <input type="color" value={draft.primary} onChange={(e) => draft.set({ primary: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
                    <input value={draft.primary} onChange={(e) => draft.set({ primary: e.target.value })} className="flex-1 bg-transparent text-sm focus:outline-none" />
                  </div>
                </Field>
                <Field label="Secondary color">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                    <input type="color" value={draft.secondary} onChange={(e) => draft.set({ secondary: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
                    <input value={draft.secondary} onChange={(e) => draft.set({ secondary: e.target.value })} className="flex-1 bg-transparent text-sm focus:outline-none" />
                  </div>
                </Field>
                <Field label="Font">
                  <select value={draft.font} onChange={(e) => draft.set({ font: e.target.value })} className="input">
                    {fonts.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label={`Border radius — ${draft.radius}px`}>
                  <input type="range" min={0} max={32} value={draft.radius} onChange={(e) => draft.set({ radius: +e.target.value })} className="w-full accent-[oklch(0.55_0.2_35)]" />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Header style">
                  <div className="inline-flex rounded-xl border border-border bg-card p-1">
                    {(["gradient", "solid", "glass"] as const).map((s) => (
                      <button key={s} onClick={() => draft.set({ headerStyle: s })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${draft.headerStyle === s ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Message size">
                  <div className="inline-flex rounded-xl border border-border bg-card p-1">
                    {([{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }] as const).map((s) => (
                      <button key={s.v} onClick={() => draft.set({ messageFontSize: s.v })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.messageFontSize === s.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Input style">
                  <div className="inline-flex rounded-xl border border-border bg-card p-1">
                    {([{ v: "rounded", l: "Rounded" }, { v: "pill", l: "Pill" }, { v: "minimal", l: "Minimal" }] as const).map((s) => (
                      <button key={s.v} onClick={() => draft.set({ inputStyle: s.v })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.inputStyle === s.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Bot bubble color">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                    <input type="color" value={draft.botBubbleColor} onChange={(e) => draft.set({ botBubbleColor: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
                    <input value={draft.botBubbleColor} onChange={(e) => draft.set({ botBubbleColor: e.target.value })} className="flex-1 bg-transparent text-sm focus:outline-none" />
                  </div>
                </Field>
              </div>
              <Field label="Bubble style">
                <div className="flex flex-wrap gap-2">
                  {bubbles.map((b) => (
                    <button key={b.id} onClick={() => draft.set({ bubble: b.id })}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${draft.bubble === b.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Text style">
                <div className="flex flex-wrap gap-2">
                  {[{ id: "default", label: "Default" }, { id: "bold", label: "Bold" }, { id: "italic", label: "Italic" }, { id: "romantic", label: "Romantic" }, { id: "playful", label: "Playful" }, { id: "elegant", label: "Elegant" }].map((s) => (
                    <button key={s.id} onClick={() => draft.set({ textStyle: s.id as any })}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${draft.textStyle === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Preview mode">
                <div className="inline-flex rounded-xl border border-border bg-card p-1">
                  {(["light", "dark"] as const).map((m) => (
                    <button key={m} onClick={() => draft.set({ preview: m })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${draft.preview === m ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                      {m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {m}
                    </button>
                  ))}
                </div>
              </Field>
              <details className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Advanced: Custom Header <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Header subtitle">
                      <input value={draft.headerSubtitle} onChange={(e) => draft.set({ headerSubtitle: e.target.value })} className="input" placeholder="Online" />
                    </Field>
                    <Field label="Bot text color">
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                        <input type="color" value={draft.botTextColor} onChange={(e) => draft.set({ botTextColor: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
                        <input value={draft.botTextColor} onChange={(e) => draft.set({ botTextColor: e.target.value })} className="flex-1 bg-transparent text-sm focus:outline-none" />
                      </div>
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={draft.showAvatar} onChange={(e) => draft.set({ showAvatar: e.target.checked })} className="rounded border-border" />
                    Show bot avatar in messages
                  </label>
                </div>
              </details>

              <details className="rounded-2xl border border-border/70 bg-muted/30 p-4" open>
                <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Widget Behaviour <span className="text-xs text-muted-foreground font-normal">(launcher, position, open mode)</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <Field label="Launcher style">
                    <div className="inline-flex rounded-xl border border-border bg-card p-1">
                      {([{ v: "icon", l: "Icon only", d: "Floating round icon" }, { v: "button", l: "Text button", d: "Button with label text" }] as const).map((s) => (
                        <button key={s.v} onClick={() => draft.set({ widgetLauncher: s.v })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${draft.widgetLauncher === s.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  {draft.widgetLauncher === "button" && (
                    <>
                      <Field label="Button text">
                        <input value={draft.widgetLauncherText} onChange={(e) => draft.set({ widgetLauncherText: e.target.value })} className="input" placeholder="Chat with us" />
                      </Field>
                      <Field label="Button style">
                        <div className="grid grid-cols-4 gap-2">
                          {(["rounded", "pill", "square", "soft"] as const).map((st) => (
                            <button key={st} onClick={() => draft.set({ widgetLauncherStyle: st })}
                              className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition ${draft.widgetLauncherStyle === st ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                              {st}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-4">
                        <div
                          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${draft.primary || "#7c3aed"}, ${draft.secondary || "#db2777"})`,
                            borderRadius:
                              draft.widgetLauncherStyle === "pill"
                                ? 999
                                : draft.widgetLauncherStyle === "square"
                                  ? 6
                                  : draft.widgetLauncherStyle === "soft"
                                    ? 18
                                    : 12,
                          }}
                        >
                          {draft.widgetLauncherText || "Chat with us"}
                        </div>
                      </div>
                    </>
                  )}
                  <Field label="Launcher position">
                    <div className="grid grid-cols-2 gap-2">
                      {(["bottom-right", "bottom-left", "top-right", "top-left"] as const).map((p) => (
                        <button key={p} onClick={() => draft.set({ widgetPosition: p })}
                          className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize transition ${draft.widgetPosition === p ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                          {p.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Open mode">
                    <div className="grid gap-2 md:grid-cols-2">
                      {([{ v: "overlay", l: "Popup window", d: "Floats over the page (like now)" }, { v: "sidebar", l: "Side panel", d: "Page shrinks, panel slides from the side" }, { v: "fullscreen", l: "Fullscreen", d: "Covers the whole screen" }, { v: "newtab", l: "New tab", d: "Opens the chat in a new tab" }] as const).map((s) => (
                        <button key={s.v} onClick={() => draft.set({ widgetOpenMode: s.v })}
                          className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${draft.widgetOpenMode === s.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                          <span className="block font-semibold">{s.l}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">{s.d}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={draft.widgetSmartPosition} onChange={(e) => draft.set({ widgetSmartPosition: e.target.checked })} className="rounded border-border" />
                    Smart opening direction (panel opens towards the free space automatically)
                  </label>
                  {draft.widgetOpenMode === "overlay" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={`Panel width — ${draft.widgetWidth}px`}>
                        <input type="range" min={280} max={700} value={draft.widgetWidth} onChange={(e) => draft.set({ widgetWidth: +e.target.value })} className="w-full accent-[oklch(0.55_0.2_35)]" />
                      </Field>
                      <Field label={`Panel height — ${draft.widgetHeight}px`}>
                        <input type="range" min={360} max={900} value={draft.widgetHeight} onChange={(e) => draft.set({ widgetHeight: +e.target.value })} className="w-full accent-[oklch(0.55_0.2_35)]" />
                      </Field>
                    </div>
                  )}
                  <Field label="Custom CSS (advanced)">
                    <textarea value={draft.widgetCustomCss} onChange={(e) => draft.set({ widgetCustomCss: e.target.value })}
                      className="input min-h-20 font-mono text-xs"
                      placeholder="/* e.g. move or resize the widget from your site */&#10;#rover-chatbot-frame { width: 480px; height: 640px; }&#10;#rover-chatbot-bubble { bottom: 80px; right: 40px; }" />
                    <p className="mt-1 text-[10px] text-muted-foreground">These styles are injected with the widget script — no extra CSS needed on your site.</p>
                  </Field>
                </div>
              </details>
            </div>
          )}

          {step === 4 && botType === "simple" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pick a template</h2>
              <p className="text-sm text-muted-foreground">Choose a visual style for your chatbot.</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((t) => {
                  const active = draft.template === t.name;
                  return (
                    <motion.button key={t.name} whileHover={{ y: -4 }} onClick={() => draft.set({ template: t.name })}
                      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-soft transition ${active ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40"}`}>
                      <div className={`mb-3 h-32 rounded-xl bg-gradient-to-br ${t.tone} shadow-inner relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-[85%] h-[85%] rounded-lg border shadow-sm flex flex-col overflow-hidden ${t.tag === "glassmorphism" ? "backdrop-blur-md bg-white/20 border-white/30" : t.tag === "minimal" ? "bg-white border-slate-200" : t.tag === "support" ? "bg-white/90 border-sky-200" : t.tag === "messenger" ? "bg-white border-emerald-200" : t.tag === "custom" ? "bg-muted/80 border-dashed border-border" : "bg-gray-950 border-fuchsia-500/30"}`} style={t.tag === "futuristic" ? { boxShadow: "0 0 20px rgba(217,70,239,0.3)" } : {}}>
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-bold ${t.tag === "glassmorphism" ? "text-white" : t.tag === "minimal" ? "text-slate-600" : t.tag === "support" ? "text-sky-700" : t.tag === "messenger" ? "text-emerald-700" : t.tag === "custom" ? "text-muted-foreground" : "text-fuchsia-300"}`}
                              style={t.tag !== "glassmorphism" && t.tag !== "futuristic" && t.tag !== "custom" ? {} : t.tag === "glassmorphism" ? { background: "rgba(255,255,255,0.15)" } : t.tag === "custom" ? {} : { borderBottom: "1px solid rgba(217,70,239,0.2)" }}>
                              <span className={`h-1.5 w-1.5 rounded-full ${t.tag === "glassmorphism" ? "bg-emerald-300" : t.tag === "minimal" ? "bg-green-500" : t.tag === "support" ? "bg-sky-400" : t.tag === "messenger" ? "bg-emerald-400" : t.tag === "custom" ? "bg-muted-foreground" : "bg-fuchsia-400"}`} />
                              Online
                            </div>
                            <div className="flex-1 px-2 py-1 space-y-1">
                              <div className={`h-2 w-3/5 rounded ${t.tag === "glassmorphism" ? "bg-white/40" : t.tag === "minimal" ? "bg-slate-200" : t.tag === "support" ? "bg-sky-100" : t.tag === "messenger" ? "bg-emerald-100" : t.tag === "custom" ? "bg-muted" : "bg-fuchsia-800/50"}`} />
                              <div className={`h-2 w-2/5 rounded ${t.tag === "glassmorphism" ? "bg-white/30" : t.tag === "minimal" ? "bg-slate-100" : t.tag === "support" ? "bg-sky-50" : t.tag === "messenger" ? "bg-emerald-50" : t.tag === "custom" ? "bg-muted/50" : "bg-fuchsia-800/30"}`} />
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 border-t" style={{ borderColor: t.tag === "futuristic" ? "rgba(217,70,239,0.2)" : undefined }}>
                              <div className={`flex-1 h-2 rounded ${t.tag === "glassmorphism" ? "bg-white/20" : t.tag === "minimal" ? "bg-slate-100" : t.tag === "support" ? "bg-sky-100" : t.tag === "messenger" ? "bg-emerald-100" : t.tag === "custom" ? "bg-muted" : "bg-fuchsia-900/50"}`} />
                              <div className={`h-3 w-3 rounded ${t.tag === "glassmorphism" ? "bg-white/30" : t.tag === "minimal" ? "bg-slate-300" : t.tag === "support" ? "bg-sky-400" : t.tag === "messenger" ? "bg-emerald-400" : t.tag === "custom" ? "bg-muted-foreground" : "bg-fuchsia-500"}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{t.name}</div>
                        {active && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-[10px] uppercase tracking-widest text-primary">{t.tag}</div>
                        {t.name === "Custom" && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setCustomDesignerOpen(true); }}
                            className="ml-auto grid h-6 w-6 place-items-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && botType === "agency" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pick a template</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((t) => {
                  const active = draft.template === t.name;
                  return (
                    <motion.button key={t.name} whileHover={{ y: -4 }} onClick={() => draft.set({ template: t.name })}
                      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-soft transition ${active ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40"}`}>
                      <div className={`mb-3 h-32 rounded-xl bg-gradient-to-br ${t.tone} shadow-inner relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-[85%] h-[85%] rounded-lg border shadow-sm flex flex-col overflow-hidden ${t.tag === "glassmorphism" ? "backdrop-blur-md bg-white/20 border-white/30" : t.tag === "minimal" ? "bg-white border-slate-200" : t.tag === "support" ? "bg-white/90 border-sky-200" : t.tag === "messenger" ? "bg-white border-emerald-200" : t.tag === "custom" ? "bg-muted/80 border-dashed border-border" : "bg-gray-950 border-fuchsia-500/30"}`} style={t.tag === "futuristic" ? { boxShadow: "0 0 20px rgba(217,70,239,0.3)" } : {}}>
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 text-[8px] font-bold ${t.tag === "glassmorphism" ? "text-white" : t.tag === "minimal" ? "text-slate-600" : t.tag === "support" ? "text-sky-700" : t.tag === "messenger" ? "text-emerald-700" : t.tag === "custom" ? "text-muted-foreground" : "text-fuchsia-300"}`}
                              style={t.tag !== "glassmorphism" && t.tag !== "futuristic" && t.tag !== "custom" ? {} : t.tag === "glassmorphism" ? { background: "rgba(255,255,255,0.15)" } : t.tag === "custom" ? {} : { borderBottom: "1px solid rgba(217,70,239,0.2)" }}>
                              <span className={`h-1.5 w-1.5 rounded-full ${t.tag === "glassmorphism" ? "bg-emerald-300" : t.tag === "minimal" ? "bg-green-500" : t.tag === "support" ? "bg-sky-400" : t.tag === "messenger" ? "bg-emerald-400" : t.tag === "custom" ? "bg-muted-foreground" : "bg-fuchsia-400"}`} />
                              Online
                            </div>
                            <div className="flex-1 px-2 py-1 space-y-1">
                              <div className={`h-2 w-3/5 rounded ${t.tag === "glassmorphism" ? "bg-white/40" : t.tag === "minimal" ? "bg-slate-200" : t.tag === "support" ? "bg-sky-100" : t.tag === "messenger" ? "bg-emerald-100" : t.tag === "custom" ? "bg-muted" : "bg-fuchsia-800/50"}`} />
                              <div className={`h-2 w-2/5 rounded ${t.tag === "glassmorphism" ? "bg-white/30" : t.tag === "minimal" ? "bg-slate-100" : t.tag === "support" ? "bg-sky-50" : t.tag === "messenger" ? "bg-emerald-50" : t.tag === "custom" ? "bg-muted/50" : "bg-fuchsia-800/30"}`} />
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 border-t" style={{ borderColor: t.tag === "futuristic" ? "rgba(217,70,239,0.2)" : undefined }}>
                              <div className={`flex-1 h-2 rounded ${t.tag === "glassmorphism" ? "bg-white/20" : t.tag === "minimal" ? "bg-slate-100" : t.tag === "support" ? "bg-sky-100" : t.tag === "messenger" ? "bg-emerald-100" : t.tag === "custom" ? "bg-muted" : "bg-fuchsia-900/50"}`} />
                              <div className={`h-3 w-3 rounded ${t.tag === "glassmorphism" ? "bg-white/30" : t.tag === "minimal" ? "bg-slate-300" : t.tag === "support" ? "bg-sky-400" : t.tag === "messenger" ? "bg-emerald-400" : t.tag === "custom" ? "bg-muted-foreground" : "bg-fuchsia-500"}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{t.name}</div>
                        {active && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-primary">{t.tag}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && botType === "agency" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Training Files</h2>
              <p className="text-sm text-muted-foreground">
                Upload different types of training files for your agency chatbot.
              </p>

              {/* -- Knowledge Base -------------------------------- */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  Knowledge Base Files
                </h3>
                <p className="text-xs text-muted-foreground mb-3">General information about your business, services, and FAQs.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3">
                    <span className="text-sm font-medium">Upload files</span>
                    <input type="file" accept=".txt,.md,.json,.pdf,.docx" multiple onChange={(e) => uploadFileType(e.target.files, 'knowledgeBase')} />
                    <span className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, JSON</span>
                  </label>
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
                    <input value={manualKBName} onChange={(e) => setManualKBName(e.target.value)} placeholder="File name" className="input" />
                    <textarea rows={3} value={manualKBContent} onChange={(e) => setManualKBContent(e.target.value)} placeholder="Paste content here" className="input min-h-[80px]" />
                    <button type="button" onClick={() => addManualFileType('knowledgeBase')} className="btn-primary w-full text-xs">Add</button>
                  </div>
                </div>
                {draft.knowledgeBase.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {draft.knowledgeBase.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
                        <span className="flex-1 truncate text-xs font-mono">{f.name}</span>
                        <button onClick={() => setSelectedFileForView(selectedFileForView?.name === f.name ? null : f)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-accent transition"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeFileType(idx, 'knowledgeBase')} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* -- Training Knowledge ---------------------------- */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  Training Knowledge Files
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Specific training data for the AI model behavior.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3">
                    <span className="text-sm font-medium">Upload files</span>
                    <input type="file" accept=".txt,.md,.json,.pdf,.docx" multiple onChange={(e) => uploadFileType(e.target.files, 'trainingKnowledge')} />
                    <span className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, JSON</span>
                  </label>
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
                    <input value={manualTKName} onChange={(e) => setManualTKName(e.target.value)} placeholder="File name" className="input" />
                    <textarea rows={3} value={manualTKContent} onChange={(e) => setManualTKContent(e.target.value)} placeholder="Paste content here" className="input min-h-[80px]" />
                    <button type="button" onClick={() => addManualFileType('trainingKnowledge')} className="btn-primary w-full text-xs">Add</button>
                  </div>
                </div>
                {draft.trainingKnowledge.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {draft.trainingKnowledge.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
                        <span className="flex-1 truncate text-xs font-mono">{f.name}</span>
                        <button onClick={() => setSelectedFileForView(selectedFileForView?.name === f.name ? null : f)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-accent transition"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeFileType(idx, 'trainingKnowledge')} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* -- Training Sheet -------------------------------- */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  Training Sheet Files
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Structured data, pricing, schedules, or spreadsheets.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3">
                    <span className="text-sm font-medium">Upload files</span>
                    <input type="file" accept=".txt,.md,.json,.pdf,.docx" multiple onChange={(e) => uploadFileType(e.target.files, 'trainingSheet')} />
                    <span className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, JSON</span>
                  </label>
                  <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
                    <input value={manualTSName} onChange={(e) => setManualTSName(e.target.value)} placeholder="File name" className="input" />
                    <textarea rows={3} value={manualTSContent} onChange={(e) => setManualTSContent(e.target.value)} placeholder="Paste content here" className="input min-h-[80px]" />
                    <button type="button" onClick={() => addManualFileType('trainingSheet')} className="btn-primary w-full text-xs">Add</button>
                  </div>
                </div>
                {draft.trainingSheet.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {draft.trainingSheet.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary/70" /> {f.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => setSelectedFileForView(selectedFileForView?.name === f.name ? null : f)}
                              className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-accent transition"><Eye className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => removeFileType(idx, 'trainingSheet')} className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        {selectedFileForView?.name === f.name && (
                          <div className="mt-3 rounded-xl border border-border/60 bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                            {f.content || <em className="text-muted-foreground/60">No text content</em>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {draft.trainingSheetServices.length > 0 && (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      File Categories
                    </h4>
                    <div className="space-y-2">
                      {draft.trainingSheetServices.map((svc, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground">{svc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* -- Upload Progress ------------------------------- */}
              {uploading && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {uploadStatus}</span>
                    <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              {!uploading && uploadStatus && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" /> {uploadStatus}
                </div>
              )}
            </div>
          )}

          {step === 6 && botType === "agency" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Review & Launch</h2>
              <p className="text-sm text-muted-foreground">
                Everything looks good! Hit <strong>Finish &amp; Save</strong> to create your chatbot.
              </p>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {draft.logo ? (
                    <img src={draft.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${draft.primary}, ${draft.secondary})` }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-base">{draft.name}</div>
                    <div className="text-xs text-muted-foreground">{draft.template}</div>
                  </div>
                  <span className="ml-auto text-[10px] rounded-full px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-semibold">Ready</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-lg border border-border/60 px-2.5 py-1 font-mono" style={{ color: draft.primary }}>? {draft.primary}</span>
                  <span className="rounded-lg border border-border/60 px-2.5 py-1 font-mono" style={{ color: draft.secondary }}>? {draft.secondary}</span>
                  <span className="rounded-lg border border-border/60 px-2.5 py-1">{draft.font}</span>
                  <span className="rounded-lg border border-border/60 px-2.5 py-1">radius {draft.radius}px</span>
                  <span className="rounded-lg border border-border/60 px-2.5 py-1">{draft.bubble} bubble</span>
                </div>
              </div>
            </div>
          )}

          {step === 7 && botType === "agency" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Product Catalog Database</h2>
              <p className="text-sm text-muted-foreground">Connect an external database containing your products or services to sell directly via chatbot.</p>

              {/* Order System Toggle Question */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Do you want to implement an Order System?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable direct selling of products or orders directly inside your chatbot conversations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => draft.set({ orderSystemEnabled: true })}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                      draft.orderSystemEnabled
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-primary/40 bg-card text-muted-foreground"
                    }`}
                  >
                    <Check className={`h-4 w-4 ${draft.orderSystemEnabled ? "opacity-100" : "opacity-0"}`} />
                    Yes, enable Order System
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      draft.set({ orderSystemEnabled: false, productConnected: false });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                      !draft.orderSystemEnabled
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-border/60 hover:border-primary/40 bg-card text-muted-foreground"
                    }`}
                  >
                    <Check className={`h-4 w-4 ${!draft.orderSystemEnabled ? "opacity-100" : "opacity-0"}`} />
                    No, skip Order System
                  </button>
                </div>

                {/* If Yes: Product Type Selection */}
                {draft.orderSystemEnabled && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-3 border-t space-y-4">
                    <div>
                      <label className="text-sm font-semibold block mb-1">What type of products do you want to sell?</label>
                      <p className="text-xs text-muted-foreground mb-3">Select product category or enter custom product type.</p>
                      
                      <div className="grid gap-2 md:grid-cols-2">
                        {[
                          { label: "E-Commerce Physical Products", desc: "Mobile phones, clothes, electronics, hardware" },
                          { label: "Digital Software & Licenses", desc: "E-books, software, digital downloads" },
                          { label: "Services & Consultations", desc: "Appointments, medical, legal, home services" },
                          { label: "Food & Restaurant Menu", desc: "Meals, fast food, groceries, beverages" },
                        ].map((pt) => (
                          <button
                            key={pt.label}
                            type="button"
                            onClick={() => draft.set({ productType: pt.label })}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              draft.productType === pt.label
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                                : "border-border/60 hover:border-primary/30 bg-card"
                            }`}
                          >
                            <div className="text-xs font-semibold">{pt.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{pt.desc}</div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Or enter custom product type:</label>
                        <input
                          value={draft.productType}
                          onChange={(e) => draft.set({ productType: e.target.value })}
                          placeholder="e.g. Mobile Phones & Electronics"
                          className="input"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Agency Order Notification Emails */}
              {draft.orderSystemEnabled && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-soft">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Agency Order Notification Emails</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Choose up to 2 additional emails to receive order notifications.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Agency Email 1 (Optional)">
                      <input type="email" value={draft.agencyEmail1 || ""} onChange={(e) => draft.set({ agencyEmail1: e.target.value })} className="input" placeholder="agency1@example.com" />
                    </Field>
                    <Field label="Agency Email 2 (Optional)">
                      <input type="email" value={draft.agencyEmail2 || ""} onChange={(e) => draft.set({ agencyEmail2: e.target.value })} className="input" placeholder="agency2@example.com" />
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Order emails will be received on these emails in any order. You can add any other email
                    of your choice — except the email used to create this account, which already receives orders.
                  </p>
                </div>
              )}

              {/* Product Catalog DB Connection */}
              {draft.orderSystemEnabled && (
                <div className="space-y-4 pt-3 border-t">
                  <label className="block text-sm font-medium">Select database type to connect product collection</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { id: "mysql" as const, label: "MySQL", icon: "??", desc: "Relational database" },
                      { id: "mongodb" as const, label: "MongoDB", icon: "??", desc: "NoSQL document store" },
                      { id: "postgresql" as const, label: "PostgreSQL", icon: "??", desc: "Advanced relational" },
                    ].map((db) => (
                      <button
                        key={db.id}
                        type="button"
                        onClick={() => {
                          draft.set({ productDbType: draft.productDbType === db.id ? "" : db.id });
                        }}
                        className={`relative rounded-2xl border p-4 text-left transition-all ${
                          draft.productDbType === db.id
                            ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                            : "border-border/60 hover:border-primary/40 bg-card"
                        }`}
                      >
                        <div className="text-2xl mb-2">{db.icon}</div>
                        <div className="text-sm font-semibold">{db.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{db.desc}</div>
                      </button>
                    ))}
                  </div>

                  {draft.productDbType && (
                    <div className="rounded-2xl border border-border/75 bg-muted/20 p-4 space-y-4">
                      <div className="text-xs font-mono text-muted-foreground">Product catalog collection connection configuration:</div>
                      
                      {draft.productDbType === "mongodb" ? (
                        <div className="space-y-4">
                          <CollectionField label="Connection String URI">
                            <input value={draft.productUri} onChange={(e) => draft.set({ productUri: e.target.value })} className="input" placeholder="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net" />
                          </CollectionField>
                          <CollectionField label="Database Name">
                            <input value={draft.productDb} onChange={(e) => draft.set({ productDb: e.target.value })} className="input" placeholder="my_database" />
                          </CollectionField>
                          <CollectionField label="Collection Name">
                            <input value={draft.productTable} onChange={(e) => draft.set({ productTable: e.target.value })} className="input" placeholder="products" />
                          </CollectionField>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <CollectionField label="Host">
                              <input value={draft.productHost} onChange={(e) => draft.set({ productHost: e.target.value })} className="input" placeholder="localhost" />
                            </CollectionField>
                            <CollectionField label="Port">
                              <input type="number" value={draft.productPort} onChange={(e) => draft.set({ productPort: Number(e.target.value) })} className="input" placeholder={draft.productDbType === "mysql" ? "3306" : "5432"} />
                            </CollectionField>
                            <CollectionField label="Database Name">
                              <input value={draft.productDb} onChange={(e) => draft.set({ productDb: e.target.value })} className="input" placeholder="my_database" />
                            </CollectionField>
                            <CollectionField label="Table Name">
                              <input value={draft.productTable} onChange={(e) => draft.set({ productTable: e.target.value })} className="input" placeholder="products" />
                            </CollectionField>
                            <CollectionField label="Username">
                              <input value={draft.productUsername} onChange={(e) => draft.set({ productUsername: e.target.value })} className="input" />
                            </CollectionField>
                            <CollectionField label="Password">
                              <input type="password" value={draft.productPassword} onChange={(e) => draft.set({ productPassword: e.target.value })} className="input" placeholder="••••••••" />
                            </CollectionField>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={draft.productSsl} onChange={(e) => draft.set({ productSsl: e.target.checked })} className="rounded border-border" />
                            Use SSL
                          </label>
                        </div>
                      )}

                      {/* Mapping Fields */}
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Product Catalog Fields Mapping
                        </div>
                        <p className="text-[11px] text-muted-foreground">Map columns/keys from your product database.</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <CollectionField label="Title / Name Field">
                            <input
                              value={draft.productMapping?.titleField || "name"}
                              onChange={(e) => draft.set({ productMapping: { ...draft.productMapping, titleField: e.target.value } })}
                              className="input text-xs h-8"
                              placeholder="name"
                            />
                          </CollectionField>
                          <CollectionField label="Price Field">
                            <input
                              value={draft.productMapping?.priceField || "price"}
                              onChange={(e) => draft.set({ productMapping: { ...draft.productMapping, priceField: e.target.value } })}
                              className="input text-xs h-8"
                              placeholder="price"
                            />
                          </CollectionField>
                          <CollectionField label="Category Field">
                            <input
                              value={draft.productMapping?.categoryField || "category"}
                              onChange={(e) => draft.set({ productMapping: { ...draft.productMapping, categoryField: e.target.value } })}
                              className="input text-xs h-8"
                              placeholder="category"
                            />
                          </CollectionField>
                          <CollectionField label="Image URL Field">
                            <input
                              value={draft.productMapping?.imageField || "image"}
                              onChange={(e) => draft.set({ productMapping: { ...draft.productMapping, imageField: e.target.value } })}
                              className="input text-xs h-8"
                              placeholder="image"
                            />
                          </CollectionField>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={async () => {
                            const body: any = {
                              type: draft.productDbType,
                              isProductCollection: true,
                              productMapping: draft.productMapping,
                            };

                            if (draft.productDbType === "mongodb") {
                              if (!draft.productUri || !draft.productDb || !draft.productTable) {
                                toast.error('Please fill Connection URI, Database Name, and Collection Name');
                                return;
                              }
                              body.uri = draft.productUri;
                              body.database = draft.productDb;
                              body.collection = draft.productTable;
                            } else {
                              if (!draft.productDb || !draft.productHost || !draft.productUsername || !draft.productPassword || !draft.productTable) {
                                toast.error('Please fill all database connection fields first');
                                return;
                              }
                              body.host = draft.productHost;
                              body.port = draft.productPort || (draft.productDbType === "mysql" ? 3306 : 5432);
                              body.database = draft.productDb;
                              body.user = draft.productUsername;
                              body.password = draft.productPassword;
                              body.table = draft.productTable;
                              body.ssl = draft.productSsl;
                            }

                            const toastId = toast.loading('Testing connection...');
                            try {
                              const res = await fetch('/api/chatbot/test-collection', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(body),
                              });
                              const data = await res.json();
                              if (data.connected) {
                                draft.set({ productConnected: true });
                                const msg = data.productCount !== undefined
                                  ? `Connected! Found ${data.productCount} product(s) in collection.`
                                  : 'Connection successful!';
                                toast.success(msg, { id: toastId });
                              } else {
                                draft.set({ productConnected: false });
                                toast.error(data.message || 'Connection failed', { id: toastId });
                              }
                            } catch (err: any) {
                              draft.set({ productConnected: false });
                              toast.error(err.message || 'Connection test failed', { id: toastId });
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                        >
                          <Database className="h-3.5 w-3.5" /> Test Catalog Connection
                        </button>
                        {draft.productConnected && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                            <Check className="h-3.5 w-3.5" /> Catalog Connected
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 8 && botType === "agency" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Orders & Chat Storage Database</h2>
              <p className="text-sm text-muted-foreground">Connect an external database to store chat logs, orders, and agent details.</p>

              {/* Database Type Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium">Select database type</label>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { id: "mysql" as const, label: "MySQL", icon: "??", desc: "Relational database" },
                    { id: "mongodb" as const, label: "MongoDB", icon: "??", desc: "NoSQL document store" },
                    { id: "postgresql" as const, label: "PostgreSQL", icon: "??", desc: "Advanced relational" },
                  ].map((db) => (
                    <button
                      key={db.id}
                      type="button"
                      onClick={() => {
                        draft.set({ databaseType: draft.databaseType === db.id ? "" : db.id });
                        if (draft.databaseType !== db.id) draft.set({ databaseMode: "collection" });
                      }}
                      className={`relative rounded-2xl border p-4 text-left transition-all ${
                        draft.databaseType === db.id
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : "border-border/60 hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="text-2xl mb-2">{db.icon}</div>
                      <div className="text-sm font-semibold">{db.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{db.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Database Mode — collection only */}
              {draft.databaseType && (
                <div>
                  <label className="mb-3 block text-sm font-medium">Database mode</label>
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Collection include only</div>
                        <div className="text-xs text-muted-foreground">Connect to an existing collection / table</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Collection Configuration */}
              {draft.databaseType && draft.databaseMode && (
                <details className="rounded-2xl border border-border/70 bg-muted/30 p-4" open>
                  <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    {draft.databaseType === "mysql" ? "MySQL" : draft.databaseType === "mongodb" ? "MongoDB" : "PostgreSQL"} Collection
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* MongoDB — connection string URI */}
                    {draft.databaseType === "mongodb" ? (
                      <div className="space-y-4">
                        <CollectionField label="Connection String URI">
                          <input value={draft.collectionUri} onChange={(e) => draft.set({ collectionUri: e.target.value })} className="input" placeholder="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net" />
                        </CollectionField>
                        <CollectionField label="Database Name">
                          <input value={draft.collectionDb} onChange={(e) => draft.set({ collectionDb: e.target.value })} className="input" placeholder="my_database" />
                        </CollectionField>
                        <CollectionField label="Collection Name">
                          <input value={draft.collectionTable} onChange={(e) => draft.set({ collectionTable: e.target.value })} className="input" placeholder="orders" />
                        </CollectionField>
                      </div>
                    ) : (
                      /* MySQL / PostgreSQL — host/port/user/pass fields */
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <CollectionField label="Host">
                            <input value={draft.collectionHost} onChange={(e) => draft.set({ collectionHost: e.target.value })} className="input" placeholder="localhost" />
                          </CollectionField>
                          <CollectionField label="Port">
                            <input type="number" value={draft.collectionPort} onChange={(e) => draft.set({ collectionPort: Number(e.target.value) })} className="input" placeholder={draft.databaseType === "mysql" ? "3306" : "5432"} />
                          </CollectionField>
                          <CollectionField label="Database Name">
                            <input value={draft.collectionDb} onChange={(e) => draft.set({ collectionDb: e.target.value })} className="input" placeholder="my_database" />
                          </CollectionField>
                          <CollectionField label="Table Name">
                            <input value={draft.collectionTable} onChange={(e) => draft.set({ collectionTable: e.target.value })} className="input" placeholder="orders" />
                          </CollectionField>
                          <CollectionField label="Username">
                            <input value={draft.collectionUsername} onChange={(e) => draft.set({ collectionUsername: e.target.value })} className="input" />
                          </CollectionField>
                          <CollectionField label="Password">
                            <input type="password" value={draft.collectionPassword} onChange={(e) => draft.set({ collectionPassword: e.target.value })} className="input" placeholder="••••••••" />
                          </CollectionField>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={draft.collectionSsl} onChange={(e) => draft.set({ collectionSsl: e.target.checked })} className="rounded border-border" />
                          Use SSL
                        </label>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={async () => {
                          const body: any = {
                            type: draft.databaseType,
                            isProductCollection: false,
                          };

                          if (draft.databaseType === "mongodb") {
                            if (!draft.collectionUri || !draft.collectionDb || !draft.collectionTable) {
                              toast.error('Please fill Connection URI, Database Name, and Collection Name');
                              return;
                            }
                            body.uri = draft.collectionUri;
                            body.database = draft.collectionDb;
                            body.collection = draft.collectionTable;
                          } else {
                            if (!draft.collectionDb || !draft.collectionHost || !draft.collectionUsername || !draft.collectionPassword || !draft.collectionTable) {
                              toast.error('Please fill all collection fields first');
                              return;
                            }
                            body.host = draft.collectionHost;
                            body.port = draft.collectionPort || (draft.databaseType === "mysql" ? 3306 : 5432);
                            body.database = draft.collectionDb;
                            body.user = draft.collectionUsername;
                            body.password = draft.collectionPassword;
                            body.table = draft.collectionTable;
                            body.ssl = draft.collectionSsl;
                          }

                          const toastId = toast.loading('Testing connection...');
                          try {
                            const res = await fetch('/api/chatbot/test-collection', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(body),
                            });
                            const data = await res.json();
                            if (data.connected) {
                              draft.set({ collectionConnected: true });
                              toast.success('Connection successful!', { id: toastId });
                            } else {
                              draft.set({ collectionConnected: false });
                              toast.error(data.message || 'Connection failed', { id: toastId });
                            }
                          } catch (err: any) {
                            draft.set({ collectionConnected: false });
                            toast.error(err.message || 'Connection test failed', { id: toastId });
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft hover:brightness-110"
                      >
                        <Database className="h-3.5 w-3.5" /> Test Connection
                      </button>
                      {draft.collectionConnected && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                          <Check className="h-3.5 w-3.5" /> Connected
                        </span>
                      )}
                    </div>

                    {draft.collectionConnected && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">What to store in this collection</label>
                        <div className="grid gap-2">
                          {[
                            { id: "user_chat" as const, label: "User Chat", desc: "Store user chat conversations and messages" },
                            { id: "all_orders" as const, label: "All Orders", desc: "Store all booking orders and inquiries" },
                            { id: "agent_contact" as const, label: "Real-time Agent Contact", desc: "Store agent contact requests and real-time chats" },
                          ].map((opt) => {
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => draft.set({ collectionStoreType: opt.id })}
                                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                                  draft.collectionStoreType === opt.id
                                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                                    : "border-border/60 hover:border-primary/40 bg-card"
                                }`}
                              >
                                <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
                                  draft.collectionStoreType === opt.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}>
                                  {draft.collectionStoreType === opt.id && <Check className="h-3 w-3" />}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium flex items-center justify-between">
                                    <span>{opt.label}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}

          {step === 5 && botType === "simple" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Training Documents</h2>
              <p className="text-sm text-muted-foreground">Upload files or paste content to train your chatbot.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4">
                  <span className="text-sm font-medium">Upload knowledge files</span>
                  <input type="file" accept=".txt,.md,.json,.pdf,.docx" multiple onChange={(e) => addKnowledgeFiles(e.target.files)} />
                  <span className="text-xs text-muted-foreground">Upload one or more files (PDF, DOCX, TXT, MD, JSON).</span>
                </label>
                <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                  <input value={manualKnowledgeName} onChange={(e) => setManualKnowledgeName(e.target.value)} placeholder="File / topic name" className="input" />
                  <textarea rows={4} value={manualKnowledgeContent} onChange={(e) => setManualKnowledgeContent(e.target.value)} placeholder="Paste text content here" className="input min-h-[120px]" />
                  <button type="button" onClick={addManualKnowledge} className="btn-primary w-full">Add content file</button>
                </div>
              </div>
              {/* Progress bar */}
              {uploading && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {uploadStatus}</span>
                    <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {!uploading && uploadStatus && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" /> {uploadStatus}
                </div>
              )}

              {draft.knowledgeFiles.length > 0 && (
                <details className="rounded-2xl border border-border/70 bg-muted/40 p-4" open>
                  <summary className="cursor-pointer text-sm font-semibold">Saved files ({draft.knowledgeFiles.length})</summary>
                  <div className="mt-3 space-y-3">
                    {draft.knowledgeFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary/70" /> {file.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => setSelectedFileForView(selectedFileForView?.name === file.name ? null : file)}
                              className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-accent transition" title="View extracted text">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => removeKnowledgeFile(index)} className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        {selectedFileForView?.name === file.name && (
                          <div className="mt-3 rounded-xl border border-border/60 bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                            {file.content || <em className="text-muted-foreground/60">No text content</em>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* -- Knowledge behaviour settings -- */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">i</div>
                  <div>
                    <p className="text-sm font-medium">How should your chatbot respond?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Train your chatbot with custom knowledge files or let it answer general questions on its own.</p>
                  </div>
                </div>
                {draft.knowledgeFiles.length > 0 ? (
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                    <span className="text-sm font-medium">Only read from knowledge files</span>
                    <div className="flex gap-1">
                      <button onClick={() => draft.set({ onlyKnowledge: true })}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${draft.onlyKnowledge ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>Yes</button>
                      <button onClick={() => draft.set({ onlyKnowledge: false })}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${!draft.onlyKnowledge ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>No</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
                    <span className="text-sm font-medium">Answer any question</span>
                    <div className="flex gap-1">
                      <button onClick={() => draft.set({ answerAnyQuestion: true })}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${draft.answerAnyQuestion ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>Yes</button>
                      <button onClick={() => draft.set({ answerAnyQuestion: false })}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold border transition ${!draft.answerAnyQuestion ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>No</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button onClick={prev} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-accent">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < maxStep || step <= 1 ? (
              <GradientButton onClick={next}>Next <ChevronRight className="h-4 w-4" /></GradientButton>
            ) : (
              <GradientButton onClick={finish} disabled={saving}>
                {saving ? "Saving…" : <><Check className="h-4 w-4" /> Finish & Save</>}
              </GradientButton>
            )}
          </div>
        </motion.div>

        {previewOpen && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/60 bg-gradient-soft p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold">
                <span>Live preview</span>
                <button onClick={() => setPreviewOpen(false)}
                  className="grid h-6 w-6 place-items-center rounded-lg border border-border/60 bg-card text-xs hover:bg-accent transition">
                  ?
                </button>
              </div>
              <LiveBotPreview
                name={draft.name}
                welcome={draft.welcome}
                primary={draft.primary}
                secondary={draft.secondary}
                radius={draft.radius}
                bubble={draft.bubble}
                logo={draft.logo}
                preview={draft.preview}
                template={draft.template}
                extractedServices={draft.extractedServices}
                trainingSheetServices={draft.trainingSheetServices}
                headerStyle={draft.headerStyle}
                botBubbleColor={draft.botBubbleColor}
                botTextColor={draft.botTextColor}
                showAvatar={draft.showAvatar}
                messageFontSize={draft.messageFontSize}
                inputStyle={draft.inputStyle}
                headerSubtitle={draft.headerSubtitle}
                textStyle={draft.textStyle}
                widgetLauncher={draft.widgetLauncher}
                widgetLauncherText={draft.widgetLauncherText}
                widgetLauncherStyle={draft.widgetLauncherStyle}
                widgetPosition={draft.widgetPosition}
                widgetOpenMode={draft.widgetOpenMode}
                widgetWidth={draft.widgetWidth}
                widgetHeight={draft.widgetHeight}
              />
            </div>
          </div>
        )}
      </div>

      {/* -- Custom Design Visual Drag-Drop Modal -- */}
      <Dialog open={customDesignerOpen} onOpenChange={setCustomDesignerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Chatbot Designer</DialogTitle>
            <DialogDescription>Drag style blocks onto the preview to design your chatbot visually.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[1fr_16rem] mt-4">
            {/* Left: Large interactive preview with overlay drop zones */}
            <div className="relative">
              <div className="rounded-2xl border border-border/60 bg-gradient-soft p-4 shadow-soft">
                <div className="relative">
                  <LiveBotPreview
                    name={draft.name}
                    welcome={draft.welcome}
                    primary={draft.primary}
                    secondary={draft.secondary}
                    radius={draft.radius}
                    bubble={draft.bubble}
                    logo={draft.logo}
                    preview={draft.preview}
                    template={draft.template}
                    extractedServices={draft.extractedServices}
                    trainingSheetServices={draft.trainingSheetServices}
                    headerStyle={draft.headerStyle}
                    botBubbleColor={draft.botBubbleColor}
                    botTextColor={draft.botTextColor}
                    showAvatar={draft.showAvatar}
                    messageFontSize={draft.messageFontSize}
                    inputStyle={draft.inputStyle}
                    headerSubtitle={draft.headerSubtitle}
                    textStyle={draft.textStyle}
                    widgetLauncher={draft.widgetLauncher}
                    widgetLauncherText={draft.widgetLauncherText}
                    widgetLauncherStyle={draft.widgetLauncherStyle}
                    widgetPosition={draft.widgetPosition}
                    widgetOpenMode={draft.widgetOpenMode}
                    widgetWidth={draft.widgetWidth}
                    widgetHeight={draft.widgetHeight}
                  />
                  {/* Drag-drop overlay zones */}
                  <div className="absolute inset-0 pointer-events-none">
                    {(["header","messages","input"] as const).map((zone) => {
                      const pos = zone === "header" ? "top-[10%] left-[8%] right-[8%] h-[14%]" :
                                  zone === "messages" ? "top-[32%] left-[8%] right-[8%] bottom-[28%]" :
                                  "bottom-[8%] left-[8%] right-[8%] h-[14%]";
                      const label = zone === "header" ? "Header" : zone === "messages" ? "Messages" : "Input";
                      const active = dragOverZone === zone;
                      return (
                        <div key={zone}
                          className={`pointer-events-auto absolute ${pos} rounded-xl border-2 border-dashed transition-all ${active ? "border-primary bg-primary/10 scale-[1.02]" : "border-transparent hover:border-primary/40 hover:bg-primary/5"}`}
                          onClick={() => document.getElementById(`${zone}-section`)?.scrollIntoView({ behavior: 'smooth' })}
                          onDragOver={(e) => { e.preventDefault(); setDragOverZone(zone); }}
                          onDragLeave={(e) => { 
                            if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDragOverZone(null); 
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverZone(null);
                            try {
                              const raw = e.dataTransfer.getData('application/x-design');
                              if (raw) {
                                const { prop, value } = JSON.parse(raw);
                                draft.set({ [prop]: value } as any);
                                toast.success(`${prop} updated!`, { duration: 1500 });
                              }
                            } catch {}
                          }}>
                          <span className={`absolute -top-2 left-2 text-[9px] font-bold transition bg-background px-1.5 py-0.5 rounded ${active ? "text-primary" : "text-primary opacity-0 group-hover:opacity-100"}`}>
                            ? {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Drag hint */}
              <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                <span>? Drag any style block onto the preview</span>
              </div>
            </div>

            {/* Right: Compact draggable palette panels */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              <div id="header-section" className="rounded-xl border border-border/60 bg-card p-3 shadow-soft scroll-mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">? Header Style</div>
                <div className="flex gap-1 mb-2">
                  {(["gradient", "solid", "glass"] as const).map((s) => (
                    <DraggableChip key={s} prop="headerStyle" value={s} onClick={() => draft.set({ headerStyle: s })}
                      active={draft.headerStyle === s} label={s} />
                  ))}
                </div>
                <input value={draft.headerSubtitle} onChange={(e) => draft.set({ headerSubtitle: e.target.value })} className="input text-xs h-8" placeholder="Subtitle" />
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 shadow-soft">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">?? Colors</div>
                <div className="grid grid-cols-2 gap-2">
                  {([["primary","Primary"],["secondary","Secondary"],["botBubbleColor","Bot Bubble"],["botTextColor","Bot Text"]] as const).map(([prop, label]) => (
                    <div key={prop}>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                      <input type="color" value={String((draft as any)[prop] ?? "#D94A2D")} onChange={(e) => draft.set({ [prop]: e.target.value } as any)}
                        className="h-7 w-full cursor-pointer rounded border-0" />
                    </div>
                  ))}
                </div>
              </div>
              <div id="messages-section" className="rounded-xl border border-border/60 bg-card p-3 shadow-soft scroll-mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">?? Messages</div>
                <div className="space-y-2">
                  <div><span className="text-[10px] text-muted-foreground">Bubbles</span>
                    <div className="flex gap-1 mt-0.5">
                      {bubbles.map((b) => (
                        <DraggableChip key={b.id} prop="bubble" value={b.id} onClick={() => draft.set({ bubble: b.id })}
                          active={draft.bubble === b.id} label={b.label} />
                      ))}
                    </div>
                  </div>
                  <div><span className="text-[10px] text-muted-foreground">Text Style</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {[{ id: "default", l: "A" }, { id: "bold", l: "B" }, { id: "italic", l: "I" }, { id: "romantic", l: "R" }, { id: "playful", l: "P" }, { id: "elegant", l: "E" }].map((s) => (
                        <DraggableChip key={s.id} prop="textStyle" value={s.id} onClick={() => draft.set({ textStyle: s.id as any })}
                          active={draft.textStyle === s.id} label={s.l} compact />
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                    <input type="checkbox" checked={draft.showAvatar} onChange={(e) => draft.set({ showAvatar: e.target.checked })} className="rounded border-border" />
                    Show avatar
                  </label>
                </div>
              </div>
              <div id="input-section" className="rounded-xl border border-border/60 bg-card p-3 shadow-soft scroll-mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">? Input</div>
                <div className="flex gap-1">
                  {([{ v: "rounded", l: "Round" }, { v: "pill", l: "Pill" }, { v: "minimal", l: "Line" }] as const).map((s) => (
                    <DraggableChip key={s.v} prop="inputStyle" value={s.v} onClick={() => draft.set({ inputStyle: s.v })}
                      active={draft.inputStyle === s.v} label={s.l} />
                  ))}
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-muted-foreground">Size</span>
                  <div className="flex gap-1 mt-0.5">
                    {([{ v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }] as const).map((s) => (
                      <DraggableChip key={s.v} prop="messageFontSize" value={s.v} onClick={() => draft.set({ messageFontSize: s.v })}
                        active={draft.messageFontSize === s.v} label={s.l} compact />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 shadow-soft">
                <div className="flex items-center gap-2 text-xs font-semibold mb-2">? Radius</div>
                <input type="range" min={0} max={32} value={draft.radius} onChange={(e) => draft.set({ radius: +e.target.value })}
                  className="w-full accent-[oklch(0.55_0.2_35)]" />
                <div className="text-[10px] text-muted-foreground text-right">{draft.radius}px</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={() => setCustomDesignerOpen(false)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition">Close</button>
            <button onClick={() => { toast.success("Custom design applied!"); setCustomDesignerOpen(false); }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:brightness-110 transition">
              <Save className="h-4 w-4" /> Save Design
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* -- View File Content Dialog -- */}
      <Dialog open={!!selectedFileForView} onOpenChange={(open) => !open && setSelectedFileForView(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFileForView?.name}</DialogTitle>
          </DialogHeader>
          {selectedFileForView?.content ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedFileForView.content}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">No content available — file was uploaded without extracted text.</p>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function DraggableChip({ prop, value, onClick, active, label, compact }: { prop: string; value: string; onClick: () => void; active: boolean; label: string; compact?: boolean }) {
  return (
    <div draggable
      onDragStart={(e) => e.dataTransfer.setData('application/x-design', JSON.stringify({ prop, value }))}
      className={`${compact ? "" : "flex-1"} cursor-grab active:cursor-grabbing`}>
      <button onClick={onClick}
        className={`w-full rounded-lg py-1 text-[10px] font-medium border transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"} ${compact ? "h-7 w-7 grid place-items-center" : ""}`}>
        {label}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span>
      {children}
      <style>{`.input{height:2.5rem;width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-card);padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 30%, transparent)}`}</style>
    </label>
  );
}

function CollectionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
