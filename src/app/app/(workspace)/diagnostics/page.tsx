import Link from "next/link";

import { DiagnosticsRunButton } from "@/components/diagnostics-run-button";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import {
  getBusinessProfile,
  getLatestDiagnosticResult,
  listDiagnosticJobsWithResults
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canManageWorkspace,
  canRunDiagnostics,
  getUsageCounter,
  isLockedState,
  isReadOnlyState,
  type DiagnosticResultRecord,
  type OutputLanguage
} from "@/lib/foundation";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean
) {
  if (!hasProfile) {
    return "Complete and save the business profile before running diagnostics.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "Diagnostics are locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "Diagnostics are read-only while this workspace account state is limited.";
  }

  if (!canManageWorkspace(context.membership.role, context.workspace.accountState)) {
    return "Only workspace owners and admins can run diagnostics in this MVP.";
  }

  const counter = getUsageCounter(context, "diagnostic_runs");
  if (!counter) {
    return "This workspace does not have a diagnostic run entitlement configured.";
  }

  if (counter.usedCount >= counter.limitCount) {
    return `Diagnostic run limit reached: ${counter.usedCount}/${counter.limitCount}.`;
  }

  return "Diagnostic runs are unavailable.";
}

function formatOutputLanguageLabel(language: OutputLanguage) {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function DiagnosticsPage() {
  const context = await requireWorkspaceContext("/app/diagnostics");
  const [profile, latestResult, history] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    listDiagnosticJobsWithResults(context.workspace.id, 10)
  ]);
  const counter = getUsageCounter(context, "diagnostic_runs");
  const canRun = canRunDiagnostics(context) && Boolean(profile);
  const disabledReason = resolveDisabledReason(context, Boolean(profile));

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Diagnostics</span>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              Structured business diagnostics with persisted history.
            </h2>
            <p className="mt-4 body-lg">
              Each run creates a job record, saves a structured result, and uses
              workspace entitlements before allowing another run.
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Usage
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {counter?.usedCount ?? 0}/{counter?.limitCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-muted">Diagnostic runs this period</p>
          </div>
        </div>
        <div className="mt-6">
          <DiagnosticsRunButton canRun={canRun} disabledReason={disabledReason} />
        </div>
        <div className="mt-6 space-y-4">
          <PageSummaryGrid
            items={[
              {
                label: "Latest score",
                value: latestResult ? `${latestResult.overallMaturityScore}/100` : "Missing",
                detail: latestResult
                  ? `Confidence: ${localizeConfidence(latestResult.confidence, context.workspace.outputLanguage)}.`
                  : "Run diagnostics after saving the profile."
              },
              {
                label: "Category scores",
                value: String(latestResult?.categoryScores.length ?? 0),
                detail: "Structured scorecards saved with each completed run."
              },
              {
                label: "Run usage",
                value: `${counter?.usedCount ?? 0}/${counter?.limitCount ?? 0}`,
                detail: "Diagnostic runs tracked against workspace entitlements."
              },
              {
                label: "Output language",
                value: formatOutputLanguageLabel(context.workspace.outputLanguage),
                detail: "System UI stays in English. Generated diagnostic content follows the workspace setting."
              }
            ]}
          />
          <PageSectionLinks
            links={[
              ...(latestResult ? [{ href: "#latest-diagnostic", label: "Latest result" }] : []),
              ...(latestResult ? [{ href: "#diagnostic-scores", label: "Scores" }] : []),
              { href: "#diagnostic-history", label: "History" }
            ]}
          />
        </div>
      </section>

      {!profile ? (
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">Profile required</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Save the business profile first.
          </h2>
          <p className="mt-4 body-lg">
            Diagnostics are intentionally grounded in workspace data. This keeps
            the first product module structured and replayable.
          </p>
          <Link
            className="mt-6 inline-flex rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
            href="/app/profile"
          >
            Complete profile
          </Link>
        </section>
      ) : null}

      {latestResult ? (
        <LatestResult
          language={context.workspace.outputLanguage}
          result={latestResult}
        />
      ) : null}

      <details className="surface overflow-hidden" id="diagnostic-history">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Run history
          </p>
          <p className="mt-2 text-sm text-muted">
            Expand to review earlier diagnostic runs and failure states.
          </p>
        </summary>
        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((entry) => (
                    <tr key={entry.job.id} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">
                        {entry.result ? `${entry.result.overallMaturityScore}/100` : "n/a"}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {entry.result?.confidence ?? "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={5}>
                      No diagnostic runs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

function localizeConfidence(
  confidence: DiagnosticResultRecord["confidence"],
  language: OutputLanguage
) {
  if (language === "es") {
    return confidence === "high" ? "alta" : confidence === "medium" ? "media" : "baja";
  }

  return confidence;
}

function LatestResult({
  language,
  result
}: {
  language: OutputLanguage;
  result: DiagnosticResultRecord;
}) {
  return (
    <section className="space-y-6" id="latest-diagnostic">
      <div className="surface p-6 md:p-8">
        <span className="eyebrow">Latest result</span>
        <div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[28px] border border-[color:var(--border)] bg-ink p-6 text-sand">
            <p className="text-sm uppercase tracking-[0.18em] text-sand/70">
              Maturity score
            </p>
            <p className="mt-4 text-6xl font-semibold">
              {result.overallMaturityScore}
            </p>
            <p className="mt-2 text-sm text-sand/70">
              Confidence: {localizeConfidence(result.confidence, language)}
            </p>
          </div>
          <div>
            <h3 className="text-3xl font-semibold tracking-[-0.04em]">
              {result.summary}
            </h3>
            <p className="mt-4 text-sm text-muted">
              Saved {new Date(result.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-5" id="diagnostic-scores">
        {result.categoryScores.map((category) => (
          <article key={category.key} className="metric-card">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              {category.label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{category.score}</p>
            <p className="mt-2 text-sm text-muted">{category.rationale}</p>
          </article>
        ))}
      </section>

      <DiagnosticCardGroup
        title="Captured input signals"
        items={result.evidenceCards.map((item) => ({
          title: item.title,
          body: `${item.observation} ${item.implication}`,
          meta: "evidence"
        }))}
      />
      <DiagnosticCardGroup
        title="Inferred conclusions"
        items={result.topBottlenecks.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.severity
        })).concat(result.topRisks.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.severity
        })))}
      />
      <DiagnosticCardGroup
        title="Top opportunities"
        items={result.topOpportunities.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.impact
        }))}
      />
      <DiagnosticCardGroup
        title="Recommended actions"
        items={result.recommendedNextActions.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: `${item.owner} | ${item.timeframe}`
        }))}
      />
    </section>
  );
}

function DiagnosticCardGroup({
  title,
  items
}: {
  title: string;
  items: Array<{ title: string; body: string; meta: string }>;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={`${title}-${item.title}`}
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {item.meta}
            </p>
            <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
