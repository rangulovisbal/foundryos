import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cookie Policy | ${siteConfig.name}`,
  description:
    "Cookie policy for the FoundryOS pilot covering essential session cookies and optional analytics, payments, and abuse-prevention services."
};

const cookieGroups = [
  {
    title: "Essential cookies",
    items: [
      "Authentication and session cookies required to keep a signed-in user inside the product.",
      "Security-related cookies or tokens required for account access and form protection."
    ]
  },
  {
    title: "Optional service cookies",
    items: [
      "Stripe may set cookies or local storage when live checkout is enabled on a deployment.",
      "Cloudflare Turnstile may process challenge-related data on public forms when abuse protection is enabled.",
      "Analytics cookies or storage may be set only if product analytics is enabled for a deployment."
    ]
  },
  {
    title: "What is not in scope today",
    items: [
      "The current FoundryOS pilot does not rely on advertising-tech cookies or a marketing-ad personalization stack.",
      "Billing and analytics may be disabled entirely on some deployments."
    ]
  }
] as const;

export default function CookiePage() {
  return (
    <LegalPageShell
      currentPath="/cookie"
      eyebrow="Cookie policy"
      intro="FoundryOS uses the minimum browser storage needed to operate the pilot product. Optional cookies depend on which integrations are actually enabled on a deployment."
      title="Cookie and browser-storage policy."
    >
      <section className="section-wrap">
        {cookieGroups.map((group) => (
          <article className="surface p-6 md:p-8" key={group.title}>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {group.items.map((item) => (
                <li
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Browser controls</p>
        <p className="mt-4 text-sm leading-7 text-muted">
          You can control cookies in your browser settings. Disabling essential
          cookies may prevent login, workspace access, or protected form handling
          from working correctly.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted">
          Before broader launch, this policy still needs lawyer review for
          jurisdiction-specific consent-banner requirements.
        </p>
      </section>
    </LegalPageShell>
  );
}
