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
  proofTrustSignals: string;
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
  lifecycleStage: string;
};

const optionalProgressFields = new Set<keyof ProfileDraft>([
  "website",
  "channelUrls",
  "evidenceNotes",
  "proofTrustSignals"
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

type StructuredOption = {
  value: string;
  labelEn: string;
  labelEs: string;
};

const PROOF_TRUST_PREFIX = "Proof / trust available:";

const industryOptions: StructuredOption[] = [
  { value: "Food & beverage", labelEn: "Food & beverage", labelEs: "Comida y bebida" },
  { value: "Creative services", labelEn: "Creative services", labelEs: "Servicios creativos" },
  { value: "Professional services", labelEn: "Professional services", labelEs: "Servicios profesionales" },
  { value: "Education / training", labelEn: "Education / training", labelEs: "Educación / formación" },
  { value: "Wellness / health", labelEn: "Wellness / health", labelEs: "Bienestar / salud" },
  { value: "Retail / ecommerce", labelEn: "Retail / ecommerce", labelEs: "Retail / ecommerce" },
  { value: "SaaS / digital product", labelEn: "SaaS / digital product", labelEs: "SaaS / producto digital" },
  { value: "Events / experiences", labelEn: "Events / experiences", labelEs: "Eventos / experiencias" },
  { value: "Consulting", labelEn: "Consulting", labelEs: "Consultoría" }
];

const businessModelOptions: StructuredOption[] = [
  { value: "Services", labelEn: "Services", labelEs: "Servicios" },
  { value: "Product sales", labelEn: "Product sales", labelEs: "Venta de producto" },
  { value: "Pop-up / event-based sales", labelEn: "Pop-up / event-based sales", labelEs: "Ventas por pop-up / evento" },
  { value: "Ecommerce", labelEn: "Ecommerce", labelEs: "Ecommerce" },
  { value: "Subscription", labelEn: "Subscription", labelEs: "Suscripción" },
  { value: "Courses / workshops", labelEn: "Courses / workshops", labelEs: "Cursos / talleres" },
  { value: "Consulting", labelEn: "Consulting", labelEs: "Consultoría" },
  { value: "Marketplace", labelEn: "Marketplace", labelEs: "Marketplace" },
  { value: "Mixed model", labelEn: "Mixed model", labelEs: "Modelo mixto" }
];

const businessStageOptions: StructuredOption[] = [
  { value: "Idea only", labelEn: "Idea only", labelEs: "Sólo idea" },
  { value: "Testing with friends/family", labelEn: "Testing with friends/family", labelEs: "Probando con amigos/familia" },
  { value: "First sales", labelEn: "First sales", labelEs: "Primeras ventas" },
  { value: "Regular sales", labelEn: "Regular sales", labelEs: "Ventas regulares" },
  { value: "Growing but disorganized", labelEn: "Growing but disorganized", labelEs: "Creciendo pero desorganizado" },
  { value: "Established but needs marketing clarity", labelEn: "Established but needs marketing clarity", labelEs: "Establecido pero necesita claridad de marketing" }
];

const teamSizeOptions: StructuredOption[] = [
  { value: "Just me", labelEn: "Just me", labelEs: "Sólo yo" },
  { value: "2-3 people", labelEn: "2-3 people", labelEs: "2-3 personas" },
  { value: "4-10 people", labelEn: "4-10 people", labelEs: "4-10 personas" },
  { value: "11-20 people", labelEn: "11-20 people", labelEs: "11-20 personas" }
];

const marketingGoalOptions: StructuredOption[] = [
  { value: "Clarify my offer", labelEn: "Clarify my offer", labelEs: "Aclarar mi oferta" },
  { value: "Understand my audience", labelEn: "Understand my audience", labelEs: "Entender mi audiencia" },
  { value: "Improve my message", labelEn: "Improve my message", labelEs: "Mejorar mi mensaje" },
  { value: "Choose a channel", labelEn: "Choose a channel", labelEs: "Elegir un canal" },
  { value: "Get more inquiries", labelEn: "Get more inquiries", labelEs: "Conseguir más consultas" },
  { value: "Prepare a launch / pop-up / campaign", labelEn: "Prepare a launch / pop-up / campaign", labelEs: "Preparar un lanzamiento / pop-up / campaña" },
  { value: "Improve conversion", labelEn: "Improve conversion", labelEs: "Mejorar conversión" },
  { value: "Collect customer feedback", labelEn: "Collect customer feedback", labelEs: "Recoger feedback de clientes" },
  { value: "Build a simple content plan", labelEn: "Build a simple content plan", labelEs: "Crear un plan simple de contenido" },
  { value: "I'm not sure yet", labelEn: "I'm not sure yet", labelEs: "Todavía no estoy seguro" }
];

const marketingChallengeOptions: StructuredOption[] = [
  { value: "People don't know we exist", labelEn: "People don't know we exist", labelEs: "La gente no sabe que existimos" },
  { value: "People like it but don't buy", labelEn: "People like it but don't buy", labelEs: "A la gente le gusta pero no compra" },
  { value: "I don't know what to post", labelEn: "I don't know what to post", labelEs: "No sé qué publicar" },
  { value: "I don't know which channel to use", labelEn: "I don't know which channel to use", labelEs: "No sé qué canal usar" },
  { value: "I don't know how to explain the offer", labelEn: "I don't know how to explain the offer", labelEs: "No sé cómo explicar la oferta" },
  { value: "I don't have a clear CTA", labelEn: "I don't have a clear CTA", labelEs: "No tengo un CTA claro" },
  { value: "I don't know how to price it", labelEn: "I don't know how to price it", labelEs: "No sé cómo poner precio" },
  { value: "I don't track what works", labelEn: "I don't track what works", labelEs: "No mido qué funciona" },
  { value: "I depend too much on referrals", labelEn: "I depend too much on referrals", labelEs: "Dependo demasiado de referidos" },
  { value: "I'm not sure yet", labelEn: "I'm not sure yet", labelEs: "Todavía no estoy seguro" }
];

const marketingChannelOptions: StructuredOption[] = [
  { value: "Instagram", labelEn: "Instagram", labelEs: "Instagram" },
  { value: "TikTok", labelEn: "TikTok", labelEs: "TikTok" },
  { value: "LinkedIn", labelEn: "LinkedIn", labelEs: "LinkedIn" },
  { value: "Website", labelEn: "Website", labelEs: "Web" },
  { value: "WhatsApp", labelEn: "WhatsApp", labelEs: "WhatsApp" },
  { value: "Email", labelEn: "Email", labelEs: "Email" },
  { value: "Pop-up events", labelEn: "Pop-up events", labelEs: "Eventos pop-up" },
  { value: "Referrals / word of mouth", labelEn: "Referrals / word of mouth", labelEs: "Referidos / boca a boca" },
  { value: "Partnerships", labelEn: "Partnerships", labelEs: "Partnerships" },
  { value: "Marketplaces", labelEn: "Marketplaces", labelEs: "Marketplaces" },
  { value: "Paid ads", labelEn: "Paid ads", labelEs: "Anuncios pagados" },
  { value: "SEO / blog", labelEn: "SEO / blog", labelEs: "SEO / blog" },
  { value: "None yet", labelEn: "None yet", labelEs: "Ninguno todavía" }
];

const ctaOptions: StructuredOption[] = [
  { value: "DM me", labelEn: "DM me", labelEs: "Envíame un DM" },
  { value: "Book a call", labelEn: "Book a call", labelEs: "Reservar una llamada" },
  { value: "Buy online", labelEn: "Buy online", labelEs: "Comprar online" },
  { value: "Visit pop-up/event", labelEn: "Visit pop-up/event", labelEs: "Visitar pop-up/evento" },
  { value: "Join waitlist", labelEn: "Join waitlist", labelEs: "Unirse a lista de espera" },
  { value: "Fill form", labelEn: "Fill form", labelEs: "Rellenar formulario" },
  { value: "Request quote", labelEn: "Request quote", labelEs: "Solicitar presupuesto" },
  { value: "Subscribe", labelEn: "Subscribe", labelEs: "Suscribirse" },
  { value: "Follow for updates", labelEn: "Follow for updates", labelEs: "Seguir para novedades" },
  { value: "No clear CTA yet", labelEn: "No clear CTA yet", labelEs: "Todavía no hay CTA claro" }
];

const proofTrustOptions: StructuredOption[] = [
  { value: "Customer feedback", labelEn: "Customer feedback", labelEs: "Feedback de clientes" },
  { value: "Testimonials", labelEn: "Testimonials", labelEs: "Testimonios" },
  { value: "Product photos", labelEn: "Product photos", labelEs: "Fotos de producto" },
  { value: "Case studies", labelEn: "Case studies", labelEs: "Casos de estudio" },
  { value: "Before/after", labelEn: "Before/after", labelEs: "Antes/después" },
  { value: "Press / mentions", labelEn: "Press / mentions", labelEs: "Prensa / menciones" },
  { value: "Repeat customers", labelEn: "Repeat customers", labelEs: "Clientes recurrentes" },
  { value: "Event attendance", labelEn: "Event attendance", labelEs: "Asistencia a eventos" },
  { value: "Sales data", labelEn: "Sales data", labelEs: "Datos de ventas" },
  { value: "None yet", labelEn: "None yet", labelEs: "Nada todavía" }
];

const measurementOptions: StructuredOption[] = [
  { value: "I don't track anything yet", labelEn: "I don't track anything yet", labelEs: "Todavía no mido nada" },
  { value: "I track manually", labelEn: "I track manually", labelEs: "Mido manualmente" },
  { value: "I track sales only", labelEn: "I track sales only", labelEs: "Sólo mido ventas" },
  { value: "I track social metrics", labelEn: "I track social metrics", labelEs: "Mido métricas sociales" },
  { value: "I track website analytics", labelEn: "I track website analytics", labelEs: "Mido analítica web" },
  { value: "I track leads/inquiries", labelEn: "I track leads/inquiries", labelEs: "Mido leads/consultas" },
  { value: "I have a CRM", labelEn: "I have a CRM", labelEs: "Tengo un CRM" },
  { value: "I'm not sure", labelEn: "I'm not sure", labelEs: "No estoy seguro" }
];

function getWizardSteps(language: OutputLanguage): StepDefinition[] {
  return [
    {
      key: "business-basics",
      label: copyForLanguage(language, "Business basics", "Datos básicos"),
      description: copyForLanguage(
        language,
        "Start with the core identity of the business so the later marketing diagnosis stays grounded in the right company context.",
        "Empieza por la identidad principal del negocio para que el diagnóstico de marketing posterior quede anclado en el contexto correcto."
      ),
      fields: ["companyName", "website", "industry", "businessModel"]
    },
    {
      key: "visible-evidence",
      label: copyForLanguage(language, "Message, CTA, and proof", "Mensaje, CTA y evidencia"),
      description: copyForLanguage(
        language,
        "Add the visible message, CTA, and public channel evidence a reviewer would check first. This does not fetch or verify live data yet.",
        "Añade el mensaje visible, el CTA y la evidencia pública de canales que un revisor miraría primero. Todavía no se consulta ni verifica información en vivo."
      ),
      fields: [
        "positioningStatement",
        "channelUrls",
        "conversionAction",
        "proofTrustSignals",
        "evidenceNotes"
      ]
    },
    {
      key: "current-state",
      label: copyForLanguage(language, "Business context", "Contexto del negocio"),
      description: copyForLanguage(
        language,
        "Capture the stage and operating context around the business so the marketing read reflects the real situation. Do not enter sensitive private financials during pilot use.",
        "Captura la etapa y el contexto operativo del negocio para que la lectura de marketing refleje la situación real. No introduzcas información financiera privada sensible durante el piloto."
      ),
      fields: ["teamSize", "geography", "lifecycleStage"]
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
      label: copyForLanguage(language, "What feels unclear", "Qué se siente poco claro"),
      description: copyForLanguage(
        language,
        "Describe what feels unclear, inconsistent, or hard in the current marketing picture. Plain language is fine.",
        "Describe qué se siente poco claro, inconsistente o difícil en el marketing actual. El lenguaje cotidiano vale."
      ),
      fields: ["biggestBottlenecks"]
    },
    {
      key: "goals",
      label: copyForLanguage(language, "30-day marketing goal", "Objetivo de marketing a 30 días"),
      description: copyForLanguage(
        language,
        "State the concrete marketing outcome you would most like the next 30 days to improve.",
        "Indica el resultado de marketing concreto que más te gustaría mejorar en los próximos 30 días."
      ),
      fields: ["primaryGoals"]
    },
    {
      key: "systems",
      label: copyForLanguage(
        language,
        "Channels, measurement, and tools",
        "Canales, medición y herramientas"
      ),
      description: copyForLanguage(
        language,
        "Name the channels, acquisition motion, sales process, and measurement stack already in use so the diagnosis can reason from what exists today.",
        "Nombra los canales, el método de adquisición, el proceso comercial y la capa de medición que ya se usan para que el diagnóstico razone desde la realidad actual."
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
        "Review the captured profile, save it, and optionally run the marketing diagnosis from this reviewed input.",
        "Revisa el perfil capturado, guárdalo y, si quieres, ejecuta el diagnóstico de marketing desde esta versión revisada."
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

function optionLabel(option: StructuredOption, language: OutputLanguage) {
  return language === "es" ? option.labelEs : option.labelEn;
}

function optionValues(options: StructuredOption[]) {
  return new Set(options.map((option) => option.value.toLowerCase()));
}

function knownOptionValue(value: string, options: StructuredOption[]) {
  const normalized = value.trim().toLowerCase();
  return options.some((option) => option.value.toLowerCase() === normalized);
}

function splitKnownAndCustomValues(value: string, options: StructuredOption[]) {
  const knownValues = optionValues(options);
  const values = textToList(value);

  return {
    selected: values.filter((item) => knownValues.has(item.toLowerCase())),
    custom: values.filter((item) => !knownValues.has(item.toLowerCase()))
  };
}

function listToDraftText(values: string[]) {
  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function splitEvidenceNotes(notes: string | null | undefined) {
  const lines = (notes ?? "").split("\n");
  const proofLineIndex = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith(PROOF_TRUST_PREFIX.toLowerCase())
  );

  if (proofLineIndex === -1) {
    return {
      proofTrustSignals: "",
      notes: notes ?? ""
    };
  }

  const proofLine = lines[proofLineIndex].trim();
  const proofSignals = proofLine
    .slice(PROOF_TRUST_PREFIX.length)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const remainingNotes = lines
    .filter((_, index) => index !== proofLineIndex)
    .join("\n")
    .trim();

  return {
    proofTrustSignals: listToDraftText(proofSignals),
    notes: remainingNotes
  };
}

function buildEvidenceNotesForSave(draft: ProfileDraft) {
  const proofSignals = textToList(draft.proofTrustSignals);
  const notes = draft.evidenceNotes.trim();
  const sections = [];

  if (proofSignals.length > 0) {
    sections.push(`${PROOF_TRUST_PREFIX} ${proofSignals.join(", ")}`);
  }

  if (notes.length > 0) {
    sections.push(notes);
  }

  return sections.join("\n\n");
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
  const evidence = splitEvidenceNotes(profile?.evidenceNotes);

  return {
    companyName: profile?.companyName ?? "",
    outputLanguage,
    website: profile?.website ?? "",
    positioningStatement: profile?.positioningStatement ?? "",
    channelUrls: listToText(profile?.channelUrls),
    proofTrustSignals: evidence.proofTrustSignals,
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
    evidenceNotes: evidence.notes,
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
      title: copyForLanguage(language, "Message, CTA, and proof", "Mensaje, CTA y evidencia"),
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
          copyForLanguage(language, "Proof / trust available", "Prueba / confianza disponible"),
          compactList(draft.proofTrustSignals).join(", ") || copyForLanguage(language, "Not provided yet.", "Todavía no se ha indicado.")
        ] as [string, string],
        [
          copyForLanguage(language, "Evidence notes", "Notas de evidencia"),
          compactValue(draft.evidenceNotes, language)
        ] as [string, string]
      ]
    },
    {
      title: copyForLanguage(language, "Business context", "Contexto del negocio"),
      items: [
        [copyForLanguage(language, "Team size", "Tamaño del equipo"), compactValue(draft.teamSize, language)] as [string, string],
        [copyForLanguage(language, "Geography", "Geografía"), compactValue(draft.geography, language)] as [string, string],
        [copyForLanguage(language, "Lifecycle stage", "Etapa del negocio"), compactValue(draft.lifecycleStage, language)] as [string, string]
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
      title: copyForLanguage(language, "Marketing challenges and goals", "Retos y objetivos de marketing"),
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
      title: copyForLanguage(language, "Channels, measurement, and tools", "Canales, medición y herramientas"),
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
          copyForLanguage(language, "Measurement", "Medición"),
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

function StructuredSelectField({
  canEdit,
  customPlaceholder,
  draftValue,
  inputClass,
  language,
  loading,
  onChange,
  options
}: {
  canEdit: boolean;
  customPlaceholder: string;
  draftValue: string;
  inputClass: string;
  language: OutputLanguage;
  loading: boolean;
  onChange: (value: string) => void;
  options: StructuredOption[];
}) {
  const trimmedValue = draftValue.trim();
  const isKnown = trimmedValue.length > 0 && knownOptionValue(trimmedValue, options);
  const selectValue = trimmedValue.length === 0 ? "" : isKnown ? trimmedValue : "__other__";
  const showCustomInput = selectValue === "__other__";

  return (
    <div className="space-y-3">
      <select
        className={inputClass}
        disabled={!canEdit || loading}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "__other__" ? "" : nextValue);
        }}
        value={selectValue}
      >
        <option value="">
          {copyForLanguage(language, "Choose one", "Elige una opción")}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabel(option, language)}
          </option>
        ))}
        <option value="__other__">
          {copyForLanguage(language, "Other", "Otro")}
        </option>
      </select>
      {showCustomInput ? (
        <input
          className={inputClass}
          disabled={!canEdit || loading}
          onChange={(event) => onChange(event.target.value)}
          placeholder={customPlaceholder}
          value={draftValue}
        />
      ) : null}
    </div>
  );
}

