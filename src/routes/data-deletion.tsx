import { createFileRoute } from "@tanstack/react-router";
import { LegalSection, LegalShell } from "@/components/common/SiteFooter";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({ meta: [{ title: "User Data Deletion — WeBotMe" }] }),
  component: () => (
    <LegalShell
      title="User Data Deletion"
      description="You can ask us to delete your personal data at any time. Here is exactly how it works."
    >
      <p className="text-xs text-muted-foreground/70">Effective date: 24 August 2026</p>

      <LegalSection number={1} title="How to request deletion">
        <p>
          Simply send us an email and we will delete your data for you:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Email us at{" "}
            <a
              href="mailto:bizy83724@gmail.com?subject=Delete%20My%20Data"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              bizy83724@gmail.com
            </a>{" "}
            with the subject line <strong>&ldquo;Delete My Data&rdquo;</strong>
          </li>
          <li>
            Mention the email address you signed up with (or the Instagram username you connected)
          </li>
          <li>
            That&apos;s it — no forms, no questions asked
          </li>
        </ul>
      </LegalSection>

      <LegalSection number={2} title="What happens next">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We confirm your request by reply email</li>
          <li>Your account, chatbots, connected accounts, and stored tokens are permanently deleted</li>
          <li>Requests are completed within 7 days (usually much sooner)</li>
          <li>You receive a confirmation once everything is removed</li>
        </ul>
      </LegalSection>

      <LegalSection number={3} title="What data we delete">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your account profile (name, email, password hash)</li>
          <li>All chatbots, training content, FAQs, and conversation history</li>
          <li>
            Connected Instagram account details — Instagram user ID, username, and the encrypted
            access token
          </li>
          <li>Connected Telegram bots and their encrypted tokens</li>
          <li>Billing records kept only where the law requires us to retain them</li>
        </ul>
      </LegalSection>

      <LegalSection number={4} title="Remove WeBotMe from Instagram yourself">
        <p>
          If you connected an Instagram account and want to revoke our access immediately, without
          waiting for us:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Open the Instagram app → <strong>Settings and privacy</strong> →{" "}
            <strong>Apps and websites</strong>
          </li>
          <li>Select WeBotMe and tap <strong>Remove</strong></li>
          <li>This instantly revokes our access token — then email us so we clear any remaining records</li>
        </ul>
      </LegalSection>

      <LegalSection number={5} title="Questions">
        <p>
          Any questions about deletion or your data? Email us anytime at{" "}
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
