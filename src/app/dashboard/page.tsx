import { SnapshotReportView } from "@/components/snapshot-report";
import { generateSnapshotReport, sampleIntake } from "@/lib/snapshot";

const report = generateSnapshotReport(sampleIntake);

const metrics = [
  {
    label: "MRR target",
    value: "EUR4.5k",
    note: "Base-case month 6 with 12 core and 3 premium accounts."
  },
  {
    label: "Primary KPI",
    value: "Snapshot -> subscription",
    note: "The wedge has to convert into recurring value, not just one-off audits."
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
            <span className="eyebrow">Dashboard demo</span>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
              Example operating dashboard for an early account.
            </h1>
          </div>
          <p className="max-w-2xl body-lg">
            This view is seeded from a sample account and the same scoring engine
            used by the intake flow. It gives the product a working core even
            before live data integrations are connected.
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
