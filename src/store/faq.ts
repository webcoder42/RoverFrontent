import { create } from "zustand";

export interface Faq {
  id: string;
  chatbotId: string;
  question: string;
  answer: string;
}

interface State {
  faqs: Faq[];
  setFaqs: (faqs: Faq[]) => void;
  addFaq: (faq: Faq) => void;
  updateFaq: (id: string, patch: Partial<Faq>) => void;
  removeFaq: (id: string) => void;
}

export const useFaqStore = create<State>((set) => ({
  faqs: [],
  setFaqs: (faqs) => set({ faqs }),
  addFaq: (faq) => set((s) => ({ faqs: [faq, ...s.faqs] })),
  updateFaq: (id, patch) => set((s) => ({ faqs: s.faqs.map((faq) => (faq.id === id ? { ...faq, ...patch } : faq)) })),
  removeFaq: (id) => set((s) => ({ faqs: s.faqs.filter((faq) => faq.id !== id) })),
}));
