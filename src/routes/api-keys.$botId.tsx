import { createFileRoute, Outlet } from "@tanstack/react-router";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/api-keys/$botId")({
  head: () => noindexHead("API Console — Webotme"),
  component: ApiKeysStepLayout,
});

function ApiKeysStepLayout() {
  return <Outlet />;
}
