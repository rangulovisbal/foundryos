import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  LayoutDashboard,
  Lock,
  Sparkles,
  Workflow,
  Wrench
} from "lucide-react";

import { LeadCaptureForm } from "@/components/lead-capture-form";
import { pricingPlans } from "@/lib/pricing";
import { generateSnapshotReport, sampleIntake } from "@/lib/snapshot";

const report = generateSnapshotReport(sampleIntake);

const heroBullets = [
  "Built for startups and lean teams already selling something real",
  "Structured first outputs after intake review",
  "No need to hire a full senior growth and ops team"
];

const firstValue = [
  {
    icon: Sparkles,
    title: "1 business scorecard",
    body: "A maturity read, primary bottleneck and business score that tells you where the drag really is."
  },
  {
    icon: Workflow,
    title: "1 roadmap for the next 30 days",
    body: "A focused execution plan with concrete priorities instead of a vague strategy document."
  },
  {
    icon: Wrench,
    title: "SOP and automation opportunities",
    body: "A shortlist of the repeated tasks that should become systems before you add more people."
  },
  {
    icon: LayoutDashboard,
    title: "A structured operating view",
    body: "Priority cards, risks, quick wins and dashboard logic that make the next move obvious."
  }
];

const steps = [
  {
    title: "Tell us how the business runs today",
    body: "You complete a structured intake covering offer, channel mix, team size, goals and bottlenecks."
  },
  {
    title: "FoundryOS scores and structures the work",
    body: "The system translates your inputs into a scorecard, roadmap, automation backlog and execution priorities."
  },
  {
    title: "You receive outputs that are usable immediately",
    body: "You get a plan you can execute, not a slide deck you need to reinterpret."
  }
];

const dashboardBlocks = [
  {
    title: "Business scorecard",
    items: [
      `${report.score}/100 operating score`,
      `${report.maturity} maturity stage`,
      report.headline
    ]
  },
  {
    title: "Priority roadmap",
    items: report.priorities.slice(0, 3).map((priority) => priority.title)
  },
  {
    title: "SOP starter",
    items: [
      "Weekly growth review cadence",
      "Lead-to-onboarding handoff checklist",
      "Async operating review template"
    ]
  },
  {
    title: "Automation shortlist",
    items: report.automationOpportunities.slice(0, 3)
  }
];

const fit = {
  yes: [
    "Startups and digital businesses with validated demand",
    "Lean teams that need a clearer operating system",
    "Founders who want structure before adding headcount",
    "Teams open to workflows, dashboards and async execution"
  ],
  no: [
    "Businesses that need a fully custom agency relationship",
    "Teams expecting unlimited calls and open-ended revisions",
    "Companies that want card processing or support handled outside Stripe",
    "High-touch consulting engagements without product boundaries"
  ]
};

const trustPoints = [
  "Payments handled securely by Stripe",
  "No payment card data stored by the product",
  "Security and legal pages are visible",
  "Lead capture protected with rate limiting and optional Cloudflare Turnstile"
];

const beforeAfter = {
  before: [
    "Priorities live in the founder's head",
    "Tasks keep moving without one operating model",
    "Manual work grows faster than the team",
    "Strategy exists, but execution stays fragmented"
  ],
  after: [
    "One scorecard tells the team what matters now",
    "The next 30 days are turned into visible priorities",
    "SOP and automation opportunities become obvious",
    "The product creates a clearer path from diagnosis to execution"
  ]
};

