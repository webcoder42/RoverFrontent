import { getAuthHeaders } from "@/lib/auth";

export interface PayPalConfig {
  configured: boolean;
  clientId: string | null;
  mode: string;
  currency: string;
  taxRate: number;
}

export interface PayPalOrderDraft {
  id: string;
  status: string;
  approveUrl: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  description: string;
}

export interface PayPalCaptureResult {
  status: string;
  orderId: string;
  captureId: string | null;
  activated: boolean;
  order?: Record<string, unknown>;
}

export interface CreatePayPalOrderPayload {
  type: "plan" | "custom";
  planId?: string;
  amount?: number;
  currency?: string;
  description?: string;
  taxRate?: number;
  metadata?: Record<string, unknown>;
}

async function paypalRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api/paypal${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() as Record<string, string>),
      ...((options.headers || {}) as Record<string, string>),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "PayPal request failed");
  }

  return data as T;
}

export async function fetchPayPalConfig(): Promise<PayPalConfig> {
  return paypalRequest<PayPalConfig>("/config");
}

export async function createPayPalOrder(
  payload: CreatePayPalOrderPayload,
): Promise<PayPalOrderDraft> {
  return paypalRequest<PayPalOrderDraft>("/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function capturePayPalOrder(
  orderId: string,
): Promise<PayPalCaptureResult> {
  return paypalRequest<PayPalCaptureResult>("/capture-order", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export function computeTax(subtotal: number, taxRate: number): number {
  if (!taxRate || taxRate <= 0 || !subtotal || subtotal <= 0) return 0;
  return Math.round(subtotal * taxRate * 100) / 10000;
}

export function computeTotal(subtotal: number, taxRate: number): number {
  return Math.round((subtotal + computeTax(subtotal, taxRate)) * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  locales = "en-US",
): string {
  return new Intl.NumberFormat(locales, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
