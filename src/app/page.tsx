import Link from "next/link";
import { ArrowRight, ChartSpline, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { LeadCaptureForm } from "@/components/lead-capture-form";

const productLadder = [
  {
    name: "AI Snapshot",
    price: "EUR79-EUR99",
    description: "Paid entry point for diagnostic, scoring and 30-day priorities."
  },
  {
    name: "AI Growth OS",
    price: "EUR149-EUR249/mo",
    description: "Core recurring layer with roadmap, assets, SOPs and monthly refresh."
  },
  {
    name: "AI Operator",
    price: "EUR499-EUR999/mo",
    description: "Premium plan with active automations, deeper reporting and priority support."
  }
];

const pillars = [
  {
    icon: Sparkles,
    title: "Diagnose before automating",
    body: "The product starts with business understanding, not with random AI gimmicks."
  },
  {
    icon: Layers3,
    title: "Structure before scale",
    body: "Every account gets a clear operating rhythm, decision stack and prioritized backlog."
  },
  {
    icon: ChartSpline,
    title: "Execution with visibility",
    body: "The dashboard exposes score, priorities, risks, assets and refresh cadence."
  },
  {
    icon: ShieldCheck,
    title: "Serious by default",
    body: "Security, compliance, async support and scope protection are built into the offer."
  }
];

const launchSequence = [
  "Sell the paid Snapshot first and use it to validate the wedge.",
  "Keep the delivery semimanual where needed, but make the product feel structured.",
  "Automate only what proves repeatable and margin-positive.",
  "Use Barcelona Activa to refine viability, legal structure and acceleration."
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Growth OS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-first operating system for small businesses and startups that need growth and operations structure without hiring a full senior team.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "79",
      highPrice: "999",
      priceCurrency: "EUR"
    }
  };

  return (
    <div className="page-shell space-y-8 pt-0">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />

      <section className="surface overflow-hidden px-6 py-8 md:px-9 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative">
            <div className="grid-lines absolute inset-0 rounded-[32px] opacity-50" />
            <div className="relative z-10 space-y-6">
              <span className="eyebrow">AI-first operating layer for lean companies</span>
              <div className="space-y-4">
                <h1 className="display max-w-4xl">
                  Clarity, execution and automation for small teams that cannot
                  afford operational chaos.
                </h1>
                <p className="max-w-2xl body-lg">
                  AI Growth OS packages strategy, marketing and operations into a
                  productized system. It diagnoses the business, prioritizes
                  actions, suggests automations and keeps the operating plan alive
                  month after month.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
                  href="/onboarding"
                >
                  Start the Snapshot <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-white/75 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
                  href="/dashboard"
                >
                  Open dashboard demo
                </Link>
              </div>

              <div className="grid gap-4 pt-4 md:grid-cols-3">
                <div className="metric-card">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    Outcome
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    30-day operating plan in days, not months
                  </p>
                </div>
                <div className="metric-card">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    Delivery
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    Dashboard, priorities, SOPs and automations
                  </p>
                </div>
                <div className="metric-card">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    Promise
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    Less manual chaos. More guided execution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-strong p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                Primary wedge
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                AI Growth OS for companies with validated product and limited internal team.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Not a classic agency. Not &quot;AI for everything&quot;. A product that
                understands the business, exposes bottlenecks and keeps pushing
                the next best move.
              </p>
            </div>

            <div className="surface-strong p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                What the customer is really buying
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Clarity instead of guesswork
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Velocity instead of drift
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  System instead of scattered effort
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Product ladder</span>
          <div className="mt-6 space-y-4">
            {productLadder.map((item) => (
              <article
                key={item.name}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                    {item.name}
                  </h3>
                  <span className="pill bg-teal/15 text-teal">{item.price}</span>
                </div>
                <p className="mt-3 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Go-to-market sequence</span>
          <div className="mt-6 space-y-4">
            {launchSequence.map((step, index) => (
              <article
                key={step}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-base text-muted">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="surface px-6 py-8 md:px-9 md:py-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Operating principles</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              The product must feel serious, fast and useful.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            The brand should not feel like hype. It should feel like a credible
            operating layer for teams that want guidance, structure and leverage.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-[26px] border border-[color:var(--border)] bg-white/80 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <LeadCaptureForm />
    </div>
  );
}
