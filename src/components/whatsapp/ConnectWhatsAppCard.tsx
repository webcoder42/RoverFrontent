import { useState } from "react";
import {
  Loader2,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Wifi,
} from "lucide-react";
import { GradientButton } from "@/components/common/GradientButton";
import { getAuthHeaders } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export interface WhatsAppAccountInfo {
  _id: string;
  phoneNumberId: string;
  phoneNumber: string;
  displayPhoneNumber: string;
  verifiedName: string;
  businessAccountId: string;
  connectedAt: string;
}

interface ConnectWhatsAppCardProps {
  account: WhatsAppAccountInfo | null;
  configured: boolean;
  loading: boolean;
  onConnected: () => void;
  onDisconnected: () => void;
}

export function ConnectWhatsAppCard({
  account,
  configured,
  loading,
  onConnected,
  onDisconnected,
}: ConnectWhatsAppCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleConnect = async () => {
    setError("");
    setNotice("");
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to connect WhatsApp");
      }
      setNotice("WhatsApp connected successfully!");
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;
    if (
      !window.confirm(
        `Disconnect "${account.verifiedName || "your WhatsApp"}"? The bot and its settings will be removed.`,
      )
    ) {
      return;
    }
    setDisconnecting(true);
    setError("");
    try {
      const res = await fetch(`/api/whatsapp/accounts/${account._id}`, {
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
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-soft">
          <Phone className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">WhatsApp Business connection</h3>
          <p className="text-xs text-muted-foreground">
            Connect your WhatsApp Business account for auto-replies.
          </p>
        </div>
      </div>

      {!configured && !account && (
        <div className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600">
          <div className="flex items-center gap-2 font-semibold">
            <Settings className="h-3.5 w-3.5" /> Setup required
          </div>
          <p className="mt-1">
            Add <code>WHATSAPP_ACCESS_TOKEN</code> and{" "}
            <code>WHATSAPP_PHONE_NUMBER_ID</code> to your server environment
            variables first.
          </p>
        </div>
      )}

      {account && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
            <Phone className="h-3.5 w-3.5 text-emerald-500" />
            {account.verifiedName || account.displayPhoneNumber || account.phoneNumberId}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Connected {formatDate(account.connectedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            {account.displayPhoneNumber}
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
          disabled={connecting || (!configured && !account)}
          className="w-full sm:w-auto"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4" />
              {account ? "Reconnect WhatsApp" : "Connect WhatsApp"}
            </>
          )}
        </GradientButton>

        {account && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-red-600 disabled:opacity-50"
            title="Disconnect WhatsApp"
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
