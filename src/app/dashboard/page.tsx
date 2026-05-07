import { SnapshotReportView } from "@/components/snapshot-report";
import { generateSnapshotReport, sampleIntake } from "@/lib/snapshot";
import type { SnapshotReport } from "@/lib/types";

const report = generateSnapshotReport(sampleIntake);
const displayReport: SnapshotReport = {
  ...report,
  summary:
    "This sample shows how FoundryOS turns founder-entered business and marketing context into a structured diagnosis, marketing priorities, and a practical first 30-day plan.",
  headline:
    "The business has real traction, but the marketing still needs clearer message, stronger proof, and a tighter conversion path.",
  recommendedPlan: "Marketing Snapshot" as const,
  monthlyFocus: [
    "Clarify the offer and headline so the right buyer understands it quickly.",
    "Strengthen proof, CTA, and channel consistency across the main touchpoints.",
    "Track one simple weekly rhythm for traffic, leads, and conversion."
  ],
  priorities: [
    {
      title: "Sharpen the homepage promise and primary CTA",
      impact: "High",
      effort: "Low",
      owner: "Founder / Marketing",
      rationale:
        "A clearer promise and CTA improve first-impression clarity before more traffic is added."
    },
    {
      title: "Make proof visible in the places prospects already look",
      impact: "High",
      effort: "Medium",
      owner: "Founder / Marketing",
      rationale:
        "Trust signals reduce friction when the audience is still deciding whether the offer is credible."
    },
    {
      title: "Choose one main channel and one weekly measurement rhythm",
      impact: "Medium",
      effort: "Low",
      owner: "Founder / Marketing",
      rationale:
        "A narrower channel focus makes it easier to see what message and conversion changes are actually working."
    }
  ],
  quickWins: [
    "Add two visible proof elements above the fold.",
    "Rewrite the founder intro so the audience and offer are obvious.",
    "Track one conversion action consistently across site and outreach."
  ],
  automationOpportunities: [
    "Route lead capture into one shared follow-up pipeline.",
    "Create a lightweight follow-up sequence for inbound interest.",
    "Use one weekly reporting template for traffic, leads, and conversion."
  ],
  risks: [
    "The current message may still be too broad for the best-fit buyer.",
    "Traffic can keep arriving without stronger proof and CTA alignment.",
    "Too many channels at once can hide what is actually converting."
  ],
  suggestedStack: [
    "Simple analytics dashboard for traffic and conversion",
    "One CRM or pipeline for inbound follow-up",
    "Shared content and campaign planning workspace"
  ]
};

const metrics = [
  {
    label: "First read",
    value: "30-day plan",
    note: "The output is structured around immediate priorities, not generic advice."
  },
  {
    label: "Visible value",
    value: "Diagnosis + plan",
    note: "The sample output combines a marketing diagnosis, priorities, and action logic in one view."
  },
  {
    label: "Support model",
    value: "Async-first",
    note: "Protect margin and founder attention with clear scope and response patterns."
  }
];

const modules = [
  "Marketing intake",
  "Marketing diagnosis",
  "Marketing priorities",
  "30-day plan",
  "Marketing assets",
  "Marketing workflows"
];

export default function DashboardPage() {
  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Sample output</span>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
              See the kind of marketing diagnosis and 30-day plan the product is designed to deliver.
            </h1>
          </div>
          <p className="max-w-2xl body-lg">
            This view is seeded from a sample account and the same structured
            intake logic used by the product. The goal is to make what is
            missing in the current marketing, and what to do next, visible at a
            glance.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-3 text-sm text-muted">{metric.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          Modules
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <article
              key={item}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5 text-base font-medium"
            >
              {item}
            </article>
          ))}
        </div>
      </section>

      <SnapshotReportView
        report={displayReport}
        title={`${sampleIntake.companyName} marketing snapshot`}
      />
    </div>
  );
}
