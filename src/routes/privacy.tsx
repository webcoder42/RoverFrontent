import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, LegalShell } from "@/components/common/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — WeBotMe" }] }),
  component: () => (
    <LegalShell
      title="Privacy Policy"
      description="This policy explains what data WeBotMe collects, why we collect it, and the choices you have. We keep it plain and honest."
    >
      <p className="text-xs text-muted-foreground/70">Effective date: 21 August 2026</p>

      <LegalSection number={1} title="Who we are">
        <p>
          WeBotMe is a platform for building and embedding AI chat assistants on websites. This
          policy covers two kinds of people: our customers (you, when you sign up for an account)
          and end-users (the visitors who chat with a chatbot you created). If you are an end-user,
          most of your data is controlled by the WeBotMe customer whose chatbot you interacted with
          — we process it on their behalf.
        </p>
      </LegalSection>

      <LegalSection number={2} title="What we collect">
        <p>
          <strong>Account data.</strong> When you register we store your username, email address,
          and a securely hashed password. We also save optional onboarding answers (like what you
          plan to use WeBotMe for) so we can improve the product.
        </p>
        <p>
          <strong>Chatbot content.</strong> Documents, FAQs, links, and other material you upload to
          train your bots. Files are stored securely; bot tokens you connect (for example Telegram
          tokens) are stored encrypted.
        </p>
        <p>
          <strong>Conversations.</strong> Messages exchanged between end-users and your chatbots, so
          your dashboard can show chat history and analytics.
        </p>
        <p>
          <strong>Billing data.</strong> Payments are handled by Paddle.com as our merchant of
          record. We never see or store your full card details — Paddle shares with us only what we
          need, like your name, email, country, and subscription status.
        </p>
        <p>
          <strong>Technical data.</strong> Basic logs such as IP address, browser type, and request
          timestamps, used for security and rate limiting (for example, enforcing daily API limits
          on each plan).
        </p>
      </LegalSection>

      <LegalSection number={3} title="How we use your data">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To operate your account and provide the features of your plan;</li>
          <li>To generate AI replies for your chatbots;</li>
          <li>
            To send transactional emails — receipts, plan confirmations, security alerts, support
            replies;
          </li>
          <li>To detect abuse, enforce plan limits, and keep the platform secure;</li>
          <li>To understand aggregate usage so we know which features to improve.</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use your chatbot content to advertise to
          anyone.
        </p>
      </LegalSection>

      <LegalSection number={4} title="AI processing disclosure">
        <p>
          When someone chats with your bot, the message is sent to a third-party large language
          model provider (currently Groq, running open models such as Llama) together with relevant
          snippets of your training material, so the model can compose an answer. These providers
          process the content only to generate the reply.
        </p>
        <p>
          In practice this means you should not upload sensitive personal data — such as health,
          financial, or government ID numbers — into training documents unless you are comfortable
          with that processing, and you should tell your end-users that they are talking to an AI
          assistant.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Who we share data with">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Paddle</strong> — subscription payments, taxes, and refunds (merchant of
            record);
          </li>
          <li>
            <strong>Groq / model providers</strong> — processing chat messages to generate replies;
          </li>
          <li>
            <strong>Cloudinary</strong> — hosting files you upload for training;
          </li>
          <li>
            <strong>Resend</strong> — delivering our transactional emails;
          </li>
          <li>
            <strong>Telegram</strong> — only if you connect a Telegram bot to your account;
          </li>
          <li>
            <strong>MongoDB Atlas</strong> — hosting our application database.
          </li>
        </ul>
        <p>
          We share data with these providers only as needed to run the service. We may also disclose
          information if the law requires it.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Cookies and local storage">
        <p>
          WeBotMe keeps it minimal. After you sign in, your session token and basic profile are
          stored in your browser&apos;s local storage so you stay logged in. We do not use
          advertising cookies or third-party trackers on the app itself.
        </p>
      </LegalSection>

      <LegalSection number={7} title="How long we keep data">
        <p>
          Account and billing records are kept while your account is active. Chatbot conversations
          and training content are kept until you delete them or close your account. If you cancel a
          paid plan, we may retain your data for a short grace period in case you reactivate, after
          which inactive free accounts and their data may be removed.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Your rights and choices">
        <p>
          You can access, correct, export, or delete your account data at any time from your
          dashboard settings, or by emailing us. Closing your account stops future processing. If
          you are an end-user who chatted with a WeBotMe-powered bot and want your conversation
          removed, please contact the site owner whose bot you used — or email us and we will pass
          the request along.
        </p>
        <p>
          Depending on where you live (for example the EU/UK), you may have additional rights such
          as objecting to processing or lodging a complaint with your local data protection
          authority.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Security">
        <p>
          We use HTTPS for all traffic, hash passwords, encrypt connected bot tokens at rest, and
          restrict database access. No system is perfect, but if a breach ever affects your data we
          will notify you promptly and tell you what happened.
        </p>
      </LegalSection>

      <LegalSection number={10} title="Children">
        <p>
          WeBotMe is not directed at children under 13 (or under 16 in the EEA/UK), and we do not
          knowingly collect their personal data. If you believe a child has given us data, contact
          us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection number={11} title="Changes and contact">
        <p>
          If we make meaningful changes to this policy we will update the effective date above and
          notify active subscribers by email for significant changes.
        </p>
        <p>
          Privacy questions? Email{" "}
          <a
            href="mailto:bizy83724@gmail.com"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            bizy83724@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  ),
});
