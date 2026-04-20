import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import {
  getBusinessProfile,
  getLatestActionPlan,
  getLatestBusinessAssets,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  formatPlanDescription,
  formatRoleLabel,
  getPlanDefinition,
  isLockedState,
  type BusinessAssetRecord,
  type DiagnosticResultRecord,
  type ThirtyDayPlanRecord
} from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

function formatConfidence(
  confidence: DiagnosticResultRecord["confidence"] | null | undefined,
  language: "en" | "es"
) {
  if (!confidence) {
    return copyForLanguage(language, "Not available", "No disponible");
  }

  return copyForLanguage(
    language,
    confidence.charAt(0).toUpperCase() + confidence.slice(1),
    confidence === "high" ? "Alta" : confidence === "medium" ? "Media" : "Baja"
  );
}

function maturityLabel(score: number | null, language: "en" | "es") {
  if (score === null) {
    return copyForLanguage(language, "Not assessed", "Sin evaluar");
  }

  if (score >= 75) {
    return copyForLanguage(
      language,
      "Execution foundation is forming",
      "La base de ejecución está tomando forma"
    );
  }

  if (score >= 50) {
    return copyForLanguage(
      language,
      "Core systems need tightening",
      "Los sistemas principales necesitan más solidez"
    );
  }

  return copyForLanguage(
    language,
    "Foundations still need structure",
    "La base todavía necesita más estructura"
  );
}

function dashboardBasis(result: DiagnosticResultRecord | null) {
  if (!result) {
    return [];
  }

  return Array.from(
    new Set(
      result.categoryScores.flatMap((item) => item.basedOn ?? []).concat(
        result.evidenceCards.flatMap((item) => item.basedOn ?? [])
      )
    )
  ).slice(0, 6);
}

function assetTypeSummary(assets: BusinessAssetRecord[]) {
  return Array.from(new Set(assets.map((asset) => asset.assetType.replaceAll("_", " ")))).slice(
    0,
    4
  );
}

function nextThirtyDayMoments(plan: ThirtyDayPlanRecord | null) {
  if (!plan) {
    return [];
  }

  return [plan.week1, plan.week2, plan.week3, plan.week4].map((week, index) => ({
    label: `Week ${index + 1}`,
    title: week.objective,
    signal: week.successSignal
  }));
}

function ModuleCard({
  detail,
  href,
  label,
  value,
  language
}: {
  detail: string;
  href: string;
  label: string;
  language: "en" | "es";
  value: string;
}) {
  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      <Link className="mt-4 inline-flex text-sm font-semibold text-ink underline" href={href}>
        {copyForLanguage(language, `Open ${label.toLowerCase()}`, `Abrir ${label.toLowerCase()}`)}
      </Link>
    </article>
  );
}

