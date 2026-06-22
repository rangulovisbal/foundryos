import Link from "next/link";

import { env } from "@/lib/env";
import { publicLegalLinks } from "@/lib/legal";

const controls = [
  "Account separation by customer",
  "Role-based permissions",
  "Encryption in transit",
  "Activity logs and auditability",
  "Backup and deletion procedures",
  "Consent gates for connectors",
  "Human review for critical outputs",
  "No sensitive data by default"
];

const handling = [
  env.stripeCheckoutEnabled
    ? "Payments are handled by Stripe Checkout and Stripe Billing."
    : "Stripe checkout is available only when billing, provisioning, account states, customer portal behavior, and routing are configured for the deployment.",
  "The product does not store payment card details.",
  "Support and deletion requests remain request-based and are reviewed manually.",
  "Lead capture can be protected with rate limiting and Cloudflare Turnstile.",
  "Generated outputs are structured operating drafts and should remain subject to human review."
];

export default function SecurityPage() {
  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Security and trust</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Clear payment handling, clear data boundaries, clear operating safeguards.
        </h1>
        <p className="mt-4 max-w-3xl body-lg">
          FoundryOS is built to give teams faster operating clarity without
          turning payments, access or data handling into a black box.
        </p>
      </section>

      <section className="section-wrap">
        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            How payments and data are handled
          </p>
          <div className="mt-4 space-y-3">
            {handling.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Public legal documents</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            These are the current public-facing policies. They clarify how
            the product works today without implying that billing automation,
            compliance automation, or full legal review is already complete.
          </p>
          <div className="mt-4 space-y-3">
            {publicLegalLinks.map((item) => (
              <Link
                key={item.href}
                className="block rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted transition hover:bg-white"
                href={item.href}
              >
                <p className="font-semibold text-ink">{item.label}</p>
                <p className="mt-1">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          Product safeguards
        </p>
        <div className="foundry-card-grid mt-6">
          {controls.map((item) => (
            <article
              key={item}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5 text-sm text-muted"
            >
              {item}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
