import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/legal-page-shell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy | ${siteConfig.name}`,
  description:
    "Privacy notice for the FoundryOS pilot covering what data is stored, why it is used, and how manual support and deletion requests currently work."
};

const categories = [
  {
    title: "Account and access data",
    items: [
      "Name, email address, hashed authentication credentials, verification state, and session-related access records.",
      "Workspace memberships, invitation records, and role assignments."
    ]
  },
  {
    title: "Workspace operating data",
    items: [
      "Business profile fields, diagnostic runs, planning outputs, assets, SOPs, support requests, and deletion requests.",
      "Administrative account-state and plan metadata used to control preview access."
    ]
  },
  {
    title: "Technical and security data",
    items: [
      "Basic request, environment, and delivery metadata required to operate the app securely.",
      "Optional service data created when integrations such as Turnstile, Stripe, Resend, or analytics are enabled on a deployment."
    ]
  }
] as const;

const uses = [
  "Authenticate users, manage workspace access, and persist generated operating artifacts.",
  "Review support requests, deletion requests, and account-state changes manually during pilot operations.",
  "Operate optional integrations such as transactional email, checkout, abuse prevention, and analytics when they are enabled.",
  "Maintain product security, diagnose issues, and improve the reliability of the FoundryOS pilot."
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageShell
      currentPath="/privacy"
      eyebrow="Privacy"
      intro="This privacy notice covers the current FoundryOS pilot. It reflects the data the app actually stores today and does not claim automated compliance workflows that are not yet built."
      title="Privacy notice for FoundryOS."
    >
      <section className="section-wrap">
        <article className="surface p-6 md:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">What data is collected</h2>
          <div className="mt-6 space-y-4">
            {categories.map((category) => (
              <div
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                key={category.title}
              >
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
                  {category.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="surface p-6 md:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">How data is used</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            {uses.map((item) => (
              <p
                className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                key={item}
              >
                {item}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="section-wrap">
        <article className="surface p-6 md:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">Sharing and processors</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            FoundryOS shares data with infrastructure and service providers only to
            operate the product. See the{" "}
            <Link className="font-semibold text-ink underline" href="/subprocessors">
              subprocessor notice
            </Link>{" "}
            for the current list and what each provider does.
          </p>
        </article>

        <article className="surface p-6 md:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">Retention and requests</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              Data is retained for as long as it is needed to operate the current
              workspace, support the pilot, and maintain a reliable audit trail.
            </p>
            <p>
              Account and workspace deletion currently operate through tracked
              request flows with manual review. Authenticated users should use the{" "}
              <Link className="font-semibold text-ink underline" href="/app/support">
                support route
              </Link>{" "}
              for privacy and deletion requests.
            </p>
          </div>
        </article>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Founder note</p>
        <p className="mt-4 text-sm leading-7 text-muted">
          Before broad launch, this notice still needs lawyer review for
          jurisdiction-specific privacy rights, retention schedules, and any
          formal data processing addendum.
        </p>
      </section>
    </LegalPageShell>
  );
}
