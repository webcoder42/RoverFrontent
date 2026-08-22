export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    clearAuth();
    return false;
  }

  const expiresAt = payload.exp * 1000;
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    clearAuth();
    return false;
  }

  return true;
}

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}
