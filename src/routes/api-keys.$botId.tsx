import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/api-keys/$botId")({
  head: () => ({ meta: [{ title: "API Console — Webotme" }] }),
  component: ApiKeysStepLayout,
});

function ApiKeysStepLayout() {
  return <Outlet />;
}
