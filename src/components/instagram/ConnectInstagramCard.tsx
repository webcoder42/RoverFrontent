import { useState } from "react";
import {
  Instagram,
  Loader2,
  Link2,
  AtSign,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { getAuthHeaders } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export interface InstagramAccountInfo {
  _id: string;
  igUserId: string;
  username: string;
  connectedAt: string;
  tokenExpiresAt: string;
  tokenValid: boolean;
  daysUntilExpiry: number;
}

interface ConnectInstagramCardProps {
  account: InstagramAccountInfo | null;
  loading: boolean;
  onDisconnected: () => void;
}

export function ConnectInstagramCard({
  account,
  loading,
  onDisconnected,
}: ConnectInstagramCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleConnect = async () => {
    setError("");
    setNotice("");
    setConnecting(true);
    try {
      const res = await fetch("/api/instagram/oauth-url", {
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Failed to start Instagram connection");
      }
      // Full page redirect to the Instagram authorization screen
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;
    if (
      !window.confirm(
        `Disconnect @${account.username || "your account"}? The bot and its settings will be removed.`,
      )
    ) {
      return;
    }
    setDisconnecting(true);
    setError("");
    try {
      const res = await fetch(`/api/instagram/accounts/${account._id}`, {
        method: "DELETE",
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to disconnect");
      }
      onDisconnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 text-white shadow-soft">
          <Instagram className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Instagram connection</h3>
          <p className="text-xs text-muted-foreground">
            Link your Instagram Business or Creator account — your access token
            is encrypted before it is stored.
          </p>
        </div>
      </div>

      {account && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
            <AtSign className="h-3.5 w-3.5 text-primary" />
            {account.username || `IG ${account.igUserId}`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Connected {formatDate(account.connectedAt)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 ${
              !account.tokenValid
                ? "font-semibold text-red-600"
                : account.daysUntilExpiry <= 7
                  ? "font-semibold text-amber-600"
                  : ""
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {account.tokenValid
              ? `Token expires in ${account.daysUntilExpiry} day${account.daysUntilExpiry === 1 ? "" : "s"}`
              : "Token expired — reconnect required"}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-600">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <GradientButton
          onClick={handleConnect}
          disabled={connecting}
          className="w-full sm:w-auto"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              {account ? "Reconnect Instagram" : "Connect Instagram"}
            </>
          )}
        </GradientButton>

        {account && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-red-600 disabled:opacity-50"
            title="Disconnect Instagram"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
