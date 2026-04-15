import type {
  ActionPlanRecord,
  BusinessAssetRecord,
  BusinessAssetSection,
  BusinessAssetSourceReference,
  BusinessAssetType,
  BusinessProfileRecord,
  DiagnosticResultRecord,
  OutputLanguage,
  RoadmapRecord,
  ThirtyDayPlanRecord,
  WorkspaceRecord
} from "@/lib/foundation";
import { getPlanDefinition } from "@/lib/foundation";

type AssetGenerationInput = {
  jobId: string;
  workspace: WorkspaceRecord;
  profile: BusinessProfileRecord;
  diagnostic: DiagnosticResultRecord;
  roadmap: RoadmapRecord;
  actionPlan: ActionPlanRecord;
  thirtyDayPlan: ThirtyDayPlanRecord;
};

type BusinessType =
  | "academy"
  | "commerce"
  | "general"
  | "marketplace"
  | "services"
  | "subscription";

function cleanList(values: Array<string | null | undefined>, limit = 5) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

function fallback(value: string | null | undefined, replacement: string) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : replacement;
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

  if (/(saas|subscription|software|platform|app|workflow)/.test(text)) {
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

function defaultChannels(type: BusinessType, language: OutputLanguage) {
  const channels: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: ["Referral partners", "Content-led lead capture", "Cohort waitlist"],
      es: ["Partners de referidos", "Captura de leads por contenido", "Waitlist de cohortes"]
    },
    commerce: {
      en: ["Owned email/SMS", "High-intent paid search", "Product-led social proof"],
      es: ["Email/SMS propio", "Busqueda paga de alta intencion", "Prueba social de producto"]
    },
    general: {
      en: ["Primary acquisition channel", "Owned follow-up channel", "Referral loop"],
      es: ["Canal primario de adquisicion", "Canal propio de seguimiento", "Loop de referidos"]
    },
    marketplace: {
      en: ["Supply onboarding", "Demand activation", "Referral or partner loop"],
      es: ["Onboarding de oferta", "Activacion de demanda", "Loop de referidos o partners"]
    },
    services: {
      en: ["Qualified outbound", "Referral network", "Authority content"],
      es: ["Outbound calificado", "Red de referidos", "Contenido de autoridad"]
    },
    subscription: {
      en: ["ICP-focused outbound", "Product-led activation", "Lifecycle email"],
      es: ["Outbound enfocado en ICP", "Activacion product-led", "Email de ciclo de vida"]
    }
  };

  return channels[type][language];
}

function typeLabel(type: BusinessType, language: OutputLanguage) {
  const labels: Record<BusinessType, { en: string; es: string }> = {
    academy: { en: "education business", es: "negocio educativo" },
    commerce: { en: "commerce business", es: "negocio de comercio" },
    general: { en: "business", es: "negocio" },
    marketplace: { en: "marketplace", es: "marketplace" },
    services: { en: "services business", es: "negocio de servicios" },
    subscription: { en: "subscription business", es: "negocio de suscripcion" }
  };

  return labels[type][language];
}

function assetLabel(type: BusinessAssetType, language: OutputLanguage) {
  const labels: Record<BusinessAssetType, { title: string; purpose: string }> =
    language === "es"
      ? {
          positioning_summary: {
            title: "Resumen de posicionamiento",
            purpose:
              "Convertir el perfil y diagnostico en una definicion clara de segmento, problema, promesa y siguiente decision."
          },
          thirty_day_action_plan_summary: {
            title: "Resumen del plan de accion de 30 dias",
            purpose:
              "Condensar el plan operativo en prioridades, semanas, quick wins y metricas revisables."
          },
          messaging_framework: {
            title: "Framework de mensajes",
            purpose:
              "Dar estructura a la narrativa comercial sin prometer resultados no verificados."
          },
          basic_channel_plan: {
            title: "Plan basico de canales",
            purpose:
              "Asignar un rol operativo a los canales actuales o recomendados y definir cadencia de revision."
          },
          execution_checklist: {
            title: "Checklist de ejecucion",
            purpose:
              "Convertir acciones y plan semanal en una lista concreta de control operativo."
          },
          founder_summary: {
            title: "Resumen para fundador",
            purpose:
              "Crear una lectura ejecutiva breve de foco, restricciones, decisiones y riesgos."
          }
        }
      : {
          positioning_summary: {
            title: "Positioning summary",
            purpose:
              "Turn the profile and diagnostic into a clear segment, problem, promise, and next decision."
          },
          thirty_day_action_plan_summary: {
            title: "30-day action plan summary",
            purpose:
              "Condense the operating plan into priorities, weeks, quick wins, and reviewable metrics."
          },
          messaging_framework: {
            title: "Messaging framework",
            purpose:
              "Structure the commercial narrative without claiming unverified outcomes."
          },
          basic_channel_plan: {
            title: "Basic channel plan",
            purpose:
              "Assign an operating role to current or recommended channels and define review cadence."
          },
          execution_checklist: {
            title: "Execution checklist",
            purpose:
              "Convert actions and the weekly plan into a concrete operating control list."
          },
          founder_summary: {
            title: "Founder summary",
            purpose:
              "Create a concise executive readout of focus, constraints, decisions, and risks."
          }
        };

  return labels[type];
}

