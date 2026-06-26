import Link from "next/link";
import { headers } from "next/headers";
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
  "Built for early-stage businesses already trying to sell something real",
  "Founder-entered evidence first, not fake autonomous certainty",
  "Clear diagnosis and a practical 30-day marketing plan"
];

const firstValue = [
  {
    icon: Sparkles,
    title: "1 marketing diagnosis",
    body: "A structured read of what is missing in your offer clarity, audience, message, channels, conversion path, proof, and measurement."
  },
  {
    icon: Workflow,
    title: "1 set of marketing priorities",
    body: "A focused set of marketing priorities for the next 30 days instead of a vague strategy document."
  },
  {
    icon: Wrench,
    title: "Marketing assets and workflows",
    body: "Reusable messaging, channel, checklist, and execution workflows that support the plan without pretending to run the business for you."
  },
  {
    icon: LayoutDashboard,
    title: "A visible plan you can actually use",
    body: "Priorities, quick wins, risks, and weekly actions that make the next move obvious."
  }
];

const sampleMarketingNarrative =
  "The business has a real offer and visible traction, but the current marketing still lacks a sharper message, clearer proof, and a more reliable conversion path.";

const sampleMarketingPriorities = [
  "Sharpen the homepage promise and primary CTA",
  "Turn proof into visible trust signals across site and outreach",
  "Set one weekly measurement rhythm for traffic, leads, and conversion"
];

const sampleImmediateFocus = [
  "Rewrite the core offer so a first-time visitor understands it in one pass.",
  "Align one main channel and one CTA instead of spreading effort everywhere.",
  "Make the next 30 days measurable with a small set of marketing signals."
];

const sampleQuickWins = [
  "Add two proof elements above the fold on the homepage.",
  "Publish one clear founder intro post that explains the offer and who it is for.",
  "Track one conversion action consistently across site and outreach."
];

const sampleWorkflowStarter = [
  "Weekly marketing review cadence",
  "Lead follow-up checklist",
  "Content and campaign review template"
];

const sampleExecutionSupport = [
  "Lead capture form routed into one shared pipeline.",
  "Simple follow-up sequence after inbound inquiries.",
  "Weekly reporting template for traffic, leads, and conversion."
];

const steps = [
  {
    title: "Show how your marketing looks today",
    body: "You complete a structured intake covering offer, audience, message, channels, CTA, proof, and measurement."
  },
  {
    title: "FoundryOS creates your diagnosis",
    body: "The system translates your saved inputs into a marketing diagnosis, clear priorities, and a practical first plan."
  },
  {
    title: "Turn it into the next 30 days",
    body: "Use the plan, assets, and routines as a starting point, then refine them as you collect real feedback."
  }
];

const dashboardBlocks = [
  {
    title: "Marketing diagnosis",
    items: [
      `${report.score}/100 marketing clarity score`,
      `${report.maturity} maturity stage`,
      sampleMarketingNarrative
    ]
  },
  {
    title: "Marketing priorities",
    items: sampleMarketingPriorities
  },
  {
    title: "Marketing workflow starter",
    items: sampleWorkflowStarter
  },
  {
    title: "Execution support",
    items: sampleExecutionSupport
  }
];

const evidenceSignals = [
  {
    label: "Website",
    value: sampleIntake.website,
    detail: "Used as the public reference point"
  },
  {
    label: "Main channel",
    value: sampleIntake.mainChannel,
    detail: "Grounds acquisition recommendations"
  },
  {
    label: "Tools",
    value: sampleIntake.currentTools,
    detail: "Shows the current measurement and execution stack"
  },
  {
    label: "Pricing model",
    value: sampleIntake.pricingModel || "Not provided",
    detail: "Optional commercial context, not private financial data"
  }
];

const marketingSignals = [
  {
    label: "Analytics",
    value: sampleIntake.hasAnalytics ? "Present" : "Missing",
    status: sampleIntake.hasAnalytics ? "usable signal" : "assumption to sharpen"
  },
  {
    label: "Workflows",
    value: sampleIntake.hasDocumentedSOPs ? "Documented" : "Not documented",
    status: sampleIntake.hasDocumentedSOPs ? "repeatable" : "needs structure"
  },
  {
    label: "Execution support",
    value: sampleIntake.openToAutomation ? "Open" : "Not ready",
    status: sampleIntake.openToAutomation ? "implementation path" : "manual first"
  }
];

const fit = {
  yes: [
    "Early-stage businesses that need clarity on what is missing in their marketing",
    "Lean teams that need better offer, audience, message, and channel focus",
    "Founders who want a practical next 30 days instead of generic advice",
    "Teams open to structured planning, reusable assets, and repeatable workflows"
  ],
  no: [
    "Businesses that need a fully custom agency relationship",
    "Teams expecting unlimited calls and open-ended revisions",
    "Teams expecting the product to run marketing autonomously",
    "High-touch consulting engagements without a defined scope"
  ]
};

