import type {
  ActionPlanRecord,
  BusinessProfileRecord,
  DiagnosticEvidenceCard,
  DiagnosticFinding,
  DiagnosticOpportunity,
  DiagnosticResultRecord,
  ImpactLevel,
  OutputLanguage,
  PlanActionItem,
  RoadmapItem,
  RoadmapRecord,
  ThirtyDayPlanRecord,
  WorkspaceRecord
} from "@/lib/foundation";
import { resolveDownstreamTrustState, type DownstreamTrustState } from "@/lib/downstream-trust";
import { getPlanDefinition } from "@/lib/foundation";

type PlanningInput = {
  jobId: string;
  workspace: WorkspaceRecord;
  profile: BusinessProfileRecord;
  diagnostic: DiagnosticResultRecord;
};

type ActionPlanInput = PlanningInput & {
  roadmap: RoadmapRecord | null;
};

type ThirtyDayPlanInput = PlanningInput & {
  actionPlan: ActionPlanRecord;
};

type BusinessType =
  | "academy"
  | "commerce"
  | "general"
  | "marketplace"
  | "services"
  | "subscription";

type CategoryTag =
  | "acquisition"
  | "commercial"
  | "data"
  | "execution"
  | "operations"
  | "positioning";

const fallbackEnglish = {
  roadmapSummary:
    "This roadmap converts the latest diagnostic into a staged operating sequence. It is a preview planning artifact, not a guarantee of commercial outcome.",
  actionFallback: "Define the next operating step with an owner and decision point.",
  owner: "Workspace owner or assigned operator",
  monthObjective: "Close the highest-risk operating gaps found in the diagnostic.",
  noDependency: "No dependency beyond workspace review."
};

const fallbackSpanish = {
  roadmapSummary:
    "Este roadmap convierte el diagnostico mas reciente en una secuencia operativa. Es un artefacto de planificacion en preview, no una garantia de resultado comercial.",
  actionFallback: "Definir el proximo paso operativo con owner y punto de decision.",
  owner: "Owner del workspace u operador asignado",
  monthObjective: "Cerrar los gaps operativos de mayor riesgo encontrados en el diagnostico.",
  noDependency: "Sin dependencia fuera de la revision del workspace."
};

function copy(language: OutputLanguage) {
  return language === "es" ? fallbackSpanish : fallbackEnglish;
}


function detectBusinessType(profile: BusinessProfileRecord): BusinessType {
  const text = [
    profile.industry,
    profile.businessModel,
    profile.primaryOffer,
    profile.targetAudience,
    ...profile.currentChannels,
    ...profile.biggestBottlenecks
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(academy|course|school|training|cohort|education|learn|student)/.test(text)) {
    return "academy";
  }

  if (/(saas|subscription|software|platform|app|ledger|workflow)/.test(text)) {
    return "subscription";
  }

  if (/(studio|agency|consulting|service|client|retainer|project)/.test(text)) {
    return "services";
  }

  if (/(ecommerce|commerce|shop|store|retail|product|inventory)/.test(text)) {
    return "commerce";
  }

  if (/(marketplace|two-sided|supply|demand)/.test(text)) {
    return "marketplace";
  }

  return "general";
}

function businessTypeLabel(type: BusinessType, language: OutputLanguage) {
  const labels: Record<BusinessType, { en: string; es: string }> = {
    academy: { en: "learning business", es: "negocio educativo" },
    commerce: { en: "commerce business", es: "negocio de comercio" },
    general: { en: "business", es: "negocio" },
    marketplace: { en: "marketplace", es: "marketplace" },
    services: { en: "service business", es: "negocio de servicios" },
    subscription: { en: "subscription business", es: "negocio de suscripcion" }
  };

  return labels[type]?.[language] ?? labels.general[language];
}

function categoryTagsForSignal(text: string, profile: BusinessProfileRecord): CategoryTag[] {
  const value = `${text} ${profile.businessModel ?? ""} ${profile.industry ?? ""}`.toLowerCase();
  const tags = new Set<CategoryTag>();

  if (/(position|posicion|niche|nicho|audience|audiencia|offer|oferta)/.test(value)) {
    tags.add("positioning");
  }

  if (/(funnel|embudo|lead|conversion|channel|acquisition|adquisicion)/.test(value)) {
    tags.add("acquisition");
  }

  if (/(operation|operacion|manual|cadence|cadencia|delivery|fulfillment)/.test(value)) {
    tags.add("operations");
  }

  if (/(data|report|reporting|metric|visibility|visibilidad)/.test(value)) {
    tags.add("data");
  }

  if (/(pricing|budget|margin|revenue|subscription|retainer)/.test(value)) {
    tags.add("commercial");
  }

  if (tags.size === 0) {
    tags.add("execution");
  }

  return Array.from(tags).slice(0, 3);
}

const blockedVisibleLabels = [
  "captured input signals",
  "conclusiones inferidas",
  "inferred conclusions",
  "operational constraint captured",
  "recommended action basis",
  "restriccion operativa capturada",
  "senales capturadas"
];

function isBlockedVisibleLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return blockedVisibleLabels.some((label) => normalized.includes(label));
}

function primaryCategory(tags: string[]): CategoryTag {
  const validTags: CategoryTag[] = [
    "acquisition",
    "commercial",
    "data",
    "execution",
    "operations",
    "positioning"
  ];

  return validTags.find((tag) => tags.includes(tag)) ?? "execution";
}

function verticalMove({
  category,
  language,
  type
}: {
  category: CategoryTag;
  language: OutputLanguage;
  type: BusinessType;
}) {
  const moves: Record<BusinessType, Record<CategoryTag, { en: string; es: string }>> = {
    academy: {
      acquisition: {
        en: "Segment the enrollment funnel by lead quality",
        es: "Segmentar el embudo de enrolamiento por calidad de lead"
      },
      commercial: {
        en: "Clarify program package and enrollment decision criteria",
        es: "Clarificar paquete del programa y criterios de decision"
      },
      data: {
        en: "Install enrollment, completion, and referral reporting",
        es: "Instalar reporting de enrolamiento, finalizacion y referidos"
      },
      execution: {
        en: "Run a focused cohort growth operating cycle",
        es: "Ejecutar un ciclo operativo de crecimiento de cohortes"
      },
      operations: {
        en: "Define the cohort delivery and follow-up cadence",
        es: "Definir cadencia de entrega y seguimiento de cohortes"
      },
      positioning: {
        en: "Clarify the learner segment and program promise",
        es: "Clarificar segmento de estudiante y promesa del programa"
      }
    },
    commerce: {
      acquisition: {
        en: "Tighten the channel-to-purchase conversion path",
        es: "Ajustar el camino de canal a compra"
      },
      commercial: {
        en: "Refine offer bundles and margin guardrails",
        es: "Refinar bundles de oferta y guardrails de margen"
      },
      data: {
        en: "Install merchandising and repeat-purchase reporting",
        es: "Instalar reporting de merchandising y recompra"
      },
      execution: {
        en: "Run a focused conversion and retention cycle",
        es: "Ejecutar un ciclo enfocado de conversion y retencion"
      },
      operations: {
        en: "Stabilize fulfillment and inventory operating cadence",
        es: "Estabilizar cadencia operativa de fulfillment e inventario"
      },
      positioning: {
        en: "Sharpen the buyer segment and product promise",
        es: "Afinar segmento comprador y promesa del producto"
      }
    },
    general: {
      acquisition: {
        en: "Define one measurable acquisition path",
        es: "Definir un camino de adquisicion medible"
      },
      commercial: {
        en: "Clarify the offer and buying decision",
        es: "Clarificar oferta y decision de compra"
      },
      data: {
        en: "Create a weekly operating scorecard",
        es: "Crear scorecard operativo semanal"
      },
      execution: {
        en: "Set a focused monthly operating cycle",
        es: "Definir ciclo operativo mensual enfocado"
      },
      operations: {
        en: "Stabilize the core operating cadence",
        es: "Estabilizar la cadencia operativa central"
      },
      positioning: {
        en: "Narrow positioning to one priority segment",
        es: "Reducir posicionamiento a un segmento prioritario"
      }
    },
    marketplace: {
      acquisition: {
        en: "Balance supply and demand activation paths",
        es: "Balancear caminos de activacion de oferta y demanda"
      },
      commercial: {
        en: "Clarify marketplace incentives and monetization trigger",
        es: "Clarificar incentivos y disparador de monetizacion"
      },
      data: {
        en: "Install liquidity and match-quality reporting",
        es: "Instalar reporting de liquidez y calidad de match"
      },
      execution: {
        en: "Run a narrow liquidity-building cycle",
        es: "Ejecutar un ciclo enfocado de liquidez"
      },
      operations: {
        en: "Define supply onboarding and demand follow-up cadence",
        es: "Definir cadencia de onboarding de oferta y seguimiento de demanda"
      },
      positioning: {
        en: "Clarify the first high-liquidity niche",
        es: "Clarificar el primer nicho de alta liquidez"
      }
    },
    services: {
      acquisition: {
        en: "Qualify leads before sales conversations",
        es: "Calificar leads antes de conversaciones comerciales"
      },
      commercial: {
        en: "Productize the service offer and buying criteria",
        es: "Productizar la oferta de servicio y criterios de compra"
      },
      data: {
        en: "Install pipeline, delivery, and margin reporting",
        es: "Instalar reporting de pipeline, entrega y margen"
      },
      execution: {
        en: "Run a focused service-growth operating cycle",
        es: "Ejecutar un ciclo operativo enfocado de servicios"
      },
      operations: {
        en: "Productize intake-to-delivery operations",
        es: "Productizar operaciones de intake a entrega"
      },
      positioning: {
        en: "Narrow the service promise to one buyer segment",
        es: "Reducir promesa de servicio a un segmento comprador"
      }
    },
    subscription: {
      acquisition: {
        en: "Define the qualified pipeline and activation funnel",
        es: "Definir pipeline calificado y embudo de activacion"
      },
      commercial: {
        en: "Clarify packaging and conversion trigger",
        es: "Clarificar packaging y disparador de conversion"
      },
      data: {
        en: "Install activation, retention, and revenue reporting",
        es: "Instalar reporting de activacion, retencion e ingresos"
      },
      execution: {
        en: "Run a focused activation and retention cycle",
        es: "Ejecutar ciclo enfocado de activacion y retencion"
      },
      operations: {
        en: "Define handoff cadence from acquisition to success",
        es: "Definir cadencia de handoff de adquisicion a exito"
      },
      positioning: {
        en: "Sharpen ICP and product promise",
        es: "Afinar ICP y promesa del producto"
      }
    }
  };

  return moves[type][category][language];
}

