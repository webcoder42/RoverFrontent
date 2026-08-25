import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Instagram, MessageCircle, Bot, Workflow } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import {
  ConnectInstagramCard,
  type InstagramAccountInfo,
} from "@/components/instagram/ConnectInstagramCard";
import { BotCustomizationPanel } from "@/components/instagram/BotCustomizationPanel";
import { getAuthHeaders } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/instagram")({
  head: () => ({ meta: [{ title: "Instagram Bot — Webotme" }] }),
  component: InstagramBotPage,
});

function InstagramBotPage() {
  const [account, setAccount] = useState<InstagramAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthNotice, setOauthNotice] = useState("");

  const fetchAccount = useCallback(() => {
    fetch("/api/instagram/accounts", {
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

    // Result of the OAuth redirect back from /api/instagram/callback
    const params = new URLSearchParams(window.location.search);
    const status = params.get("connected");
    if (status) {
      const messages: Record<string, string> = {
        success: "Instagram connected successfully! Your auto-reply bot is ready.",
        denied: "Instagram authorization was cancelled.",
        invalid_state: "The connection link expired. Please try connecting again.",
        exchange_failed: "Could not get an access token from Instagram. Please try again.",
        missing_params: "Instagram callback was incomplete. Please try again.",
        error: "Something went wrong while connecting Instagram.",
      };
      if (status === "success") {
        setOauthNotice(messages[status]);
        // Refresh once more so the new account appears
        setTimeout(fetchAccount, 500);
      } else {
        setOauthNotice(messages[status] || "");
      }
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchAccount]);

  const active = Boolean(account?.tokenValid && account);

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 text-white shadow-soft">
            <Instagram className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Instagram Bot</h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect your Instagram Business/Creator account and let an auto-reply
          chatbot answer every DM and comment for you — like ManyChat.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" /> Account
          </div>
          <div className="mt-2 truncate text-lg font-bold">
            {account ? `@${account.username || account.igUserId}` : "Not connected"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Workflow className="h-4 w-4 text-primary" /> Service Flows
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-600">
            {active ? "Bot ready to configure" : "Connect Instagram first"}
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
        <ConnectInstagramCard
          account={account}
          loading={loading}
          onDisconnected={fetchAccount}
        />
      </div>

      {account && (
        <BotCustomizationPanel accountId={account._id} />
      )}
    </PageTransition>
  );
}