const trustPoints = [
  "Free self-serve starter path",
  "Stripe checkout only when paid plans are configured",
  "Security and legal pages are visible",
  "Lead capture protected with rate limiting and optional Cloudflare Turnstile"
];

const beforeAfter = {
  before: [
    "The offer is hard to explain clearly",
    "Audience, message, and channels keep shifting",
    "Traffic or outreach exists, but conversion stays fuzzy",
    "The founder knows something is off, but not what to fix first"
  ],
  after: [
    "One diagnosis shows what is missing in the current marketing setup",
    "The next 30 days become visible marketing priorities",
    "Message, channel, and workflow gaps become easier to act on",
    "The product creates a clearer path from diagnosis to execution"
  ]
};

const faqs = [
  {
    question: "What do I get first?",
    answer:
      "FoundryOS starts with a marketing diagnosis, 30-day priorities, quick wins, key risks, and a practical first action plan."
  },
  {
    question: "How fast is the first value?",
    answer:
      "The product is designed to create a structured first output quickly after intake. Quality still depends on how specific and complete your saved marketing context is."
  },
  {
    question: "Do you store payment data?",
    answer:
      "No payment is required for the starter path. If paid plans are enabled, checkout is handled by Stripe and FoundryOS does not store card data."
  },
  {
    question: "Who should start with Snapshot?",
    answer:
      "Teams that need clarity first. Snapshot is the fastest way to understand what is missing in their marketing before deciding whether they need a one-off diagnosis, recurring planning, or deeper implementation support."
  },
  {
    question: "Is everything fully automated?",
    answer:
      "No, and that is intentional. The system is productized and structured, but the priority is useful outputs and good decisions, not automation theater."
  }
];

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FoundryOS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Self-serve marketing diagnosis and 30-day marketing planning for early-stage businesses that need clearer priorities without pretending to run the business autonomously."
  };

  return (
    <div className="page-shell space-y-8 pt-0">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        nonce={nonce}
        // React 19 clears the nonce attribute on the client for security, so the
        // server (nonce set) and client (nonce blanked) markup differ. This is a
        // benign, expected mismatch for a non-executed JSON-LD data block.
        suppressHydrationWarning
        type="application/ld+json"
      />

      <section className="surface overflow-hidden px-5 py-10 md:px-10 md:py-14">
        <div className="relative">
          <div className="grid-lines absolute inset-0 rounded-[32px] opacity-40" />
          <div className="relative z-10 mx-auto max-w-5xl space-y-7 text-center">
            <span className="eyebrow justify-center">
              Self-serve marketing diagnosis and 30-day planning
            </span>
            <div className="space-y-4">
              <h1 className="mx-auto max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-7xl">
                Get a 30-day{" "}
                <span className="font-serif-display tracking-[-0.03em]">
                  marketing plan
                </span>{" "}
                after seeing what your marketing is missing.
              </h1>
              <p className="mx-auto max-w-3xl body-lg">
                FoundryOS helps early-stage businesses diagnose what is missing
                in their marketing, then turns saved business context into clear
                priorities, reusable assets, and a practical 30-day plan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                className="foundry-primary-button rounded-full"
                href="/signup"
              >
                Start free <ArrowRight className="h-4 w-4" />
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
                  className="rounded-[22px] border border-[color:var(--border)] bg-white/82 px-4 py-4"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mx-auto mt-10 max-w-5xl rounded-[32px] border border-[color:var(--border)] bg-[#f7f5ee]/90 p-3 shadow-[0_28px_80px_-55px_rgba(5,26,36,0.65)] md:p-5">
            <div className="rounded-[26px] border border-[color:var(--border)] bg-white/82 p-4 md:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-teal/80" />
                <span className="ml-auto hidden h-2 w-32 rounded-full bg-ink/10 sm:block" />
              </div>
              <div className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    FoundryOS marketing diagnosis
                  </p>
                  <h2 className="mt-2 text-left text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
                    {sampleIntake.companyName}
                  </h2>
                </div>
                <span className="pill bg-teal/15 text-teal">{report.maturity}</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <article className="rounded-[24px] border border-[color:var(--border)] bg-sand/55 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Marketing clarity score
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-6xl font-semibold tracking-[-0.08em]">
                      {report.score}
                    </p>
                    <p className="pb-2 text-sm font-semibold text-muted">/100</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${report.score}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {sampleMarketingNarrative}
                  </p>
                </article>

                <article className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Next 30 days
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {sampleMarketingPriorities.map((priority) => (
                      <div
                        className="rounded-2xl border border-[color:var(--border)] bg-[#fbfaf7] p-4"
                        key={priority}
                      >
                        <p className="text-sm font-semibold leading-6">{priority}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {marketingSignals.map((signal) => (
                  <div
                    className="rounded-[20px] border border-[color:var(--border)] bg-white/75 p-4 text-left"
                    key={signal.label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                      {signal.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                      {signal.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">What you get after intake</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            The deliverables feel{" "}
            <span className="font-serif-display tracking-[-0.02em]">usable</span>,
            not conceptual.
          </h2>
          <p className="mt-4 body-lg">
            The product creates a structured first output quickly, then keeps
            the guidance grounded in the evidence and context you provide.
          </p>
        </div>

        <div className="foundry-card-grid mt-10">
          {firstValue.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-[28px] border border-[color:var(--border)] bg-white/85 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-sand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">How it works</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
            The flow stays{" "}
            <span className="font-serif-display tracking-[-0.02em]">simple</span>{" "}
            so the output stays usable.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-white/85 p-6"
            >
              <div className="absolute right-5 top-5 h-16 w-16 rounded-full border border-[color:var(--border)] bg-sand/80" />
              <p className="relative text-sm font-semibold uppercase tracking-[0.22em] text-muted">
                0{index + 1}
              </p>
              <h3 className="relative mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="relative mt-3 text-sm leading-7 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-10" id="sample-output">
        <div className="mx-auto max-w-4xl text-center">
          <span className="eyebrow justify-center">What the dashboard includes</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            Diagnosis, priorities, assets and{" "}
            <span className="font-serif-display tracking-[-0.02em]">
              reusable workflows.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl body-lg">
            This is the kind of output the system is designed to deliver:
            visible marketing priorities, next steps, and execution support in
            one place.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-[color:var(--border)] bg-ink p-6 text-sand shadow-[0_28px_70px_-48px_rgba(5,26,36,0.75)]">
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
                  Marketing clarity score
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
                  {sampleImmediateFocus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sand/70">
                  Quick wins
                </p>
                <ul className="mt-3 space-y-3 text-sm text-sand/85">
                  {sampleQuickWins.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sand/70">
                Evidence used in this sample
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {evidenceSignals.map((signal) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                    key={signal.label}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-sand/55">
                      {signal.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-sand">
                      {signal.value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-sand/60">
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {dashboardBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-[26px] border border-[color:var(--border)] bg-white/85 p-5"
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

      <section className="grid gap-5 md:grid-cols-2">
        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Before FoundryOS</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            The usual starting point is marketing ambiguity.
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
            The goal is a business that knows what to fix next.
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

      <section className="grid gap-5 md:grid-cols-2">
        <div className="surface p-6 md:p-8">
          <span className="eyebrow">Who it is for</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
            Best fit for teams that need marketing clarity before scale.
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

      <section className="surface p-6 md:p-10" id="plans">
        <div className="mx-auto max-w-4xl text-center">
          <span className="eyebrow justify-center">Plans</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            Start with the right level of{" "}
            <span className="font-serif-display tracking-[-0.02em]">
              marketing support.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl body-lg">
            The free starter path is the main starting point. FoundryOS Core is
            the recurring planning layer. Assisted support is for teams that
            need deeper implementation.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[30px] border p-6 ${
                plan.id === "snapshot"
                  ? "border-ink bg-ink text-sand shadow-[0_30px_80px_-50px_rgba(5,26,36,0.85)]"
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
                  href={plan.id === "snapshot" ? "/signup" : "/pricing"}
                >
                  {plan.id === "snapshot"
                    ? "Start free"
                    : plan.id === "growth-os"
                      ? "Compare recurring plan"
                      : "Compare assisted"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="foundry-dark-panel p-6 text-[#E0EBF0] md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
            Security and trust
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Trust has to be{" "}
            <span className="font-serif-display tracking-[-0.02em]">visible</span>,
            especially when planning touches real customer-facing work.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            The promise is simple: clear data handling, evidence-linked outputs,
            and checkout only when paid plans are configured.
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

      <section className="surface p-6 md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="eyebrow justify-center">FAQ</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
            Questions teams ask{" "}
            <span className="font-serif-display tracking-[-0.02em]">
              before starting.
            </span>
          </h2>
        </div>
        <div className="mx-auto mt-8 max-w-4xl divide-y divide-[color:var(--border)] rounded-[28px] border border-[color:var(--border)] bg-white/80">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group px-5 py-5 open:bg-white/70 md:px-7"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="text-lg font-semibold">{faq.question}</span>
                <span className="text-xl text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <LeadCaptureForm />
    </div>
  );
}