function directiveAction({
  category,
  language,
  type
}: {
  category: CategoryTag;
  language: OutputLanguage;
  type: BusinessType;
}) {
  const actions: Record<BusinessType, Record<CategoryTag, { en: string; es: string }>> = {
    academy: {
      acquisition: {
        en: "Score the next 20 leads by enrollment intent and fit",
        es: "Puntuar los proximos 20 leads por intencion y fit de enrolamiento"
      },
      commercial: {
        en: "Write one program package with price, promise, and acceptance criteria",
        es: "Escribir un paquete de programa con precio, promesa y criterios de aceptacion"
      },
      data: {
        en: "Build a weekly report for lead quality, enrollment, completion, and referrals",
        es: "Crear reporte semanal de calidad de lead, enrolamiento, finalizacion y referidos"
      },
      execution: {
        en: "Run one weekly enrollment review with decisions and owners",
        es: "Ejecutar una revision semanal de enrolamiento con decisiones y owners"
      },
      operations: {
        en: "Map enrollment-to-completion handoffs and assign one owner per step",
        es: "Mapear handoffs de enrolamiento a finalizacion y asignar owner por paso"
      },
      positioning: {
        en: "Rewrite the program promise for one learner segment and one outcome",
        es: "Reescribir la promesa del programa para un segmento y un resultado"
      }
    },
    commerce: {
      acquisition: {
        en: "Test one purchase path from channel click to checkout completion",
        es: "Probar un camino de compra de click de canal a checkout completo"
      },
      commercial: {
        en: "Define one margin-safe bundle and discount rule",
        es: "Definir un bundle con margen seguro y regla de descuento"
      },
      data: {
        en: "Track traffic, conversion, order value, and repeat purchase weekly",
        es: "Medir trafico, conversion, valor de orden y recompra semanalmente"
      },
      execution: {
        en: "Run one merchandising test with a clear keep-or-cut decision",
        es: "Ejecutar una prueba de merchandising con decision mantener-o-cortar"
      },
      operations: {
        en: "Document fulfillment exceptions and remove the top delay source",
        es: "Documentar excepciones de fulfillment y eliminar la mayor fuente de demora"
      },
      positioning: {
        en: "Rewrite product messaging for the highest-intent buyer segment",
        es: "Reescribir mensaje de producto para el segmento comprador de mayor intencion"
      }
    },
    general: {
      acquisition: {
        en: "Define one funnel stage, owner, input metric, and conversion event",
        es: "Definir una etapa de embudo, owner, metrica de entrada y evento de conversion"
      },
      commercial: {
        en: "Write the offer decision criteria and disqualification rules",
        es: "Escribir criterios de decision de oferta y reglas de descalificacion"
      },
      data: {
        en: "Create a weekly scorecard with five operating metrics",
        es: "Crear scorecard semanal con cinco metricas operativas"
      },
      execution: {
        en: "Run one weekly operating review with decisions, owners, and next actions",
        es: "Ejecutar revision semanal con decisiones, owners y proximas acciones"
      },
      operations: {
        en: "Document the core workflow and remove one manual handoff",
        es: "Documentar workflow central y eliminar un handoff manual"
      },
      positioning: {
        en: "Choose one segment, one pain, and one promise for the next test",
        es: "Elegir un segmento, un dolor y una promesa para la proxima prueba"
      }
    },
    marketplace: {
      acquisition: {
        en: "Measure supply and demand activation separately for one niche",
        es: "Medir activacion de oferta y demanda por separado para un nicho"
      },
      commercial: {
        en: "Define the transaction or match event that proves monetization",
        es: "Definir evento de transaccion o match que prueba monetizacion"
      },
      data: {
        en: "Track liquidity, match quality, response time, and repeat usage weekly",
        es: "Medir liquidez, calidad de match, tiempo de respuesta y uso repetido semanalmente"
      },
      execution: {
        en: "Run one liquidity sprint for the highest-fit niche",
        es: "Ejecutar un sprint de liquidez para el nicho con mejor fit"
      },
      operations: {
        en: "Assign owners for supply onboarding and demand follow-up",
        es: "Asignar owners para onboarding de oferta y seguimiento de demanda"
      },
      positioning: {
        en: "Define the first niche where both sides have urgent intent",
        es: "Definir el primer nicho donde ambos lados tienen intencion urgente"
      }
    },
    services: {
      acquisition: {
        en: "Add a lead qualification checklist before every sales call",
        es: "Agregar checklist de calificacion antes de cada llamada comercial"
      },
      commercial: {
        en: "Package the service into one clear scope, timeline, and decision rule",
        es: "Empaquetar el servicio con alcance, timeline y regla de decision"
      },
      data: {
        en: "Track qualified pipeline, close rate, delivery load, and gross margin weekly",
        es: "Medir pipeline calificado, cierre, carga de entrega y margen bruto semanalmente"
      },
      execution: {
        en: "Run one weekly service pipeline review with keep-or-drop decisions",
        es: "Ejecutar revision semanal de pipeline con decisiones mantener-o-descartar"
      },
      operations: {
        en: "Document intake, delivery, and approval steps for the primary service",
        es: "Documentar pasos de intake, entrega y aprobacion del servicio principal"
      },
      positioning: {
        en: "Rewrite the service promise for one buyer, one pain, and one measurable result",
        es: "Reescribir promesa de servicio para un comprador, un dolor y un resultado medible"
      }
    },
    subscription: {
      acquisition: {
        en: "Map visitor-to-activation stages and define the qualified conversion event",
        es: "Mapear etapas visitante-a-activacion y definir evento de conversion calificado"
      },
      commercial: {
        en: "Define packaging, trigger event, and upgrade rule for one ICP",
        es: "Definir packaging, evento disparador y regla de upgrade para un ICP"
      },
      data: {
        en: "Track activation, retention, expansion, and pipeline quality weekly",
        es: "Medir activacion, retencion, expansion y calidad de pipeline semanalmente"
      },
      execution: {
        en: "Run one activation sprint with an owner and success threshold",
        es: "Ejecutar sprint de activacion con owner y umbral de exito"
      },
      operations: {
        en: "Define sales-to-success handoffs and remove one repeated manual step",
        es: "Definir handoffs venta-a-exito y eliminar un paso manual repetido"
      },
      positioning: {
        en: "Rewrite ICP, problem, and product promise for the next funnel test",
        es: "Reescribir ICP, problema y promesa de producto para la proxima prueba de embudo"
      }
    }
  };

  return actions[type][category][language];
}

