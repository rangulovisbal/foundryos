import Link from "next/link";
import { BadgeCheck, Lock, Receipt, ShieldCheck } from "lucide-react";

import { CheckoutButton } from "@/components/checkout-button";
import { pricingPlans } from "@/lib/pricing";

const planIncludes: Record<string, string[]> = {
  snapshot: [
    "1 business scorecard",
    "1 diagnostic summary",
    "1 priority roadmap for the next 30 days",
    "1 quick-wins list",
    "1 recommended starter stack"
  ],
  "growth-os": [
    "Monthly refreshed roadmap",
    "Execution dashboard",
    "Asset generation",
    "SOP builder and operating templates",
    "Automation recommendations"
  ],
  operator: [
    "Integrations and connectors",
    "Active workflows",
    "Role-specific agents",
    "Deeper reporting",
    "Priority support"
  ]
};

const purchaseSteps = [
  {
    title: "Pay securely with Stripe",
    body: "Checkout happens on Stripe. The product does not store card data."
  },
  {
    title: "Complete the intake",
    body: "After purchase, you provide the business context needed to score the account and build the plan."
  },
  {
    title: "Receive your first outputs",
    body: "Snapshot customers receive a scorecard and roadmap. Growth OS customers move into recurring refreshes."
  }
];

const trustItems = [
  "Payments handled securely by Stripe",
  "No payment card data stored locally",
  "Security page and legal pack visible",
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
  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Pricing</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Clear plans, clear deliverables, clear next step.
        </h1>
        <p className="mt-4 max-w-3xl body-lg">
          Start with Snapshot if you need a diagnostic and a 30-day plan.
          Choose Growth OS if you want a recurring operating layer. Use Operator
          when the work includes deeper implementation and integrations.
        </p>
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
              {plan.checkoutEnabled ? (
                <CheckoutButton planId={plan.id}>{plan.ctaLabel}</CheckoutButton>
              ) : (
                <Link
                  className="inline-flex w-full items-center justify-center rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand transition hover:opacity-90"
                  href="/#snapshot-request"
                >
                  {plan.ctaLabel}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">What happens after you buy</span>
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
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
