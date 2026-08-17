import { getAuthHeaders } from "@/lib/auth";

export interface StripeConnectStatus {
  configured: boolean;
  publishableKey: string | null;
  connectClientId: string | null;
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
}

async function stripeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/stripe${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() as Record<string, string>),
      ...((options.headers || {}) as Record<string, string>),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Stripe request failed");
  }

  return data as T;
}

export function fetchStripeConnectStatus() {
  return stripeRequest<StripeConnectStatus>("/connect/status");
}

export function startStripeConnectOnboarding() {
  return stripeRequest<{ url: string; accountId: string }>("/connect/onboard", {
    method: "POST",
  });
}

export function refreshStripeConnectOnboarding() {
  return stripeRequest<{ url: string }>("/connect/refresh", {
    method: "POST",
  });
}

export function disconnectStripeAccount() {
  return stripeRequest<{ message: string }>("/connect/disconnect", {
    method: "POST",
  });
}