function categoryLabel(category: CategoryTag, language: OutputLanguage) {
  const labels: Record<CategoryTag, { en: string; es: string }> = {
    acquisition: { en: "acquisition", es: "adquisicion" },
    commercial: { en: "commercial", es: "comercial" },
    data: { en: "data visibility", es: "visibilidad de datos" },
    execution: { en: "execution cadence", es: "cadencia de ejecucion" },
    operations: { en: "operations", es: "operaciones" },
    positioning: { en: "positioning", es: "posicionamiento" }
  };

  return labels[category][language];
}

function cleanProblemLabel({
  category,
  language,
  title,
  type
}: {
  category: CategoryTag;
  language: OutputLanguage;
  title: string;
  type: BusinessType;
}) {
  const cleaned = title
    .replace(/^Resolve:\s*/i, "")
    .replace(/^Resolver:\s*/i, "")
    .replace(/^Activate opportunity:\s*/i, "")
    .replace(/^Activar oportunidad:\s*/i, "")
    .trim();

  if (!cleaned || isBlockedVisibleLabel(cleaned)) {
    const vertical = businessTypeLabel(type, language);
    const categoryName = categoryLabel(category, language);
    return language === "es"
      ? `gap de ${categoryName} en este ${vertical}`
      : `${categoryName} gap in this ${vertical}`;
  }

  return cleaned;
}

function roadmapReasoning({
  evidence,
  language,
  signal
}: {
  evidence: string | null;
  language: OutputLanguage;
  signal: string;
}) {
  if (evidence && !isBlockedVisibleLabel(evidence)) {
    return evidence;
  }

  return language === "es"
    ? `El diagnostico senala ${signal} como restriccion de negocio que debe traducirse a una decision operativa.`
    : `The diagnostic identifies ${signal} as a business constraint that needs an operating decision.`;
}

function actionDescription({
  category,
  language,
  roadmapTitle,
  signal,
  type
}: {
  category: CategoryTag;
  language: OutputLanguage;
  roadmapTitle: string;
  signal: string;
  type: BusinessType;
}) {
  const vertical = businessTypeLabel(type, language);
  const categoryName = categoryLabel(category, language);

  return language === "es"
    ? `Ejecutar este paso para avanzar "${roadmapTitle}" en el ${vertical}. Debe producir una decision concreta sobre ${categoryName}, usando "${signal}" como contexto, no como titulo de trabajo.`
    : `Execute this step to advance "${roadmapTitle}" for the ${vertical}. It should produce a concrete ${categoryName} decision, using "${signal}" as context rather than the work title.`;
}

