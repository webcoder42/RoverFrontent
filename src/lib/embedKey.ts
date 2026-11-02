import { apiFetch } from "@/lib/apiFetch";
import { getAuthHeaders } from "@/lib/auth";

/**
 * Placeholder written into the embed snippet INSTEAD of the real key.
 *
 * The snippet is copied into public HTML, so it never carries a usable
 * credential: the owner copies their key separately from the dashboard and
 * pastes it over this token. The loader refuses to start until it is replaced.
 */
export const EMBED_KEY_PLACEHOLDER = "PASTE_YOUR_WEBOTME_API_KEY";

/** `wbm_8cbf9d23_f53e...` -> `wbm_8cbf...c2b0` for on-screen display only. */
export function maskEmbedKey(key: string): string {
  if (!key) return "";
  if (key.length <= 14) return key;
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}

/**
 * True when a stored snippet still carries the placeholder and therefore
 * needs the owner to paste their key before the widget will run.
 */
export const needsKeyPasted = (script: string) =>
  Boolean(script) && script.includes(EMBED_KEY_PLACEHOLDER);

// The embed snippet ships the bot's public `wbm_...` key so every widget call
// can be authenticated server-side. The backend host is therefore never sent
// to a customer's page: the snippet carries only a bot id and this key.
//
// The key is AES-encrypted at rest and only an authenticated owner (or admin)
// can decrypt it, so it is revealed here — right before the owner copies the
// snippet — and never fetched anonymously.
const cache = new Map<string, string>();

/** Prefetch/overwrite the cached key (used when a caller already has it). */
export function primeEmbedKey(botId: string, key: string) {
  if (botId && key) cache.set(botId, key);
}

/**
 * The chatbot's own API key. Every chatbot has exactly ONE unique key, so one
 * key can never unlock a different bot. Minted on first use so the owner
 * always has something to copy over the snippet's placeholder.
 */
export async function fetchEmbedKey(botId: string): Promise<string> {
  if (!botId) throw new Error("Missing chatbot id");

  const cached = cache.get(botId);
  if (cached) return cached;

  const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

  const reveal = () =>
    apiFetch(`/api/chatbot/${botId}/api-key/reveal`, { method: "POST", headers });

  let res = await reveal();

  // First-time bots have no key yet — mint one, then reveal it.
  if (res.status === 404) {
    await apiFetch(`/api/chatbot/${botId}/api-key`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Embed" }),
    });
    res = await reveal();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.key) {
    throw new Error(data.message || "Could not load this chatbot's embed key");
  }

  cache.set(botId, data.key);
  return data.key;
}
