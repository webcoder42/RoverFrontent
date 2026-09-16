import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Bot, Workflow, Sparkles, Globe } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import {
  ConnectFacebookCard,
  type FacebookAccountInfo,
} from "@/components/facebook/ConnectFacebookCard";
import { FacebookBotCustomizationPanel } from "@/components/facebook/BotCustomizationPanel";
import { getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/facebook")({
  head: () => ({ meta: [{ title: "Facebook Bot — Webotme" }] }),
  component: FacebookBotPage,
});

function FacebookBotPage() {
  const [account, setAccount] = useState<FacebookAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthNotice, setOauthNotice] = useState("");

  const fetchAccount = useCallback(() => {
    fetch("/api/facebook/accounts", {
      headers: getAuthHeaders() as Record<string, string>,
    })
      .then((r) => r.json())
      .then((data) => {
        setAccount(Array.isArray(data.accounts) ? data.accounts[0] || null : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAccount();

    const params = new URLSearchParams(window.location.search);
    const status = params.get("connected");
    if (status) {
      const messages: Record<string, string> = {
        success: "Facebook Page connected successfully! Your auto-reply bot is ready.",
        denied: "Facebook authorization was cancelled.",
        invalid_state: "The connection link expired. Please try connecting again.",
        exchange_failed: "Could not get an access token from Facebook. Please try again.",
        missing_params: "Facebook callback was incomplete. Please try again.",
        no_pages: "No Facebook Pages found. Please create a Page first and try again.",
        error: "Something went wrong while connecting Facebook.",
      };
      if (status === "success") {
        setOauthNotice(messages[status]);
        setTimeout(fetchAccount, 500);
      } else {
        setOauthNotice(messages[status] || "");
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchAccount]);

  const active = Boolean(account?.tokenValid && account);

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-soft">
            <Globe className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Facebook Bot</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your Facebook Page and let an auto-reply chatbot answer every
          message and comment for you — like ManyChat.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" /> Page
          </div>
          <div className="mt-2 truncate text-lg font-bold">
            {account ? account.pageName || `Page ${account.pageId}` : "Not connected"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Workflow className="h-4 w-4 text-primary" /> Service Flows
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-600">
            {active ? "Bot ready to configure" : "Connect Facebook first"}
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

      {oauthNotice && (
        <div
          className={`mb-6 rounded-xl px-3 py-2.5 text-xs ${
            oauthNotice.includes("successfully")
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {oauthNotice}
        </div>
      )}

      <div className="mb-8">
        <ConnectFacebookCard
          account={account}
          loading={loading}
          onDisconnected={fetchAccount}
        />
      </div>

      {account && (
        <FacebookBotCustomizationPanel accountId={account._id} />
      )}
    </PageTransition>
  );
}