function dedupeActions(actions: PlanActionItem[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = action.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function expectedImpact(
  signal: DiagnosticFinding | DiagnosticOpportunity,
  fallback: ImpactLevel = "medium"
): ImpactLevel {
  if ("severity" in signal) {
    return signal.severity === "high" ? "high" : signal.severity === "low" ? "low" : "medium";
  }

  return signal.impact ?? fallback;
}

function effortForIndex(index: number) {
  return index < 2 ? "medium" : index < 5 ? "low" : "high";
}

function dependencyForTags(tags: string[], language: OutputLanguage) {
  if (tags.includes("data")) {
    return language === "es"
      ? ["Definir metricas base y fuente de datos visible."]
      : ["Define baseline metrics and a visible data source."];
  }

  if (tags.includes("acquisition")) {
    return language === "es"
      ? ["Acordar el canal principal y el evento de conversion."]
      : ["Agree on the primary channel and conversion event."];
  }

  if (tags.includes("positioning")) {
    return language === "es"
      ? ["Acordar segmento, promesa y oferta primaria."]
      : ["Agree on segment, promise, and primary offer."];
  }

  return [copy(language).noDependency];
}

function evidenceForIndex(evidenceCards: DiagnosticEvidenceCard[], index: number) {
  const evidence = evidenceCards[index % Math.max(evidenceCards.length, 1)];

  if (!evidence) {
    return null;
  }

  return `${evidence.title}: ${evidence.observation}`;
}

function profileSignalSummary(profile: BusinessProfileRecord, language: OutputLanguage) {
  const ns = language === "es" ? "no especificado" : "not specified";
  const sl = (en: string, es: string) => (language === "es" ? es : en);
  const channels = profile.currentChannels.length ? profile.currentChannels.join(", ") : ns;
  const tools = profile.currentTools.length ? profile.currentTools.join(", ") : ns;

  return [
    `${sl("Website", "Website")}: ${profile.website ?? ns}`,
    `${sl("Positioning", "Posicionamiento")}: ${profile.positioningStatement ?? ns}`,
    `${sl("Offer", "Oferta")}: ${profile.primaryOffer ?? ns}`,
    `${sl("Audience", "Audiencia")}: ${profile.targetAudience ?? ns}`,
    `${sl("CTA", "CTA")}: ${profile.conversionAction ?? ns}`,
    `${sl("Channels", "Canales")}: ${channels}`,
    `${sl("Tools", "Herramientas")}: ${tools}`
  ].join("; ");
}

function validationRoadmapItems(input: PlanningInput, trustState: DownstreamTrustState): RoadmapItem[] {
  const language = input.workspace.outputLanguage;
  const type = detectBusinessType(input.profile);
  const sl = (en: string, es: string) => (language === "es" ? es : en);
  const gaps = trustState.evidenceGaps.length
    ? trustState.evidenceGaps
    : [
        sl(
          "Core evidence is incomplete: offer, audience, CTA, acquisition, sales process, tools, or reporting need confirmation.",
          "La evidencia base esta incompleta: oferta, audiencia, CTA, adquisicion, proceso de venta, herramientas o reporting necesitan confirmacion."
        )
      ];
  const tasks = trustState.validationTasks.length
    ? trustState.validationTasks
    : [
        sl(
          "Confirm the minimum evidence set before execution planning.",
          "Confirmar el set minimo de evidencia antes de planificar ejecucion."
        )
      ];
  const profileSignals = profileSignalSummary(input.profile, language);
  const roadmapSeeds = [
    {
      title: trustState.hasContradiction
        ? sl("Resolve contradictory evidence", "Resolver evidencia contradictoria")
        : sl("Inventory weak and missing evidence", "Inventariar evidencia debil y faltante"),
      phase: "now" as const,
      signal: gaps[0],
      category: "data" as CategoryTag
    },
    {
      title: sl("Validate offer, audience, and CTA", "Validar oferta, audiencia y CTA"),
      phase: "now" as const,
      signal: tasks[0] ?? gaps[0],
      category: "positioning" as CategoryTag
    },
    {
      title: sl("Confirm acquisition and sales evidence", "Confirmar evidencia de adquisicion y ventas"),
      phase: "now" as const,
      signal: tasks[1] ?? gaps[1] ?? gaps[0],
      category: "acquisition" as CategoryTag
    },
    {
      title: sl("Document tools, reporting, and operating cadence", "Documentar herramientas, reporting y cadencia operativa"),
      phase: "next" as const,
      signal: tasks[2] ?? gaps[2] ?? gaps[0],
      category: "operations" as CategoryTag
    },
    {
      title: sl("Decide what can become an operating plan", "Decidir que puede convertirse en plan operativo"),
      phase: "later" as const,
      signal: trustState.cannotClaim[0] ?? trustState.summary,
      category: "execution" as CategoryTag
    }
  ];

  return roadmapSeeds.map((item, index): RoadmapItem => ({
    title: item.title,
    description:
      language === "es"
        ? `Modo validacion primero para este ${businessTypeLabel(type, language)}. Antes de ejecutar, confirmar: ${item.signal}`
        : `Validation-first mode for this ${businessTypeLabel(type, language)}. Before execution, confirm: ${item.signal}`,
    phase: item.phase,
    categoryTags: [item.category],
    effortLevel: index < 3 ? "low" : "medium",
    expectedImpact: index < 3 ? "high" : "medium",
    dependencies:
      language === "es"
        ? ["Actualizar el perfil con evidencia visible antes de tratar esto como consejo fuerte."]
        : ["Update the profile with visible evidence before treating this as strong advice."],
    reasoning:
      language === "es"
        ? `${trustState.label}. Basado en inputs actuales: ${profileSignals}`
        : `${trustState.label}. Based on current inputs: ${profileSignals}`
  }));
}

function roadmapItemFromFinding({
  finding,
  index,
  phase,
  language,
  profile,
  evidence
}: {
  finding: DiagnosticFinding;
  index: number;
  phase: RoadmapItem["phase"];
  language: OutputLanguage;
  profile: BusinessProfileRecord;
  evidence: string | null;
}): RoadmapItem {
  const tags = categoryTagsForSignal(`${finding.title} ${finding.detail}`, profile);
  const type = detectBusinessType(profile);
  const category = primaryCategory(tags);
  const signal = cleanProblemLabel({
    category,
    language,
    title: finding.title,
    type
  });
  const title = verticalMove({ category, language, type });

  return {
    title,
    description:
      language === "es"
        ? `Movimiento estrategico para este ${businessTypeLabel(type, language)}: resolver ${signal} con una decision clara, un owner y una prueba medible. Contexto: ${finding.detail}`
        : `Strategic move for this ${businessTypeLabel(type, language)}: resolve ${signal} with a clear decision, owner, and measurable test. Context: ${finding.detail}`,
    phase,
    categoryTags: tags,
    effortLevel: effortForIndex(index),
    expectedImpact: expectedImpact(finding),
    dependencies: dependencyForTags(tags, language),
    reasoning: roadmapReasoning({ evidence, language, signal })
  };
}

function roadmapItemFromOpportunity({
  opportunity,
  index,
  phase,
  language,
  profile,
  evidence
}: {
  opportunity: DiagnosticOpportunity;
  index: number;
  phase: RoadmapItem["phase"];
  language: OutputLanguage;
  profile: BusinessProfileRecord;
  evidence: string | null;
}): RoadmapItem {
  const tags = categoryTagsForSignal(`${opportunity.title} ${opportunity.detail}`, profile);
  const type = detectBusinessType(profile);
  const category = primaryCategory(tags);
  const signal = cleanProblemLabel({
    category,
    language,
    title: opportunity.title,
    type
  });
  const title = verticalMove({ category, language, type });

  return {
    title,
    description:
      language === "es"
        ? `Area de leverage para este ${businessTypeLabel(type, language)}: convertir ${signal} en una prueba enfocada antes de escalarla. Contexto: ${opportunity.detail}`
        : `Leverage area for this ${businessTypeLabel(type, language)}: turn ${signal} into a focused test before scaling it. Context: ${opportunity.detail}`,
    phase,
    categoryTags: tags,
    effortLevel: effortForIndex(index + 2),
    expectedImpact: opportunity.impact,
    dependencies: dependencyForTags(tags, language),
    reasoning: roadmapReasoning({ evidence, language, signal })
  };
}

function dedupeRoadmapItems(items: RoadmapItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildRoadmap(input: PlanningInput): RoadmapRecord {
  const language = input.workspace.outputLanguage;
  const trustState = resolveDownstreamTrustState({
    diagnostic: input.diagnostic,
    language,
    profile: input.profile
  });
  const findings = [
    ...input.diagnostic.topBottlenecks,
    ...input.diagnostic.topRisks
  ].slice(0, 5);
  const opportunities = input.diagnostic.topOpportunities.slice(0, 4);

  const nowItems = findings
    .slice(0, 3)
    .map((finding, index) =>
      roadmapItemFromFinding({
        finding,
        index,
        phase: "now",
        language,
        profile: input.profile,
        evidence: evidenceForIndex(input.diagnostic.evidenceCards, index)
      })
    );
  const nextItems = opportunities
    .slice(0, 3)
    .map((opportunity, index) =>
      roadmapItemFromOpportunity({
        opportunity,
        index,
        phase: "next",
        language,
        profile: input.profile,
        evidence: evidenceForIndex(input.diagnostic.evidenceCards, index + 2)
      })
    );
  const laterSignals = findings.slice(3).concat(
    opportunities.slice(3).map((opportunity) => ({
      title: opportunity.title,
      detail: opportunity.detail,
      severity: opportunity.impact === "high" ? "medium" : opportunity.impact
    }))
  );
  const laterItems = laterSignals.slice(0, 3).map((finding, index) =>
    roadmapItemFromFinding({
      finding: finding as DiagnosticFinding,
      index: index + 5,
      phase: "later",
      language,
      profile: input.profile,
      evidence: evidenceForIndex(input.diagnostic.evidenceCards, index + 4)
    })
  );

  const items = dedupeRoadmapItems([...nowItems, ...nextItems, ...laterItems]);
  const type = detectBusinessType(input.profile);
  const plan = getPlanDefinition(input.workspace.plan);
  const validationFirst = trustState?.mode === "validation_first";

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    sourceDiagnosticResultId: input.diagnostic.id,
    summary:
      validationFirst && trustState
        ? language === "es"
          ? `Roadmap de validacion primero. ${trustState.summary} Plan actual: ${plan.label}. Tipo de negocio: ${businessTypeLabel(type, language)}.`
          : `Validation-first roadmap. ${trustState.summary} Current plan: ${plan.label}. Business type: ${businessTypeLabel(type, language)}.`
        : language === "es"
          ? `${copy(language).roadmapSummary} Plan actual: ${plan.label}. Tipo de negocio: ${businessTypeLabel(type, language)}.`
          : `${copy(language).roadmapSummary} Current plan: ${plan.label}. Business type: ${businessTypeLabel(type, language)}.`,
    items: validationFirst && trustState ? validationRoadmapItems(input, trustState) : items,
    createdAt: new Date().toISOString()
  };
}

function actionFromRoadmapItem({
  index,
  item,
  language,
  profile
}: {
  index: number;
  item: RoadmapItem;
  language: OutputLanguage;
  profile: BusinessProfileRecord;
}): PlanActionItem {
  const priority = item.phase === "now" || item.expectedImpact === "high" ? "high" : index < 5 ? "medium" : "low";
  const category = primaryCategory(item.categoryTags);
  const type = detectBusinessType(profile);
  const signal = cleanProblemLabel({
    category,
    language,
    title: item.description || item.title,
    type
  });

  return {
    title: directiveAction({ category, language, type }),
    description: actionDescription({
      category,
      language,
      roadmapTitle: item.title,
      signal,
      type
    }),
    priority,
    ownerSuggestion:
      item.categoryTags.includes("data") || item.categoryTags.includes("operations")
        ? language === "es"
          ? "Operador o owner responsable de operaciones"
          : "Operator or operations owner"
        : copy(language).owner,
    status: "not_started",
    linkedCategory: category,
    linkedReasoning: item.reasoning
  };
}

function fallbackActions(input: PlanningInput) {
  const language = input.workspace.outputLanguage;

  return input.diagnostic.recommendedNextActions.slice(0, 6).map(
    (action, index): PlanActionItem => {
      const tags = categoryTagsForSignal(`${action.title} ${action.detail}`, input.profile);
      const category = primaryCategory(tags);
      const type = detectBusinessType(input.profile);
      const signal = cleanProblemLabel({
        category,
        language,
        title: action.title,
        type
      });

      return {
        title: directiveAction({ category, language, type }),
        description: actionDescription({
          category,
          language,
          roadmapTitle: verticalMove({ category, language, type }),
          signal,
          type
        }),
        priority: index < 3 ? "high" : "medium",
        ownerSuggestion: action.owner || copy(language).owner,
        status: "not_started",
        linkedCategory: category,
        linkedReasoning:
          evidenceForIndex(input.diagnostic.evidenceCards, index) ??
          (language === "es"
            ? "Accion derivada del diagnostico mas reciente."
            : "Action derived from the latest diagnostic.")
      };
    }
  );
}

function validationFirstActions(input: ActionPlanInput, trustState: DownstreamTrustState) {
  const language = input.workspace.outputLanguage;
  const sl = (en: string, es: string) => (language === "es" ? es : en);
  const actionSeeds = [
    {
      title: trustState.hasContradiction
        ? sl("Resolve contradiction before execution", "Resolver contradiccion antes de ejecutar")
        : sl("Close the minimum evidence gaps", "Cerrar los gaps minimos de evidencia"),
      category: "data" as CategoryTag,
      evidence: trustState.evidenceGaps[0] ?? trustState.summary
    },
    {
      title: sl("Validate offer, audience, and CTA evidence", "Validar evidencia de oferta, audiencia y CTA"),
      category: "positioning" as CategoryTag,
      evidence: trustState.validationTasks[0] ?? trustState.evidenceGaps[0] ?? trustState.summary
    },
    {
      title: sl("Confirm acquisition source and sales process", "Confirmar fuente de adquisicion y proceso de venta"),
      category: "acquisition" as CategoryTag,
      evidence: trustState.validationTasks[1] ?? trustState.evidenceGaps[1] ?? trustState.summary
    },
    {
      title: sl("Document tools, owners, and reporting cadence", "Documentar herramientas, owners y cadencia de reporting"),
      category: "operations" as CategoryTag,
      evidence: trustState.validationTasks[2] ?? trustState.evidenceGaps[2] ?? trustState.summary
    },
    {
      title: sl("Decide what advice is safe to operationalize", "Decidir que recomendacion es segura para operar"),
      category: "execution" as CategoryTag,
      evidence: trustState.cannotClaim[0] ?? trustState.summary
    }
  ];

  return actionSeeds.map((seed, index): PlanActionItem => ({
    title: seed.title,
    description:
      language === "es"
        ? `Tarea de validacion, no ejecucion definitiva. Confirmar evidencia antes de convertir esta recomendacion en trabajo operativo: ${seed.evidence}`
        : `Validation task, not final execution. Confirm evidence before converting this recommendation into operating work: ${seed.evidence}`,
    priority: index < 3 ? "high" : "medium",
    ownerSuggestion:
      language === "es"
        ? "Owner del workspace o responsable de evidencia"
        : "Workspace owner or evidence owner",
    status: "not_started",
    linkedCategory: seed.category,
    linkedReasoning: trustState.summary
  }));
}

export function buildActionPlan(input: ActionPlanInput): ActionPlanRecord {
  const trustState = resolveDownstreamTrustState({
    diagnostic: input.diagnostic,
    language: input.workspace.outputLanguage,
    profile: input.profile
  });
  const sourceActions =
    trustState?.mode === "validation_first"
      ? validationFirstActions(input, trustState)
      : null;
  const roadmapActions =
    input.roadmap?.items.map((item, index) =>
      actionFromRoadmapItem({
        index,
        item,
        language: input.workspace.outputLanguage,
        profile: input.profile
      })
    ) ?? [];
  const actions = dedupeActions(sourceActions ?? (roadmapActions.length > 0 ? roadmapActions : fallbackActions(input)))
    .slice(0, 9)
    .map((action) => ({
      ...action,
      description: action.description || copy(input.workspace.outputLanguage).actionFallback
    }));

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    sourceDiagnosticResultId: input.diagnostic.id,
    sourceRoadmapId: input.roadmap?.id ?? null,
    actions,
    createdAt: new Date().toISOString()
  };
}

function priorityFallback(
  actionPlan: ActionPlanRecord,
  language: OutputLanguage,
  profile: BusinessProfileRecord
) {
  const values = actionPlan.actions
    .filter((action) => action.priority === "high")
    .map((action) => action.title)
    .slice(0, 3);

  if (values.length >= 3) {
    return values;
  }

  const type = detectBusinessType(profile);
  const fallback: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: [
        "Clarify the program promise for one learner segment",
        "Define enrollment funnel stages and lead-quality rules",
        "Install completion and referral review cadence"
      ],
      es: [
        "Clarificar promesa del programa para un segmento de estudiante",
        "Definir etapas de enrolamiento y reglas de calidad de lead",
        "Instalar cadencia de finalizacion y referidos"
      ]
    },
    commerce: {
      en: [
        "Clarify the highest-intent buyer segment",
        "Define channel-to-checkout conversion path",
        "Install merchandising and repeat-purchase review cadence"
      ],
      es: [
        "Clarificar segmento comprador de mayor intencion",
        "Definir camino de canal a checkout",
        "Instalar cadencia de merchandising y recompra"
      ]
    },
    general: {
      en: ["Clarify positioning", "Define a measurable funnel", "Install a weekly cadence"],
      es: ["Clarificar posicionamiento", "Definir embudo medible", "Instalar cadencia semanal"]
    },
    marketplace: {
      en: [
        "Clarify the first high-liquidity niche",
        "Define supply and demand activation stages",
        "Install match-quality review cadence"
      ],
      es: [
        "Clarificar el primer nicho de alta liquidez",
        "Definir etapas de activacion de oferta y demanda",
        "Instalar cadencia de calidad de match"
      ]
    },
    services: {
      en: [
        "Clarify the service promise for one buyer segment",
        "Define lead qualification and proposal rules",
        "Install delivery load and margin review cadence"
      ],
      es: [
        "Clarificar promesa de servicio para un segmento comprador",
        "Definir reglas de calificacion y propuesta",
        "Instalar cadencia de carga de entrega y margen"
      ]
    },
    subscription: {
      en: [
        "Clarify ICP and activation promise",
        "Define qualified pipeline and activation stages",
        "Install activation, retention, and revenue review cadence"
      ],
      es: [
        "Clarificar ICP y promesa de activacion",
        "Definir pipeline calificado y etapas de activacion",
        "Instalar cadencia de activacion, retencion e ingresos"
      ]
    }
  };

  return [...values, ...fallback[type][language]].slice(0, 3);
}

