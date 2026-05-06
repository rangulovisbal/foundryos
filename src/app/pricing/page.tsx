import Link from "next/link";
import { BadgeCheck, Lock, Receipt, ShieldCheck } from "lucide-react";

import { CheckoutButton } from "@/components/checkout-button";
import { isPlanCheckoutConfigured, pricingPlans } from "@/lib/pricing";

const planIncludes: Record<string, string[]> = {
  snapshot: [
    "1 marketing diagnosis",
    "1 evidence-backed diagnostic summary",
    "1 marketing priorities map for the next 30 days",
    "1 quick-wins list",
    "1 starter channel and measurement checklist"
  ],
  "growth-os": [
    "Monthly refreshed marketing priorities",
    "30-day marketing plan tracking",
    "Marketing asset drafting",
    "Marketing workflow support",
    "Measurement and reporting prompts"
  ],
  operator: [
    "Integrations and connectors",
    "Active implementation support",
    "Role-specific agents",
    "Deeper reporting",
    "Priority support"
  ]
};

const trustItems = [
  "First pilot is free, assisted, and manually reviewed",
  "Stripe checkout stays disabled until paid provisioning is verified",
  "Security and legal policy pages are visible",
  "Clear plan boundaries and no hidden scope creep"
];

const notIncluded = [
  "Unlimited meetings",
  "Infinite revisions",
  "Deep brand strategy",
  "Constant manual implementation",
  "Improvised WhatsApp support",
  "Custom work outside scope"
];

export default function PricingPage() {
  const hasLiveCheckout = pricingPlans.some(
    (plan) => plan.checkoutEnabled && isPlanCheckoutConfigured(plan.id)
  );
  const purchaseSteps = [
    {
      title: "Start access with the current billing mode",
      body: hasLiveCheckout
        ? "Checkout happens on Stripe when it is enabled on this deployment. The product does not store card data."
        : "This deployment is running the free assisted design-partner pilot, so access starts with manual review instead of live checkout."
    },
    {
      title: "Complete the intake",
      body: "Once access starts, you provide the business and marketing context needed to diagnose what is missing and build the plan."
    },
    {
      title: "Receive your first outputs",
      body: "Pilot customers receive a founder-reviewed marketing diagnosis and 30-day marketing plan. Recurring refreshes stay assisted-service language until 2-3 pilot cycles prove what should repeat."
    }
  ] as const;

  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Pricing</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Clear plans, clear deliverables, clear next marketing step.
        </h1>
        <p className="mt-4 max-w-3xl body-lg">
          Start with the assisted Snapshot pilot if you need clarity on what is
          missing in your marketing and what to do in the next 30 days.
          FoundryOS Core and Operator remain future packaging until the first
          pilots prove the repeatable workflow.
        </p>
        {!hasLiveCheckout ? (
          <p className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
            This deployment is running the free assisted design-partner pilot.
            Public checkout is disabled, so use the request form and we will
            follow up manually.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-3" id="plans">
        {pricingPlans.map((plan) => (
          <article
            id={plan.id}
            key={plan.name}
            className={`surface p-6 ${
              plan.id === "snapshot" ? "ring-2 ring-ink/10" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">
                  {plan.cadence}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                  {plan.name}
                </h2>
              </div>
              <span className="pill bg-coral/15 text-coral">{plan.price}</span>
            </div>

            <p className="mt-4 text-sm leading-7 text-muted">{plan.description}</p>

            <ul className="mt-6 space-y-3 text-sm text-muted">
              {planIncludes[plan.id].map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.checkoutEnabled && isPlanCheckoutConfigured(plan.id) ? (
                <CheckoutButton planId={plan.id}>{plan.ctaLabel}</CheckoutButton>
              ) : (
                <Link
                  className="inline-flex w-full items-center justify-center rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand transition hover:opacity-90"
                  href="/#snapshot-request"
                >
                  {plan.checkoutEnabled ? "Request access" : plan.ctaLabel}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">What happens after access starts</span>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {purchaseSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
            >
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Trust and handling</span>
        <div className="foundry-card-grid mt-6">
          {[Lock, Receipt, ShieldCheck, BadgeCheck].map((Icon, index) => (
            <article
              key={trustItems[index]}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sand">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {trustItems[index]}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Not included by default</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
          Scope is controlled so the product stays fast and useful.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notIncluded.map((item) => (
            <div
              key={item}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5 text-sm text-muted"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