function sourceReferences({
  actionPlan,
  diagnostic,
  profile,
  roadmap,
  thirtyDayPlan,
  workspace
}: Omit<AssetGenerationInput, "jobId">): BusinessAssetSourceReference[] {
  const plan = getPlanDefinition(workspace.plan);

  return [
    {
      sourceType: "workspace",
      label: "Workspace",
      referenceId: workspace.id,
      detail: `${workspace.name} / ${plan.label} / ${workspace.accountState}`
    },
    {
      sourceType: "business_profile",
      label: "Business profile",
      referenceId: profile.id,
      detail: fallback(profile.companyName, workspace.name)
    },
    {
      sourceType: "diagnostic",
      label: "Diagnostic result",
      referenceId: diagnostic.id,
      detail: `${diagnostic.overallMaturityScore}/100, confidence ${diagnostic.confidence}`
    },
    {
      sourceType: "roadmap",
      label: "Roadmap",
      referenceId: roadmap.id,
      detail: `${roadmap.items.length} staged recommendations`
    },
    {
      sourceType: "action_plan",
      label: "Action plan",
      referenceId: actionPlan.id,
      detail: `${actionPlan.actions.length} action cards`
    },
    {
      sourceType: "thirty_day_plan",
      label: "30-day plan",
      referenceId: thirtyDayPlan.id,
      detail: thirtyDayPlan.monthObjective
    }
  ];
}

function createAsset({
  content,
  input,
  purpose,
  title,
  type
}: {
  content: BusinessAssetSection[];
  input: AssetGenerationInput;
  purpose: string;
  title: string;
  type: BusinessAssetType;
}): BusinessAssetRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    workspaceId: input.workspace.id,
    assetType: type,
    title,
    purpose,
    content,
    sourceReferences: sourceReferences(input),
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

function primaryBottleneck(diagnostic: DiagnosticResultRecord, language: OutputLanguage) {
  return (
    diagnostic.topBottlenecks[0]?.title ??
    (language === "es" ? "restriccion operativa principal" : "primary operating constraint")
  );
}

function primaryRisk(diagnostic: DiagnosticResultRecord, language: OutputLanguage) {
  return (
    diagnostic.topRisks[0]?.title ??
    (language === "es" ? "riesgo de ejecucion sin owner claro" : "execution risk without clear owner")
  );
}

function primaryOpportunity(diagnostic: DiagnosticResultRecord, language: OutputLanguage) {
  return (
    diagnostic.topOpportunities[0]?.title ??
    (language === "es" ? "oportunidad de foco operativo" : "operating focus opportunity")
  );
}

function section(heading: string, items: string[]): BusinessAssetSection {
  return {
    heading,
    items: items.filter((item) => item.trim().length > 0)
  };
}

