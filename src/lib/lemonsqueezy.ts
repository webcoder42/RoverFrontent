import { getAuthHeaders } from "@/lib/auth";

export interface LemonSqueezyConfig {
  configured: boolean;
  storeId: string | null;
  variantId: string | null;
  currency: string;
  taxRate: number;
  mode: string;
}

export interface LemonSqueezyCheckoutDraft {
  checkoutId: string;
  checkoutUrl: string;
  type: string;
  description: string;
}

export interface CreateLemonSqueezyCheckoutPayload {
  type: "plan" | "custom";
  planId?: string;
  amount?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

async function lemonsqueezyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/lemonsqueezy${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() as Record<string, string>),
      ...((options.headers || {}) as Record<string, string>),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Lemon Squeezy request failed");
  }

  return data as T;
}

export async function fetchLemonSqueezyConfig(): Promise<LemonSqueezyConfig> {
  return lemonsqueezyRequest<LemonSqueezyConfig>("/config");
}

export async function createLemonSqueezyCheckout(
  payload: CreateLemonSqueezyCheckoutPayload,
): Promise<LemonSqueezyCheckoutDraft> {
  return lemonsqueezyRequest<LemonSqueezyCheckoutDraft>("/create-checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
