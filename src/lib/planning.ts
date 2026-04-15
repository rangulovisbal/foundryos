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

function compactList(values: Array<string | null | undefined>, limit = 4) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

function joinForSentence(values: string[], language: OutputLanguage) {
  if (values.length === 0) {
    return language === "es" ? "sin senales especificas" : "no specific signals";
  }

  return values.join(", ");
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
    const key = `${item.phase}:${item.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildRoadmap(input: PlanningInput): RoadmapRecord {
  const language = input.workspace.outputLanguage;
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
  const profileSignals = compactList([
    input.profile.primaryOffer,
    input.profile.targetAudience,
    input.profile.businessModel,
    input.profile.industry
  ]);
  const plan = getPlanDefinition(input.workspace.plan);

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    sourceDiagnosticResultId: input.diagnostic.id,
    summary:
      language === "es"
        ? `${copy(language).roadmapSummary} Plan actual: ${plan.label}. Senales usadas: ${joinForSentence(profileSignals, language)}.`
        : `${copy(language).roadmapSummary} Current plan: ${plan.label}. Source signals: ${joinForSentence(profileSignals, language)}.`,
    items,
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
    title: item.reasoning,
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

export function buildActionPlan(input: ActionPlanInput): ActionPlanRecord {
  const roadmapActions =
    input.roadmap?.items.map((item, index) =>
      actionFromRoadmapItem({
        index,
        item,
        language: input.workspace.outputLanguage,
        profile: input.profile
      })
    ) ?? [];
  const actions = dedupeActions(roadmapActions.length > 0 ? roadmapActions : fallbackActions(input))
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

export function buildThirtyDayPlan(input: ThirtyDayPlanInput): ThirtyDayPlanRecord {
  const language = input.workspace.outputLanguage;
  const type = detectBusinessType(input.profile);
  const priorities = priorityFallback(input.actionPlan, language, input.profile);
  const primaryAction = input.actionPlan.actions[0];
  const company = input.profile.companyName ?? input.workspace.name;
  const signals = compactList([
    input.profile.primaryOffer,
    input.profile.targetAudience,
    input.profile.businessModel,
    input.diagnostic.topBottlenecks[0]?.title
  ]);
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
          ? `Definir el flujo actual (${journeyLabel(type, language)}) y confirmar senales base: ${joinForSentence(signals, language)}.`
          : `Define the current flow (${journeyLabel(type, language)}) and confirm baseline signals: ${joinForSentence(signals, language)}.`,
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
      successSignal:
        language === "es"
          ? "El equipo conoce el foco del mes, owner, baseline y umbral de exito."
          : "The team knows the month focus, owner, baseline, and success threshold."
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
      title: language === "es" ? "Semana 3: Operar y ajustar" : "Week 3: Operate and adjust",
      objective:
        language === "es"
          ? "Revisar evidencia, reducir repeticion manual y ajustar el sistema."
          : "Review evidence, reduce manual repetition, and adjust the system.",
      actions: [
        language === "es" ? `Iterar sobre: ${priorities[2]}` : `Iterate on: ${priorities[2]}`,
        language === "es"
          ? "Revisar riesgos y bloquear una consecuencia antes de que escale"
          : "Review risks and block one consequence before it scales",
        language === "es"
          ? "Eliminar o documentar una tarea manual repetida"
          : "Remove or document one repeated manual task"
      ],
      successSignal:
        language === "es"
          ? "La segunda iteracion mejora claridad, velocidad o visibilidad."
          : "The second iteration improves clarity, speed, or visibility."
    }),
    week4: weekPlan({
      title: language === "es" ? "Semana 4: Decision de continuidad" : "Week 4: Continuity decision",
      objective:
        language === "es"
          ? "Decidir que mantener, pausar o convertir en SOP despues del mes."
          : "Decide what to keep, pause, or turn into SOP after the month.",
      actions: [
        language === "es"
          ? "Comparar baseline contra resultado y decidir mantener, cambiar o pausar"
          : "Compare baseline against result and decide keep, change, or pause",
        language === "es"
          ? "Marcar acciones completadas, bloqueadas y convertibles en SOP"
          : "Mark completed, blocked, and SOP-ready actions",
        language === "es"
          ? "Definir owner y foco del proximo ciclo mensual"
          : "Define owner and focus for the next monthly cycle"
      ],
      successSignal:
        language === "es"
          ? "Hay una decision clara para el siguiente ciclo de 30 dias."
          : "There is a clear decision for the next 30-day cycle."
    }),
    quickWins:
      language === "es"
        ? ["Nombrar owner de cada accion", "Crear tablero semanal simple", "Elegir una metrica primaria"]
        : ["Name one owner per action", "Create a simple weekly board", "Choose one primary metric"],
    risksToAvoid: input.diagnostic.topRisks
      .map((risk) => risk.title)
      .slice(0, 4)
      .concat(
        language === "es"
          ? ["Expandir alcance sin evidencia"]
          : ["Expanding scope without evidence"]
      )
      .slice(0, 5),
    successSignals:
      language === "es"
        ? [
            "El equipo revisa el plan semanalmente",
            "La metrica primaria se actualiza",
            "Las acciones bloqueadas tienen decision"
          ]
        : [
            "The team reviews the plan weekly",
            "The primary metric is updated",
            "Blocked actions receive a decision"
          ],
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
