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
              Deterministic business diagnostics with visible evidence.
            </h2>
            <p className="mt-4 body-lg">
              Each run creates a job record, saves a structured result, shows what
              the read is based on, and uses workspace entitlements before allowing
              another run.
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
                detail: "Each score now carries visible evidence references and main drivers."
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

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}

function explanationHighlights(
  result: DiagnosticResultRecord,
  language: OutputLanguage
) {
  const basis = dedupe(
    result.categoryScores.flatMap((item) => item.basedOn ?? []).concat(
      result.evidenceCards.flatMap((item) => item.basedOn ?? [])
    )
  ).slice(0, 4);

  return basis.map((item) =>
    language === "es" ? `Basado en ${item}` : `Based on ${item}`
  );
}

function ambiguityCards(result: DiagnosticResultRecord) {
  return result.evidenceCards.filter((item) =>
    /ambiguity|ambiguedad/i.test(item.title)
  );
}

function resultHasInsufficientSignal(result: DiagnosticResultRecord) {
  return result.topBottlenecks.some((item) =>
    /not enough signal|no hay suficiente senal|insufficient signal/i.test(
      `${item.title} ${item.detail}`
    )
  );
}

function trustNote(result: DiagnosticResultRecord, language: OutputLanguage) {
  if (resultHasInsufficientSignal(result)) {
    return language === "es"
      ? "El sistema esta siendo conservador a proposito: con senal debil, el resultado solo debe orientar."
      : "The system is being intentionally conservative: with weak signal, this result should only guide direction.";
  }

  if (ambiguityCards(result).length > 0) {
    return language === "es"
      ? "Hay entradas en tension dentro del perfil, asi que la confianza baja hasta que se resuelva esa ambiguedad."
      : "Some profile inputs are in tension, so confidence is lowered until that ambiguity is resolved.";
  }

  return language === "es"
    ? "Esta lectura se genera de forma determinista a partir del perfil guardado; no es telemetria en vivo ni comprension autonoma del negocio."
    : "This read is generated deterministically from the saved profile; it is not live telemetry or autonomous business understanding.";
}

function maturityNarrative(result: DiagnosticResultRecord, language: OutputLanguage) {
  if (result.overallMaturityScore >= 75) {
    return language === "es"
      ? "La base operativa ya tiene forma y las mejoras son mas de enfoque que de supervivencia."
      : "The operating foundation is taking shape, so improvement is more about focus than basic survival.";
  }

  if (result.overallMaturityScore >= 50) {
    return language === "es"
      ? "Hay una base util, pero todavia faltan sistemas y prioridades mas consistentes."
      : "There is a usable base, but systems and priorities still need more consistency.";
  }

  return language === "es"
    ? "El resultado sigue siendo util, pero senala que faltan fundamentos antes de escalar."
    : "The result is still useful, but it points to missing fundamentals before scale.";
}

function LatestResult({
  language,
  result
}: {
  language: OutputLanguage;
  result: DiagnosticResultRecord;
}) {
  const highlights = explanationHighlights(result, language);
  const ambiguities = ambiguityCards(result);

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

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          {language === "es" ? "Por que sale este resultado" : "Why this result looks this way"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <span key={item} className="pill bg-white/85 text-ink">
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{trustNote(result, language)}</p>
        {ambiguities.length > 0 ? (
          <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {language === "es" ? "Ambiguedad a resolver" : "Ambiguity to resolve"}
            </p>
            <p className="mt-2 text-sm text-muted">{ambiguities[0].implication}</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {language === "es" ? "Madurez actual" : "Current maturity"}
          </p>
          <p className="mt-3 text-2xl font-semibold">{result.overallMaturityScore}/100</p>
          <p className="mt-2 text-sm text-muted">{maturityNarrative(result, language)}</p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {language === "es" ? "Confianza" : "Confidence"}
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {localizeConfidence(result.confidence, language)}
          </p>
          <p className="mt-2 text-sm text-muted">{trustNote(result, language)}</p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {language === "es" ? "Brechas principales" : "Top gaps"}
          </p>
          <div className="mt-4 space-y-3">
            {result.topBottlenecks.slice(0, 2).map((gap) => (
              <div
                className="rounded-[20px] border border-[color:var(--border)] bg-white/80 px-3 py-3 text-sm text-muted"
                key={gap.title}
              >
                <p className="font-semibold text-ink">{gap.title}</p>
                <p className="mt-1">{gap.detail}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {language === "es" ? "Siguiente paso" : "Next 30 days"}
          </p>
          <div className="mt-4 space-y-3">
            {result.recommendedNextActions.slice(0, 2).map((action) => (
              <div
                className="rounded-[20px] border border-[color:var(--border)] bg-white/80 px-3 py-3 text-sm text-muted"
                key={action.title}
              >
                <p className="font-semibold text-ink">{action.title}</p>
                <p className="mt-1">{action.timeframe}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-5" id="diagnostic-scores">
        {result.categoryScores.map((category) => (
          <article key={category.key} className="metric-card">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              {category.label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{category.score}</p>
            <p className="mt-2 text-sm text-muted">{category.rationale}</p>
            {category.basedOn?.length ? (
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
                {language === "es" ? "Basado en" : "Based on"}:{" "}
                {category.basedOn.join(", ")}
              </p>
            ) : null}
            {category.drivers && category.drivers.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {category.drivers.slice(0, 2).map((driver) => (
                  <li
                    key={`${category.key}-${driver.label}`}
                    className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-3 py-2"
                  >
                    <span className="font-semibold">
                      {driver.points > 0 ? "+" : ""}
                      {driver.points}
                    </span>{" "}
                    {driver.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <DiagnosticCardGroup
        title="Captured input signals"
        language={language}
        items={result.evidenceCards.map((item) => ({
          title: item.title,
          body: `${item.observation} ${item.implication}`,
          meta: item.signalQuality ?? "evidence",
          basis: item.basedOn
        }))}
      />
      <DiagnosticCardGroup
        title="Inferred conclusions"
        language={language}
        items={result.topBottlenecks.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.severity,
          basis: item.basedOn
        })).concat(result.topRisks.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.severity,
          basis: item.basedOn
        })))}
      />
      <DiagnosticCardGroup
        title="Top opportunities"
        language={language}
        items={result.topOpportunities.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: item.impact,
          basis: item.basedOn
        }))}
      />
      <DiagnosticCardGroup
        title="Recommended actions"
        language={language}
        items={result.recommendedNextActions.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: `${item.owner} | ${item.timeframe}`,
          basis: item.basedOn
        }))}
      />
    </section>
  );
}

function DiagnosticCardGroup({
  language,
  title,
  items
}: {
  language: OutputLanguage;
  title: string;
  items: Array<{ title: string; body: string; meta: string; basis?: string[] }>;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={`${title}-${item.title}-${index}`}
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
          >
            <div className="flex flex-wrap gap-2">
              <span className="pill bg-white text-ink">{item.meta}</span>
              {item.basis?.slice(0, 2).map((basis) => (
                <span className="pill bg-sand text-ink" key={`${item.title}-${basis}`}>
                  {basis}
                </span>
              ))}
            </div>
            <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
            {item.basis && item.basis.length > 0 ? (
              <details className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-3 text-sm text-muted">
                <summary className="cursor-pointer font-semibold text-ink">
                  {language === "es" ? "Ver base completa" : "View full basis"}
                </summary>
                <p className="mt-3">
                  {language === "es" ? "Basado en" : "Based on"}: {item.basis.join(", ")}
                </p>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
