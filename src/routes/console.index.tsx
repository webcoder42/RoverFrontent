import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { config } from "@/lib/config";

export const Route = createFileRoute("/console/")({
  validateSearch: (search: Record<string, unknown>): { key?: string } => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  head: () => ({ meta: [{ title: "Analytics Console — WeBotMe" }] }),
  component: ConsoleGate,
});

function ConsoleGate() {
  const navigate = useNavigate();
  const { key: initialKey } = Route.useSearch();
  const [value, setValue] = useState(
    initialKey && /^wc_[a-f0-9]{32}$/i.test(initialKey) ? initialKey : "",
  );
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    const key = value.trim();
    if (!/^wc_[a-f0-9]{32}$/i.test(key)) {
      setError("Please enter a valid console ID (starts with wc_).");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/store/public/console/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "This console ID is not valid.");
        return;
      }
      // Session-scoped pass — lives only in THIS tab. A copied dashboard URL
      // opened anywhere else has no token and bounces back here.
      sessionStorage.setItem("webotme-console-session", data.sessionToken || "");
      navigate({ to: "/console/$botId", params: { botId: key } });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#0b0f1a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Analytics Console</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your console ID to view your chatbot's live business analytics.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <KeyRound className="h-3.5 w-3.5" /> Console ID
          </label>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && !checking && submit()}
            placeholder="e.g. wc_9f2c41a8d7e6b5a4c3d2e1f0987654ab"
            autoFocus
            spellCheck={false}
            disabled={checking}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          />
          {error && <p className="mt-2 text-xs font-medium text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={!value.trim() || checking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
              </>
            ) : (
              <>
                Verify & Open Dashboard <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
            Your console ID is a private key shared by your service provider. Keep it safe — anyone
            with this ID can view the analytics dashboard.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
