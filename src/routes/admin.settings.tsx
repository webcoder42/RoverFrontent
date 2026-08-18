import { createFileRoute } from "@tanstack/react-router";
import { PageTransition } from "@/components/common/PageTransition";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — Webotme" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">System-wide configuration.</p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft text-center text-muted-foreground">
        <Settings className="mx-auto h-8 w-8 mb-3" />
        <p>Admin settings coming soon.</p>
      </div>
    </PageTransition>
  );
}
