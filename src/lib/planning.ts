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

const fallbackEnglish = {
  roadmapSummary:
    "This roadmap converts the latest diagnostic into a staged operating sequence. It is a preview planning artifact, not a guarantee of commercial outcome.",
  actionFallback: "Create an operating action from the latest diagnostic signal.",
  owner: "Workspace owner or assigned operator",
  monthObjective: "Close the highest-risk operating gaps found in the diagnostic.",
  noDependency: "No dependency beyond workspace review."
};

const fallbackSpanish = {
  roadmapSummary:
    "Este roadmap convierte el diagnostico mas reciente en una secuencia operativa. Es un artefacto de planificacion en preview, no una garantia de resultado comercial.",
  actionFallback: "Crear una accion operativa desde la senal mas reciente del diagnostico.",
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

function detectBusinessType(profile: BusinessProfileRecord) {
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

  if (/(studio|agency|consulting|service|client|retainer|project)/.test(text)) {
    return "services";
  }

  if (/(ecommerce|commerce|shop|store|retail|product|inventory)/.test(text)) {
    return "commerce";
  }

  if (/(saas|subscription|software|platform|app|ledger|workflow)/.test(text)) {
    return "subscription";
  }

  if (/(marketplace|two-sided|supply|demand)/.test(text)) {
    return "marketplace";
  }

  return "general";
}

function businessTypeLabel(type: string, language: OutputLanguage) {
  const labels: Record<string, { en: string; es: string }> = {
    academy: { en: "learning business", es: "negocio educativo" },
    commerce: { en: "commerce business", es: "negocio de comercio" },
    general: { en: "business", es: "negocio" },
    marketplace: { en: "marketplace", es: "marketplace" },
    services: { en: "service business", es: "negocio de servicios" },
    subscription: { en: "subscription business", es: "negocio de suscripcion" }
  };

  return labels[type]?.[language] ?? labels.general[language];
}

function categoryTagsForSignal(text: string, profile: BusinessProfileRecord) {
  const value = `${text} ${profile.businessModel ?? ""} ${profile.industry ?? ""}`.toLowerCase();
  const tags = new Set<string>();

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
  const type = businessTypeLabel(detectBusinessType(profile), language);

  return {
    title: language === "es" ? `Resolver: ${finding.title}` : `Resolve: ${finding.title}`,
    description:
      language === "es"
        ? `Para este ${type}, ${finding.detail} La prioridad es convertir esta restriccion en un punto de decision operativo.`
        : `For this ${type}, ${finding.detail} The priority is to turn this constraint into an operating decision.`,
    phase,
    categoryTags: tags,
    effortLevel: effortForIndex(index),
    expectedImpact: expectedImpact(finding),
    dependencies: dependencyForTags(tags, language),
    reasoning:
      evidence ??
      (language === "es"
        ? "El diagnostico marco esta restriccion como una conclusion prioritaria."
        : "The diagnostic marked this constraint as a priority conclusion.")
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
  const type = businessTypeLabel(detectBusinessType(profile), language);

  return {
    title:
      language === "es"
        ? `Activar oportunidad: ${opportunity.title}`
        : `Activate opportunity: ${opportunity.title}`,
    description:
      language === "es"
        ? `Esta oportunidad debe adaptarse al modelo de ${type}: ${opportunity.detail}`
        : `This opportunity should be adapted to the ${type} model: ${opportunity.detail}`,
    phase,
    categoryTags: tags,
    effortLevel: effortForIndex(index + 2),
    expectedImpact: opportunity.impact,
    dependencies: dependencyForTags(tags, language),
    reasoning:
      evidence ??
      (language === "es"
        ? "La oportunidad viene del diagnostico mas reciente y debe probarse antes de escalarla."
        : "The opportunity comes from the latest diagnostic and should be tested before scaling.")
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

function actionFromRoadmapItem(item: RoadmapItem, index: number, language: OutputLanguage): PlanActionItem {
  const priority = item.phase === "now" || item.expectedImpact === "high" ? "high" : index < 5 ? "medium" : "low";

  return {
    title: item.title.replace(/^Resolve: /, "").replace(/^Resolver: /, ""),
    description: item.description,
    priority,
    ownerSuggestion:
      item.categoryTags.includes("data") || item.categoryTags.includes("operations")
        ? language === "es"
          ? "Operador o owner responsable de operaciones"
          : "Operator or operations owner"
        : copy(language).owner,
    status: "not_started",
    linkedCategory: item.categoryTags[0] ?? "execution",
    linkedReasoning: item.reasoning
  };
}

function fallbackActions(input: PlanningInput) {
  const language = input.workspace.outputLanguage;

  return input.diagnostic.recommendedNextActions.slice(0, 6).map(
    (action, index): PlanActionItem => ({
      title: action.title,
      description: action.detail || copy(language).actionFallback,
      priority: index < 3 ? "high" : "medium",
      ownerSuggestion: action.owner || copy(language).owner,
      status: "not_started",
      linkedCategory:
        categoryTagsForSignal(`${action.title} ${action.detail}`, input.profile)[0] ??
        "execution",
      linkedReasoning:
        evidenceForIndex(input.diagnostic.evidenceCards, index) ??
        (language === "es"
          ? "Accion derivada del diagnostico mas reciente."
          : "Action derived from the latest diagnostic.")
    })
  );
}

export function buildActionPlan(input: ActionPlanInput): ActionPlanRecord {
  const roadmapActions =
    input.roadmap?.items.map((item, index) =>
      actionFromRoadmapItem(item, index, input.workspace.outputLanguage)
    ) ?? [];
  const actions = (roadmapActions.length > 0 ? roadmapActions : fallbackActions(input))
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

function priorityFallback(actionPlan: ActionPlanRecord, language: OutputLanguage) {
  const values = actionPlan.actions
    .filter((action) => action.priority === "high")
    .map((action) => action.title)
    .slice(0, 3);

  if (values.length >= 3) {
    return values;
  }

  const fallback =
    language === "es"
      ? ["Clarificar posicionamiento", "Definir embudo medible", "Instalar cadencia semanal"]
      : ["Clarify positioning", "Define a measurable funnel", "Install a weekly cadence"];

  return [...values, ...fallback].slice(0, 3);
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

export function buildThirtyDayPlan(input: ThirtyDayPlanInput): ThirtyDayPlanRecord {
  const language = input.workspace.outputLanguage;
  const priorities = priorityFallback(input.actionPlan, language);
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
        ? `${company}: ${copy(language).monthObjective} Prioridad principal: ${primaryAction?.title ?? priorities[0]}.`
        : `${company}: ${copy(language).monthObjective} Primary priority: ${primaryAction?.title ?? priorities[0]}.`,
    topPriorities: priorities,
    week1: weekPlan({
      title: language === "es" ? "Semana 1: Enfoque y baseline" : "Week 1: Focus and baseline",
      objective:
        language === "es"
          ? `Alinear equipo y confirmar las senales base: ${joinForSentence(signals, language)}.`
          : `Align the team and confirm baseline signals: ${joinForSentence(signals, language)}.`,
      actions: [
        priorities[0],
        language === "es" ? "Definir owner y decision semanal" : "Define owner and weekly decision",
        language === "es" ? "Capturar metricas base" : "Capture baseline metrics"
      ],
      successSignal:
        language === "es"
          ? "El equipo puede explicar el foco del mes y la metrica primaria."
          : "The team can explain the month focus and primary metric."
    }),
    week2: weekPlan({
      title: language === "es" ? "Semana 2: Prueba controlada" : "Week 2: Controlled test",
      objective:
        language === "es"
          ? "Convertir el primer gap en una prueba operativa limitada."
          : "Turn the first gap into a bounded operating test.",
      actions: [
        priorities[1],
        language === "es" ? "Lanzar una prueba con alcance pequeno" : "Launch a small-scope test",
        language === "es" ? "Registrar friccion y conversion" : "Record friction and conversion"
      ],
      successSignal:
        language === "es"
          ? "Existe una prueba activa con resultado observable."
          : "One active test has an observable result."
    }),
    week3: weekPlan({
      title: language === "es" ? "Semana 3: Operar y ajustar" : "Week 3: Operate and adjust",
      objective:
        language === "es"
          ? "Ajustar el sistema segun evidencia, no opiniones."
          : "Adjust the system from evidence, not opinions.",
      actions: [
        priorities[2],
        language === "es" ? "Revisar riesgos del diagnostico" : "Review diagnostic risks",
        language === "es" ? "Eliminar una tarea manual repetida" : "Remove one repeated manual task"
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
        language === "es" ? "Comparar baseline contra resultado" : "Compare baseline against result",
        language === "es" ? "Marcar acciones completadas y bloqueadas" : "Mark completed and blocked actions",
        language === "es" ? "Definir el proximo ciclo mensual" : "Define the next monthly cycle"
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
    metricsToWatch: metrics
      .map((metric) => metricLabels[metric as keyof typeof metricLabels] ?? metricLabels.execution)
      .concat(language === "es" ? ["Cadencia semanal cumplida"] : ["Weekly cadence completed"])
      .slice(0, 5),
    createdAt: new Date().toISOString()
  };
}
