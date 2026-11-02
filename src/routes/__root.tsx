import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/queryClient";
import { SITE_NAME, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const details = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <pre className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/50 p-3 text-left font-mono text-[11px] leading-4 text-muted-foreground">
          {details}
        </pre>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {details && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(details).catch(() => {});
              }}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Copy error
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: `${SITE_NAME} — AI chatbots for any website, zero code` },
      {
        name: "description",
        content:
          "Build an AI chatbot for your website in minutes. Your own flows, your own database, your own email, orders inside chat — one simple script, no coding.",
      },
      { name: "robots", content: "index, follow" },
      { name: "application-name", content: SITE_NAME },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd, websiteJsonLd],
        } as unknown as Record<string, never>,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CacheChangeSync />
      <HeadContent />
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

function CacheChangeSync() {
  useEffect(() => {
    const source = new EventSource("/api/cache-events");
    let refreshTimer: number | undefined;

    const refreshCachedResponses = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void queryClient
          .invalidateQueries({ queryKey: ["api"], refetchType: "none" })
          .then(() => queryClient.refetchQueries({ queryKey: ["api"], type: "all" }));
      }, 100);
    };

    source.addEventListener("cache-change", refreshCachedResponses);
    source.addEventListener("open", refreshCachedResponses);

    return () => {
      window.clearTimeout(refreshTimer);
      source.close();
    };
  }, []);

  return null;
}
