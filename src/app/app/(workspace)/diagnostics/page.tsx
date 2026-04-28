import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Package,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Users
} from "lucide-react";

import { DiagnosticsRunButton } from "@/components/diagnostics-run-button";
import { OutputFeedbackWidget } from "@/components/output-feedback-widget";
import {
  FoundryMetricCard,
  FoundryProgressBar,
  FoundryScoreRing,
  FoundrySectionCard,
  FoundryStatusChip,
  type FoundryStatusTone
} from "@/components/foundry-primitives";
import { LockedStatePanel } from "@/components/locked-state-panel";
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
  type DiagnosticFinding,
  type DiagnosticResultRecord,
  type OutputLanguage
} from "@/lib/foundation";
import { copyForLanguage, formatDateTimeForLanguage } from "@/lib/language";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  language: OutputLanguage
) {
  if (!hasProfile) {
    return copyForLanguage(
      language,
      "Complete and save the business profile before running diagnostics.",
      "Completa y guarda el perfil del negocio antes de ejecutar el diagnóstico."
    );
  }

  if (isLockedState(context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Diagnostics are locked for this workspace account state.",
      "El diagnóstico está bloqueado para el estado actual de esta cuenta."
    );
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Diagnostics are read-only while this workspace account state is limited.",
      "El diagnóstico queda en solo lectura mientras el estado de la cuenta sea limitado."
    );
  }

  if (!canManageWorkspace(context.membership.role, context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Only workspace owners and admins can run diagnostics in this MVP.",
      "Solo los owners y admins pueden ejecutar diagnósticos en este MVP."
    );
  }

  const counter = getUsageCounter(context, "diagnostic_runs");
  if (!counter) {
    return copyForLanguage(
      language,
      "This workspace does not have a diagnostic run entitlement configured.",
      "Este espacio no tiene configurado un cupo de ejecuciones de diagnóstico."
    );
  }

  if (counter.usedCount >= counter.limitCount) {
    return copyForLanguage(
      language,
      `Diagnostic run limit reached: ${counter.usedCount}/${counter.limitCount}.`,
      `Se alcanzó el límite de diagnósticos: ${counter.usedCount}/${counter.limitCount}.`
    );
  }

  return copyForLanguage(
    language,
    "Diagnostic runs are unavailable.",
    "Las ejecuciones de diagnóstico no están disponibles."
  );
}

function formatOutputLanguageLabel(language: OutputLanguage) {
  return language === "es" ? "Salida en español" : "English output";
}

function localizeConfidence(
  confidence: DiagnosticResultRecord["confidence"],
  language: OutputLanguage
) {
  if (language === "es") {
    return confidence === "high" ? "Alta" : confidence === "medium" ? "Media" : "Baja";
  }

  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

function confidenceTone(
  confidence: DiagnosticResultRecord["confidence"]
): FoundryStatusTone {
  if (confidence === "high") {
    return "success";
  }

  if (confidence === "medium") {
    return "warning";
  }

  return "error";
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
      ? "El sistema está siendo conservador a propósito: con señal débil, este resultado solo debe orientar."
      : "The system is being intentionally conservative: with weak signal, this result should only guide direction.";
  }

  if (ambiguityCards(result).length > 0) {
    return language === "es"
      ? "Hay entradas en tensión dentro del perfil, así que la confianza baja hasta que se resuelva esa ambigüedad."
      : "Some profile inputs are in tension, so confidence is lowered until that ambiguity is resolved.";
  }

  return language === "es"
    ? "Esta lectura se genera de forma determinista a partir del perfil guardado; no es telemetría en vivo ni comprensión autónoma del negocio."
    : "This read is generated deterministically from the saved profile; it is not live telemetry or autonomous business understanding.";
}

function maturityNarrative(result: DiagnosticResultRecord, language: OutputLanguage) {
  if (result.overallMaturityScore >= 75) {
    return language === "es"
      ? "La base operativa ya tiene forma y las mejoras son más de enfoque que de supervivencia."
      : "The operating foundation is taking shape, so improvement is more about focus than basic survival.";
  }

  if (result.overallMaturityScore >= 50) {
    return language === "es"
      ? "Hay una base útil, pero todavía faltan sistemas y prioridades más consistentes."
      : "There is a usable base, but systems and priorities still need more consistency.";
  }

  return language === "es"
    ? "El resultado sigue siendo útil, pero señala que faltan fundamentos antes de escalar."
    : "The result is still useful, but it points to missing fundamentals before scale.";
}

