import type { SnapshotReport } from "@/lib/types";

type SnapshotReportProps = {
  report: SnapshotReport;
  title?: string;
};

function formatRecommendedPlan(plan: SnapshotReport["recommendedPlan"]) {
  switch (plan) {
    case "AI Snapshot":
      return "Marketing Snapshot";
    case "AI Operator":
      return "Marketing Operator";
    default:
      return plan;
  }
}

export function SnapshotReportView({
  report,
  title = "Marketing Snapshot output"
}: SnapshotReportProps) {
  return (
    <section className="space-y-6">
      <div className="surface-strong p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Marketing Snapshot</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl body-lg">{report.summary}</p>
          </div>
          <div className="flex gap-4">
            <div className="metric-card min-w-[150px]">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                Marketing clarity score
              </p>
              <p className="mt-2 text-4xl font-semibold">{report.score}</p>
            </div>
            <div className="metric-card min-w-[180px]">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                Suggested path
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatRecommendedPlan(report.recommendedPlan)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-wrap">
        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Marketing diagnosis
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            {report.headline}
          </h3>
          <p className="mt-3 text-muted">
            The business is currently in a <strong>{report.maturity}</strong>{" "}
            maturity stage. The next month should be run as a focused marketing
            sprint, not as scattered execution.
          </p>
        </div>

        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            30-day focus
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {report.monthlyFocus.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Marketing priorities
          </p>
          <div className="mt-4 space-y-4">
            {report.priorities.map((priority) => (
              <article
                key={priority.title}
                className="rounded-[22px] border border-[color:var(--border)] bg-white/80 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{priority.title}</h3>
                  <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <span className="pill bg-coral/15 text-coral">
                      {priority.impact}
                    </span>
                    <span className="pill bg-teal/15 text-teal">
                      {priority.effort}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{priority.rationale}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
                  Owner: {priority.owner}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Quick wins
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {report.quickWins.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Execution support
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {report.automationOpportunities.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Risk register
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {report.risks.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Suggested channel and measurement stack
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {report.suggestedStack.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
