import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, LegalShell } from "@/components/common/SiteFooter";

export const Route = createFileRoute("/refunds")({
  head: () => ({ meta: [{ title: "Refund Policy — WeBotMe" }] }),
  component: () => (
    <LegalShell
      title="Refund Policy"
      description="We want you to be happy with WeBotMe. This page explains how cancellations and refunds work for subscriptions purchased through our checkout."
    >
      <p className="text-xs text-muted-foreground/70">Effective date: 21 August 2026</p>

      <LegalSection number={1} title="The short version">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Monthly plans can be cancelled anytime — you keep access until the period ends.</li>
          <li>
            New purchases can be refunded within <strong>14 days</strong> if you have barely used
            the service.
          </li>
          <li>
            Renewal charges can be refunded within <strong>48 hours</strong> if you forgot to cancel
            and haven&apos;t used paid features since.
          </li>
          <li>The free Starter plan never costs anything, so there is nothing to refund there.</li>
        </ul>
      </LegalSection>

      <LegalSection number={2} title="About your subscription">
        <p>
          WeBotMe paid plans (Pro $20/month, Advanced $30/month) are recurring monthly subscriptions
          managed through Paddle.com, which acts as our merchant of record and handles payments,
          taxes, invoices, and refunds on our behalf.
        </p>
        <p>
          Because WeBotMe is a digital service delivered instantly, using significant plan
          entitlements — creating chatbots, uploading training data, or making API calls — consumes
          real infrastructure on our side. That is why refunds weigh how much of the service was
          actually used.
        </p>
      </LegalSection>

      <LegalSection number={3} title="When we issue refunds">
        <p>
          <strong>First-time purchase within 14 days.</strong> If WeBotMe isn&apos;t a good fit,
          email us within 14 days of your first payment. If you&apos;ve made little or no meaningful
          use of paid features, we&apos;ll refund you in full.
        </p>
        <p>
          <strong>Accidental renewals.</strong> Charged after forgetting to cancel? Tell us within
          48 hours of the renewal charge and, as long as you haven&apos;t used paid features in that
          new cycle, we&apos;ll refund it.
        </p>
        <p>
          <strong>Service problems.</strong> If a confirmed issue on our side (extended downtime, a
          broken core feature) materially stopped you from using what you paid for, we&apos;ll
          refund the affected period fairly — even outside the windows above.
        </p>
        <p>
          <strong>Duplicate or wrong charges.</strong> Double-charged or billed incorrectly? We
          refund immediately, no questions asked.
        </p>
        <p>
          Refunds are generally <em>not</em> issued for: partial months after heavy usage, accounts
          suspended for violating our{" "}
          <a href="/terms" className="font-medium text-primary underline-offset-2 hover:underline">
            Terms of Service
          </a>
          , or requests made long after the charge without a service fault.
        </p>
      </LegalSection>

      <LegalSection number={4} title="How to request a refund">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Email{" "}
            <a
              href="mailto:bizy83724@gmail.com"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              bizy83724@gmail.com
            </a>{" "}
            from your account email.
          </li>
          <li>Include your Paddle receipt (or order ID) and a one-line reason.</li>
          <li>We reply within 1–2 business days and confirm once approved.</li>
        </ol>
        <p>
          Approved refunds are processed by Paddle back to your original payment method. Banks
          typically take <strong>5–10 business days</strong> to show the money, depending on your
          card issuer.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Cancelling future charges">
        <p>
          Cancelling is not the same as refunding. You can cancel anytime from your dashboard or by
          emailing us — this stops all future renewals while letting you use the plan until the end
          of the current billing period. If you don&apos;t want to be renewed at all, please cancel
          before your next billing date.
        </p>
      </LegalSection>

      <LegalSection number={6} title="EU / UK withdrawal rights">
        <p>
          If you live in the EU or UK, you normally have a statutory 14-day right to withdraw from a
          distance purchase. By clicking to subscribe you ask us to start delivering the digital
          service immediately; if you then withdraw within 14 days having already used the service,
          we may deduct an amount proportional to what was provided. In practice, the
          &quot;first-time purchase&quot; promise above usually gives you a better deal than the
          statutory minimum.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Please talk to us before charging back">
        <p>
          If something went wrong, a quick email almost always sorts it out faster than a bank
          dispute. Chargebacks filed without contacting us first may result in the related account
          being paused until the matter is resolved.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Questions">
        <p>
          Anything unclear about billing or refunds? Write to{" "}
          <a
            href="mailto:bizy83724@gmail.com"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            bizy83724@gmail.com
          </a>{" "}
          — a human reads every message.
        </p>
      </LegalSection>
    </LegalShell>
  ),
});