function weekPlan({
  title,
  objective,
  actions,
  successSignal
}: {
  title: string;
  objective: string;
  actions: string[];
  successSignal: string;
}) {
  return {
    title,
    objective,
    actions: actions.slice(0, 4),
    successSignal
  };
}

function journeyLabel(type: BusinessType, language: OutputLanguage) {
  const labels: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: "lead source -> application -> enrollment -> completion -> referral",
      es: "fuente de lead -> aplicacion -> enrolamiento -> finalizacion -> referido"
    },
    commerce: {
      en: "traffic source -> product view -> checkout -> repeat purchase",
      es: "fuente de trafico -> vista de producto -> checkout -> recompra"
    },
    general: {
      en: "source -> qualification -> conversion -> retention",
      es: "fuente -> calificacion -> conversion -> retencion"
    },
    marketplace: {
      en: "supply onboarding -> demand activation -> match -> repeat usage",
      es: "onboarding de oferta -> activacion de demanda -> match -> uso repetido"
    },
    services: {
      en: "lead source -> qualification -> proposal -> delivery -> renewal",
      es: "fuente de lead -> calificacion -> propuesta -> entrega -> renovacion"
    },
    subscription: {
      en: "visitor -> qualified lead -> activation -> retention -> expansion",
      es: "visitante -> lead calificado -> activacion -> retencion -> expansion"
    }
  };

  return labels[type][language];
}

function testScope(type: BusinessType, language: OutputLanguage) {
  const scopes: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: "one learner segment, one program promise, and one enrollment path",
      es: "un segmento de estudiante, una promesa de programa y un camino de enrolamiento"
    },
    commerce: {
      en: "one buyer segment, one offer bundle, and one checkout path",
      es: "un segmento comprador, un bundle de oferta y un camino de checkout"
    },
    general: {
      en: "one segment, one offer, and one conversion path",
      es: "un segmento, una oferta y un camino de conversion"
    },
    marketplace: {
      en: "one niche, one supply segment, and one demand segment",
      es: "un nicho, un segmento de oferta y un segmento de demanda"
    },
    services: {
      en: "one buyer segment, one service package, and one sales path",
      es: "un segmento comprador, un paquete de servicio y un camino comercial"
    },
    subscription: {
      en: "one ICP, one activation event, and one conversion path",
      es: "un ICP, un evento de activacion y un camino de conversion"
    }
  };

  return scopes[type][language];
}