function StructuredMultiSelectField({
  canEdit,
  customPlaceholder,
  language,
  loading,
  onChange,
  options,
  value
}: {
  canEdit: boolean;
  customPlaceholder: string;
  language: OutputLanguage;
  loading: boolean;
  onChange: (value: string) => void;
  options: StructuredOption[];
  value: string;
}) {
  const { selected, custom } = splitKnownAndCustomValues(value, options);
  const [showCustom, setShowCustom] = useState(custom.length > 0);
  const selectedSet = new Set(selected.map((item) => item.toLowerCase()));

  function updateSelected(nextSelected: string[], nextCustom = custom) {
    onChange(listToDraftText([...nextSelected, ...nextCustom]));
  }

  function toggleOption(option: StructuredOption) {
    if (!canEdit || loading) {
      return;
    }

    const isSelected = selectedSet.has(option.value.toLowerCase());
    const nextSelected = isSelected
      ? selected.filter((item) => item.toLowerCase() !== option.value.toLowerCase())
      : [...selected, option.value];

    updateSelected(nextSelected);
  }

  function updateCustom(value: string) {
    const nextCustom = textToList(value);
    updateSelected(selected, nextCustom);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedSet.has(option.value.toLowerCase());

          return (
            <button
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-ink bg-ink text-sand"
                  : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
              } disabled:opacity-60`}
              disabled={!canEdit || loading}
              key={option.value}
              onClick={() => toggleOption(option)}
              type="button"
            >
              {optionLabel(option, language)}
            </button>
          );
        })}
        <button
          className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
            showCustom
              ? "border-gold bg-gold/10 text-ink"
              : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
          } disabled:opacity-60`}
          disabled={!canEdit || loading}
          onClick={() => setShowCustom((current) => !current)}
          type="button"
        >
          {copyForLanguage(language, "Other", "Otro")}
        </button>
      </div>
      {showCustom ? (
        <textarea
          className="min-h-24 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60"
          disabled={!canEdit || loading}
          onChange={(event) => updateCustom(event.target.value)}
          placeholder={customPlaceholder}
          value={custom.join("\n")}
        />
      ) : null}
    </div>
  );
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
                "Optional. Leave blank if you don't have a website yet. If you add one, enter a valid full URL starting with http:// or https://. Do not type N/A.",
                "Opcional. Déjalo en blanco si aún no tienes sitio web. Si añades uno, introduce una URL válida completa que empiece por http:// o https://. No escribas N/A."
              )}
            </p>
          </Field>
          <Field
            helpText={copyForLanguage(
              language,
              "Choose the closest sector so the diagnosis can use a relevant marketing lens. Example: a supper club or packaged food brand is Food & beverage.",
              "Elige el sector más cercano para que el diagnóstico use una lectura de marketing relevante. Ejemplo: un supper club o marca de comida es Comida y bebida."
            )}
            label={copyForLanguage(language, "Industry / sector", "Industria / sector")}
          >
            <StructuredSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe your sector",
                "Describe tu sector"
              )}
              draftValue={draft.industry}
              inputClass={inputClass}
              language={language}
              loading={loading}
              onChange={(value) => updateField("industry", value)}
              options={industryOptions}
            />
          </Field>
          <Field
            helpText={copyForLanguage(
              language,
              "Pick how money is usually made today or expected to be made first. Example: tastings and market stalls are Pop-up / event-based sales.",
              "Elige cómo se gana dinero hoy o cómo se espera ganar primero. Ejemplo: degustaciones y mercados son ventas por pop-up / evento."
            )}
            label={copyForLanguage(language, "Business model", "Modelo de negocio")}
          >
            <StructuredSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe the model",
                "Describe el modelo"
              )}
              draftValue={draft.businessModel}
              inputClass={inputClass}
              language={language}
              loading={loading}
              onChange={(value) => updateField("businessModel", value)}
              options={businessModelOptions}
            />
          </Field>
        </div>
      );
    case "visible-evidence":
      return (
        <div className="space-y-4">
          <Field label={copyForLanguage(language, "Current one-line message / positioning", "Mensaje / posicionamiento actual en una frase")}>
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
            <Field label={copyForLanguage(language, "Main public marketing / channel URLs", "URLs públicas principales de marketing / canales")}>
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
            <Field
              helpText={copyForLanguage(
                language,
                "This is the action you want someone to take after seeing your marketing. Example: Visit pop-up/event.",
                "Es la acción que quieres que alguien haga después de ver tu marketing. Ejemplo: visitar pop-up/evento."
              )}
              label={copyForLanguage(language, "CTA / next step", "CTA / siguiente paso")}
            >
              <StructuredSelectField
                canEdit={canEdit}
                customPlaceholder={copyForLanguage(
                  language,
                  "Describe the next step",
                  "Describe el siguiente paso"
                )}
                draftValue={draft.conversionAction}
                inputClass={inputClass}
                language={language}
                loading={loading}
                onChange={(value) => updateField("conversionAction", value)}
                options={ctaOptions}
              />
            </Field>
          </div>
          <Field
            helpText={copyForLanguage(
              language,
              "Pick proof that already exists, even if it is informal. Example: customer comments after a tasting count as Customer feedback.",
              "Elige la prueba que ya existe, aunque sea informal. Ejemplo: comentarios de clientes después de una degustación cuentan como feedback de clientes."
            )}
            label={copyForLanguage(language, "Proof / trust available", "Prueba / confianza disponible")}
          >
            <StructuredMultiSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Tell us more about proof, trust, or customer signals",
                "Cuéntanos más sobre prueba, confianza o señales de clientes"
              )}
              language={language}
              loading={loading}
              onChange={(value) => updateField("proofTrustSignals", value)}
              options={proofTrustOptions}
              value={draft.proofTrustSignals}
            />
          </Field>
          <Field
            helpText={copyForLanguage(
              language,
              "Add raw context the dropdowns cannot capture. Example: 'Three people asked for catering after the last pop-up.'",
              "Añade contexto que los desplegables no capturan. Ejemplo: 'Tres personas preguntaron por catering después del último pop-up.'"
            )}
            label={copyForLanguage(language, "Evidence notes / customer comments", "Notas de evidencia / comentarios de clientes")}
          >
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
            <StructuredSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe the team size",
                "Describe el tamaño del equipo"
              )}
              draftValue={draft.teamSize}
              inputClass={inputClass}
              language={language}
              loading={loading}
              onChange={(value) => updateField("teamSize", value)}
              options={teamSizeOptions}
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
          <Field label={copyForLanguage(language, "Business stage", "Etapa del negocio")}>
            <StructuredSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe the stage",
                "Describe la etapa"
              )}
              draftValue={draft.lifecycleStage}
              inputClass={inputClass}
              language={language}
              loading={loading}
              onChange={(value) => updateField("lifecycleStage", value)}
              options={businessStageOptions}
            />
          </Field>
        </div>
      );
    case "offer-audience":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
          <Field
            helpText={copyForLanguage(
              language,
              "Explain what you sell and what makes the project different or worth caring about. Example: handmade dumplings for private supper clubs using family recipes.",
              "Explica qué vendes y qué hace que el proyecto sea distinto o relevante. Ejemplo: dumplings artesanales para cenas privadas usando recetas familiares."
            )}
            label={copyForLanguage(language, "Current offer description / what makes it special", "Descripción de la oferta / qué la hace especial")}
          >
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("primaryOffer", event.target.value)}
              placeholder={copyForLanguage(
                language,
              "What the business sells, how it is packaged, and why a buyer should care.",
              "Qué vende el negocio, cómo se empaqueta y por qué a un comprador debería importarle."
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
                "Who the business is built for, what they are trying to solve, and what makes them a good-fit buyer.",
                "Para quién está construido el negocio, qué intenta resolver y qué lo convierte en un comprador bien encajado."
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
          <Field
            helpText={copyForLanguage(
              language,
              "Choose what feels hardest right now. Example: if people compliment the product but do not order, choose People like it but don't buy.",
              "Elige lo que se siente más difícil ahora. Ejemplo: si la gente felicita el producto pero no pide, elige A la gente le gusta pero no compra."
            )}
            label={copyForLanguage(language, "Main marketing challenge", "Principal reto de marketing")}
          >
            <StructuredMultiSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe your challenge",
                "Describe tu reto"
              )}
              language={language}
              loading={loading}
              onChange={(value) => updateField("biggestBottlenecks", value)}
              options={marketingChallengeOptions}
              value={draft.biggestBottlenecks}
            />
          </Field>
          <p className="text-sm text-muted">
            {copyForLanguage(
              language,
              "Select one or more challenges. Use Other if none fits exactly.",
              "Selecciona uno o más retos. Usa Otro si ninguno encaja exactamente."
            )}
          </p>
        </div>
      );
    case "goals":
      return (
        <div className="space-y-4">
          <Field
            helpText={copyForLanguage(
              language,
              "Pick the outcome you want the next 30 days to improve. Example: Prepare a launch / pop-up / campaign.",
              "Elige el resultado que quieres mejorar en los próximos 30 días. Ejemplo: preparar un lanzamiento / pop-up / campaña."
            )}
            label={copyForLanguage(language, "Main 30-day marketing goal", "Objetivo principal de marketing a 30 días")}
          >
            <StructuredMultiSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe your goal",
                "Describe tu objetivo"
              )}
              language={language}
              loading={loading}
              onChange={(value) => updateField("primaryGoals", value)}
              options={marketingGoalOptions}
              value={draft.primaryGoals}
            />
          </Field>
          <p className="text-sm text-muted">
            {copyForLanguage(
              language,
              "Select one or more goals. These goals shape the deterministic diagnosis and first 30-day marketing plan.",
              "Selecciona uno o más objetivos. Estos objetivos moldean el diagnóstico determinista y el primer plan de marketing de 30 días."
            )}
          </p>
        </div>
      );
    case "systems":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
          <Field
            helpText={copyForLanguage(
              language,
              "Select where people currently discover or contact you. Example: if most demand comes through Instagram DMs, choose Instagram.",
              "Selecciona dónde te descubren o contactan actualmente. Ejemplo: si la mayoría llega por DMs de Instagram, elige Instagram."
            )}
            label={copyForLanguage(language, "Current marketing channels", "Canales de marketing actuales")}
          >
            <StructuredMultiSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Describe any other channels",
                "Describe otros canales"
              )}
              language={language}
              loading={loading}
              onChange={(value) => updateField("currentChannels", value)}
              options={marketingChannelOptions}
              value={draft.currentChannels}
            />
          </Field>
            <Field
              helpText={copyForLanguage(
                language,
                "Pick how you currently know whether marketing is working. Example: if you count Instagram DMs in a spreadsheet, choose I track manually.",
                "Elige cómo sabes actualmente si el marketing funciona. Ejemplo: si cuentas DMs de Instagram en una hoja, elige Mido manualmente."
              )}
              label={copyForLanguage(language, "Measurement", "Medición")}
            >
            <StructuredMultiSelectField
              canEdit={canEdit}
              customPlaceholder={copyForLanguage(
                language,
                "Add tools or measurement details",
                "Añade herramientas o detalles de medición"
              )}
              language={language}
              loading={loading}
              onChange={(value) => updateField("currentTools", value)}
              options={measurementOptions}
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
        evidenceNotes: buildEvidenceNotesForSave(draft),
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
          "Marketing profile saved. You can keep editing or run the marketing diagnosis from the review step.",
          "Perfil de marketing guardado. Puedes seguir editándolo o ejecutar el diagnóstico de marketing desde el paso de revisión."
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
              {copyForLanguage(language, "Guided marketing intake", "Captura guiada de marketing")}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {copyForLanguage(
                language,
                "Build the profile step by step, then review it before the marketing diagnosis.",
                "Construye el perfil paso a paso y revísalo antes del diagnóstico de marketing."
              )}
            </h2>
            <p className="mt-4 body-lg">
              {copyForLanguage(
                language,
                "The save flow stays the same, but the profile now captures the business context and visible marketing evidence needed to separate stated claims, visible signals, and what still needs validation.",
                "El guardado sigue funcionando igual, pero el perfil ahora captura el contexto del negocio y la evidencia visible de marketing necesaria para separar declaraciones, señales visibles y lo que todavía necesita validación."
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

          <nav className="space-y-3" aria-label="Marketing intake steps">
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
                          "Review the full profile, then save or run the marketing diagnosis.",
                          "Revisa el perfil completo y luego guarda o ejecuta el diagnóstico de marketing."
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
                  `Review note: these steps still have missing fields: ${reviewWarnings.join(", ")}. You can still save a partial profile, but the marketing diagnosis will have weaker signal.`,
                  `Nota de revisión: estos pasos todavía tienen campos sin completar: ${reviewWarnings.join(", ")}. Puedes guardar un perfil parcial, pero el diagnóstico de marketing tendrá una señal más débil.`
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
                      : copyForLanguage(language, "Save and run marketing diagnosis", "Guardar y ejecutar diagnóstico de marketing")}
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
  helpText,
  label,
  children
}: {
  helpText?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 text-sm font-medium">
      <div className="flex flex-wrap items-center gap-2">
        <span>{label}</span>
        {helpText ? (
          <details className="group relative">
            <summary className="inline-flex size-6 cursor-pointer list-none items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-xs font-semibold text-muted transition hover:text-ink">
              ?
            </summary>
            <div className="absolute left-0 z-10 mt-2 w-72 rounded-2xl border border-[color:var(--border)] bg-white p-3 text-xs font-normal leading-5 text-muted shadow-soft">
              {helpText}
            </div>
          </details>
        ) : null}
      </div>
      {children}
    </div>
  );
}
