"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BusinessProfileRecord, OutputLanguage } from "@/lib/foundation";
import {
  copyForLanguage,
  formatDateTimeForLanguage
} from "@/lib/language";

type ProfileDraft = {
  companyName: string;
  outputLanguage: OutputLanguage;
  website: string;
  positioningStatement: string;
  channelUrls: string;
  industry: string;
  businessModel: string;
  teamSize: string;
  geography: string;
  primaryOffer: string;
  targetAudience: string;
  conversionAction: string;
  pricingModel: string;
  acquisitionMethod: string;
  salesProcess: string;
  currentChannels: string;
  currentTools: string;
  primaryGoals: string;
  biggestBottlenecks: string;
  evidenceNotes: string;
  budgetBand: string;
  lifecycleStage: string;
};

const optionalProgressFields = new Set<keyof ProfileDraft>([
  "website",
  "channelUrls",
  "evidenceNotes"
]);
const urlPlaceholderValues = new Set([
  "na",
  "n/a",
  "none",
  "no website",
  "no website yet",
  "-"
]);

type ProfileStepKey =
  | "business-basics"
  | "visible-evidence"
  | "current-state"
  | "offer-audience"
  | "bottlenecks"
  | "goals"
  | "systems"
  | "output-language"
  | "review";

type StepDefinition = {
  key: ProfileStepKey;
  label: string;
  description: string;
  fields: Array<keyof ProfileDraft>;
};

function getWizardSteps(language: OutputLanguage): StepDefinition[] {
  return [
    {
      key: "business-basics",
      label: copyForLanguage(language, "Business basics", "Datos básicos"),
      description: copyForLanguage(
        language,
        "Start with the core identity of the business so later answers stay grounded in the right company context.",
        "Empieza por la identidad principal del negocio para que las respuestas posteriores queden ancladas en el contexto correcto."
      ),
      fields: ["companyName", "website", "industry", "businessModel"]
    },
    {
      key: "visible-evidence",
      label: copyForLanguage(language, "Visible evidence", "Evidencia visible"),
      description: copyForLanguage(
        language,
        "Add the visible positioning and channel evidence a reviewer would check first. This does not fetch or verify live data yet.",
        "Añade la evidencia visible de posicionamiento y canales que un revisor miraría primero. Todavía no se consulta ni verifica información en vivo."
      ),
      fields: ["positioningStatement", "channelUrls", "conversionAction", "evidenceNotes"]
    },
    {
      key: "current-state",
      label: copyForLanguage(language, "Current state", "Estado actual"),
      description: copyForLanguage(
        language,
        "Capture the current shape of the company: team, geography, stage, and budget range.",
        "Captura la situación actual de la empresa: equipo, geografía, etapa y rango de presupuesto."
      ),
      fields: ["teamSize", "geography", "lifecycleStage", "budgetBand"]
    },
    {
      key: "offer-audience",
      label: copyForLanguage(language, "Offer and audience", "Oferta y audiencia"),
      description: copyForLanguage(
        language,
        "Describe what the company sells, who it is built for, and how the buyer sees the price or ticket model.",
        "Describe qué vende la empresa, para quién está pensada y cómo ve el comprador el precio o modelo de ticket."
      ),
      fields: ["primaryOffer", "targetAudience", "pricingModel"]
    },
    {
      key: "bottlenecks",
      label: copyForLanguage(language, "Pain points", "Puntos de dolor"),
      description: copyForLanguage(
        language,
        "List the biggest operational or commercial constraints in the founder’s own language.",
        "Enumera las mayores limitaciones operativas o comerciales con el lenguaje real del fundador u operador."
      ),
      fields: ["biggestBottlenecks"]
    },
    {
      key: "goals",
      label: copyForLanguage(language, "Goals", "Objetivos"),
      description: copyForLanguage(
        language,
        "State the operating outcomes the workspace wants the system to optimize for next.",
        "Indica los resultados operativos que el espacio quiere optimizar a continuación."
      ),
      fields: ["primaryGoals"]
    },
    {
      key: "systems",
      label: copyForLanguage(
        language,
        "Tools, channels, and operations",
        "Herramientas, canales y operaciones"
      ),
      description: copyForLanguage(
        language,
        "Name the channels, acquisition motion, sales process, and systems already in use so the diagnostic can reason from what exists today.",
        "Nombra los canales, método de adquisición, proceso comercial y sistemas que ya se usan para que el diagnóstico razone desde la realidad actual."
      ),
      fields: ["currentChannels", "acquisitionMethod", "salesProcess", "currentTools"]
    },
    {
      key: "output-language",
      label: copyForLanguage(language, "Primary language", "Idioma principal"),
      description: copyForLanguage(
        language,
        "Choose the primary workspace language. Generated outputs follow this setting and the app experience is moving toward the same language.",
        "Elige el idioma principal del espacio. Los resultados generados siguen esta configuración y la experiencia de la app se alinea con ese idioma donde ya está conectado."
      ),
      fields: ["outputLanguage"]
    },
    {
      key: "review",
      label: copyForLanguage(language, "Review and run", "Revisar y ejecutar"),
      description: copyForLanguage(
        language,
        "Review the captured profile, save it, and optionally run diagnostics from this reviewed input.",
        "Revisa el perfil capturado, guárdalo y, si quieres, ejecuta el diagnóstico desde esta versión revisada."
      ),
      fields: []
    }
  ];
}

