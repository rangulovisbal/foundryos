import { CheckoutButton } from "@/components/checkout-button";
import { pricingPlans } from "@/lib/pricing";

const planIncludes: Record<string, string[]> = {
  snapshot: [
    "Business scorecard",
    "Diagnostic summary",
    "30-day priorities",
    "Quick wins and main risks",
    "Suggested starter stack"
  ],
  "growth-os": [
    "Monthly refresh and reprioritization",
    "Operating roadmap",
    "Base assets and templates",
    "SOP library",
    "Suggested automations and dashboard"
  ],
  operator: [
    "Connectors and active workflows",
    "Function-specific agents",
    "Deeper reporting",
    "Priority support",
    "Higher usage limits"
  ]
};

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
        <span className="eyebrow">Pricing architecture</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Sell outcomes and structure, not endless founder time.
        </h1>
        <p className="mt-4 max-w-3xl body-lg">
          The base offer is intentionally scoped. The product should scale
          through templates, refresh loops, automation and async support, not
          through ad hoc work.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article key={plan.name} className="surface p-6">
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
              <CheckoutButton planId={plan.id}>Open Stripe checkout</CheckoutButton>
            </div>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Scope protection</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
          What the core product does not include
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
