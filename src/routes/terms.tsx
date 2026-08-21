import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, LegalShell } from "@/components/common/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — WeBotMe" }] }),
  component: () => (
    <LegalShell
      title="Terms of Service"
      description="These terms govern your use of the WeBotMe platform. Please read them carefully before creating an account or subscribing to a plan."
    >
      <p className="text-xs text-muted-foreground/70">Effective date: 21 August 2026</p>

      <LegalSection number={1} title="About these terms">
        <p>
          WeBotMe (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a web-based service
          that lets you build, train, and embed AI chat assistants on your own website. By creating
          an account or subscribing to a paid plan, you agree to these Terms of Service. If you do
          not agree, please do not use the platform.
        </p>
        <p>
          You must be at least 18 years old, or have permission from a parent or guardian, to use
          WeBotMe.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Your account">
        <p>
          You are responsible for keeping your login credentials secure and for all activity that
          happens under your account. Please use a strong password and let us know immediately if
          you suspect someone else has accessed your account.
        </p>
        <p>
          The information you give us when signing up (such as your email address) must be accurate
          and kept up to date, because we use it to deliver receipts, security notices, and support.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Plans, billing and renewals">
        <p>
          WeBotMe offers a free Starter tier and paid monthly subscriptions (currently Pro at
          $20/month and Advanced at $30/month). Each plan has its own limits — for example, how many
          chatbots you can create, daily API requests, training storage, and email support volume.
          The limits shown on our pricing page at the time of your purchase apply to your
          subscription.
        </p>
        <p>
          Paid plans renew automatically each month until cancelled. Payments are collected on our
          behalf by <strong>Paddle.com</strong>, which acts as our merchant of record. Your bank or
          card statement will show charges from Paddle. Prices are in US dollars and may include
          applicable taxes depending on your location.
        </p>
        <p>
          If a renewal payment fails, we may pause or downgrade your subscription until the payment
          issue is resolved. We will always try to notify you by email first.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Acceptable use">
        <p>You agree not to use WeBotMe to create or operate chatbots that:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>break any applicable law or regulation;</li>
          <li>harass, defraud, deceive, or impersonate real people;</li>
          <li>distribute malware, spam, or unsolicited advertising;</li>
          <li>generate or spread hateful, violent, sexual, or otherwise harmful content;</li>
          <li>infringe the intellectual property or privacy rights of others.</li>
        </ul>
        <p>
          You also agree not to attempt to disrupt the platform, circumvent plan limits, resell
          access without our written permission, or reverse engineer parts of the service that are
          not openly documented.
        </p>
        <p>
          If we reasonably believe your usage breaks these rules, we may suspend or terminate your
          account. Where possible we will warn you first and give you a chance to fix the problem.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Your content and AI processing">
        <p>
          Anything you upload to train your chatbots — documents, FAQs, website links, and the
          conversations your end-users have with your bots — remains yours. We only use it to run
          and improve the service you signed up for; we do not sell your data.
        </p>
        <p>
          To generate replies, messages from your chatbots are processed by third-party AI model
          providers working on our behalf. This processing is described in more detail in our{" "}
          <a
            href="/privacy"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          . You are responsible for making sure you have the right to process any personal data you
          collect through your chatbots.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Third-party services">
        <p>
          WeBotMe integrates with services such as Paddle (payments), Cloudinary (file storage),
          Telegram (bot connectivity), and external AI model providers. Your use of those services
          is also subject to their own terms. We are not responsible for outages or changes in
          third-party services, but we will always try to keep your bots running smoothly.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Service availability and changes">
        <p>
          We work hard to keep WeBotMe available and reliable, but the service is provided &quot;as
          is&quot;. We may add, change, or remove features over time. If we make a significant
          change that affects a paid feature you rely on, we will give you reasonable notice by
          email.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Cancelling and terminating">
        <p>
          You can cancel a paid subscription at any time from your dashboard or by contacting us.
          Cancelling stops future charges, and you keep access to paid features until the end of the
          period you already paid for. Our{" "}
          <a
            href="/refunds"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Refund Policy
          </a>{" "}
          explains when refunds may be available.
        </p>
        <p>
          We may suspend or close accounts that violate these terms, that put the platform or other
          users at risk, or whose payments fail repeatedly.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Disclaimers and liability">
        <p>
          To the fullest extent permitted by law, WeBotMe is not liable for indirect or
          consequential losses — such as lost profits or lost data — arising from your use of the
          service. Our total liability for any claim related to the service is limited to the amount
          you paid us in the 12 months before the claim arose.
        </p>
        <p>
          Nothing in these terms limits liability that cannot legally be limited, and nothing here
          affects your statutory consumer rights.
        </p>
      </LegalSection>

      <LegalSection number={10} title="Changes to these terms">
        <p>
          We may update these terms as the product evolves. When we do, we will change the effective
          date above and, for significant changes, notify active subscribers by email. Continuing to
          use WeBotMe after an update means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection number={11} title="Contact">
        <p>
          Questions about these terms? Email us at{" "}
          <a
            href="mailto:bizy83724@gmail.com"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            bizy83724@gmail.com
          </a>{" "}
          and we will get back to you.
        </p>
      </LegalSection>
    </LegalShell>
  ),
});