function scoreTone(score: number): FoundryStatusTone {
  if (score >= 75) {
    return "success";
  }

  if (score >= 50) {
    return "warning";
  }

  return "error";
}

function scoreBuckets(result: DiagnosticResultRecord) {
  return result.categoryScores.reduce(
    (totals, category) => {
      if (category.score >= 75) {
        totals.strong += 1;
      } else if (category.score >= 50) {
        totals.attention += 1;
      } else {
        totals.critical += 1;
      }

      return totals;
    },
    { strong: 0, attention: 0, critical: 0 }
  );
}

function categoryMeta(key: string, label: string) {
  const normalized = `${key} ${label}`.toLowerCase();

  if (normalized.includes("revenue") || normalized.includes("sales")) {
    return { icon: CircleDollarSign };
  }

  if (normalized.includes("operation")) {
    return { icon: Settings2 };
  }

  if (normalized.includes("team") || normalized.includes("culture")) {
    return { icon: Users };
  }

  if (normalized.includes("product")) {
    return { icon: Package };
  }

  if (normalized.includes("finance")) {
    return { icon: BarChart3 };
  }

  if (normalized.includes("risk") || normalized.includes("compliance")) {
    return { icon: ShieldCheck };
  }

  return { icon: Activity };
}

function findingTone(value: string): FoundryStatusTone {
  if (value === "high" || value === "error") {
    return "error";
  }

  if (value === "medium" || value === "warning" || value === "mixed") {
    return "warning";
  }

  if (value === "strong" || value === "low" || value === "success") {
    return "success";
  }

  return "neutral";
}

function localizeEvidenceQuality(
  quality: NonNullable<DiagnosticResultRecord["evidenceCards"][number]["evidenceQuality"]>,
  language: OutputLanguage
) {
  const labels = {
    clear: copyForLanguage(language, "Clear evidence", "Evidencia clara"),
    weak: copyForLanguage(language, "Weak evidence", "Evidencia débil"),
    missing: copyForLanguage(language, "Missing evidence", "Evidencia faltante"),
    contradictory: copyForLanguage(
      language,
      "Contradictory evidence",
      "Evidencia contradictoria"
    )
  };

  return labels[quality];
}

function evidenceQualityTone(
  quality: NonNullable<DiagnosticResultRecord["evidenceCards"][number]["evidenceQuality"]>
): FoundryStatusTone {
  if (quality === "clear") return "success";
  if (quality === "contradictory") return "error";
  if (quality === "weak") return "warning";
  return "neutral";
}

function validationNeedsForResult(result: DiagnosticResultRecord) {
  return Array.from(
    new Set(result.evidenceCards.flatMap((item) => item.needsValidation ?? []))
  ).slice(0, 5);
}

function evidenceQualityCounts(result: DiagnosticResultRecord) {
  return result.evidenceCards.reduce(
    (counts, card) => {
      const quality = card.evidenceQuality ?? "missing";
      counts[quality] += 1;
      return counts;
    },
    { clear: 0, weak: 0, missing: 0, contradictory: 0 }
  );
}

function localizeFindingSeverity(
  finding: DiagnosticFinding,
  language: OutputLanguage
) {
  if (language === "es") {
    return finding.severity === "high"
      ? "Crítica"
      : finding.severity === "medium"
        ? "Atención"
        : "Baja";
  }

  return finding.severity === "high"
    ? "Critical"
    : finding.severity === "medium"
      ? "Needs attention"
      : "Low";
}