function verticalMetrics(type: BusinessType, language: OutputLanguage) {
  const metrics: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: [
        "Lead quality by source",
        "Enrollment conversion",
        "Completion rate",
        "Referral signal"
      ],
      es: [
        "Calidad de lead por fuente",
        "Conversion de enrolamiento",
        "Tasa de finalizacion",
        "Senal de referidos"
      ]
    },
    commerce: {
      en: ["Channel conversion", "Checkout completion", "Average order value", "Repeat purchase"],
      es: ["Conversion por canal", "Checkout completado", "Valor promedio de orden", "Recompra"]
    },
    general: {
      en: ["Qualified conversion rate", "Weekly decision count", "Cycle time", "Primary metric movement"],
      es: ["Tasa de conversion calificada", "Decisiones semanales", "Tiempo de ciclo", "Movimiento de metrica primaria"]
    },
    marketplace: {
      en: ["Supply activation", "Demand activation", "Match quality", "Repeat usage"],
      es: ["Activacion de oferta", "Activacion de demanda", "Calidad de match", "Uso repetido"]
    },
    services: {
      en: ["Qualified pipeline", "Close rate", "Delivery load", "Gross margin"],
      es: ["Pipeline calificado", "Tasa de cierre", "Carga de entrega", "Margen bruto"]
    },
    subscription: {
      en: ["Qualified pipeline", "Activation rate", "Retention signal", "Expansion signal"],
      es: ["Pipeline calificado", "Tasa de activacion", "Senal de retencion", "Senal de expansion"]
    }
  };

  return metrics[type][language];
}

function week3Objective(type: BusinessType, priorities: string[], language: OutputLanguage) {
  const p = priorities[2] ?? (language === "es" ? "la tercera prioridad" : "the third priority");
  const obj: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: `Review lead quality by source, enrollment friction, and completion drop-off. Adjust messaging or intake for the weakest segment. Iterate on: ${p}`,
      es: `Revisar calidad de lead por fuente, friccion de enrolamiento y abandono. Ajustar mensaje o intake para el segmento mas debil. Iterar sobre: ${p}`
    },
    subscription: {
      en: `Review activation quality, retention signal, and packaging friction. Adjust ICP definition based on conversion data. Iterate on: ${p}`,
      es: `Revisar calidad de activacion, senal de retencion y friccion de packaging. Ajustar definicion de ICP basado en datos de conversion. Iterar sobre: ${p}`
    },
    services: {
      en: `Review qualified pipeline, proposal conversion rate, and delivery load. Drop one underqualified lead source. Iterate on: ${p}`,
      es: `Revisar pipeline calificado, tasa de conversion de propuesta y carga de entrega. Eliminar una fuente de lead sin calificacion. Iterar sobre: ${p}`
    },
    commerce: {
      en: `Review checkout conversion, average order value, and repeat purchase signal. Pause or cut the underperforming traffic source. Iterate on: ${p}`,
      es: `Revisar conversion de checkout, valor promedio de orden y senal de recompra. Pausar o cortar la fuente de trafico que no convierte. Iterar sobre: ${p}`
    },
    marketplace: {
      en: `Review supply activation, demand conversion, and match quality. Identify which side of the marketplace has more friction. Iterate on: ${p}`,
      es: `Revisar activacion de oferta, conversion de demanda y calidad de match. Identificar que lado del marketplace tiene mas friccion. Iterar sobre: ${p}`
    },
    general: {
      en: `Review evidence, reduce the most repeated manual step, and adjust the operating system. Iterate on: ${p}`,
      es: `Revisar evidencia, reducir el paso manual mas repetido y ajustar el sistema operativo. Iterar sobre: ${p}`
    }
  };
  return obj[type][language];
}

function week4Objective(type: BusinessType, language: OutputLanguage) {
  const obj: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: "Decide which program gets the next cohort. Lock enrollment criteria, lead-quality threshold, and referral incentive structure.",
      es: "Decidir que programa recibe la proxima cohorte. Cerrar criterios de enrolamiento, umbral de calidad de lead y estructura de referidos."
    },
    subscription: {
      en: "Decide on packaging and activation rule for the next cycle. Lock the ICP definition and conversion event.",
      es: "Decidir packaging y regla de activacion para el proximo ciclo. Cerrar la definicion del ICP y el evento de conversion."
    },
    services: {
      en: "Decide which service package gets priority next month. Lock proposal rules, scope criteria, and disqualification triggers.",
      es: "Decidir que paquete de servicio tiene prioridad el proximo mes. Cerrar reglas de propuesta, criterios de alcance y disparadores de descalificacion."
    },
    commerce: {
      en: "Decide which offer bundle and channel continue. Lock discount rules and repeat-purchase trigger.",
      es: "Decidir que bundle de oferta y canal continuan. Cerrar reglas de descuento y disparador de recompra."
    },
    marketplace: {
      en: "Decide which niche gets the next liquidity push. Lock supply onboarding rules and demand activation criteria.",
      es: "Decidir que nicho recibe el siguiente impulso de liquidez. Cerrar reglas de onboarding de oferta y criterios de activacion de demanda."
    },
    general: {
      en: "Decide what to keep, pause, or convert into a repeatable process. Assign an owner and focus for the next monthly cycle.",
      es: "Decidir que mantener, pausar o convertir en proceso repetible. Asignar owner y foco para el proximo ciclo mensual."
    }
  };
  return obj[type][language];
}

function week1SuccessSignal(type: BusinessType, language: OutputLanguage) {
  const signals: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: "The team has named the lead quality problem by source and assigned one owner to each enrollment stage.",
      es: "El equipo ha nombrado el problema de calidad de lead por fuente y asignado un owner a cada etapa de enrolamiento."
    },
    subscription: {
      en: "The team has named the activation bottleneck and assigned one owner to each funnel stage.",
      es: "El equipo ha nombrado el cuello de botella de activacion y asignado un owner a cada etapa del embudo."
    },
    services: {
      en: "The team has documented the qualification criteria and assigned one owner to the primary service pipeline.",
      es: "El equipo ha documentado los criterios de calificacion y asignado un owner al pipeline del servicio principal."
    },
    commerce: {
      en: "The team has mapped the checkout funnel with drop-off points and assigned one owner to the primary traffic source.",
      es: "El equipo ha mapeado el embudo de checkout con puntos de abandono y asignado un owner a la fuente de trafico principal."
    },
    marketplace: {
      en: "The team has documented supply and demand activation stages separately and assigned one owner to each side.",
      es: "El equipo ha documentado etapas de activacion de oferta y demanda por separado con un owner para cada lado."
    },
    general: {
      en: "The team knows the month focus, owner, baseline, and success threshold.",
      es: "El equipo conoce el foco del mes, owner, baseline y umbral de exito."
    }
  };
  return signals[type][language];
}

function verticalQuickWins(type: BusinessType, language: OutputLanguage) {
  const wins: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: [
        "Score last 10 leads by program fit and drop the bottom third",
        "Map the enrollment-to-completion drop-off in two steps or less",
        "Confirm whether referral rate has ever been measured"
      ],
      es: [
        "Puntuar los ultimos 10 leads por fit de programa y eliminar el tercio inferior",
        "Mapear el abandono enrolamiento-finalizacion en dos pasos o menos",
        "Confirmar si la tasa de referidos se ha medido alguna vez"
      ]
    },
    subscription: {
      en: [
        "Define the activation event in one sentence and confirm every team member agrees",
        "Identify the last 5 churned users and their primary exit reason",
        "Confirm whether pipeline quality vs volume is being tracked separately"
      ],
      es: [
        "Definir el evento de activacion en una frase y confirmar que el equipo coincide",
        "Identificar los ultimos 5 usuarios que abandonaron y su razon principal",
        "Confirmar si calidad vs volumen de pipeline se mide por separado"
      ]
    },
    services: {
      en: [
        "Add a qualification checklist to the next sales call before it happens",
        "Calculate gross margin on the last three delivered projects",
        "Map intake-to-delivery steps and count how many are manual"
      ],
      es: [
        "Agregar checklist de calificacion a la proxima llamada comercial antes de que ocurra",
        "Calcular margen bruto de los ultimos tres proyectos entregados",
        "Mapear pasos de intake a entrega y contar cuantos son manuales"
      ]
    },
    commerce: {
      en: [
        "Map traffic-to-checkout with drop-off percentages at each step",
        "Calculate repeat purchase rate for the last 90 days",
        "Check whether discount usage is tracked against margin impact"
      ],
      es: [
        "Mapear trafico a checkout con porcentajes de abandono por paso",
        "Calcular tasa de recompra de los ultimos 90 dias",
        "Verificar si el uso de descuentos se mide contra impacto en margen"
      ]
    },
    marketplace: {
      en: [
        "Count active supply-side providers vs inactive and identify the top drop-off reason",
        "Measure how many demand-side requests got a response within 24 hours",
        "Identify whether match quality or match speed is the bigger friction point"
      ],
      es: [
        "Contar proveedores del lado oferta activos vs inactivos e identificar la razon principal de abandono",
        "Medir cuantas solicitudes del lado demanda tuvieron respuesta en 24 horas",
        "Identificar si la calidad o la velocidad del match es el mayor punto de friccion"
      ]
    },
    general: {
      en: [
        "Name one owner per action before the week ends",
        "Choose one primary outcome metric and confirm it is being tracked",
        "Identify the one manual task that consumes the most founder time"
      ],
      es: [
        "Nombrar un owner por accion antes de que termine la semana",
        "Elegir una metrica de resultado primaria y confirmar que se mide",
        "Identificar la tarea manual que consume mas tiempo del fundador"
      ]
    }
  };
  return wins[type][language];
}

