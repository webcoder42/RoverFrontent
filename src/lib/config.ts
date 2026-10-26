// Public gateway origin — the single host a customer's browser ever talks to.
// The widget loader, the API and the chat app are all served from it, so the
// backend host never appears in an embed snippet, a share link or the network
// tab. Resolved at runtime from the app's own origin (Vercel rewrites forward
// /api and /static to the backend), never from the backend URL itself.
const trimSlash = (value: string) => value.replace(/\/+$/, "");

const resolveGateway = (): string => {
  const explicit = import.meta.env.VITE_GATEWAY_URL;
  if (explicit) return trimSlash(explicit);
  if (typeof window !== "undefined" && window.location.origin) {
    return trimSlash(window.location.origin);
  }
  // Build-time / non-browser fallback: the public chat host, never the backend.
  return trimSlash(import.meta.env.VITE_CHAT_BASE_URL || "");
};

export const GATEWAY_URL = resolveGateway();

export const config = {
  apiBaseUrl: GATEWAY_URL,
  chatBaseUrl: GATEWAY_URL,
};

export const getWidgetScriptUrl = () => `${GATEWAY_URL}/static/widget.js?v=20261017-key`;

export const AUTOFLOW_SCRIPT_VERSION = "20261017-key";
