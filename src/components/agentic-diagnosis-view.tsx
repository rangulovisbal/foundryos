import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Megaphone,
  Sparkles
} from "lucide-react";

import {
  FoundryProgressBar,
  FoundrySectionCard,
  FoundryStatusChip,
  type FoundryStatusTone
} from "@/components/foundry-primitives";
import type { DiagnosisOutput } from "@/lib/agentic/schema";
import { copyForLanguage } from "@/lib/language";
import type { OutputLanguage } from "@/lib/foundation";

type Confidence = "low" | "medium" | "high";
type Effort = "S" | "M" | "L";

const dimensionLabels: Record<
  DiagnosisOutput["scores"][number]["dimension"],
  { en: string; es: string }
> = {
  offer: { en: "Offer", es: "Oferta" },
  audience: { en: "Audience", es: "Audiencia" },
  message: { en: "Message", es: "Mensaje" },
  channel: { en: "Channel", es: "Canal" },
  conversion: { en: "Conversion", es: "Conversión" },
  social_proof: { en: "Social proof", es: "Prueba social" },
  measurement: { en: "Measurement", es: "Medición" }
};

const assetLabels: Record<
  DiagnosisOutput["assets"][number]["type"],
  { en: string; es: string }
> = {
  one_liner: { en: "One-liner", es: "Frase clave" },
  cta: { en: "CTA", es: "Llamada a la acción" },
  headline: { en: "Headline", es: "Titular" },
  content_idea: { en: "Content idea", es: "Idea de contenido" },
  email: { en: "Email", es: "Email" }
};

function scoreTone(score: number): FoundryStatusTone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "error";
}

function confidenceTone(confidence: Confidence): FoundryStatusTone {
  if (confidence === "high") return "success";
  if (confidence === "medium") return "warning";
  return "error";
}