function verticalSuccessSignals(type: BusinessType, language: OutputLanguage) {
  const signals: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: [
        "Enrollment quality by source is reviewed weekly with a disqualification rule applied",
        "At least one program segment shows measurable completion improvement",
        "Referral rate is tracked against enrollment target for the cycle"
      ],
      es: [
        "Calidad de enrolamiento por fuente se revisa semanalmente con regla de descalificacion aplicada",
        "Al menos un segmento de programa muestra mejora medible en finalizacion",
        "Tasa de referidos se mide contra el objetivo de enrolamiento del ciclo"
      ]
    },
    subscription: {
      en: [
        "Activation rate shows measurable movement against the baseline defined in week 1",
        "At least one qualified pipeline milestone was reached",
        "Retention signal is reviewed weekly and assigned to one owner"
      ],
      es: [
        "La tasa de activacion muestra movimiento medible contra el baseline de la semana 1",
        "Al menos un hito de pipeline calificado fue alcanzado",
        "La senal de retencion se revisa semanalmente y tiene un owner asignado"
      ]
    },
    services: {
      en: [
        "Qualified pipeline grew without adding unqualified leads",
        "At least one proposal used the new scoping and qualification rules",
        "Delivery load is tracked against gross margin weekly"
      ],
      es: [
        "El pipeline calificado crecio sin agregar leads no calificados",
        "Al menos una propuesta uso las nuevas reglas de alcance y calificacion",
        "La carga de entrega se mide contra margen bruto semanalmente"
      ]
    },
    commerce: {
      en: [
        "Checkout conversion shows measurable movement against the week-1 baseline",
        "Repeat purchase rate is tracked against acquisition cost",
        "At least one underperforming channel was paused or adjusted with a documented decision"
      ],
      es: [
        "La conversion de checkout muestra movimiento medible contra el baseline de semana 1",
        "La tasa de recompra se mide contra el costo de adquisicion",
        "Al menos un canal sin rendimiento fue pausado o ajustado con decision documentada"
      ]
    },
    marketplace: {
      en: [
        "Both sides of the marketplace have an activation metric being tracked separately",
        "Match quality shows improvement against the week-1 baseline",
        "At least one friction point was removed or documented with a removal plan"
      ],
      es: [
        "Ambos lados del marketplace tienen una metrica de activacion medida por separado",
        "La calidad de match muestra mejora contra el baseline de semana 1",
        "Al menos un punto de friccion fue eliminado o documentado con plan de eliminacion"
      ]
    },
    general: {
      en: [
        "The primary outcome metric is being updated weekly with a named owner",
        "At least one blocked action received a keep-or-drop decision",
        "The weekly review is happening and producing a recorded decision"
      ],
      es: [
        "La metrica de resultado primaria se actualiza semanalmente con un owner nombrado",
        "Al menos una accion bloqueada recibio una decision de continuar o descartar",
        "La revision semanal ocurre y produce una decision registrada"
      ]
    }
  };
  return signals[type][language];
}

function validationWeek({
  actions,
  objective,
  successSignal,
  title
}: {
  actions: string[];
  objective: string;
  successSignal: string;
  title: string;
}): ThirtyDayPlanRecord["week1"] {
  return {
    title,
    objective,
    actions,
    successSignal
  };
}

function buildValidationFirstThirtyDayPlan(
  input: ThirtyDayPlanInput,
  trustState: DownstreamTrustState
): ThirtyDayPlanRecord {
  const language = input.workspace.outputLanguage;
  const sl = (en: string, es: string) => (language === "es" ? es : en);
  const company = input.profile.companyName ?? input.workspace.name;
  const gaps = trustState.evidenceGaps.length
    ? trustState.evidenceGaps
    : [
        sl(
          "Minimum business evidence is incomplete.",
          "La evidencia minima del negocio esta incompleta."
        )
      ];
  const tasks = trustState.validationTasks.length
    ? trustState.validationTasks
    : [
        sl(
          "Confirm offer, audience, CTA, acquisition, sales process, tools, and reporting evidence.",
          "Confirmar oferta, audiencia, CTA, adquisicion, proceso de venta, herramientas y reporting."
        )
      ];
  const priorities = [
    trustState.hasContradiction
      ? sl("Resolve contradictory evidence before execution", "Resolver evidencia contradictoria antes de ejecutar")
      : sl("Close the highest-risk evidence gaps", "Cerrar los gaps de evidencia de mayor riesgo"),
    sl("Validate offer, audience, CTA, and acquisition claims", "Validar afirmaciones de oferta, audiencia, CTA y adquisicion"),
    sl("Decide what can become an operating plan", "Decidir que puede convertirse en plan operativo")
  ];

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    sourceDiagnosticResultId: input.diagnostic.id,
    monthObjective:
      language === "es"
        ? `${company}: modo validacion primero. Reparar evidencia antes de tratar el diagnostico como plan operativo.`
        : `${company}: validation-first mode. Repair evidence before treating the diagnostic as an operating plan.`,
    topPriorities: priorities,
    week1: validationWeek({
      title: sl("Week 1: Evidence inventory", "Semana 1: Inventario de evidencia"),
      objective: sl(
        "List what is known, what is missing, and which claims are unsafe to operationalize.",
        "Listar que se sabe, que falta y que afirmaciones no son seguras para operar."
      ),
      actions: [
        tasks[0] ?? priorities[0],
        sl("Capture the current profile gaps in one decision log.", "Capturar los gaps actuales del perfil en un registro de decisiones."),
        sl("Mark each recommendation as confirmed, provisional, or blocked.", "Marcar cada recomendacion como confirmada, provisional o bloqueada.")
      ],
      successSignal: sl(
        "Evidence gaps and unsafe claims are visible in one reviewable list.",
        "Los gaps de evidencia y afirmaciones inseguras estan visibles en una lista revisable."
      )
    }),
    week2: validationWeek({
      title: sl("Week 2: Offer and conversion validation", "Semana 2: Validacion de oferta y conversion"),
      objective: sl(
        "Confirm whether the offer, audience, CTA, and pricing evidence support the current diagnosis.",
        "Confirmar si la evidencia de oferta, audiencia, CTA y precio soporta el diagnostico actual."
      ),
      actions: [
        tasks[1] ?? priorities[1],
        gaps[0],
        sl("Rewrite only the claims that are backed by visible evidence.", "Reescribir solo las afirmaciones respaldadas por evidencia visible.")
      ],
      successSignal: sl(
        "Offer, audience, CTA, and pricing claims are either confirmed or explicitly provisional.",
        "Las afirmaciones de oferta, audiencia, CTA y precio quedan confirmadas o explicitamente provisionales."
      )
    }),
    week3: validationWeek({
      title: sl("Week 3: Channel and operating proof", "Semana 3: Prueba de canal y operacion"),
      objective: sl(
        "Validate acquisition source, sales process, tools, reporting, and operating ownership before scaling work.",
        "Validar fuente de adquisicion, proceso de venta, herramientas, reporting y ownership operativo antes de escalar trabajo."
      ),
      actions: [
        tasks[2] ?? priorities[2],
        gaps[1] ?? gaps[0],
        sl("Document the minimum metric and owner for each current channel.", "Documentar metrica minima y owner para cada canal actual.")
      ],
      successSignal: sl(
        "Each active channel or tool has a documented purpose, owner, and evidence source.",
        "Cada canal o herramienta activa tiene proposito, owner y fuente de evidencia documentados."
      )
    }),
    week4: validationWeek({
      title: sl("Week 4: Operating-plan decision", "Semana 4: Decision de plan operativo"),
      objective: sl(
        "Decide whether the evidence is strong enough to convert into a normal 30-day execution plan.",
        "Decidir si la evidencia es suficientemente fuerte para convertirla en un plan normal de ejecucion de 30 dias."
      ),
      actions: [
        sl("Classify each downstream recommendation as execute, revise, or discard.", "Clasificar cada recomendacion posterior como ejecutar, revisar o descartar."),
        trustState.cannotClaim[0] ?? priorities[2],
        sl("Update the profile before regenerating roadmap, actions, assets, or SOPs.", "Actualizar el perfil antes de regenerar roadmap, acciones, assets o SOPs.")
      ],
      successSignal: sl(
        "There is a recorded decision on whether to proceed with execution planning or continue validation.",
        "Existe una decision registrada sobre avanzar a planificacion de ejecucion o continuar validacion."
      )
    }),
    quickWins: [
      sl("Add missing website, offer, CTA, channel, pricing, and sales-process evidence.", "Anadir evidencia faltante de website, oferta, CTA, canal, precio y proceso de venta."),
      sl("Resolve any contradictory profile evidence before generating customer-facing assets.", "Resolver evidencia contradictoria antes de generar assets de cara al cliente."),
      sl("Replace generic claims with founder-confirmed facts.", "Reemplazar afirmaciones genericas por hechos confirmados por el founder.")
    ],
    risksToAvoid: trustState.cannotClaim,
    successSignals: [
      sl("All critical evidence gaps are closed or explicitly marked provisional.", "Todos los gaps criticos de evidencia estan cerrados o marcados como provisionales."),
      sl("Contradictions are resolved before execution advice is accepted.", "Las contradicciones se resuelven antes de aceptar consejos de ejecucion."),
      sl("The next generation run can cite stronger profile evidence.", "La siguiente generacion puede citar evidencia de perfil mas fuerte.")
    ],
    metricsToWatch: [
      sl("Evidence gaps closed", "Gaps de evidencia cerrados"),
      sl("Contradictions resolved", "Contradicciones resueltas"),
      sl("Profile fields confirmed", "Campos de perfil confirmados"),
      sl("Recommendations marked execute/revise/discard", "Recomendaciones marcadas ejecutar/revisar/descartar")
    ],
    createdAt: new Date().toISOString()
  };
}

