import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Bot, Workflow, Sparkles, Phone } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import {
  ConnectWhatsAppCard,
  type WhatsAppAccountInfo,
} from "@/components/whatsapp/ConnectWhatsAppCard";
import { WhatsAppBotCustomizationPanel } from "@/components/whatsapp/BotCustomizationPanel";
import { getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Bot — Webotme" }] }),
  component: WhatsAppBotPage,
});

function WhatsAppBotPage() {
  const [account, setAccount] = useState<WhatsAppAccountInfo | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(() => {
    fetch("/api/whatsapp/accounts", {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        setAccount(Array.isArray(data.accounts) ? data.accounts[0] || null : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchSetupInfo = useCallback(() => {
    fetch("/api/whatsapp/setup-info", {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
      })
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    fetchAccount();
    fetchSetupInfo();
  }, [fetchAccount, fetchSetupInfo]);

  const active = Boolean(account);

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-soft">
            <Phone className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">WhatsApp Bot</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your WhatsApp Business account and let an auto-reply chatbot
          answer every message for you — like ManyChat.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" /> Account
          </div>
          <div className="mt-2 truncate text-lg font-bold">
            {account ? account.verifiedName || account.displayPhoneNumber : "Not connected"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Workflow className="h-4 w-4 text-primary" /> Service Flows
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-600">
            {active ? "Bot ready to configure" : "Connect WhatsApp first"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Status
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-600">
            {active ? "Connected & eligible" : "Waiting for connection"}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ConnectWhatsAppCard
          account={account}
          configured={configured}
          loading={loading}
          onConnected={fetchAccount}
          onDisconnected={fetchAccount}
        />
      </div>

      {account && (
        <WhatsAppBotCustomizationPanel accountId={account._id} />
      )}
    </PageTransition>
  );
}
