import Link from "next/link";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MessageCircleQuestion,
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

function averageScore(scores: DiagnosisOutput["scores"]) {
  if (scores.length === 0) return 0;
  return Math.round(
    scores.reduce((total, score) => total + score.score, 0) / scores.length
  );
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
  const weekOne = diagnosis.plan_30d.find((week) => week.week === 1);
  const startingPoint = averageScore(diagnosis.scores);

  return (
    <section className="space-y-6" id="agentic-diagnosis">
      <FoundrySectionCard
        title={copyForLanguage(language, "Verdict", "Veredicto")}
        description={copyForLanguage(
          language,
          "Senior-strategist read of this specific business: cause over symptom.",
          "Lectura de estratega senior para este negocio concreto: causa sobre síntoma."
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
        <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-6">
          <div className="flex items-center gap-2 text-muted">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              {copyForLanguage(language, "The verdict", "El veredicto")}
            </p>
          </div>
          <p className="mt-4 text-xl font-medium leading-9 tracking-[-0.01em] text-ink md:text-2xl md:leading-10">
            {diagnosis.summary}
          </p>
        </div>
      </FoundrySectionCard>

      {diagnosis.top_bottlenecks.length > 0 ? (
        <FoundrySectionCard
          title={copyForLanguage(
            language,
            "Your 3 bottlenecks",
            "Tus 3 cuellos de botella"
          )}
          description={copyForLanguage(
            language,
            "The blockers that actually move the needle for this business.",
            "Los bloqueos que de verdad mueven la aguja en este negocio."
          )}
        >
          <div className="grid gap-3 md:grid-cols-3">
            {diagnosis.top_bottlenecks.map((bottleneck, index) => (
              <article
                className="rounded-[22px] border border-gold/30 bg-gold/10 p-5"
                key={`bottleneck-${index}`}
              >
                <div className="flex items-center gap-2 text-muted">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                    {index + 1}
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink">
                  {bottleneck}
                </p>
              </article>
            ))}
          </div>
        </FoundrySectionCard>
      ) : null}

      {weekOne ? (
        <FoundrySectionCard
          title={copyForLanguage(language, "This week", "Esta semana")}
          description={weekOne.focus}
          actions={
            <Link
              className="inline-flex items-center rounded-[24px] bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-sand"
              href="/app/actions"
            >
              {copyForLanguage(language, "View full plan", "Ver plan completo")}
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {weekOne.tasks.map((task, index) => (
              <article
                className="rounded-[22px] border border-[color:var(--border)] bg-white/90 p-5"
                key={`week1-task-${index}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {copyForLanguage(language, "Week 1", "Semana 1")}
                    </p>
                  </div>
                  <FoundryStatusChip tone="neutral">
                    {copyForLanguage(language, "Effort", "Esfuerzo")}:{" "}
                    {localizeEffort(task.effort, language)}
                  </FoundryStatusChip>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{task.title}</h3>
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
        </FoundrySectionCard>
      ) : null}

      {diagnosis.founder_answers.length > 0 ? (
        <FoundrySectionCard
          title={copyForLanguage(
            language,
            "Answers to your questions",
            "Respuestas a tus dudas"
          )}
          description={copyForLanguage(
            language,
            "Each challenge you named, answered concretely for this business.",
            "Cada duda que marcaste, respondida en concreto para este negocio."
          )}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {diagnosis.founder_answers.map((entry, index) => (
              <article
                className="rounded-[22px] border border-[color:var(--border)] bg-white/90 p-5"
                key={`founder-answer-${index}`}
              >
                <div className="flex items-start gap-2 text-muted">
                  <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm font-semibold leading-6 text-ink">
                    {entry.question}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">{entry.answer}</p>
              </article>
            ))}
          </div>
        </FoundrySectionCard>
      ) : null}

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

      <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Starting point", "Punto de partida")}
          </p>
          <FoundryStatusChip tone={scoreTone(startingPoint)}>
            {startingPoint}/100
          </FoundryStatusChip>
          <p className="text-sm leading-6 text-muted">
            {copyForLanguage(
              language,
              "Average of the 7 dimensions. It exists to measure progress between cycles, not to judge the business.",
              "Media de las 7 dimensiones. Sirve para medir progreso entre ciclos, no para juzgar el negocio."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