export default async function WorkspaceDashboardPage() {
  const context = await requireWorkspaceContext("/app/dashboard");
  const [
    profile,
    latestDiagnostic,
    latestRoadmap,
    latestActionPlan,
    latestThirtyDayPlan,
    latestAssets
  ] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestRoadmap(context.workspace.id),
    getLatestActionPlan(context.workspace.id),
    getLatestThirtyDayPlan(context.workspace.id),
    getLatestBusinessAssets(context.workspace.id)
  ]);
  const plan = getPlanDefinition(context.workspace.plan);
  const language = context.workspace.outputLanguage;
  const maturityScore = latestDiagnostic?.overallMaturityScore ?? null;
  const topGaps = latestDiagnostic?.topBottlenecks.slice(0, 3) ?? [];
  const evidenceBasis = dashboardBasis(latestDiagnostic);
  const thirtyDayMoments = nextThirtyDayMoments(latestThirtyDayPlan);
  const assetTypes = assetTypeSummary(latestAssets);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">
          {copyForLanguage(language, "Workspace dashboard", "Panel del espacio")}
        </span>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              {copyForLanguage(
                language,
                `A clearer operating snapshot for ${context.workspace.name}.`,
                `Una vista operativa más clara para ${context.workspace.name}.`
              )}
            </h2>
            <p className="mt-4 body-lg">
              {copyForLanguage(
                language,
                "This dashboard surfaces the most useful saved context first: current maturity, top gaps, the next 30 days, confidence, and what the read is based on.",
                "Este panel muestra primero el contexto guardado más útil: madurez actual, principales brechas, próximos 30 días, confianza y en qué se basa la lectura."
              )}
            </p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-ink p-6 text-sand">
            <p className="text-sm uppercase tracking-[0.18em] text-sand/70">
              {copyForLanguage(language, "Current maturity", "Madurez actual")}
            </p>
            <p className="mt-4 text-6xl font-semibold">
              {maturityScore === null ? "--" : maturityScore}
            </p>
            <p className="mt-3 text-sm text-sand/80">
              {maturityLabel(maturityScore, language)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pill bg-white/12 text-sand">
                {copyForLanguage(language, "Confidence", "Confianza")}:{" "}
                {formatConfidence(latestDiagnostic?.confidence, language)}
              </span>
              <span className="pill bg-white/12 text-sand">{plan.label}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <PageSummaryGrid
            items={[
              {
                label: copyForLanguage(language, "Profile", "Perfil"),
                value: profile
                  ? copyForLanguage(language, "Saved", "Guardado")
                  : copyForLanguage(language, "Needs setup", "Falta configurar"),
                detail: profile
                  ? copyForLanguage(
                      language,
                      "The guided intake can refine the same saved profile model.",
                      "La captura guiada puede refinar el mismo perfil guardado."
                    )
                  : copyForLanguage(
                      language,
                      "Complete the guided intake before expecting strong diagnostics.",
                      "Completa la captura guiada antes de esperar un diagnóstico sólido."
                    )
              },
              {
                label: copyForLanguage(language, "Confidence", "Confianza"),
                value: formatConfidence(latestDiagnostic?.confidence, language),
                detail: latestDiagnostic
                  ? copyForLanguage(
                      language,
                      "Confidence reflects completeness, consistency, specificity, and evidence quality.",
                      "La confianza refleja integridad, consistencia, especificidad y calidad de la evidencia."
                    )
                  : copyForLanguage(
                      language,
                      "Confidence appears after the first diagnostic run.",
                      "La confianza aparece después del primer diagnóstico."
                    )
              },
              {
                label: copyForLanguage(language, "Top gaps", "Principales brechas"),
                value: String(topGaps.length),
                detail:
                  topGaps.length > 0
                    ? topGaps.map((gap) => gap.title).join(" | ")
                    : copyForLanguage(
                        language,
                        "No major gaps surfaced yet.",
                        "Todavía no aparecen brechas principales."
                      )
              },
              {
                label: copyForLanguage(language, "Next 30 days", "Próximos 30 días"),
                value: latestThirtyDayPlan
                  ? copyForLanguage(language, "Planned", "Planificado")
                  : copyForLanguage(language, "Not planned", "Sin plan"),
                detail: latestThirtyDayPlan
                  ? latestThirtyDayPlan.monthObjective
                  : copyForLanguage(
                      language,
                      "Generate actions and the 30-day plan after diagnostics.",
                      "Genera acciones y el plan de 30 días después del diagnóstico."
                    )
              }
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Top gaps", "Principales brechas")}
          </p>
          <div className="mt-4 grid gap-4">
            {topGaps.length > 0 ? (
              topGaps.map((gap) => (
              <div
                  className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                  key={gap.title}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill bg-coral/10 text-coral">{gap.severity}</span>
                    {gap.basedOn?.map((basis) => (
                      <span className="pill bg-sand text-ink" key={`${gap.title}-${basis}`}>
                        {basis}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{gap.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{gap.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 text-sm text-muted">
                {copyForLanguage(
                  language,
                  "Run diagnostics to surface the most pressing execution gaps.",
                  "Ejecuta el diagnóstico para mostrar las brechas operativas más urgentes."
                )}
              </div>
            )}
          </div>
        </article>

        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "What this is based on", "En qué se basa")}
          </p>
          {evidenceBasis.length > 0 ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {evidenceBasis.map((basis) => (
                  <span className="pill bg-white/85 text-ink" key={basis}>
                    {basis}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">
                {copyForLanguage(
                  language,
                  "This view is grounded in the saved profile and deterministic scoring layer. It is not using live telemetry or hidden external signals yet.",
                  "Esta vista se basa en el perfil guardado y en la capa de puntuación determinista. Todavía no usa telemetría en vivo ni señales externas ocultas."
                )}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">
              {copyForLanguage(
                language,
                "Evidence basis appears after a diagnostic run saves score drivers and visible input references.",
                "La base de evidencia aparece cuando un diagnóstico guarda los impulsores de puntuación y las referencias visibles de entrada."
              )}
            </p>
          )}
        </article>
      </section>

      <section className="surface p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              {copyForLanguage(language, "Next 30 days", "Próximos 30 días")}
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {latestThirtyDayPlan
                ? latestThirtyDayPlan.monthObjective
                : copyForLanguage(
                    language,
                    "No 30-day plan has been generated yet.",
                    "Todavía no se ha generado un plan de 30 días."
                  )}
            </h3>
          </div>
          <Link
            className="inline-flex rounded-[24px] border border-[color:var(--border)] bg-white/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
            href="/app/actions"
          >
            {copyForLanguage(language, "Open actions", "Abrir acciones")}
          </Link>
        </div>

        {thirtyDayMoments.length > 0 ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {thirtyDayMoments.map((moment) => (
              <article
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                key={moment.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {moment.label}
                </p>
                <h4 className="mt-3 text-xl font-semibold">{moment.title}</h4>
                <p className="mt-4 text-sm text-muted">
                  <strong className="text-ink">
                    {copyForLanguage(language, "Success signal", "Señal de éxito")}:
                  </strong>{" "}
                  {moment.signal}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 text-sm text-muted">
            {copyForLanguage(
              language,
              "Generate actions to turn the diagnostic into a practical weekly plan.",
              "Genera acciones para convertir el diagnóstico en un plan semanal práctico."
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          detail={
            profile
              ? copyForLanguage(language, "Saved profile context is available.", "El contexto del perfil ya está guardado.")
              : copyForLanguage(language, "Start the guided intake.", "Inicia la captura guiada.")
          }
          href="/app/profile"
          label={copyForLanguage(language, "Profile", "Perfil")}
          language={language}
          value={profile ? copyForLanguage(language, "Saved", "Guardado") : copyForLanguage(language, "Not started", "Sin empezar")}
        />
        <ModuleCard
          detail={
            latestDiagnostic
              ? `Latest score ${latestDiagnostic.overallMaturityScore}/100.`
              : copyForLanguage(language, "Run the first diagnostic.", "Ejecuta el primer diagnóstico.")
          }
          href="/app/diagnostics"
          label={copyForLanguage(language, "Diagnostics", "Diagnóstico")}
          language={language}
          value={
            latestDiagnostic
              ? copyForLanguage(language, "Saved", "Guardado")
              : copyForLanguage(language, "Not generated", "Sin generar")
          }
        />
        <ModuleCard
          detail={
            latestRoadmap
              ? `${latestRoadmap.items.length} roadmap items are saved.`
              : copyForLanguage(language, "Generate a staged roadmap next.", "Genera después una hoja de ruta por etapas.")
          }
          href="/app/roadmap"
          label={copyForLanguage(language, "Roadmap", "Hoja de ruta")}
          language={language}
          value={
            latestRoadmap
              ? copyForLanguage(language, "Saved", "Guardado")
              : copyForLanguage(language, "Not generated", "Sin generar")
          }
        />
        <ModuleCard
          detail={
            latestActionPlan
              ? `${latestActionPlan.actions.length} action cards are saved.`
              : copyForLanguage(language, "Generate actions and a 30-day plan.", "Genera acciones y un plan de 30 días.")
          }
          href="/app/actions"
          label={copyForLanguage(language, "Actions", "Acciones")}
          language={language}
          value={
            latestActionPlan
              ? copyForLanguage(language, "Saved", "Guardado")
              : copyForLanguage(language, "Not generated", "Sin generar")
          }
        />
        <ModuleCard
          detail={
            latestAssets.length > 0
              ? `Saved types: ${assetTypes.join(", ")}.`
              : copyForLanguage(language, "Generate preview artifacts after planning.", "Genera activos piloto después de planificar.")
          }
          href="/app/assets"
          label={copyForLanguage(language, "Assets", "Activos")}
          language={language}
          value={
            latestAssets.length > 0
              ? copyForLanguage(language, `${latestAssets.length} saved`, `${latestAssets.length} guardados`)
              : copyForLanguage(language, "Not generated", "Sin generar")
          }
        />
        <ModuleCard
          detail={copyForLanguage(
            language,
            `Role: ${context.membership.role}. Global role: ${context.user.globalRole.replaceAll("_", " ")}.`,
            `Rol: ${formatRoleLabel(context.membership.role, language)}. Rol global: ${formatRoleLabel(context.user.globalRole, language)}.`
          )}
          href="/app/team"
          label={copyForLanguage(language, "Team", "Equipo")}
          language={language}
          value={context.workspace.slug}
        />
        <ModuleCard
          detail={formatPlanDescription(context.workspace.plan, language)}
          href="/app/dashboard"
          label={copyForLanguage(language, "Plan", "Plan")}
          language={language}
          value={plan.label}
        />
        <ModuleCard
          detail={copyForLanguage(
            language,
            "Support, deletion requests, and pilot operations stay explicit.",
            "El soporte, las solicitudes de eliminación y la operativa piloto siguen siendo explícitos."
          )}
          href="/app/support"
          label={copyForLanguage(language, "Support", "Soporte")}
          language={language}
          value={copyForLanguage(language, "Pilot-ready", "Listo para piloto")}
        />
      </section>
    </div>
  );
}