const faqs = [
  {
    question: "What do I get first?",
    answer:
      "The first deliverable is AI Snapshot: a business scorecard, 30-day roadmap, quick wins, key risks and a recommended starter stack."
  },
  {
    question: "How fast is the first value?",
    answer:
      "The pilot is designed to deliver structured first outputs quickly after intake review. Exact timing depends on the current deployment and whether billing or follow-up steps are still manual."
  },
  {
    question: "Do you store payment data?",
    answer:
      "No. When checkout is enabled, billing is handled by Stripe. The product does not process or store payment card details."
  },
  {
    question: "Who should start with Snapshot?",
    answer:
      "Teams that need clarity first. Snapshot is the fastest way to understand whether the next step should be a one-off diagnostic, FoundryOS Core or a custom Operator rollout."
  },
  {
    question: "Is everything fully automated?",
    answer:
      "No, and that is intentional. The system is productized and structured, but the priority is useful outputs and good decisions, not automation theater."
  }
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FoundryOS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-first operating system for small businesses and startups that need a 30-day plan, better execution and cleaner operations without hiring a full senior team.",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "99",
      highPrice: "699",
      priceCurrency: "EUR"
    }
  };

  return (
    <div className="page-shell space-y-8 pt-0">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />

      <section className="surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
        <div className="relative">
          <div className="grid-lines absolute inset-0 rounded-[32px] opacity-40" />
          <div className="relative z-10 mx-auto max-w-5xl space-y-7 text-center">
              <span className="eyebrow justify-center">
                AI-first operating system for startups and lean teams
              </span>
              <div className="space-y-4">
                <h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-7xl">
                  Get a 30-day operating plan and execution roadmap without
                  hiring a full team.
                </h1>
                <p className="mx-auto max-w-3xl body-lg">
                  FoundryOS gives you a business scorecard, roadmap, SOP
                  starters and automation opportunities in a structured
                  AI-first workflow built for lean teams.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  className="foundry-primary-button rounded-full"
                  href="/pricing#plans"
                >
                  Get your AI Snapshot <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-ink underline-offset-4 hover:underline"
                  href="#sample-output"
                >
                  See sample output
                </Link>
              </div>

              <ul className="mx-auto grid max-w-4xl gap-3 text-sm text-muted md:grid-cols-3">
                {heroBullets.map((item) => (
                  <li
                    key={item}
                    className="rounded-[22px] border border-[color:var(--border)] bg-white/85 px-4 py-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="surface-strong p-6 text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                First value
              </p>
              <div className="mt-4 grid gap-4">
                <div className="metric-card">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    Operating score
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-5xl font-semibold">{report.score}</p>
                    <span className="pill bg-teal/15 text-teal">
                      {report.maturity}
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    Next 30 days
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-muted">
                    {report.priorities.slice(0, 3).map((priority) => (
                      <li
                        key={priority.title}
                        className="rounded-2xl border border-[color:var(--border)] bg-sand/60 px-4 py-3"
                      >
                        {priority.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="surface-strong p-6 text-left">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                What this replaces
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Random task lists with no operating logic
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Strategy docs that never become an execution plan
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Manual chaos that grows faster than the team can handle
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-6 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">What you get in 24 hours</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              The first deliverable is tangible, not conceptual.
            </h2>
          </div>
          <p className="max-w-2xl body-lg">
            The product should show value immediately: a scorecard, next actions,
            system recommendations and a clearer operating view.
          </p>
        </div>

        <div className="foundry-card-grid mt-10">
          {firstValue.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-[26px] border border-[color:var(--border)] bg-white/85 p-6"
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

      <section className="surface p-6 md:p-10">
        <span className="eyebrow">How it works</span>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-10" id="sample-output">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">What the dashboard includes</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              Scorecards, roadmap cards, SOP starters and automation queue.
            </h2>
          </div>
          <p className="max-w-2xl body-lg">
            This is the kind of output the system is designed to deliver:
            visible priorities, next steps and operating logic in one place.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-[color:var(--border)] bg-ink p-6 text-sand">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  Sample account
                </p>
                <h3 className="mt-2 text-3xl font-semibold">
                  {sampleIntake.companyName}
                </h3>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sand/70">
                  Operating score
                </p>
                <p className="mt-2 text-5xl font-semibold">{report.score}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sand/70">
                  Immediate focus
                </p>
                <ul className="mt-3 space-y-3 text-sm text-sand/85">
                  {report.monthlyFocus.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sand/70">
                  Quick wins
                </p>
                <ul className="mt-3 space-y-3 text-sm text-sand/85">
                  {report.quickWins.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {dashboardBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  {block.title}
                </p>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  {block.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-[color:var(--border)] bg-sand/65 px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap">
        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Before FoundryOS</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            The usual starting point is operational noise.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            {beforeAfter.before.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface p-6 md:p-8">
          <span className="eyebrow">After FoundryOS</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            The goal is a business that knows what to do next.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            {beforeAfter.after.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-wrap">
        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Who it is for</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            Best fit for teams that need structure before scale.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            {fit.yes.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Who it is not for</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            Not built for open-ended service work.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            {fit.no.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface p-6 md:p-8" id="plans">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Plans</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              Start with the right level of operating support.
            </h2>
          </div>
          <p className="max-w-2xl body-lg">
            Snapshot is the main starting point. FoundryOS Core is the recurring
            layer. Operator is for teams that need deeper implementation.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[28px] border p-6 ${
                plan.id === "snapshot"
                  ? "border-ink bg-ink text-sand"
                  : "border-[color:var(--border)] bg-white/85"
              }`}
            >
              <p
                className={`text-sm uppercase tracking-[0.2em] ${
                  plan.id === "snapshot" ? "text-sand/70" : "text-muted"
                }`}
              >
                {plan.cadence}
              </p>
              <h3 className="mt-3 text-3xl font-semibold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-semibold">{plan.price}</p>
              <p
                className={`mt-4 text-sm leading-7 ${
                  plan.id === "snapshot" ? "text-sand/80" : "text-muted"
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-6">
                <Link
                  className={`inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] ${
                    plan.id === "snapshot"
                      ? "text-sand"
                      : "text-ink underline-offset-4 hover:underline"
                  }`}
                  href={plan.id === "operator" ? "#snapshot-request" : "/pricing"}
                >
                  {plan.id === "snapshot"
                    ? "See plan details"
                    : plan.id === "growth-os"
                      ? "Compare recurring plan"
                      : "Request Operator"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="foundry-dark-panel p-6 text-[#E0EBF0] md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">Security and trust</span>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">
              Trust has to be visible, especially for an AI-first product.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            The commercial promise is simple: secure checkout, clear data
            handling and structured outputs without hype or black-box pricing.
          </p>
        </div>

        <div className="foundry-card-grid mt-8">
          {trustPoints.map((item, index) => {
            const icons = [Lock, BadgeCheck, Clock3, LayoutDashboard];
            const Icon = icons[index];

            return (
              <article
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-medium text-white/72">{item}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">FAQ</span>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
            >
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <LeadCaptureForm />
    </div>
  );
}
