import Link from "next/link";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  LifeBuoy,
  Map,
  ScrollText,
  Stethoscope,
  Target,
  TriangleAlert,
  Zap
} from "lucide-react";

import {
  FoundryMetricCard,
  FoundryProgressBar,
  FoundrySectionCard,
  FoundryStatusChip,
  type FoundryStatusTone
} from "@/components/foundry-primitives";
import { LockedStatePanel } from "@/components/locked-state-panel";
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
  type ActionStatus,
  type BusinessAssetRecord,
  type DiagnosticResultRecord,
  type OutputLanguage,
  type PlanActionItem,
  type ThirtyDayPlanRecord
} from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

function maturityLabel(score: number | null, language: OutputLanguage) {
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

function scoreTone(score: number): FoundryStatusTone {
  if (score >= 75) {
    return "success";
  }

  if (score >= 50) {
    return "warning";
  }

  return "error";
}

function confidenceLabel(
  confidence: DiagnosticResultRecord["confidence"] | null,
  language: OutputLanguage
) {
  if (!confidence) {
    return copyForLanguage(language, "Not available", "No disponible");
  }

  if (language === "es") {
    return confidence === "high" ? "Alta" : confidence === "medium" ? "Media" : "Baja";
  }

  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
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

function nextThirtyDayMoments(plan: ThirtyDayPlanRecord | null, language: OutputLanguage) {
  if (!plan) {
    return [];
  }

  return [plan.week1, plan.week2, plan.week3, plan.week4].map((week, index) => ({
    label: copyForLanguage(language, `Week ${index + 1}`, `Semana ${index + 1}`),
    title: week.objective,
    signal: week.successSignal
  }));
}

function actionStatusMeta(status: ActionStatus, language: OutputLanguage) {
  switch (status) {
    case "done":
      return {
        tone: "success" as const,
        label: copyForLanguage(language, "Done", "Hecha")
      };
    case "in_progress":
      return {
        tone: "warning" as const,
        label: copyForLanguage(language, "In progress", "En curso")
      };
    case "blocked":
      return {
        tone: "error" as const,
        label: copyForLanguage(language, "Blocked", "Bloqueada")
      };
    default:
      return {
        tone: "neutral" as const,
        label: copyForLanguage(language, "To do", "Por hacer")
      };
  }
}

function moduleValueLabel(
  present: boolean,
  language: OutputLanguage,
  countLabel?: { en: string; es: string }
) {
  if (countLabel) {
    return copyForLanguage(language, countLabel.en, countLabel.es);
  }

  return present
    ? copyForLanguage(language, "Saved", "Guardado")
    : copyForLanguage(language, "Not generated", "Sin generar");
}

function keyActionCount(actions: PlanActionItem[] | null) {
  if (!actions || actions.length === 0) {
    return { completed: 0, total: 0 };
  }

  return {
    completed: actions.filter((action) => action.status === "done").length,
    total: actions.length
  };
}

function topAttentionGap(
  profileExists: boolean,
  diagnostic: DiagnosticResultRecord | null,
  language: OutputLanguage
) {
  if (!profileExists) {
    return {
      tone: "warning" as const,
      title: copyForLanguage(
        language,
        "Profile still missing",
        "El perfil todavía falta"
      ),
      body: copyForLanguage(
        language,
        "The dashboard can look polished, but the diagnosis layer only becomes trustworthy once the guided intake is complete.",
        "El panel puede verse mejor, pero la capa de diagnóstico solo gana confianza cuando la captura guiada está completa."
      ),
      href: "/app/profile",
      cta: copyForLanguage(language, "Complete marketing profile", "Completar perfil de marketing")
    };
  }

  if (!diagnostic) {
    return {
      tone: "info" as const,
      title: copyForLanguage(
        language,
        "No marketing diagnosis yet",
        "Todavía no hay diagnóstico de marketing"
      ),
      body: copyForLanguage(
        language,
        "Run the marketing diagnosis to turn the saved profile into visible maturity, gaps, and next-step priorities.",
        "Ejecuta el diagnóstico de marketing para convertir el perfil guardado en madurez, brechas y prioridades visibles."
      ),
      href: "/app/diagnostics",
      cta: copyForLanguage(language, "Open marketing diagnosis", "Abrir diagnóstico de marketing")
    };
  }

  const criticalGap = diagnostic.topBottlenecks.find((gap) => gap.severity === "high");

  if (criticalGap) {
    return {
      tone: "error" as const,
      title: criticalGap.title,
      body: criticalGap.detail,
      href: "/app/diagnostics",
      cta: copyForLanguage(language, "Review full read", "Revisar lectura completa")
    };
  }

  return {
    tone: "success" as const,
    title: copyForLanguage(
      language,
      "No critical gaps surfaced",
      "No aparecen brechas críticas"
    ),
    body: copyForLanguage(
      language,
      "The current read is pointing more to prioritization and consistency than to emergency fixes.",
      "La lectura actual apunta más a priorización y consistencia que a correcciones urgentes."
    ),
    href: "/app/diagnostics",
    cta: copyForLanguage(language, "See category scores", "Ver puntuaciones")
  };
}

function primaryNextAction({
  hasProfile,
  hasDiagnostic,
  hasThirtyDayPlan,
  language
}: {
  hasProfile: boolean;
  hasDiagnostic: boolean;
  hasThirtyDayPlan: boolean;
  language: OutputLanguage;
}) {
  if (!hasProfile) {
    return {
      eyebrow: copyForLanguage(language, "Step 1", "Paso 1"),
      href: "/app/profile",
      label: copyForLanguage(language, "Complete marketing profile", "Completar perfil de marketing"),
      summary: copyForLanguage(
        language,
        "Start here. The diagnosis and plan need your offer, audience, channel, CTA, and proof context.",
        "Empieza aquí. El diagnóstico y el plan necesitan tu oferta, audiencia, canal, CTA y prueba."
      )
    };
  }

  if (!hasDiagnostic) {
    return {
      eyebrow: copyForLanguage(language, "Step 2", "Paso 2"),
      href: "/app/diagnostics",
      label: copyForLanguage(language, "Run marketing diagnosis", "Ejecutar diagnóstico de marketing"),
      summary: copyForLanguage(
        language,
        "Turn the saved profile into a clear read of what is missing in the marketing.",
        "Convierte el perfil guardado en una lectura clara de lo que falta en el marketing."
      )
    };
  }

  if (!hasThirtyDayPlan) {
    return {
      eyebrow: copyForLanguage(language, "Step 3", "Paso 3"),
      href: "/app/actions",
      label: copyForLanguage(language, "Generate 30-day plan", "Generar plan 30 días"),
      summary: copyForLanguage(
        language,
        "Turn the diagnosis into weekly marketing actions, quick wins, and success signals.",
        "Convierte el diagnóstico en acciones semanales de marketing, quick wins y señales de éxito."
      )
    };
  }

  return {
    eyebrow: copyForLanguage(language, "Step 4", "Paso 4"),
    href: "/app/assets",
    label: copyForLanguage(language, "Review supporting materials", "Revisar materiales de apoyo"),
    summary: copyForLanguage(
      language,
      "Use the plan as the source, then review optional assets and routines that support execution.",
      "Usa el plan como fuente y revisa los activos y rutinas opcionales que apoyan la ejecución."
    )
  };
}

function pathStepTone(isComplete: boolean, isCurrent: boolean): FoundryStatusTone {
  if (isComplete) {
    return "success";
  }

  return isCurrent ? "warning" : "neutral";
}

function ModuleCard({
  detail,
  href,
  icon,
  label,
  language,
  value
}: {
  detail: string;
  href: string;
  icon: typeof FileText;
  label: string;
  language: OutputLanguage;
  value: string;
}) {
  return (
    <FoundryMetricCard detail={detail} icon={icon} label={label} value={value}>
      <Link
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
        href={href}
      >
        {copyForLanguage(language, "Open module", "Abrir módulo")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </FoundryMetricCard>
  );
}

function PathStepCard({
  detail,
  href,
  icon,
  isComplete,
  isCurrent,
  label,
  language,
  step
}: {
  detail: string;
  href: string;
  icon: typeof FileText;
  isComplete: boolean;
  isCurrent: boolean;
  label: string;
  language: OutputLanguage;
  step: string;
}) {
  const tone = pathStepTone(isComplete, isCurrent);

  return (
    <article
      className={`rounded-[24px] border p-5 ${
        isCurrent
          ? "border-gold/40 bg-gold/10"
          : "border-[color:var(--border)] bg-white/85"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-2.5 text-ink">
          {(() => {
            const Icon = icon;
            return <Icon className="h-4 w-4" />;
          })()}
        </div>
        <FoundryStatusChip tone={tone}>
          {isComplete
            ? copyForLanguage(language, "Done", "Hecho")
            : isCurrent
              ? copyForLanguage(language, "Next", "Siguiente")
              : copyForLanguage(language, "Later", "Después")}
        </FoundryStatusChip>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {step}
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-ink">{label}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{detail}</p>
      <Link
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
        href={href}
      >
        {copyForLanguage(language, "Open", "Abrir")}
        <ArrowRight className="h-4 w-4" />
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
  const evidenceBasis = dashboardBasis(latestDiagnostic);
  const thirtyDayMoments = nextThirtyDayMoments(latestThirtyDayPlan, language);
  const assetTypes = assetTypeSummary(latestAssets);
  const actionCounts = keyActionCount(latestActionPlan?.actions ?? null);
  const priorityCount =
    latestThirtyDayPlan?.topPriorities.length ?? profile?.primaryGoals.length ?? 0;
  const attentionGap = topAttentionGap(Boolean(profile), latestDiagnostic, language);
  const primaryAction = primaryNextAction({
    hasDiagnostic: Boolean(latestDiagnostic),
    hasProfile: Boolean(profile),
    hasThirtyDayPlan: Boolean(latestThirtyDayPlan),
    language
  });

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="foundry-dark-panel p-5 text-[#E0EBF0] md:p-8">
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-end">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              {copyForLanguage(language, "Dashboard", "Panel")}
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              {language === "es" ? (
                <>
                  Vista real del marketing para{" "}
                  <span className="font-serif-display text-[#F4F2EC]">
                    {context.workspace.name}.
                  </span>
                </>
              ) : (
                <>
                  Real marketing snapshot for{" "}
                  <span className="font-serif-display text-[#F4F2EC]">
                    {context.workspace.name}.
                  </span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              {copyForLanguage(
                language,
                "A summary-first view of the latest saved profile, marketing diagnosis, planning artifacts, and evidence basis. No mock data, no hidden integrations.",
                "Una vista primero-resumen del perfil guardado, diagnóstico de marketing, artefactos de planificación y base de evidencia. Sin datos simulados ni integraciones ocultas."
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href={primaryAction.href}>
                <ArrowRight className="h-4 w-4" />
                {primaryAction.label}
              </Link>
              <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="/app/profile">
                <FileText className="h-4 w-4" />
                {copyForLanguage(language, "Review profile", "Revisar perfil")}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                {copyForLanguage(language, "Current maturity", "Madurez actual")}
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-6xl font-semibold leading-none tracking-[-0.06em] text-white">
                  {maturityScore === null ? "--" : maturityScore}
                </span>
                <span className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                  /100
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/68">
                {latestDiagnostic
                  ? maturityLabel(maturityScore, language)
                  : copyForLanguage(
                      language,
                      "Run the first marketing diagnosis to create the baseline.",
                      "Ejecuta el primer diagnóstico de marketing para crear la línea base."
                    )}
              </p>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                {copyForLanguage(language, "Trust snapshot", "Lectura de confianza")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    {confidenceLabel(latestDiagnostic?.confidence ?? null, language)}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {copyForLanguage(language, "Confidence", "Confianza")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    {evidenceBasis.length}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {copyForLanguage(language, "Basis signals", "Señales base")}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/68">
                {copyForLanguage(
                  language,
                  "Confidence stays tied to saved evidence quality, not visual polish.",
                  "La confianza sigue atada a la calidad de evidencia guardada, no al pulido visual."
                )}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="foundry-card-grid">
        <FoundryMetricCard
          change={
            latestDiagnostic
              ? maturityLabel(maturityScore, language)
              : copyForLanguage(language, "Needs first run", "Falta la primera ejecución")
          }
          detail={copyForLanguage(
            language,
            "Overall maturity reflects the latest saved diagnostic baseline.",
            "La madurez general refleja la última línea base diagnóstica guardada."
          )}
          icon={Activity}
          label={copyForLanguage(language, "Health score", "Puntuación general")}
          tone={maturityScore === null ? "neutral" : scoreTone(maturityScore)}
          trend={maturityScore !== null && maturityScore >= 75 ? "up" : "neutral"}
          value={maturityScore === null ? "--" : `${maturityScore}/100`}
        />
        <FoundryMetricCard
          detail={copyForLanguage(
            language,
            "Completed actions out of the latest saved action plan.",
            "Acciones completadas dentro del último plan de acción guardado."
          )}
          icon={CheckCircle2}
          label={copyForLanguage(language, "Actions completed", "Acciones completadas")}
          tone={actionCounts.total > 0 && actionCounts.completed > 0 ? "success" : "neutral"}
          value={`${actionCounts.completed}/${actionCounts.total}`}
        />
        <FoundryMetricCard
          detail={copyForLanguage(
            language,
            "Current top priorities pulled from the 30-day plan or saved profile goals.",
            "Prioridades actuales tomadas del plan de 30 días o de los objetivos del perfil."
          )}
          icon={Target}
          label={copyForLanguage(language, "Active priorities", "Prioridades activas")}
          tone={priorityCount > 0 ? "info" : "neutral"}
          value={String(priorityCount)}
        />
        <FoundryMetricCard
          detail={copyForLanguage(
            language,
                  "Saved marketing asset outputs already available for the workspace.",
                  "Activos de marketing guardados que ya están disponibles en el espacio."
          )}
          icon={FolderOpen}
          label={copyForLanguage(language, "Assets ready", "Activos listos")}
          tone={latestAssets.length > 0 ? "warning" : "neutral"}
          value={String(latestAssets.length)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="rounded-[28px] border border-gold/30 bg-gold/10 p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {primaryAction.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {primaryAction.label}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{primaryAction.summary}</p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
            href={primaryAction.href}
          >
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <section className="grid gap-3 sm:grid-cols-2">
          <PathStepCard
            detail={copyForLanguage(
              language,
              "Capture offer, audience, CTA, channels, proof, and the 30-day marketing goal.",
              "Captura oferta, audiencia, CTA, canales, prueba y objetivo de marketing a 30 días."
            )}
            href="/app/profile"
            icon={FileText}
            isComplete={Boolean(profile)}
            isCurrent={!profile}
            label={copyForLanguage(language, "Complete marketing profile", "Completar perfil de marketing")}
            language={language}
            step={copyForLanguage(language, "Step 1", "Paso 1")}
          />
          <PathStepCard
            detail={copyForLanguage(
              language,
              "Generate the marketing read: what is clear, assumed, missing, or ready to act on.",
              "Genera la lectura de marketing: qué está claro, qué se asume, qué falta y qué se puede ejecutar."
            )}
            href="/app/diagnostics"
            icon={Stethoscope}
            isComplete={Boolean(latestDiagnostic)}
            isCurrent={Boolean(profile) && !latestDiagnostic}
            label={copyForLanguage(language, "Run marketing diagnosis", "Ejecutar diagnóstico de marketing")}
            language={language}
            step={copyForLanguage(language, "Step 2", "Paso 2")}
          />
          <PathStepCard
            detail={copyForLanguage(
              language,
              "Turn the diagnosis into the practical month of weekly marketing work.",
              "Convierte el diagnóstico en un mes práctico de trabajo semanal de marketing."
            )}
            href="/app/actions"
            icon={Zap}
            isComplete={Boolean(latestThirtyDayPlan)}
            isCurrent={Boolean(latestDiagnostic) && !latestThirtyDayPlan}
            label={copyForLanguage(language, "Generate 30-day plan", "Generar plan 30 días")}
            language={language}
            step={copyForLanguage(language, "Step 3", "Paso 3")}
          />
          <PathStepCard
            detail={copyForLanguage(
              language,
              "Review optional assets and routines derived from the plan after the core path is done.",
              "Revisa activos y rutinas opcionales derivados del plan después de completar la ruta principal."
            )}
            href="/app/assets"
            icon={FolderOpen}
            isComplete={latestAssets.length > 0}
            isCurrent={Boolean(latestThirtyDayPlan) && latestAssets.length === 0}
            label={copyForLanguage(language, "Review supporting materials", "Revisar materiales de apoyo")}
            language={language}
            step={copyForLanguage(language, "Step 4", "Paso 4")}
          />
        </section>
      </section>

      <section
        className={`rounded-[28px] border p-5 md:p-6 ${
          attentionGap.tone === "error"
            ? "border-rose-200 bg-rose-50/70"
            : attentionGap.tone === "warning"
              ? "border-amber-200 bg-amber-50/70"
              : "border-emerald-200 bg-emerald-50/60"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <TriangleAlert
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                attentionGap.tone === "error"
                  ? "text-rose-700"
                  : attentionGap.tone === "warning"
                    ? "text-amber-700"
                    : "text-emerald-700"
              }`}
            />
            <div>
              <p className="text-lg font-semibold text-ink">{attentionGap.title}</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{attentionGap.body}</p>
            </div>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-[24px] border border-[color:var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-ink"
            href={attentionGap.href}
          >
            {attentionGap.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Workspace details", "Detalles del espacio")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Expand for diagnosis detail, recent actions, evidence basis, and workspace context.",
              "Despliega para ver detalle del diagnóstico, acciones recientes, evidencia y contexto."
            )}
          </p>
        </summary>
        <div className="grid min-w-0 gap-5 px-6 pb-6 md:px-8 md:pb-8 2xl:grid-cols-[1.05fr_0.95fr]">
        <FoundrySectionCard
          actions={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
              href="/app/diagnostics"
            >
              {copyForLanguage(language, "View full read", "Ver lectura completa")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          description={copyForLanguage(
            language,
            "A quick scan of the latest category scores, based on the current saved profile and evidence layer.",
            "Un escaneo rápido de las últimas puntuaciones por categoría, basado en el perfil guardado y la capa de evidencia."
          )}
          title={copyForLanguage(language, "Marketing diagnosis overview", "Resumen del diagnóstico de marketing")}
        >
          {latestDiagnostic ? (
            <div className="space-y-4">
              {latestDiagnostic.categoryScores.map((category) => {
                const tone = scoreTone(category.score);

                return (
                  <div key={category.key}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{category.label}</p>
                        <p className="truncate text-xs text-muted">{category.rationale}</p>
                      </div>
                      <FoundryStatusChip tone={tone}>{category.score}%</FoundryStatusChip>
                    </div>
                    <FoundryProgressBar tone={tone} value={category.score} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted">
              {copyForLanguage(
                language,
                "Run the marketing diagnosis to see maturity by category and what is driving each score.",
                "Ejecuta el diagnóstico de marketing para ver la madurez por categoría y qué impulsa cada puntuación."
              )}
            </p>
          )}
        </FoundrySectionCard>

        <FoundrySectionCard
          actions={
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline"
              href="/app/actions"
            >
              {copyForLanguage(language, "Open 30-day plan", "Abrir plan 30 días")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          description={copyForLanguage(
            language,
            "The most recent execution items from the saved action plan.",
            "Los últimos frentes de ejecución del plan de acción guardado."
          )}
          title={copyForLanguage(language, "Recent actions", "Acciones recientes")}
        >
          {latestActionPlan?.actions.length ? (
            <div className="divide-y divide-[color:var(--border)]">
              {latestActionPlan.actions.slice(0, 4).map((action) => {
                const status = actionStatusMeta(action.status, language);

                return (
                  <div
                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    key={`${action.title}-${action.ownerSuggestion}`}
                  >
                    <div
                      className={`rounded-2xl border p-2.5 ${
                        status.tone === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : status.tone === "warning"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : status.tone === "error"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-[color:var(--border)] bg-white text-muted"
                      }`}
                    >
                      {action.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : action.status === "in_progress" ? (
                        <Zap className="h-4 w-4" />
                      ) : action.status === "blocked" ? (
                        <TriangleAlert className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{action.title}</p>
                      <p className="text-xs text-muted">
                        {action.linkedCategory} · {action.ownerSuggestion}
                      </p>
                    </div>
                    <FoundryStatusChip tone={status.tone}>{status.label}</FoundryStatusChip>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted">
              {copyForLanguage(
                language,
                "Generate the 30-day plan after the diagnosis to turn the read into an execution queue.",
                "Genera el plan de 30 días después del diagnóstico para convertir la lectura en una cola de ejecución."
              )}
            </p>
          )}
        </FoundrySectionCard>
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Plan snapshot", "Resumen del plan")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Expand for the current 30-day objective, week-by-week moments, and evidence basis.",
              "Despliega para ver el objetivo de 30 días, momentos semanales y base de evidencia."
            )}
          </p>
        </summary>
        <div className="grid min-w-0 gap-5 px-6 pb-6 md:px-8 md:pb-8 2xl:grid-cols-[1.05fr_0.95fr]">
        <FoundrySectionCard
          description={copyForLanguage(
            language,
            "The current month objective and the week-by-week sequence built from the latest 30-day marketing plan.",
            "El objetivo del mes actual y la secuencia semanal construida desde el último plan de marketing de 30 días."
          )}
          title={copyForLanguage(language, "Next 30 days", "Próximos 30 días")}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {copyForLanguage(language, "Current monthly objective", "Objetivo mensual")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink">
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
              className="inline-flex items-center gap-2 rounded-[24px] border border-[color:var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-ink"
              href="/app/actions"
            >
              {copyForLanguage(language, "Open 30-day plan", "Abrir plan 30 días")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {thirtyDayMoments.length > 0 ? (
            <div className="foundry-week-grid mt-6">
              {thirtyDayMoments.map((moment) => (
                <article
                  className="foundry-readable-card rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                  key={moment.label}
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl border border-[color:var(--border)] bg-sand/60 p-2 text-ink">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {moment.label}
                    </p>
                  </div>
                  <h4 className="mt-4 text-base font-semibold leading-7 text-ink md:text-lg">
                    {moment.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-muted">
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
                "Generate the 30-day plan to turn the diagnosis into a practical weekly plan.",
                "Genera el plan de 30 días para convertir el diagnóstico en un plan semanal práctico."
              )}
            </div>
          )}
        </FoundrySectionCard>

        <FoundrySectionCard
          description={copyForLanguage(
            language,
            "The saved basis behind the current dashboard read, plus the workspace business and marketing context.",
            "La base guardada detrás de la lectura actual del panel, junto con el contexto de negocio y marketing del espacio."
          )}
          title={copyForLanguage(language, "What this is based on", "En qué se basa")}
        >
          {evidenceBasis.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {evidenceBasis.map((basis) => (
                  <span key={basis} className="pill bg-white/85 text-ink">
                    {basis}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {copyForLanguage(
                  language,
                  "This dashboard uses the saved profile, the diagnostic evidence layer, and the latest planning artifacts. It is not using live telemetry or hidden external data.",
                  "Este panel usa el perfil guardado, la capa de evidencia diagnóstica y los últimos artefactos de planificación. No usa telemetría en vivo ni datos externos ocultos."
                )}
              </p>
            </>
          ) : (
            <p className="text-sm leading-7 text-muted">
              {copyForLanguage(
                language,
                "The visible evidence basis appears after the first diagnostic run saves category references and signal cards.",
                "La base de evidencia visible aparece cuando el primer diagnóstico guarda referencias de categoría y tarjetas de señal."
              )}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {copyForLanguage(language, "Plan", "Plan")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{plan.label}</p>
              <p className="mt-2 text-sm text-muted">
                {formatPlanDescription(context.workspace.plan, language)}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {copyForLanguage(language, "Team context", "Contexto del equipo")}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {formatRoleLabel(context.membership.role, language)}
              </p>
              <p className="mt-2 text-sm text-muted">
                {copyForLanguage(
                  language,
                  `Global role: ${context.user.globalRole.replaceAll("_", " ")}.`,
                  `Rol global: ${formatRoleLabel(context.user.globalRole, language)}.`
                )}
              </p>
            </div>
          </div>
        </FoundrySectionCard>
        </div>
      </details>

      <section>
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Secondary access", "Acceso secundario")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            {copyForLanguage(language, "Supporting materials and account areas", "Materiales de apoyo y áreas de cuenta")}
          </h2>
        </div>
        <div className="foundry-card-grid">
        <ModuleCard
          detail={
            latestRoadmap
              ? copyForLanguage(
                  language,
                  `${latestRoadmap.items.length} priority-list items are saved as planning detail.`,
                  `${latestRoadmap.items.length} elementos de la lista de prioridades están guardados como detalle de planificación.`
                )
              : copyForLanguage(
                  language,
                  "Optional planning detail that supports the 30-day plan, not a separate first step.",
                  "Detalle opcional de planificación que apoya el plan de 30 días, no un primer paso separado."
                )
          }
          href="/app/roadmap"
          icon={Map}
          label={copyForLanguage(language, "Priority list", "Lista de prioridades")}
          language={language}
          value={moduleValueLabel(Boolean(latestRoadmap), language)}
        />
        <ModuleCard
          detail={
            latestAssets.length > 0
              ? copyForLanguage(
                  language,
                  `Saved types: ${assetTypes.join(", ")}.`,
                  `Tipos guardados: ${assetTypes.join(", ")}.`
                )
              : copyForLanguage(
                  language,
                  "Generate preview marketing assets after planning.",
                  "Genera activos de marketing piloto después de planificar."
                )
          }
          href="/app/assets"
          icon={FolderOpen}
          label={copyForLanguage(language, "Marketing assets", "Activos de marketing")}
          language={language}
          value={moduleValueLabel(latestAssets.length > 0, language, latestAssets.length > 0
            ? {
                en: `${latestAssets.length} saved`,
                es: `${latestAssets.length} guardados`
              }
            : undefined)}
        />
        <ModuleCard
          detail={copyForLanguage(
            language,
            "Repeatable marketing routines derived from the saved profile and diagnosis.",
            "Rutinas repetibles de marketing derivadas del perfil guardado y el diagnóstico."
          )}
          href="/app/sops"
          icon={ScrollText}
          label={copyForLanguage(language, "Marketing routines", "Rutinas de marketing")}
          language={language}
          value={copyForLanguage(language, "Supporting", "Apoyo")}
        />
        <ModuleCard
          detail={copyForLanguage(
            language,
            "Support, deletion requests, and pilot operations stay explicit.",
            "El soporte, las solicitudes de eliminación y la operativa piloto siguen siendo explícitos."
          )}
          href="/app/support"
          icon={LifeBuoy}
          label={copyForLanguage(language, "Support", "Soporte")}
          language={language}
          value={copyForLanguage(language, "Pilot-ready", "Listo para piloto")}
        />
        </div>
      </section>
    </div>
  );
}
