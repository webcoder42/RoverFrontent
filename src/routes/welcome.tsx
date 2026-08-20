import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome — Webotme" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <section className="max-w-lg text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome to WeBotMe</h1>
        <p className="mt-3 text-muted-foreground">
          Your checkout was completed. Your plan will be available in your dashboard shortly.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