export default async function DiagnosticsPage() {
  const context = await requireWorkspaceContext("/app/diagnostics");
  const language = context.workspace.outputLanguage;
  const [profile, latestResult, history] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    listDiagnosticJobsWithResults(context.workspace.id, 10)
  ]);
  const counter = getUsageCounter(context, "diagnostic_runs");
  const canRun = canRunDiagnostics(context) && Boolean(profile);
  const disabledReason = resolveDisabledReason(context, Boolean(profile), language);
  const buckets = latestResult ? scoreBuckets(latestResult) : null;
  const qualityCounts = latestResult ? evidenceQualityCounts(latestResult) : null;

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="foundry-dark-panel p-5 text-[#E0EBF0] md:p-8">
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              {copyForLanguage(language, "Diagnostics", "Diagnóstico")}
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              {language === "es" ? (
                <>
                  Evidencia visible,{" "}
                  <span className="font-serif-display text-[#F4F2EC]">
                    confianza honesta.
                  </span>
                </>
              ) : (
                <>
                  Visible evidence,{" "}
                  <span className="font-serif-display text-[#F4F2EC]">
                    honest confidence.
                  </span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              {copyForLanguage(
                language,
                "The diagnostic remains deterministic, but the presentation now separates score, evidence quality, uncertainty, and validation needs before anything feels like strong truth.",
                "El diagnóstico sigue siendo determinista, pero la presentación separa puntuación, calidad de evidencia, incertidumbre y validaciones pendientes antes de tratar algo como verdad fuerte."
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  {copyForLanguage(language, "Run usage", "Uso de ejecuciones")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {counter?.usedCount ?? 0}/{counter?.limitCount ?? 0}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  {copyForLanguage(language, "Output language", "Idioma de salida")}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {formatOutputLanguageLabel(language)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            {latestResult ? (
              <div className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="rounded-[28px] border border-white/10 bg-white/90 p-3 text-ink">
                    <FoundryScoreRing
                      label={copyForLanguage(language, "Score", "Puntuación")}
                      score={latestResult.overallMaturityScore}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                      {copyForLanguage(language, "Latest diagnostic", "Último diagnóstico")}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                      {localizeConfidence(latestResult.confidence, language)}{" "}
                      {copyForLanguage(language, "confidence", "de confianza")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {formatDateTimeForLanguage(language, latestResult.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <FoundryStatusChip tone="success">
                    {copyForLanguage(
                      language,
                      `${buckets?.strong ?? 0} strong`,
                      `${buckets?.strong ?? 0} fuertes`
                    )}
                  </FoundryStatusChip>
                  <FoundryStatusChip tone="warning">
                    {copyForLanguage(
                      language,
                      `${buckets?.attention ?? 0} watch`,
                      `${buckets?.attention ?? 0} atención`
                    )}
                  </FoundryStatusChip>
                  <FoundryStatusChip tone="error">
                    {copyForLanguage(
                      language,
                      `${buckets?.critical ?? 0} critical`,
                      `${buckets?.critical ?? 0} críticas`
                    )}
                  </FoundryStatusChip>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-[#051A24]/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    {copyForLanguage(language, "Evidence quality", "Calidad de evidencia")}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <div>
                      <p className="text-xl font-semibold text-white">{qualityCounts?.clear ?? 0}</p>
                      <p className="text-[11px] text-white/55">
                        {copyForLanguage(language, "Clear", "Clara")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">{qualityCounts?.weak ?? 0}</p>
                      <p className="text-[11px] text-white/55">
                        {copyForLanguage(language, "Weak", "Débil")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">{qualityCounts?.missing ?? 0}</p>
                      <p className="text-[11px] text-white/55">
                        {copyForLanguage(language, "Missing", "Falta")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">
                        {qualityCounts?.contradictory ?? 0}
                      </p>
                      <p className="text-[11px] text-white/55">
                        {copyForLanguage(language, "Conflict", "Conflicto")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                  {copyForLanguage(
                    language,
                    "No diagnostic has been saved yet.",
                    "Todavía no se ha guardado ningún diagnóstico."
                  )}
                </h2>
                <p className="text-sm leading-7 text-white/68">
                  {copyForLanguage(
                    language,
                    "Once the first run is saved, this view shows score, category breakdown, confidence, evidence quality, and validation needs.",
                    "Cuando se guarde la primera ejecución, esta vista mostrará puntuación, categorías, confianza, calidad de evidencia y validaciones pendientes."
                  )}
                </p>
              </div>
            )}

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.07] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {copyForLanguage(language, "Run or re-run", "Ejecutar o repetir")}
              </p>
              <div className="mt-4">
                <DiagnosticsRunButton
                  canRun={canRun}
                  disabledReason={disabledReason}
                  language={language}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {!profile ? (
        <FoundrySectionCard
          description={copyForLanguage(
            language,
            "Diagnostics are intentionally grounded in saved workspace data, so the profile needs to exist first.",
            "El diagnóstico se apoya de forma intencional en los datos guardados del espacio, así que el perfil debe existir primero."
          )}
          title={copyForLanguage(
            language,
            "Profile required before running diagnostics.",
            "Se necesita el perfil antes de ejecutar el diagnóstico."
          )}
        >
          <Link
            className="inline-flex items-center gap-2 rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
            href="/app/profile"
          >
            {copyForLanguage(language, "Complete profile", "Completar perfil")}
          </Link>
        </FoundrySectionCard>
      ) : null}

      {latestResult ? <LatestResult language={language} result={latestResult} /> : null}

      {latestResult ? (
        <OutputFeedbackWidget
          workspaceId={context.workspace.id}
          moduleType="diagnostic"
          outputId={latestResult.id}
          language={language}
        />
      ) : null}

      <details className="surface overflow-hidden" id="diagnostic-history">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Run history", "Historial")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Expand to review earlier diagnostic runs and failure states.",
              "Despliega para revisar ejecuciones anteriores y estados fallidos."
            )}
          </p>
        </summary>
        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    {copyForLanguage(language, "Created", "Creado")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {copyForLanguage(language, "Status", "Estado")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {copyForLanguage(language, "Score", "Puntuación")}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {copyForLanguage(language, "Confidence", "Confianza")}
                  </th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((entry) => (
                    <tr key={entry.job.id} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-4 text-muted">
                        {formatDateTimeForLanguage(language, entry.job.createdAt)}
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">
                        {entry.result ? `${entry.result.overallMaturityScore}/100` : "n/a"}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {entry.result ? localizeConfidence(entry.result.confidence, language) : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">{entry.job.error ?? "none"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={5}>
                      {copyForLanguage(
                        language,
                        "No diagnostic runs yet.",
                        "Todavía no hay ejecuciones de diagnóstico."
                      )}
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

function LatestResult({
  language,
  result
}: {
  language: OutputLanguage;
  result: DiagnosticResultRecord;
}) {
  const highlights = explanationHighlights(result, language);
  const ambiguities = ambiguityCards(result);
  const validationNeeds = validationNeedsForResult(result);

  return (
    <section className="space-y-6" id="latest-diagnostic">
      <div className="foundry-card-grid">
        <FoundryMetricCard
          detail={maturityNarrative(result, language)}
          icon={Activity}
          label={copyForLanguage(language, "Current maturity", "Madurez actual")}
          tone={scoreTone(result.overallMaturityScore)}
          value={`${result.overallMaturityScore}/100`}
        />
        <FoundryMetricCard
          detail={trustNote(result, language)}
          icon={CheckCircle2}
          label={copyForLanguage(language, "Confidence", "Confianza")}
          tone={confidenceTone(result.confidence)}
          value={localizeConfidence(result.confidence, language)}
        />
        <FoundryMetricCard
          detail={copyForLanguage(
            language,
            "Highest-severity bottlenecks surfaced by the latest run.",
            "Las brechas de mayor severidad que mostró la última ejecución."
          )}
          icon={AlertTriangle}
          label={copyForLanguage(language, "Top gaps", "Brechas principales")}
          tone={result.topBottlenecks.length > 0 ? "warning" : "neutral"}
          value={String(result.topBottlenecks.length)}
        >
          <div className="space-y-2">
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
        </FoundryMetricCard>
        <FoundryMetricCard
          detail={copyForLanguage(
            language,
            "Immediate actions suggested by the deterministic scoring layer.",
            "Las acciones inmediatas sugeridas por la capa determinista de puntuación."
          )}
          icon={RefreshCw}
          label={copyForLanguage(language, "Next 30 days", "Siguiente 30 días")}
          tone={result.recommendedNextActions.length > 0 ? "info" : "neutral"}
          value={String(result.recommendedNextActions.length)}
        >
          <div className="space-y-2">
            {result.recommendedNextActions.slice(0, 2).map((action) => (
              <div
                className="rounded-[20px] border border-[color:var(--border)] bg-white/80 px-3 py-3 text-sm text-muted"
                key={action.title}
              >
                <p className="font-semibold text-ink">{action.title}</p>
                <p className="mt-1">
                  {action.owner} · {action.timeframe}
                </p>
              </div>
            ))}
          </div>
        </FoundryMetricCard>
      </div>

      <FoundrySectionCard
        description={trustNote(result, language)}
        title={copyForLanguage(
          language,
          "Why this result looks this way",
          "Por qué sale este resultado"
        )}
      >
        <div className="flex flex-wrap gap-2">
          {highlights.map((item) => (
            <span key={item} className="pill bg-white/85 text-ink">
              {item}
            </span>
          ))}
        </div>
        {ambiguities.length > 0 ? (
          <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {copyForLanguage(language, "Ambiguity to resolve", "Ambigüedad a resolver")}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{ambiguities[0].implication}</p>
          </div>
        ) : null}
      </FoundrySectionCard>

      {validationNeeds.length > 0 ? (
        <FoundrySectionCard
          description={copyForLanguage(
            language,
            "These items must be checked before treating the diagnostic as strong truth instead of directional guidance.",
            "Estos puntos deben comprobarse antes de tratar el diagnóstico como una verdad fuerte en vez de una orientación."
          )}
          title={copyForLanguage(
            language,
            "What still needs validation",
            "Qué falta validar"
          )}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {validationNeeds.map((need, index) => (
              <article
                className="rounded-[22px] border border-gold/30 bg-gold/10 p-4"
                key={`${need}-${index}`}
              >
                <FoundryStatusChip tone="warning">
                  {copyForLanguage(language, "Needs validation", "Necesita validación")}
                </FoundryStatusChip>
                <p className="mt-3 text-sm leading-7 text-muted">{need}</p>
              </article>
            ))}
          </div>
        </FoundrySectionCard>
      ) : null}

      <FoundrySectionCard
        description={copyForLanguage(
          language,
          "Each category keeps its score visible, plus rationale, visible evidence, and the strongest score drivers.",
          "Cada categoría mantiene visible su puntuación, junto con la lógica, la evidencia visible y los principales impulsores."
        )}
        title={copyForLanguage(language, "Category breakdown", "Desglose por categorías")}
      >
        <div className="space-y-3" id="diagnostic-scores">
          {result.categoryScores.map((category, index) => {
            const tone = scoreTone(category.score);
            const meta = categoryMeta(category.key, category.label);
            const Icon = meta.icon;

            return (
              <details
                className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white/90"
                key={category.key}
                open={index === 0}
              >
                <summary className="cursor-pointer list-none px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-2xl border p-2.5 ${
                        tone === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : tone === "warning"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{category.label}</p>
                        <div className="flex items-center gap-2">
                          <FoundryStatusChip tone={tone}>{category.score}%</FoundryStatusChip>
                          <ChevronDown className="h-4 w-4 text-muted" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <FoundryProgressBar tone={tone} value={category.score} />
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="border-t border-[color:var(--border)] px-5 py-4">
                  <p className="text-sm leading-7 text-muted">{category.rationale}</p>
                  {category.basedOn?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.basedOn.map((basis) => (
                        <span className="pill bg-sand text-ink" key={`${category.key}-${basis}`}>
                          {basis}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {category.drivers && category.drivers.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {category.drivers.slice(0, 4).map((driver) => (
                        <div
                          className="rounded-[20px] border border-[color:var(--border)] bg-sand/55 px-4 py-3"
                          key={`${category.key}-${driver.label}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-ink">
                              {driver.points > 0 ? "+" : ""}
                              {driver.points} {copyForLanguage(language, "points", "puntos")}
                            </p>
                            <FoundryStatusChip
                              tone={driver.tone === "positive" ? "success" : "error"}
                            >
                              {driver.tone === "positive"
                                ? copyForLanguage(language, "Helps", "Suma")
                                : copyForLanguage(language, "Hurts", "Resta")}
                            </FoundryStatusChip>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted">{driver.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </FoundrySectionCard>

      <DiagnosticCardGroup
        language={language}
        title={copyForLanguage(language, "Captured input signals", "Señales capturadas")}
        items={result.evidenceCards.map((item) => ({
          title: item.title,
          body: `${item.observation} ${item.implication}`,
          meta: item.evidenceQuality
            ? localizeEvidenceQuality(item.evidenceQuality, language)
            : item.signalQuality === "strong"
              ? copyForLanguage(language, "Strong signal", "Señal fuerte")
              : item.signalQuality === "mixed"
                ? copyForLanguage(language, "Mixed signal", "Señal mixta")
                : item.signalQuality === "weak"
                  ? copyForLanguage(language, "Weak signal", "Señal débil")
                  : copyForLanguage(language, "Evidence", "Evidencia"),
          metaTone: item.evidenceQuality
            ? evidenceQualityTone(item.evidenceQuality)
            : findingTone(item.signalQuality ?? "neutral"),
          basis: item.basedOn,
          needsValidation: item.needsValidation
        }))}
      />
      <DiagnosticCardGroup
        language={language}
        title={copyForLanguage(language, "Inferred conclusions", "Conclusiones inferidas")}
        items={result.topBottlenecks
          .map((item) => ({
            title: item.title,
            body: item.detail,
            meta: localizeFindingSeverity(item, language),
            metaTone: findingTone(item.severity),
            basis: item.basedOn
          }))
          .concat(
            result.topRisks.map((item) => ({
              title: item.title,
              body: item.detail,
              meta: localizeFindingSeverity(item, language),
              metaTone: findingTone(item.severity),
              basis: item.basedOn
            }))
          )}
      />
      <DiagnosticCardGroup
        language={language}
        title={copyForLanguage(language, "Top opportunities", "Oportunidades principales")}
        items={result.topOpportunities.map((item) => ({
          title: item.title,
          body: item.detail,
          meta:
            language === "es"
              ? item.impact === "high"
                ? "Impacto alto"
                : item.impact === "medium"
                  ? "Impacto medio"
                  : "Impacto bajo"
              : item.impact === "high"
                ? "High impact"
                : item.impact === "medium"
                  ? "Medium impact"
                  : "Low impact",
          metaTone: findingTone(item.impact),
          basis: item.basedOn
        }))}
      />
      <DiagnosticCardGroup
        language={language}
        title={copyForLanguage(language, "Recommended actions", "Acciones recomendadas")}
        items={result.recommendedNextActions.map((item) => ({
          title: item.title,
          body: item.detail,
          meta: `${item.owner} · ${item.timeframe}`,
          metaTone: "info" as const,
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
  items: Array<{
    title: string;
    body: string;
    meta: string;
    metaTone: FoundryStatusTone;
    basis?: string[];
    needsValidation?: string[];
  }>;
}) {
  return (
    <FoundrySectionCard title={title}>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={`${title}-${item.title}-${index}`}
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
          >
            <div className="flex flex-wrap gap-2">
              <FoundryStatusChip tone={item.metaTone}>{item.meta}</FoundryStatusChip>
              {item.basis?.slice(0, 2).map((basis) => (
                <span className="pill bg-sand text-ink" key={`${item.title}-${basis}`}>
                  {basis}
                </span>
              ))}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
            {item.basis && item.basis.length > 0 ? (
              <details className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-3 text-sm text-muted">
                <summary className="cursor-pointer font-semibold text-ink">
                  {copyForLanguage(language, "View full basis", "Ver base completa")}
                </summary>
                <p className="mt-3">
                  {copyForLanguage(language, "Based on", "Basado en")}: {item.basis.join(", ")}
                </p>
              </details>
            ) : null}
            {item.needsValidation && item.needsValidation.length > 0 ? (
              <details className="mt-4 rounded-[20px] border border-gold/30 bg-gold/10 p-3 text-sm text-muted">
                <summary className="cursor-pointer font-semibold text-ink">
                  {copyForLanguage(language, "Needs validation", "Necesita validación")}
                </summary>
                <ul className="mt-3 space-y-2">
                  {item.needsValidation.map((need) => (
                    <li key={`${item.title}-${need}`}>{need}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </FoundrySectionCard>
  );
}