export function buildThirtyDayPlan(input: ThirtyDayPlanInput): ThirtyDayPlanRecord {
  const language = input.workspace.outputLanguage;
  const trustState = resolveDownstreamTrustState({
    diagnostic: input.diagnostic,
    language,
    profile: input.profile
  });

  if (trustState?.mode === "validation_first") {
    return buildValidationFirstThirtyDayPlan(input, trustState);
  }

  const type = detectBusinessType(input.profile);
  const priorities = priorityFallback(input.actionPlan, language, input.profile);
  const primaryAction = input.actionPlan.actions[0];
  const company = input.profile.companyName ?? input.workspace.name;
  const metrics = categoryTagsForSignal(
    input.actionPlan.actions.map((action) => action.linkedCategory).join(" "),
    input.profile
  );
  const metricLabels =
    language === "es"
      ? {
          acquisition: "Tasa de lead calificado",
          commercial: "Conversion oferta a compromiso",
          data: "Cobertura semanal de reporting",
          execution: "Acciones completadas por semana",
          operations: "Tiempo de ciclo operativo",
          positioning: "Resonancia de mensaje por segmento"
        }
      : {
          acquisition: "Qualified lead rate",
          commercial: "Offer-to-commitment conversion",
          data: "Weekly reporting coverage",
          execution: "Actions completed per week",
          operations: "Operating cycle time",
          positioning: "Message resonance by segment"
        };

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    sourceDiagnosticResultId: input.diagnostic.id,
    monthObjective:
      language === "es"
        ? `${company}: cerrar los gaps de mayor riesgo para este ${businessTypeLabel(type, language)}. Prioridad principal: ${primaryAction?.title ?? priorities[0]}.`
        : `${company}: close the highest-risk gaps for this ${businessTypeLabel(type, language)}. Primary priority: ${primaryAction?.title ?? priorities[0]}.`,
    topPriorities: priorities,
    week1: weekPlan({
      title: language === "es" ? "Semana 1: Enfoque y baseline" : "Week 1: Focus and baseline",
      objective:
        language === "es"
          ? `Definir el flujo actual (${journeyLabel(type, language)}) y confirmar senales base de este ${businessTypeLabel(type, language)}.`
          : `Define the current flow (${journeyLabel(type, language)}) and confirm baseline signals for this ${businessTypeLabel(type, language)}.`,
      actions: [
        language === "es"
          ? `Definir alcance, owner y baseline para: ${priorities[0]}`
          : `Define scope, owner, and baseline for: ${priorities[0]}`,
        language === "es"
          ? `Mapear flujo actual: ${journeyLabel(type, language)}`
          : `Map current flow: ${journeyLabel(type, language)}`,
        language === "es"
          ? "Elegir umbral de exito y regla de decision semanal"
          : "Choose success threshold and weekly decision rule"
      ],
      successSignal: week1SuccessSignal(type, language)
    }),
    week2: weekPlan({
      title: language === "es" ? "Semana 2: Prueba controlada" : "Week 2: Controlled test",
      objective:
        language === "es"
          ? `Probar ${testScope(type, language)} sin expandir alcance.`
          : `Test ${testScope(type, language)} without expanding scope.`,
      actions: [
        language === "es" ? `Lanzar prueba: ${priorities[1]}` : `Launch test: ${priorities[1]}`,
        language === "es"
          ? "Registrar friccion, conversion y calidad de entrada"
          : "Record friction, conversion, and input quality",
        language === "es"
          ? "Marcar que se mantiene, cambia o descarta"
          : "Mark what stays, changes, or gets dropped"
      ],
      successSignal:
        language === "es"
          ? "La prueba tiene resultado observable y una decision documentada."
          : "The test has an observable result and documented decision."
    }),
    week3: weekPlan({
      title: language === "es" ? "Semana 3: Revisar y ajustar" : "Week 3: Review and adjust",
      objective: week3Objective(type, priorities, language),
      actions: [
        language === "es" ? `Iterar sobre: ${priorities[2]}` : `Iterate on: ${priorities[2]}`,
        language === "es"
          ? "Revisar riesgos activos y bloquear una consecuencia antes de que escale"
          : "Review active risks and block one consequence before it scales",
        language === "es"
          ? "Eliminar o documentar el paso manual mas repetido"
          : "Remove or document the most repeated manual step"
      ],
      successSignal:
        language === "es"
          ? "La segunda iteracion produce un dato concreto, no solo actividad."
          : "The second iteration produces a concrete data point, not just activity."
    }),
    week4: weekPlan({
      title: language === "es" ? "Semana 4: Decision de continuidad" : "Week 4: Continuity decision",
      objective: week4Objective(type, language),
      actions: [
        language === "es"
          ? "Comparar resultado contra baseline y registrar la decision: continuar, ajustar o pausar"
          : "Compare result against baseline and record the decision: continue, adjust, or pause",
        language === "es"
          ? "Cerrar acciones bloqueadas con una decision documentada"
          : "Close blocked actions with a documented decision",
        language === "es"
          ? "Definir owner, foco y metrica primaria del proximo ciclo mensual"
          : "Define owner, focus, and primary metric for the next monthly cycle"
      ],
      successSignal:
        language === "es"
          ? "Hay una decision documentada y un owner confirmado para el siguiente ciclo."
          : "There is a documented decision and confirmed owner for the next cycle."
    }),
    quickWins: verticalQuickWins(type, language),
    risksToAvoid: input.diagnostic.topRisks
      .map((risk) => risk.title)
      .slice(0, 4)
      .concat(
        language === "es"
          ? ["Expandir alcance sin evidencia"]
          : ["Expanding scope without evidence"]
      )
      .slice(0, 5),
    successSignals: verticalSuccessSignals(type, language),
    metricsToWatch: verticalMetrics(type, language)
      .concat(
        metrics.map(
          (metric) => metricLabels[metric as keyof typeof metricLabels] ?? metricLabels.execution
        )
      )
      .concat(language === "es" ? ["Cadencia semanal cumplida"] : ["Weekly cadence completed"])
      .slice(0, 5),
    createdAt: new Date().toISOString()
  };
}
