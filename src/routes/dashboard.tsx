import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { isAuthenticated } from "@/lib/auth";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: "/",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  head: () => noindexHead("Dashboard — Webotme"),
  component: DashboardLayout,
});

function DashboardLayout() {
  const isIncreaseLimitsPage = useRouterState({
    select: (state) => state.location.pathname === "/dashboard/increase-limits",
  });

  return (
    <div className="flex min-h-screen w-full">
      {!isIncreaseLimitsPage && (
        <div className="hidden md:flex md:sticky md:top-0 md:h-screen">
          <Sidebar />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar hideSidebarMenu={isIncreaseLimitsPage} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