function listToText(values: string[] | undefined) {
  return (values ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUrlFieldValue(value: string) {
  const trimmed = value.trim();
  return urlPlaceholderValues.has(trimmed.toLowerCase()) ? "" : trimmed;
}

function textToUrlList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => normalizeUrlFieldValue(item))
    .filter(Boolean);
}

function buildInitialDraft(
  profile: BusinessProfileRecord | null,
  outputLanguage: OutputLanguage
): ProfileDraft {
  return {
    companyName: profile?.companyName ?? "",
    outputLanguage,
    website: profile?.website ?? "",
    positioningStatement: profile?.positioningStatement ?? "",
    channelUrls: listToText(profile?.channelUrls),
    industry: profile?.industry ?? "",
    businessModel: profile?.businessModel ?? "",
    teamSize: profile?.teamSize ?? "",
    geography: profile?.geography ?? "",
    primaryOffer: profile?.primaryOffer ?? "",
    targetAudience: profile?.targetAudience ?? "",
    conversionAction: profile?.conversionAction ?? "",
    pricingModel: profile?.pricingModel ?? "",
    acquisitionMethod: profile?.acquisitionMethod ?? "",
    salesProcess: profile?.salesProcess ?? "",
    currentChannels: listToText(profile?.currentChannels),
    currentTools: listToText(profile?.currentTools),
    primaryGoals: listToText(profile?.primaryGoals),
    biggestBottlenecks: listToText(profile?.biggestBottlenecks),
    evidenceNotes: profile?.evidenceNotes ?? "",
    budgetBand: profile?.budgetBand ?? "",
    lifecycleStage: profile?.lifecycleStage ?? ""
  };
}

function fieldHasValue(field: keyof ProfileDraft, value: string) {
  if (field === "outputLanguage") {
    return true;
  }

  if (optionalProgressFields.has(field) && value.trim().length === 0) {
    return true;
  }

  return value.trim().length > 0;
}

function stepProgress(draft: ProfileDraft, step: StepDefinition) {
  if (step.fields.length === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      isComplete: true
    };
  }

  const completedCount = step.fields.filter((field) =>
    fieldHasValue(field, draft[field])
  ).length;

  return {
    completedCount,
    totalCount: step.fields.length,
    isComplete: completedCount === step.fields.length
  };
}

function getInitialStep(
  profile: BusinessProfileRecord | null,
  outputLanguage: OutputLanguage
) {
  const wizardSteps = getWizardSteps(outputLanguage);
  const draft = buildInitialDraft(profile, outputLanguage);
  const firstIncomplete = wizardSteps.find(
    (step) => step.key !== "review" && !stepProgress(draft, step).isComplete
  );

  return firstIncomplete?.key ?? "review";
}

function compactValue(value: string, language: OutputLanguage) {
  return value.trim().length > 0
    ? value.trim()
    : copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.");
}

function compactList(value: string) {
  return textToList(value);
}

function progressPercent(draft: ProfileDraft, wizardSteps: StepDefinition[]) {
  const completableSteps = wizardSteps.filter((step) => step.key !== "review");
  const completeCount = completableSteps.filter((step) =>
    stepProgress(draft, step).isComplete
  ).length;

  return Math.round((completeCount / completableSteps.length) * 100);
}

