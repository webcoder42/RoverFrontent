import { initializePaddle, type Paddle } from "@paddle/paddle-js";

export type BillingInterval = "month" | "year";
export type PaddleEnvironment = "live" | "sandbox";

export interface Tier {
  name: "Starter" | "Pro" | "Advanced";
  description: string;
  features: string[];
  priceId: { month: string; year: string };
}

const paddleEnvironment = import.meta.env.VITE_PADDLE_ENV?.trim();
const paddleToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.trim();
const priceEnvPrefix = paddleEnvironment === "sandbox" ? "SANDBOX_" : "";

function getPriceEnv(name: string) {
  return import.meta.env[`VITE_PADDLE_${priceEnvPrefix}PRICE_${name}`]?.trim() || "";
}

export const PADDLE_PRICE_IDS = {
  starter: {
    month: getPriceEnv("STARTER_MONTH"),
    year: getPriceEnv("STARTER_YEAR"),
  },
  pro: {
    month: getPriceEnv("PRO_MONTH"),
    year: getPriceEnv("PRO_YEAR"),
  },
  advanced: {
    month: getPriceEnv("ADVANCED_MONTH"),
    year: getPriceEnv("ADVANCED_YEAR"),
  },
} satisfies Record<"starter" | "pro" | "advanced", Tier["priceId"]>;

export const hasYearlyPaddlePrices = Boolean(
  PADDLE_PRICE_IDS.pro.year && PADDLE_PRICE_IDS.advanced.year,
);

export function getPaddleEnvironment(): PaddleEnvironment {
  if (paddleEnvironment !== "live" && paddleEnvironment !== "sandbox") {
    throw new Error("VITE_PADDLE_ENV must be set to live or sandbox");
  }
  return paddleEnvironment;
}

export function getPaddlePriceId(planId: string, interval: BillingInterval, planName?: string) {
  const planKey = `${planId} ${planName || ""}`.toLowerCase();
  const tier = planKey.includes("pro")
    ? "pro"
    : planKey.includes("premium") || planKey.includes("advanced") || planKey.includes("prinum")
      ? "advanced"
      : "starter";
  const priceId = PADDLE_PRICE_IDS[tier][interval];
  if (tier !== "starter" && !priceId) {
    throw new Error(`Missing Paddle ${tier} ${interval} price ID`);
  }
  return priceId || null;
}

export async function initializePaddleClient(): Promise<Paddle> {
  getPaddleEnvironment();
  if (!paddleToken || (!paddleToken.startsWith("live_") && paddleEnvironment === "live")) {
    throw new Error("VITE_PADDLE_CLIENT_TOKEN must contain the live_ client token");
  }
  if (!paddleToken) {
    throw new Error("VITE_PADDLE_CLIENT_TOKEN is not configured");
  }

  const paddle = await initializePaddle({
    environment: paddleEnvironment === "live" ? "production" : "sandbox",
    token: paddleToken,
  });
  if (!paddle) {
    throw new Error("Paddle failed to initialize");
  }
  return paddle;
}