function localizeConfidence(confidence: Confidence, language: OutputLanguage) {
  if (language === "es") {
    return confidence === "high" ? "Alta" : confidence === "medium" ? "Media" : "Baja";
  }
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

function localizeEffort(effort: Effort, language: OutputLanguage) {
  if (language === "es") {
    return effort === "S" ? "Bajo" : effort === "M" ? "Medio" : "Alto";
  }
  return effort === "S" ? "Low" : effort === "M" ? "Medium" : "High";
}

export function AgenticDiagnosisView({
  diagnosis,
  language,
  model,
  createdAtLabel
}: {
  diagnosis: DiagnosisOutput;
  language: OutputLanguage;
  model?: string;
  createdAtLabel?: string;
}) {
  return (
    <section className="space-y-6" id="agentic-diagnosis">
      <FoundrySectionCard
        title={copyForLanguage(language, "Strategic diagnosis", "Diagnóstico estratégico")}
        description={copyForLanguage(
          language,
          "Senior-strategist read of this specific business: cause over symptom, sequenced plan, and honest confidence.",
          "Lectura de estratega senior para este negocio concreto: causa sobre síntoma, plan secuenciado y confianza honesta."
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FoundryStatusChip tone={confidenceTone(diagnosis.overall_confidence)}>
              {copyForLanguage(language, "Confidence", "Confianza")}:{" "}
              {localizeConfidence(diagnosis.overall_confidence, language)}
            </FoundryStatusChip>
            {createdAtLabel ? (
              <FoundryStatusChip tone="neutral">{createdAtLabel}</FoundryStatusChip>
            ) : null}
            {model ? <FoundryStatusChip tone="neutral">{model}</FoundryStatusChip> : null}
          </div>
        }
      >
        <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
          <div className="flex items-center gap-2 text-muted">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              {copyForLanguage(language, "Summary", "Resumen")}
            </p>
          </div>
          <p className="mt-3 text-base leading-7 text-ink">{diagnosis.summary}</p>
        </div>

        {diagnosis.top_bottlenecks.length > 0 ? (
          <div className="mt-5">
            <div className="flex items-center gap-2 text-muted">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                {copyForLanguage(language, "Top bottlenecks", "Cuellos de botella principales")}
              </p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {diagnosis.top_bottlenecks.map((bottleneck, index) => (
                <article
                  className="rounded-[22px] border border-gold/30 bg-gold/10 p-4"
                  key={`bottleneck-${index}`}
                >
                  <p className="text-sm font-semibold leading-6 text-ink">
                    {index + 1}. {bottleneck}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </FoundrySectionCard>

      <FoundrySectionCard
        title={copyForLanguage(language, "The 7 dimensions", "Las 7 dimensiones")}
        description={copyForLanguage(
          language,
          "Score, confidence, the key finding, and the evidence gap for each marketing dimension.",
          "Puntuación, confianza, el hallazgo clave y la brecha de evidencia de cada dimensión de marketing."
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {diagnosis.scores.map((dimension) => {
            const tone = scoreTone(dimension.score);
            const label = dimensionLabels[dimension.dimension];

            return (
              <article
                className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5"
                key={dimension.dimension}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-ink">
                    {language === "es" ? label.es : label.en}
                  </h3>
                  <div className="flex items-center gap-2">
                    <FoundryStatusChip tone={confidenceTone(dimension.confidence)}>
                      {localizeConfidence(dimension.confidence, language)}
                    </FoundryStatusChip>
                    <FoundryStatusChip tone={tone}>{dimension.score}%</FoundryStatusChip>
                  </div>
                </div>
                <div className="mt-3">
                  <FoundryProgressBar tone={tone} value={dimension.score} />
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">{dimension.finding}</p>
                {dimension.evidence_gap ? (
                  <div className="mt-4 rounded-[18px] border border-[color:var(--border)] bg-sand/45 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {copyForLanguage(language, "Evidence gap", "Brecha de evidencia")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">{dimension.evidence_gap}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </FoundrySectionCard>

      <FoundrySectionCard
        title={copyForLanguage(language, "30-day plan", "Plan de 30 días")}
        description={copyForLanguage(
          language,
          "Sequenced by dependency: foundations first, then proof and conversion, then reach, with measurement closing the loop.",
          "Secuenciado por dependencia: primero los fundamentos, luego prueba y conversión, después alcance, con la medición cerrando el ciclo."
        )}
      >
        <div className="space-y-4">
          {diagnosis.plan_30d.map((week) => (
            <div
              className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5"
              key={`week-${week.week}`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[color:var(--border)] bg-sand/60 p-2.5 text-ink">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {copyForLanguage(language, "Week", "Semana")} {week.week}
                  </p>
                  <h3 className="text-base font-semibold text-ink">{week.focus}</h3>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {week.tasks.map((task, index) => (
                  <article
                    className="rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-4"
                    key={`week-${week.week}-task-${index}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-ink">{task.title}</h4>
                      <FoundryStatusChip tone="neutral">
                        {copyForLanguage(language, "Effort", "Esfuerzo")}:{" "}
                        {localizeEffort(task.effort, language)}
                      </FoundryStatusChip>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{task.why}</p>
                    <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-ink">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p>
                        <span className="font-semibold">
                          {copyForLanguage(language, "Done when", "Hecho cuando")}:
                        </span>{" "}
                        {task.done_when}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FoundrySectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <FoundrySectionCard
          title={copyForLanguage(language, "Ready-to-use assets", "Activos listos para usar")}
          description={copyForLanguage(
            language,
            "Copy you can paste today, written for this business.",
            "Textos que puedes pegar hoy, escritos para este negocio."
          )}
        >
          <div className="space-y-3">
            {diagnosis.assets.map((asset, index) => {
              const label = assetLabels[asset.type];
              return (
                <article
                  className="rounded-[20px] border border-[color:var(--border)] bg-white/90 p-4"
                  key={`asset-${index}`}
                >
                  <div className="flex items-center gap-2 text-muted">
                    <Megaphone className="h-4 w-4" />
                    <FoundryStatusChip tone="info">
                      {language === "es" ? label.es : label.en}
                    </FoundryStatusChip>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink">{asset.text}</p>
                </article>
              );
            })}
          </div>
        </FoundrySectionCard>

        <FoundrySectionCard
          title={copyForLanguage(language, "Standard operating procedures", "Procedimientos (SOPs)")}
          description={copyForLanguage(
            language,
            "Repeatable routines the owner can run alone.",
            "Rutinas repetibles que el dueño puede ejecutar solo."
          )}
        >
          <div className="space-y-3">
            {diagnosis.sops.map((sop, index) => (
              <article
                className="rounded-[20px] border border-[color:var(--border)] bg-white/90 p-4"
                key={`sop-${index}`}
              >
                <div className="flex items-center gap-2 text-ink">
                  <FileText className="h-4 w-4 text-muted" />
                  <h3 className="text-sm font-semibold">{sop.name}</h3>
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
                  {sop.steps.map((step, stepIndex) => (
                    <li key={`sop-${index}-step-${stepIndex}`}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </FoundrySectionCard>
      </div>
    </section>
  );
}
