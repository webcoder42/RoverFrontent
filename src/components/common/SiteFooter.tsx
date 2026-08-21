import { Link } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import logo from "@/asset/logo.png";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="WeBotMe" className="h-10 w-auto shrink-0 object-contain" />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            WeBotMe is a web-based platform for building, training, and embedding AI chat assistants
            on your own website — no code required.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/70">
            Payments are processed by Paddle.com, our merchant of record.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Product
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/plans" className="transition-colors hover:text-primary">
                Pricing &amp; Plans
              </Link>
            </li>
            <li>
              <a
                href={isAuthenticated() ? "/dashboard" : "/"}
                className="transition-colors hover:text-primary"
              >
                {isAuthenticated() ? "Dashboard" : "Sign in"}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Legal
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/terms" className="transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refunds" className="transition-colors hover:text-primary">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground/70 sm:flex-row">
          <span>© {new Date().getFullYear()} WeBotMe. All rights reserved.</span>
          <span>
            Questions? Email us at{" "}
            <a
              href="mailto:bizy83724@gmail.com"
              className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              bizy83724@gmail.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function LegalShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="relative z-10 flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-4 backdrop-blur-xl">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="WeBotMe" className="h-14 w-auto shrink-0 object-contain" />
        </Link>
        <a
          href={isAuthenticated() ? "/dashboard" : "/"}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {isAuthenticated() ? "Dashboard" : "Login"}
        </a>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-7 shadow-soft md:p-8 [&:not(:first-child)]:mt-5">
      <h2 className="flex items-baseline gap-3 text-lg font-bold tracking-tight">
        <span className="grid h-7 w-7 shrink-0 translate-y-0.5 place-items-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