function reviewGroups(draft: ProfileDraft, language: OutputLanguage) {
  return [
    {
      title: copyForLanguage(language, "Business basics", "Datos básicos"),
      items: [
        [copyForLanguage(language, "Company name", "Nombre de la empresa"), compactValue(draft.companyName, language)] as [string, string],
        [copyForLanguage(language, "Website", "Sitio web"), compactValue(draft.website, language)] as [string, string],
        [copyForLanguage(language, "Industry", "Industria"), compactValue(draft.industry, language)] as [string, string],
        [copyForLanguage(language, "Business model", "Modelo de negocio"), compactValue(draft.businessModel, language)] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Visible evidence", "Evidencia visible"),
      items: [
        [
          copyForLanguage(language, "One-line positioning", "Posicionamiento en una frase"),
          compactValue(draft.positioningStatement, language)
        ] as [string, string],
        [
          copyForLanguage(language, "Channel URLs", "URLs de canales"),
          compactList(draft.channelUrls).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string],
        [
          copyForLanguage(language, "Current CTA", "CTA actual"),
          compactValue(draft.conversionAction, language)
        ] as [string, string],
        [
          copyForLanguage(language, "Evidence notes", "Notas de evidencia"),
          compactValue(draft.evidenceNotes, language)
        ] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Current state", "Estado actual"),
      items: [
        [copyForLanguage(language, "Team size", "Tamaño del equipo"), compactValue(draft.teamSize, language)] as [string, string],
        [copyForLanguage(language, "Geography", "Geografía"), compactValue(draft.geography, language)] as [string, string],
        [copyForLanguage(language, "Lifecycle stage", "Etapa del negocio"), compactValue(draft.lifecycleStage, language)] as [string, string],
        [copyForLanguage(language, "Budget band", "Rango de presupuesto"), compactValue(draft.budgetBand, language)] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Offer and audience", "Oferta y audiencia"),
      items: [
        [copyForLanguage(language, "Primary offer", "Oferta principal"), compactValue(draft.primaryOffer, language)] as [string, string],
        [copyForLanguage(language, "Target audience", "Audiencia objetivo"), compactValue(draft.targetAudience, language)] as [string, string],
        [copyForLanguage(language, "Pricing / ticket model", "Precio / modelo de ticket"), compactValue(draft.pricingModel, language)] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Pain points and goals", "Puntos de dolor y objetivos"),
      items: [
        [
          copyForLanguage(language, "Biggest bottlenecks", "Mayores cuellos de botella"),
          compactList(draft.biggestBottlenecks).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string],
        [
          copyForLanguage(language, "Primary goals", "Objetivos principales"),
          compactList(draft.primaryGoals).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Systems and output", "Sistemas y salida"),
      items: [
        [
          copyForLanguage(language, "Current channels", "Canales actuales"),
          compactList(draft.currentChannels).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string],
        [
          copyForLanguage(language, "Acquisition method", "Método de adquisición"),
          compactValue(draft.acquisitionMethod, language)
        ] as [string, string],
        [
          copyForLanguage(language, "Sales process", "Proceso comercial"),
          compactValue(draft.salesProcess, language)
        ] as [string, string],
        [
          copyForLanguage(language, "Current tools", "Herramientas actuales"),
          compactList(draft.currentTools).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string],
        [
          copyForLanguage(language, "Primary language", "Idioma principal"),
          draft.outputLanguage === "es"
            ? copyForLanguage(language, "Spanish output", "Salida en español")
            : copyForLanguage(language, "English output", "Salida en inglés")
        ] as [string, string]
      ]
    }
  ];
}

function renderStepFields({
  activeStep,
  canEdit,
  draft,
  inputClass,
  language,
  loading,
  textareaClass,
  updateField
}: {
  activeStep: ProfileStepKey;
  canEdit: boolean;
  draft: ProfileDraft;
  inputClass: string;
  language: OutputLanguage;
  loading: boolean;
  textareaClass: string;
  updateField: (field: keyof ProfileDraft, value: string) => void;
}) {
  switch (activeStep) {
    case "business-basics":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={copyForLanguage(language, "Company name", "Nombre de la empresa")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder={copyForLanguage(language, "FoundryOS Studio", "FoundryOS Studio")}
              value={draft.companyName}
            />
          </Field>
          <Field label={copyForLanguage(language, "Website", "Sitio web")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("website", event.target.value)}
              placeholder="https://example.com"
              value={draft.website}
            />
            <p className="text-sm font-normal text-muted">
              {copyForLanguage(
                language,
                'Optional. Leave it blank if there is "No website yet". If you add one, enter a valid full URL. Do not type N/A.',
                'Opcional. Déjalo en blanco si "Aún no hay sitio web". Si añades uno, introduce una URL válida completa. No escribas N/A.'
              )}
            </p>
          </Field>
          <Field label={copyForLanguage(language, "Industry", "Industria")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("industry", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "B2B SaaS, services, ecommerce...",
                "SaaS B2B, servicios, ecommerce..."
              )}
              value={draft.industry}
            />
          </Field>
          <Field label={copyForLanguage(language, "Business model", "Modelo de negocio")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("businessModel", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Subscription, project services, marketplace...",
                "Suscripción, servicios por proyecto, marketplace..."
              )}
              value={draft.businessModel}
            />
          </Field>
        </div>
      );
    case "visible-evidence":
      return (
        <div className="space-y-4">
          <Field label={copyForLanguage(language, "Current one-line positioning", "Posicionamiento actual en una frase")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("positioningStatement", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "We help boutique agencies turn founder-led sales into repeatable pipeline.",
                "Ayudamos a agencias boutique a convertir ventas lideradas por el fundador en pipeline repetible."
              )}
              value={draft.positioningStatement}
            />
          </Field>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label={copyForLanguage(language, "Main social / channel URLs", "URLs principales de canales")}>
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("channelUrls", event.target.value)}
                placeholder="https://linkedin.com/company/example&#10;https://instagram.com/example"
                value={draft.channelUrls}
              />
              <p className="text-sm font-normal text-muted">
                {copyForLanguage(
                  language,
                  "Optional. Add one full URL per line. Leave it blank if links are not available yet. Do not type N/A.",
                  "Opcional. Añade una URL completa por línea. Déjalo en blanco si todavía no hay enlaces disponibles. No escribas N/A."
                )}
              </p>
            </Field>
            <Field label={copyForLanguage(language, "Current CTA or conversion action", "CTA o acción de conversión actual")}>
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("conversionAction", event.target.value)}
                placeholder={copyForLanguage(
                  language,
                  "Book a demo, request proposal, join waitlist, buy now...",
                  "Reservar demo, solicitar propuesta, unirse a lista de espera, comprar ahora..."
                )}
                value={draft.conversionAction}
              />
            </Field>
          </div>
          <Field label={copyForLanguage(language, "Optional evidence notes", "Notas opcionales de evidencia")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("evidenceNotes", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Paste context the system should consider: recent objections, homepage claim, sales notes, screenshots summarized in text, or known data gaps.",
                "Pega contexto que el sistema debería considerar: objeciones recientes, promesa de la home, notas comerciales, capturas resumidas en texto o gaps de datos conocidos."
              )}
              value={draft.evidenceNotes}
            />
          </Field>
          <p className="text-sm text-muted">
            {copyForLanguage(
              language,
              "These fields are user-entered evidence only. FoundryOS does not crawl or verify the URLs yet.",
              "Estos campos son evidencia introducida por el usuario. FoundryOS todavía no rastrea ni verifica las URLs."
            )}
          </p>
        </div>
      );
    case "current-state":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={copyForLanguage(language, "Team size", "Tamaño del equipo")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("teamSize", event.target.value)}
              placeholder={copyForLanguage(language, "Solo, 2-5, 6-10...", "Solo, 2-5, 6-10...")}
              value={draft.teamSize}
            />
          </Field>
          <Field label={copyForLanguage(language, "Geography", "Geografía")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("geography", event.target.value)}
              placeholder={copyForLanguage(language, "US, Spain, EU, global...", "España, UE, LatAm, global...")}
              value={draft.geography}
            />
          </Field>
          <Field label={copyForLanguage(language, "Lifecycle stage", "Etapa del negocio")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("lifecycleStage", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Pre-revenue, validated, growing...",
                "Pre-ingresos, validado, creciendo..."
              )}
              value={draft.lifecycleStage}
            />
          </Field>
          <Field label={copyForLanguage(language, "Budget band", "Rango de presupuesto")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("budgetBand", event.target.value)}
              placeholder={copyForLanguage(language, "Under 1k, 1k-5k, 5k+...", "Menos de 1k, 1k-5k, 5k+...")}
              value={draft.budgetBand}
            />
          </Field>
        </div>
      );
    case "offer-audience":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
          <Field label={copyForLanguage(language, "Primary offer", "Oferta principal")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("primaryOffer", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "What the business sells, how it is packaged, and why a buyer chooses it.",
                "Qué vende el negocio, cómo se empaqueta y por qué un comprador lo elige."
              )}
              value={draft.primaryOffer}
            />
          </Field>
          <Field label={copyForLanguage(language, "Target audience", "Audiencia objetivo")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("targetAudience", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Who the business is built for, what they are trying to solve, and why they buy.",
                "Para quién está construido el negocio, qué intenta resolver y por qué compra."
              )}
              value={draft.targetAudience}
            />
          </Field>
          </div>
          <Field label={copyForLanguage(language, "Approximate pricing / ticket model", "Precio aproximado / modelo de ticket")}>
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("pricingModel", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "$99/month, $5k project, 10% take rate, custom proposal...",
                "99€/mes, proyecto de 5k, 10% comisión, propuesta personalizada..."
              )}
              value={draft.pricingModel}
            />
          </Field>
        </div>
      );
    case "bottlenecks":
      return (
        <div className="space-y-4">
          <Field label={copyForLanguage(language, "Biggest bottlenecks", "Mayores cuellos de botella")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("biggestBottlenecks", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Manual onboarding\nUnclear channel priorities\nWeak reporting visibility",
                "Onboarding manual\nPrioridades de canal poco claras\nPoca visibilidad de reporting"
              )}
              value={draft.biggestBottlenecks}
            />
          </Field>
          <p className="text-sm text-muted">
            {copyForLanguage(
              language,
              "Add one bottleneck per line. Keep the wording close to how the founder or operator actually describes the problem.",
              "Añade un cuello de botella por línea. Mantén el texto cerca de cómo el fundador u operador describe realmente el problema."
            )}
          </p>
        </div>
      );
    case "goals":
      return (
        <div className="space-y-4">
          <Field label={copyForLanguage(language, "Primary goals", "Objetivos principales")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("primaryGoals", event.target.value)}
              placeholder={copyForLanguage(
                language,
                "Increase qualified leads\nReduce founder operations time\nImprove weekly KPI visibility",
                "Aumentar leads cualificados\nReducir tiempo operativo del fundador\nMejorar visibilidad semanal de KPIs"
              )}
              value={draft.primaryGoals}
            />
          </Field>
          <p className="text-sm text-muted">
            {copyForLanguage(
              language,
              "Add one goal per line. These goals feed the deterministic diagnostic and later planning outputs.",
              "Añade un objetivo por línea. Estos objetivos alimentan el diagnóstico determinista y los resultados de planificación posteriores."
            )}
          </p>
        </div>
      );
    case "systems":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
          <Field label={copyForLanguage(language, "Current channels", "Canales actuales")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentChannels", event.target.value)}
              placeholder={copyForLanguage(language, "SEO\nReferrals\nLinkedIn outbound", "SEO\nReferencias\nOutbound en LinkedIn")}
              value={draft.currentChannels}
            />
          </Field>
          <Field label={copyForLanguage(language, "Current tools", "Herramientas actuales")}>
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentTools", event.target.value)}
              placeholder={copyForLanguage(language, "HubSpot\nGoogle Analytics\nWeekly scorecard", "HubSpot\nGoogle Analytics\nScorecard semanal")}
              value={draft.currentTools}
            />
          </Field>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label={copyForLanguage(language, "Current acquisition method", "Método de adquisición actual")}>
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("acquisitionMethod", event.target.value)}
                placeholder={copyForLanguage(
                  language,
                  "Mostly referrals, founder LinkedIn outbound, SEO trials, paid search...",
                  "Principalmente referidos, outbound del fundador en LinkedIn, pruebas SEO, búsqueda pagada..."
                )}
                value={draft.acquisitionMethod}
              />
            </Field>
            <Field label={copyForLanguage(language, "Current sales process", "Proceso comercial actual")}>
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("salesProcess", event.target.value)}
                placeholder={copyForLanguage(
                  language,
                  "Lead form -> discovery call -> proposal -> close. Founder handles every step.",
                  "Formulario -> llamada de diagnóstico -> propuesta -> cierre. El fundador gestiona todo."
                )}
                value={draft.salesProcess}
              />
            </Field>
          </div>
        </div>
      );
    case "output-language":
      return (
        <div className="space-y-4">
          <Field label={copyForLanguage(language, "Primary workspace language", "Idioma principal del espacio")}>
            <select
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) =>
                updateField("outputLanguage", event.target.value as OutputLanguage)
              }
              value={draft.outputLanguage}
            >
              <option value="en">{copyForLanguage(language, "English", "Inglés")}</option>
              <option value="es">{copyForLanguage(language, "Spanish", "Español")}</option>
            </select>
          </Field>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-sand/55 p-4 text-sm text-muted">
            {copyForLanguage(
              language,
              "Generated outputs follow this setting across diagnostics, planning, and assets. The workspace experience uses this language where the language layer is already wired.",
              "Los resultados generados siguen esta configuración en diagnóstico, planificación y activos. La experiencia del espacio usa este idioma donde la capa de idioma ya está conectada."
            )}
          </div>
        </div>
      );
    case "review":
      return (
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-sand/55 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              {copyForLanguage(language, "Review before save", "Revisión antes de guardar")}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {copyForLanguage(
                language,
                "Review the captured context and evidence, then save it or save and run diagnostics from this reviewed input. New evidence fields are optional, but weak or missing evidence lowers confidence.",
                "Revisa el contexto y la evidencia capturada, luego guarda o guarda y ejecuta el diagnóstico desde esta versión revisada. Los nuevos campos de evidencia son opcionales, pero la evidencia débil o faltante baja la confianza."
              )}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviewGroups(draft, language).map((group) => (
              <ReviewCard group={group} key={group.title} />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function BusinessProfileForm({
  profile,
  outputLanguage,
  canEdit,
  canRunDiagnostic,
  diagnosticDisabledReason
}: {
  profile: BusinessProfileRecord | null;
  outputLanguage: OutputLanguage;
  canEdit: boolean;
  canRunDiagnostic: boolean;
  diagnosticDisabledReason: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() =>
    buildInitialDraft(profile, outputLanguage)
  );
  const [activeStep, setActiveStep] = useState<ProfileStepKey>(() =>
    getInitialStep(profile, outputLanguage)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loadingAction, setLoadingAction] = useState<"save" | "run" | null>(null);
  const language = draft.outputLanguage;
  const wizardSteps = useMemo(() => getWizardSteps(language), [language]);

  const activeStepIndex = wizardSteps.findIndex((step) => step.key === activeStep);
  const activeDefinition = wizardSteps[activeStepIndex] ?? wizardSteps[0];
  const completedSteps = wizardSteps.filter(
    (step) => step.key !== "review" && stepProgress(draft, step).isComplete
  ).length;
  const progress = progressPercent(draft, wizardSteps);
  const inputClass =
    "w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";
  const textareaClass =
    "min-h-32 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";

  const reviewWarnings = useMemo(
    () =>
      wizardSteps
        .filter((step) => step.key !== "review" && !stepProgress(draft, step).isComplete)
        .map((step) => step.label),
    [draft, wizardSteps]
  );

  function updateField(field: keyof ProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    const response = await fetch("/api/app/business-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        outputLanguage: draft.outputLanguage,
        companyName: draft.companyName,
        website: normalizeUrlFieldValue(draft.website),
        positioningStatement: draft.positioningStatement,
        channelUrls: textToUrlList(draft.channelUrls),
        industry: draft.industry,
        businessModel: draft.businessModel,
        teamSize: draft.teamSize,
        geography: draft.geography,
        primaryOffer: draft.primaryOffer,
        targetAudience: draft.targetAudience,
        conversionAction: draft.conversionAction,
        pricingModel: draft.pricingModel,
        acquisitionMethod: draft.acquisitionMethod,
        salesProcess: draft.salesProcess,
        currentChannels: textToList(draft.currentChannels),
        currentTools: textToList(draft.currentTools),
        primaryGoals: textToList(draft.primaryGoals),
        biggestBottlenecks: textToList(draft.biggestBottlenecks),
        evidenceNotes: draft.evidenceNotes,
        budgetBand: draft.budgetBand,
        lifecycleStage: draft.lifecycleStage
      })
    });

    const payload = (await response.json()) as {
      error?: string;
      field?: keyof ProfileDraft;
      profile?: BusinessProfileRecord;
    };

    if (!response.ok) {
      const failure = new Error(
        payload.error ??
          copyForLanguage(
            language,
            "Profile save failed.",
            "No se pudo guardar el perfil."
          )
      ) as Error & { field?: keyof ProfileDraft };

      failure.field = payload.field;
      throw failure;
    }

    return payload.profile ?? null;
  }

  async function runDiagnosticFromReview() {
    const response = await fetch("/api/app/diagnostics/run", {
      method: "POST"
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(
        payload.error ??
          copyForLanguage(
            language,
            "Diagnostic run failed.",
            "No se pudo ejecutar el diagnóstico."
          )
      );
    }
  }

  async function handlePersist(mode: "save" | "run") {
    if (!canEdit) {
      return;
    }

    if (mode === "run" && !canRunDiagnostic) {
      setMessageTone("error");
      setMessage(diagnosticDisabledReason);
      return;
    }

    setLoadingAction(mode);
    setMessage(null);

    try {
      const savedProfile = await saveProfile();

      if (savedProfile) {
        setDraft(buildInitialDraft(savedProfile, draft.outputLanguage));
      }

      if (mode === "run") {
        await runDiagnosticFromReview();
        router.push("/app/diagnostics");
        router.refresh();
        return;
      }

      setMessageTone("success");
      setMessage(
        copyForLanguage(
          language,
          "Business profile saved. You can keep editing or run diagnostics from the review step.",
          "Perfil del negocio guardado. Puedes seguir editándolo o ejecutar el diagnóstico desde el paso de revisión."
        )
      );
      router.refresh();
    } catch (error) {
      const failingField =
        error instanceof Error && "field" in error
          ? (error.field as keyof ProfileDraft | undefined)
          : undefined;

      if (failingField) {
        const relatedStep = wizardSteps.find((step) => step.fields.includes(failingField));
        if (relatedStep) {
          setActiveStep(relatedStep.key);
        }
      }

      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "The profile action could not be completed.",
              "No se pudo completar la acción del perfil."
            )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function moveStep(direction: "back" | "next") {
    const nextIndex =
      direction === "back"
        ? Math.max(activeStepIndex - 1, 0)
        : Math.min(activeStepIndex + 1, wizardSteps.length - 1);

    setActiveStep(wizardSteps[nextIndex].key);
  }

  return (
    <form
      className="surface space-y-6 p-6 md:p-8"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div>
            <span className="eyebrow">
              {copyForLanguage(language, "Guided intake wizard", "Asistente de captura guiada")}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {copyForLanguage(
                language,
                "Build the profile step by step, then review it before diagnostics.",
                "Construye el perfil paso a paso y revísalo antes del diagnóstico."
              )}
            </h2>
            <p className="mt-4 body-lg">
              {copyForLanguage(
                language,
                "The save flow stays the same, but the profile now captures a small evidence layer so diagnostics can separate stated claims, visible signals, and what still needs validation.",
                "El guardado sigue funcionando igual, pero el perfil ahora captura una pequeña capa de evidencia para que el diagnóstico separe declaraciones, señales visibles y lo que todavía necesita validación."
              )}
            </p>
          </div>

          {!canEdit ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              {copyForLanguage(
                language,
                "This profile is read-only for your role or current account state.",
                "Este perfil está en solo lectura para tu rol o para el estado actual de la cuenta."
              )}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-[color:var(--border)] bg-sand/55 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  {copyForLanguage(language, "Intake progress", "Progreso de captura")}
                </p>
                <p className="mt-2 text-3xl font-semibold">{progress}%</p>
              </div>
              <p className="text-sm text-muted">
                {copyForLanguage(
                  language,
                  `${completedSteps}/${wizardSteps.length - 1} steps completed`,
                  `${completedSteps}/${wizardSteps.length - 1} pasos completados`
                )}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-ink transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <nav className="space-y-3" aria-label="Profile intake steps">
            {wizardSteps.map((step, index) => {
              const currentProgress = stepProgress(draft, step);
              const isActive = step.key === activeStep;

              return (
                <button
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-ink bg-ink text-sand"
                      : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
                  }`}
                  key={step.key}
                  onClick={() => setActiveStep(step.key)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        isActive ? "text-sand/70" : "text-muted"
                      }`}
                    >
                      {copyForLanguage(language, `Step ${index + 1}`, `Paso ${index + 1}`)}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        isActive
                          ? "bg-white/15 text-sand"
                          : step.key === "review" || currentProgress.isComplete
                            ? "bg-teal/10 text-teal"
                            : currentProgress.completedCount > 0
                              ? "bg-gold/10 text-gold"
                              : "bg-white text-muted"
                      }`}
                    >
                      {step.key === "review"
                        ? copyForLanguage(language, "final", "final")
                        : currentProgress.isComplete
                          ? copyForLanguage(language, "ready", "listo")
                          : currentProgress.completedCount > 0
                            ? copyForLanguage(language, "in progress", "en curso")
                            : copyForLanguage(language, "not started", "sin empezar")}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold">{step.label}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isActive ? "text-sand/80" : "text-muted"
                    }`}
                  >
                    {step.key === "review"
                      ? copyForLanguage(
                          language,
                          "Review the full profile, then save or run diagnostics.",
                          "Revisa el perfil completo y luego guarda o ejecuta el diagnóstico."
                        )
                      : copyForLanguage(
                          language,
                          `${currentProgress.completedCount}/${currentProgress.totalCount} fields filled`,
                          `${currentProgress.completedCount}/${currentProgress.totalCount} campos completados`
                        )}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  {activeDefinition.label}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  {activeDefinition.label}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                  {activeDefinition.description}
                </p>
              </div>
              <p className="text-sm text-muted">
                {copyForLanguage(
                  language,
                  `Step ${activeStepIndex + 1} of ${wizardSteps.length}`,
                  `Paso ${activeStepIndex + 1} de ${wizardSteps.length}`
                )}
              </p>
            </div>

            {activeStep === "review" && reviewWarnings.length > 0 ? (
              <div className="mt-6 rounded-[24px] border border-gold/30 bg-gold/10 p-4 text-sm text-muted">
                {copyForLanguage(
                  language,
                  `Review note: these steps still have missing fields: ${reviewWarnings.join(", ")}. You can still save a partial profile, but diagnostics will have weaker signal.`,
                  `Nota de revisión: estos pasos todavía tienen campos sin completar: ${reviewWarnings.join(", ")}. Puedes guardar un perfil parcial, pero el diagnóstico tendrá una señal más débil.`
                )}
              </div>
            ) : null}

            <div className="mt-6">
              {renderStepFields({
                activeStep,
                canEdit,
                draft,
                inputClass,
                language,
                loading: loadingAction !== null,
                textareaClass,
                updateField
              })}
            </div>
          </section>

          <div className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--border)] bg-white/85 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={activeStepIndex === 0}
                  onClick={() => moveStep("back")}
                  type="button"
                >
                  {copyForLanguage(language, "Back", "Atrás")}
                </button>
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={activeStepIndex === wizardSteps.length - 1}
                  onClick={() => moveStep("next")}
                  type="button"
                >
                  {copyForLanguage(language, "Next", "Siguiente")}
                </button>
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-sand/60 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={!canEdit || loadingAction !== null}
                  onClick={() => void handlePersist("save")}
                  type="button"
                >
                  {loadingAction === "save"
                    ? copyForLanguage(language, "Saving...", "Guardando...")
                    : copyForLanguage(language, "Save draft", "Guardar borrador")}
                </button>
              </div>

              {activeStep === "review" ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
                    disabled={!canEdit || loadingAction !== null}
                    onClick={() => void handlePersist("save")}
                    type="button"
                  >
                    {loadingAction === "save"
                      ? copyForLanguage(language, "Saving profile...", "Guardando perfil...")
                      : copyForLanguage(language, "Save profile", "Guardar perfil")}
                  </button>
                  <button
                    className="rounded-[24px] border border-ink bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-60"
                    disabled={!canEdit || loadingAction !== null}
                    onClick={() => void handlePersist("run")}
                    type="button"
                  >
                    {loadingAction === "run"
                      ? copyForLanguage(language, "Saving and running...", "Guardando y ejecutando...")
                      : copyForLanguage(language, "Save and run diagnostic", "Guardar y ejecutar diagnóstico")}
                  </button>
                </div>
              ) : null}
            </div>

            {profile?.updatedAt ? (
              <p className="text-sm text-muted">
                {copyForLanguage(language, "Last saved", "Último guardado")}{" "}
                {formatDateTimeForLanguage(language, profile.updatedAt)}
              </p>
            ) : (
              <p className="text-sm text-muted">
                {copyForLanguage(
                  language,
                  "Draft saves use the same persisted business profile model already in the app.",
                  "Los borradores usan el mismo modelo de perfil persistido que ya existe en la app."
                )}
              </p>
            )}

            {activeStep === "review" && !canRunDiagnostic ? (
              <p className="text-sm text-muted">{diagnosticDisabledReason}</p>
            ) : null}
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-teal/30 bg-teal/10 text-teal"
                  : "border-coral/30 bg-coral/10 text-coral"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function ReviewCard({
  group
}: {
  group: { title: string; items: Array<[string, string]> };
}) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{group.title}</p>
      <div className="mt-4 space-y-3">
        {group.items.map(([label, value]) => (
          <div
            className="rounded-[20px] border border-[color:var(--border)] bg-sand/45 px-4 py-3"
            key={`${group.title}-${label}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