export function buildBusinessAssets(input: AssetGenerationInput): BusinessAssetRecord[] {
  const { actionPlan, diagnostic, profile, roadmap, thirtyDayPlan, workspace } = input;
  const language = workspace.outputLanguage;
  const type = detectBusinessType(profile);
  const company = fallback(profile.companyName, workspace.name);
  const vertical = typeLabel(type, language);
  const audience = fallback(
    profile.targetAudience,
    language === "es" ? "segmento prioritario aun por afinar" : "priority segment still to sharpen"
  );
  const offer = fallback(
    profile.primaryOffer,
    language === "es" ? "oferta principal aun por documentar" : "primary offer still to document"
  );
  const channels = profile.currentChannels.length
    ? profile.currentChannels.slice(0, 4)
    : defaultChannels(type, language);
  const nowRoadmapItems = roadmap.items
    .filter((item) => item.phase === "now")
    .slice(0, 3);
  const topActions = actionPlan.actions.slice(0, 5);
  const labels = (assetType: BusinessAssetType) => assetLabel(assetType, language);

  const positioning = createAsset({
    input,
    type: "positioning_summary",
    ...labels("positioning_summary"),
    content:
      language === "es"
        ? [
            section("Segmento prioritario", [
              `${company} debe enfocar el ${vertical} en: ${audience}.`,
              `Geografia/contexto: ${fallback(profile.geography, "no especificado")}.`
            ]),
            section("Problema principal", [
              primaryBottleneck(diagnostic, language),
              diagnostic.topBottlenecks[0]?.detail ?? diagnostic.summary
            ]),
            section("Promesa y oferta", [
              `Oferta actual: ${offer}.`,
              `La promesa debe conectar el problema anterior con una decision clara de compra o adopcion.`
            ]),
            section("Siguiente decision", [
              `Elegir una combinacion unica de segmento, problema y promesa para validar durante el proximo ciclo.`,
              `No ampliar canales hasta que la propuesta y el criterio de lead calificado esten claros.`
            ])
          ]
        : [
            section("Priority segment", [
              `${company} should focus this ${vertical} around: ${audience}.`,
              `Geography/context: ${fallback(profile.geography, "not specified")}.`
            ]),
            section("Primary problem", [
              primaryBottleneck(diagnostic, language),
              diagnostic.topBottlenecks[0]?.detail ?? diagnostic.summary
            ]),
            section("Promise and offer", [
              `Current offer: ${offer}.`,
              `The promise should connect the problem above to a clear buying or adoption decision.`
            ]),
            section("Next decision", [
              `Choose one segment, one problem, and one promise to validate in the next operating cycle.`,
              `Do not expand channels until the offer and qualified-lead criteria are clear.`
            ])
          ]
  });

  const actionSummary = createAsset({
    input,
    type: "thirty_day_action_plan_summary",
    ...labels("thirty_day_action_plan_summary"),
    content:
      language === "es"
        ? [
            section("Objetivo del mes", [thirtyDayPlan.monthObjective]),
            section("Top 3 prioridades", thirtyDayPlan.topPriorities),
            section("Secuencia semanal", [
              `${thirtyDayPlan.week1.title}: ${thirtyDayPlan.week1.objective}`,
              `${thirtyDayPlan.week2.title}: ${thirtyDayPlan.week2.objective}`,
              `${thirtyDayPlan.week3.title}: ${thirtyDayPlan.week3.objective}`,
              `${thirtyDayPlan.week4.title}: ${thirtyDayPlan.week4.objective}`
            ]),
            section("Metricas a revisar", thirtyDayPlan.metricsToWatch)
          ]
        : [
            section("Month objective", [thirtyDayPlan.monthObjective]),
            section("Top 3 priorities", thirtyDayPlan.topPriorities),
            section("Weekly sequence", [
              `${thirtyDayPlan.week1.title}: ${thirtyDayPlan.week1.objective}`,
              `${thirtyDayPlan.week2.title}: ${thirtyDayPlan.week2.objective}`,
              `${thirtyDayPlan.week3.title}: ${thirtyDayPlan.week3.objective}`,
              `${thirtyDayPlan.week4.title}: ${thirtyDayPlan.week4.objective}`
            ]),
            section("Metrics to review", thirtyDayPlan.metricsToWatch)
          ]
  });

  const messaging = createAsset({
    input,
    type: "messaging_framework",
    ...labels("messaging_framework"),
    content:
      language === "es"
        ? [
            section("Mensaje central", [
              `${company} ayuda a ${audience} a avanzar sobre "${primaryOpportunity(
                diagnostic,
                language
              )}" mediante ${offer}.`
            ]),
            section(
              "Pilares de valor",
              cleanList(nowRoadmapItems.map((item) => item.title), 3)
            ),
            section(
              "Objeciones a responder",
              cleanList(diagnostic.topRisks.map((risk) => risk.title), 3)
            ),
            section("CTA de preview", [
              "Invitar a una conversacion de diagnostico o revision, no prometer automatizaciones ni resultados comerciales garantizados."
            ])
          ]
        : [
            section("Core message", [
              `${company} helps ${audience} advance "${primaryOpportunity(
                diagnostic,
                language
              )}" through ${offer}.`
            ]),
            section("Value pillars", cleanList(nowRoadmapItems.map((item) => item.title), 3)),
            section("Objections to answer", cleanList(diagnostic.topRisks.map((risk) => risk.title), 3)),
            section("Preview CTA", [
              "Invite a diagnostic or operating review conversation, without promising automation or guaranteed commercial outcomes."
            ])
          ]
  });

  const channelPlan = createAsset({
    input,
    type: "basic_channel_plan",
    ...labels("basic_channel_plan"),
    content:
      language === "es"
        ? [
            section("Canales prioritarios", channels),
            section("Rol de cada canal", [
              `Adquisicion: usar el canal con mayor senal de intencion para validar calidad de lead.`,
              `Seguimiento: usar un canal propio para mover leads calificados a decision.`,
              `Prueba: revisar conversion y calidad antes de ampliar volumen.`
            ]),
            section("Cadencia", [
              "Revision semanal de leads, conversion, calidad y aprendizajes.",
              "Decision semanal: mantener, ajustar o pausar el canal probado."
            ]),
            section("Riesgo a evitar", [primaryRisk(diagnostic, language)])
          ]
        : [
            section("Priority channels", channels),
            section("Role of each channel", [
              `Acquisition: use the highest-intent channel to validate lead quality.`,
              `Follow-up: use an owned channel to move qualified leads toward a decision.`,
              `Testing: review conversion and quality before increasing volume.`
            ]),
            section("Cadence", [
              "Weekly review of leads, conversion, quality, and learning.",
              "Weekly decision: keep, adjust, or pause the channel being tested."
            ]),
            section("Risk to avoid", [primaryRisk(diagnostic, language)])
          ]
  });

  const executionChecklist = createAsset({
    input,
    type: "execution_checklist",
    ...labels("execution_checklist"),
    content:
      language === "es"
        ? [
            section("Esta semana", cleanList(topActions.map((action) => action.title), 5)),
            section("Definir", [
              "Owner de cada accion prioritaria.",
              "Criterio de lead, oportunidad o tarea completada.",
              "Metrica que se revisara al final de la semana."
            ]),
            section("Probar", thirtyDayPlan.quickWins.slice(0, 4)),
            section("Revisar", thirtyDayPlan.successSignals.slice(0, 4))
          ]
        : [
            section("This week", cleanList(topActions.map((action) => action.title), 5)),
            section("Define", [
              "Owner for every priority action.",
              "Criteria for a completed lead, opportunity, or task.",
              "Metric that will be reviewed at the end of the week."
            ]),
            section("Test", thirtyDayPlan.quickWins.slice(0, 4)),
            section("Review", thirtyDayPlan.successSignals.slice(0, 4))
          ]
  });

  const founderSummary = createAsset({
    input,
    type: "founder_summary",
    ...labels("founder_summary"),
    content:
      language === "es"
        ? [
            section("Lectura actual", [
              `${company} tiene un score de madurez de ${diagnostic.overallMaturityScore}/100 con confianza ${diagnostic.confidence}.`,
              diagnostic.summary
            ]),
            section("Foco estrategico", [
              nowRoadmapItems[0]?.title ?? primaryOpportunity(diagnostic, language),
              `El plan de 30 dias debe concentrarse en: ${thirtyDayPlan.topPriorities.join(", ")}.`
            ]),
            section("Riesgos activos", cleanList(diagnostic.topRisks.map((risk) => risk.title), 3)),
            section("Decision del fundador", [
              "Confirmar el segmento prioritario, el owner operativo y el criterio de exito del proximo ciclo."
            ])
          ]
        : [
            section("Current read", [
              `${company} has a maturity score of ${diagnostic.overallMaturityScore}/100 with ${diagnostic.confidence} confidence.`,
              diagnostic.summary
            ]),
            section("Strategic focus", [
              nowRoadmapItems[0]?.title ?? primaryOpportunity(diagnostic, language),
              `The 30-day plan should concentrate on: ${thirtyDayPlan.topPriorities.join(", ")}.`
            ]),
            section("Active risks", cleanList(diagnostic.topRisks.map((risk) => risk.title), 3)),
            section("Founder decision", [
              "Confirm the priority segment, operating owner, and success criteria for the next cycle."
            ])
          ]
  });

  return [
    positioning,
    actionSummary,
    messaging,
    channelPlan,
    executionChecklist,
    founderSummary
  ];
}
