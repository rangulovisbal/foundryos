import { SnapshotReportView } from "@/components/snapshot-report";
import { generateSnapshotReport, sampleIntake } from "@/lib/snapshot";

const report = generateSnapshotReport(sampleIntake);

const metrics = [
  {
    label: "First read",
    value: "30-day plan",
    note: "The output is structured around immediate priorities, not generic advice."
  },
  {
    label: "Visible value",
    value: "Score + roadmap",
    note: "The sample output combines diagnosis, priorities and action logic in one view."
  },
  {
    label: "Support model",
    value: "Async-first",
    note: "Protect margin and founder attention with clear scope and response patterns."
  }
];

const modules = [
  "Intake and score engine",
  "Operating roadmap",
  "SOP library",
  "Automation backlog",
  "Metrics layer",
  "Monthly refresh loop"
];

export default function DashboardPage() {
  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Sample output</span>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
              See the kind of operating view the product is designed to deliver.
            </h1>
          </div>
          <p className="max-w-2xl body-lg">
            This view is seeded from a sample account and the same scoring engine
            used by the intake flow. The goal is to make priorities, quick wins
            and automation opportunities visible at a glance.
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
        report={report}
        title={`${sampleIntake.companyName} operating snapshot`}
      />
    </div>
  );
}
