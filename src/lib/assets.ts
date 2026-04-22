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
import { resolveDownstreamTrustState, type DownstreamTrustState } from "@/lib/downstream-trust";
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

type AssetSourceFocus = {
  workspace?: string[];
  profile?: string[];
  diagnostic?: string[];
  roadmap?: string[];
  actionPlan?: string[];
  thirtyDayPlan?: string[];
};

type ChannelOperatingPlan = {
  channel: string;
  purpose: string;
  validationGoal: string;
  primaryKpi: string;
  cadence: string;
  decisionRule: string;
};

type ChecklistStep = {
  title: string;
  owner: string;
  work: string;
  evidence: string;
  done: string;
};

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

const blockedAssetLabels = [
  "captured operating constraint",
  "captured input signals",
  "conclusiones inferidas",
  "inferred conclusions",
  "operational constraint captured",
  "recommended action basis",
  "restriccion operativa capturada",
  "senales capturadas"
];

function cleanAssetSignal(value: string | null | undefined, replacement: string) {
  const cleaned = value?.trim() ?? "";
  const normalized = cleaned.toLowerCase();
  if (!normalized || blockedAssetLabels.some((label) => normalized.includes(label))) {
    return replacement;
  }

  return cleaned;
}

function joinSignals(values: string[], fallbackValue: string) {
  const cleaned = cleanList(values, 6);
  return cleaned.length > 0 ? cleaned.join("; ") : fallbackValue;
}

function localizedCategoryLabel(category: string, language: OutputLanguage): string {
  const labels: Record<string, { en: string; es: string }> = {
    acquisition: { en: "acquisition", es: "adquisicion" },
    commercial: { en: "commercial", es: "comercial" },
    data: { en: "data", es: "datos" },
    execution: { en: "execution", es: "ejecucion" },
    operations: { en: "operations", es: "operaciones" },
    positioning: { en: "positioning", es: "posicionamiento" }
  };
  return labels[category]?.[language] ?? (language === "es" ? "ejecucion" : "execution");
}

function localizeConfidence(confidence: string, language: OutputLanguage): string {
  if (language !== "es") return confidence;
  const map: Record<string, string> = { high: "alta", medium: "media", low: "baja" };
  return map[confidence] ?? confidence;
}

function localizePhase(phase: string, language: OutputLanguage): string {
  if (language !== "es") return phase;
  const map: Record<string, string> = { now: "ahora", next: "siguiente", later: "despues" };
  return map[phase] ?? phase;
}

function localizePriority(priority: string, language: OutputLanguage): string {
  if (language !== "es") return priority;
  const map: Record<string, string> = { high: "alta", medium: "media", low: "baja" };
  return map[priority] ?? priority;
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
}: Omit<AssetGenerationInput, "jobId">, focus: AssetSourceFocus = {}): BusinessAssetSourceReference[] {
  const lang = workspace.outputLanguage;
  const plan = getPlanDefinition(workspace.plan);
  const ns = lang === "es" ? "no especificado" : "not specified";
  const sl = (en: string, es: string) => lang === "es" ? es : en;

  const defaultProfileSignals = [
    `${sl("Company", "Empresa")}: ${fallback(profile.companyName, workspace.name)}`,
    `${sl("Audience", "Audiencia")}: ${fallback(profile.targetAudience, ns)}`,
    `${sl("Offer", "Oferta")}: ${fallback(profile.primaryOffer, ns)}`,
    `${sl("Channels", "Canales")}: ${joinSignals(profile.currentChannels, ns)}`
  ];
  const defaultDiagnosticSignals = [
    `${sl("Score", "Puntuacion")}: ${diagnostic.overallMaturityScore}/100`,
    `${sl("Confidence", "Confianza")}: ${localizeConfidence(diagnostic.confidence, lang)}`,
    `${sl("Bottleneck", "Cuello de botella")}: ${cleanAssetSignal(diagnostic.topBottlenecks[0]?.title, ns)}`,
    `${sl("Risk", "Riesgo")}: ${cleanAssetSignal(diagnostic.topRisks[0]?.title, ns)}`
  ];
  const defaultRoadmapSignals = roadmap.items
    .filter((item) => item.phase === "now")
    .slice(0, 3)
    .map((item) => `${localizePhase(item.phase, lang)}: ${cleanAssetSignal(item.title, sl("operating move", "movimiento operativo"))}`);
  const defaultActionSignals = actionPlan.actions
    .slice(0, 4)
    .map((action) => `${localizePriority(action.priority, lang)}: ${cleanAssetSignal(action.title, sl("operating action", "accion operativa"))}`);
  const defaultPlanSignals = [
    `${sl("Objective", "Objetivo")}: ${cleanAssetSignal(thirtyDayPlan.monthObjective, sl("operating objective", "objetivo operativo"))}`,
    `${sl("Metrics", "Metricas")}: ${joinSignals(
      thirtyDayPlan.metricsToWatch.map((metric) =>
        cleanAssetSignal(metric, sl("operating metric", "metrica operativa"))
      ),
      ns
    )}`
  ];

  return [
    {
      sourceType: "workspace",
      label: "Workspace",
      referenceId: workspace.id,
      detail: joinSignals(
        focus.workspace ?? [
          `${workspace.name}`,
          `${sl("Plan", "Plan")}: ${plan.label}`,
          `${sl("State", "Estado")}: ${workspace.accountState}`,
          `${sl("Language", "Idioma")}: ${workspace.outputLanguage}`
        ],
        `${workspace.name} / ${plan.label} / ${workspace.accountState}`
      )
    },
    {
      sourceType: "business_profile",
      label: sl("Business profile", "Perfil de negocio"),
      referenceId: profile.id,
      detail: joinSignals(focus.profile ?? defaultProfileSignals, fallback(profile.companyName, workspace.name))
    },
    {
      sourceType: "diagnostic",
      label: sl("Diagnostic result", "Resultado de diagnostico"),
      referenceId: diagnostic.id,
      detail: joinSignals(
        focus.diagnostic ?? defaultDiagnosticSignals,
        `${diagnostic.overallMaturityScore}/100, ${sl("confidence", "confianza")} ${localizeConfidence(diagnostic.confidence, lang)}`
      )
    },
    {
      sourceType: "roadmap",
      label: sl("Roadmap", "Roadmap"),
      referenceId: roadmap.id,
      detail: joinSignals(
        focus.roadmap ?? defaultRoadmapSignals,
        `${roadmap.items.length} ${sl("staged recommendations", "recomendaciones escalonadas")}`
      )
    },
    {
      sourceType: "action_plan",
      label: sl("Action plan", "Plan de acciones"),
      referenceId: actionPlan.id,
      detail: joinSignals(
        focus.actionPlan ?? defaultActionSignals,
        `${actionPlan.actions.length} ${sl("action cards", "tarjetas de accion")}`
      )
    },
    {
      sourceType: "thirty_day_plan",
      label: sl("30-day plan", "Plan de 30 dias"),
      referenceId: thirtyDayPlan.id,
      detail: joinSignals(
        focus.thirtyDayPlan ?? defaultPlanSignals,
        cleanAssetSignal(thirtyDayPlan.monthObjective, sl("operating objective", "objetivo operativo"))
      )
    }
  ];
}

function createAsset({
  content,
  input,
  purpose,
  sourceFocus,
  title,
  type
}: {
  content: BusinessAssetSection[];
  input: AssetGenerationInput;
  purpose: string;
  sourceFocus?: AssetSourceFocus;
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
    sourceReferences: sourceReferences(input, sourceFocus),
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

function buildValidationFirstAssets(
  input: AssetGenerationInput,
  trustState: DownstreamTrustState
): BusinessAssetRecord[] {
  const { diagnostic, profile, workspace } = input;
  const language = workspace.outputLanguage;
  const sl = (en: string, es: string) => (language === "es" ? es : en);
  const company = fallback(profile.companyName, workspace.name);
  const ns = sl("not specified", "no especificado");
  const prefix = trustState.hasContradiction
    ? sl("Conditional draft", "Borrador condicional")
    : sl("Provisional draft", "Borrador provisional");
  const knownSignals = [
    `${sl("Company", "Empresa")}: ${company}`,
    `${sl("Website", "Website")}: ${fallback(profile.website, ns)}`,
    `${sl("Offer", "Oferta")}: ${fallback(profile.primaryOffer, ns)}`,
    `${sl("Audience", "Audiencia")}: ${fallback(profile.targetAudience, ns)}`,
    `${sl("CTA", "CTA")}: ${fallback(profile.conversionAction, ns)}`,
    `${sl("Channels", "Canales")}: ${joinSignals(profile.currentChannels, ns)}`,
    `${sl("Tools", "Herramientas")}: ${joinSignals(profile.currentTools, ns)}`
  ];
  const gaps = trustState.evidenceGaps.length
    ? trustState.evidenceGaps
    : [sl("Minimum profile evidence is incomplete.", "La evidencia minima del perfil esta incompleta.")];
  const tasks = trustState.validationTasks.length
    ? trustState.validationTasks
    : [
        sl(
          "Validate offer, audience, CTA, channel, sales process, tools, and reporting evidence.",
          "Validar oferta, audiencia, CTA, canal, proceso de venta, herramientas y reporting."
        )
      ];
  const cannotClaim = trustState.cannotClaim.length
    ? trustState.cannotClaim
    : [
        sl(
          "Do not treat this as final positioning, channel, conversion, or operating advice yet.",
          "No tratar esto aun como posicionamiento, canal, conversion o consejo operativo final."
        )
      ];
  const trustSections = [
    section(sl("Trust status", "Estado de confianza"), [
      trustState.summary,
      `${sl("Diagnostic confidence", "Confianza diagnostica")}: ${localizeConfidence(diagnostic.confidence, language)}`
    ]),
    section(sl("Known evidence", "Evidencia conocida"), knownSignals),
    section(sl("Needs validation before use", "Necesita validacion antes de uso"), tasks.slice(0, 5)),
    section(sl("Do not claim yet", "No afirmar todavia"), cannotClaim.slice(0, 4))
  ];
  const validationSourceFocus: AssetSourceFocus = {
    profile: knownSignals,
    diagnostic: [
      `${sl("Score", "Puntuacion")}: ${diagnostic.overallMaturityScore}/100`,
      `${sl("Confidence", "Confianza")}: ${localizeConfidence(diagnostic.confidence, language)}`,
      `${sl("Trust state", "Estado de confianza")}: ${trustState.label}`,
      `${sl("Evidence gaps", "Gaps de evidencia")}: ${joinSignals(gaps, ns)}`
    ],
    actionPlan: input.actionPlan.actions.map((action) => `${localizePriority(action.priority, language)}: ${action.title}`).slice(0, 5),
    thirtyDayPlan: [
      `${sl("Objective", "Objetivo")}: ${input.thirtyDayPlan.monthObjective}`,
      `${sl("Validation metrics", "Metricas de validacion")}: ${joinSignals(input.thirtyDayPlan.metricsToWatch, ns)}`
    ]
  };
  const provisionalChannelList = profile.currentChannels.length
    ? profile.currentChannels
    : [
        sl(
          "No active channel confirmed yet - choose one channel only after evidence is repaired.",
          "No hay canal activo confirmado - elegir un canal solo despues de reparar evidencia."
        )
      ];

  return [
    createAsset({
      input,
      type: "positioning_summary",
      title: `${prefix}: ${assetLabel("positioning_summary", language).title}`,
      purpose: sl(
        "Capture provisional positioning only; do not use as final market-facing language until evidence is validated.",
        "Capturar posicionamiento provisional; no usar como lenguaje final de mercado hasta validar evidencia."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Conditional positioning frame", "Marco de posicionamiento condicional"), [
          sl(
            `If the offer and audience evidence are confirmed, ${company} can sharpen one promise for one buyer segment.`,
            `Si se confirma la evidencia de oferta y audiencia, ${company} puede afinar una promesa para un segmento comprador.`
          ),
          sl(
            "If validation fails, change the segment, offer, or CTA before increasing acquisition activity.",
            "Si la validacion falla, cambiar segmento, oferta o CTA antes de aumentar actividad de adquisicion."
          )
        ])
      ]
    }),
    createAsset({
      input,
      type: "thirty_day_action_plan_summary",
      title: `${prefix}: ${assetLabel("thirty_day_action_plan_summary", language).title}`,
      purpose: sl(
        "Summarize validation work first, before treating the plan as an execution calendar.",
        "Resumir primero el trabajo de validacion antes de tratar el plan como calendario de ejecucion."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Validation-first sequence", "Secuencia de validacion primero"), [
          input.thirtyDayPlan.week1.objective,
          input.thirtyDayPlan.week2.objective,
          input.thirtyDayPlan.week3.objective,
          input.thirtyDayPlan.week4.objective
        ])
      ]
    }),
    createAsset({
      input,
      type: "messaging_framework",
      title: `${prefix}: ${assetLabel("messaging_framework", language).title}`,
      purpose: sl(
        "Create conditional messaging prompts for testing, not confident public copy.",
        "Crear prompts condicionales de mensaje para probar, no copy publico definitivo."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Conditional message tests", "Pruebas condicionales de mensaje"), [
          sl(
            "Test one pain, one buyer, one promise, and one measurable result before publishing stronger copy.",
            "Probar un dolor, un comprador, una promesa y un resultado medible antes de publicar copy mas fuerte."
          ),
          sl(
            "Use neutral language such as 'we are testing' or 'we help with' until proof is confirmed.",
            "Usar lenguaje neutral como 'estamos probando' o 'ayudamos con' hasta confirmar prueba."
          )
        ])
      ]
    }),
    createAsset({
      input,
      type: "basic_channel_plan",
      title: `${prefix}: ${assetLabel("basic_channel_plan", language).title}`,
      purpose: sl(
        "Treat channels as validation paths until acquisition evidence is confirmed.",
        "Tratar canales como rutas de validacion hasta confirmar evidencia de adquisicion."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Channel validation candidates", "Candidatos de validacion de canal"), provisionalChannelList),
        section(sl("Decision rule", "Regla de decision"), [
          sl(
            "Do not scale channel activity until source, conversion action, owner, and baseline metric are documented.",
            "No escalar actividad de canal hasta documentar fuente, accion de conversion, owner y metrica base."
          )
        ])
      ]
    }),
    createAsset({
      input,
      type: "execution_checklist",
      title: `${prefix}: ${assetLabel("execution_checklist", language).title}`,
      purpose: sl(
        "Convert uncertainty into a verification checklist before execution.",
        "Convertir incertidumbre en checklist de verificacion antes de ejecutar."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Verification checklist", "Checklist de verificacion"), tasks.slice(0, 8))
      ]
    }),
    createAsset({
      input,
      type: "founder_summary",
      title: `${prefix}: ${assetLabel("founder_summary", language).title}`,
      purpose: sl(
        "Give the founder an honest readout of what is known, uncertain, and blocked.",
        "Dar al founder un resumen honesto de lo conocido, incierto y bloqueado."
      ),
      sourceFocus: validationSourceFocus,
      content: [
        ...trustSections,
        section(sl("Founder decision", "Decision del founder"), [
          sl(
            "Use this run to repair evidence, not to approve a full operating system rollout.",
            "Usar esta corrida para reparar evidencia, no para aprobar un despliegue operativo completo."
          ),
          sl(
            "Regenerate roadmap, actions, assets, and SOPs after the missing or contradictory evidence is resolved.",
            "Regenerar roadmap, acciones, assets y SOPs despues de resolver la evidencia faltante o contradictoria."
          )
        ])
      ]
    })
  ];
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

function verticalKpi(type: BusinessType, language: OutputLanguage) {
  const kpis: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: "qualified enrollment conversations",
      es: "conversaciones de enrolamiento calificadas"
    },
    commerce: { en: "qualified purchases or checkout starts", es: "compras calificadas o inicios de checkout" },
    general: { en: "qualified conversion events", es: "eventos de conversion calificados" },
    marketplace: { en: "qualified supply or demand activations", es: "activaciones calificadas de oferta o demanda" },
    services: { en: "qualified sales conversations", es: "conversaciones comerciales calificadas" },
    subscription: { en: "qualified activations or demo requests", es: "activaciones calificadas o solicitudes de demo" }
  };

  return kpis[type][language];
}

function verticalBuyerPain(
  type: BusinessType,
  audience: string,
  language: OutputLanguage
): string {
  const pain: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: `${audience} need a structured path to a real, verifiable outcome — not just content access. They want to know what they will achieve, how long it takes, and whether they will actually finish.`,
      es: `${audience} necesitan un camino estructurado hacia un resultado real y verificable, no solo acceso a contenido. Quieren saber que lograran, cuanto tiempo toma y si realmente terminaran.`
    },
    subscription: {
      en: `${audience} lose time and accuracy to manual or disconnected processes. They need a reliable system that removes operational drag without requiring a large implementation project.`,
      es: `${audience} pierden tiempo y precision por procesos manuales o desconectados. Necesitan un sistema confiable que elimine friccion operativa sin requerir una implementacion compleja.`
    },
    services: {
      en: `${audience} struggle to find a partner who delivers on scope and timeline without constant oversight. They want to know exactly what they are getting before they commit.`,
      es: `${audience} no encuentran facilmente un partner que cumpla alcance y timeline sin supervision constante. Quieren saber exactamente que recibiran antes de comprometerse.`
    },
    commerce: {
      en: `${audience} want to buy the right product with confidence — clear on fit, price, delivery timeline, and what happens if something goes wrong.`,
      es: `${audience} quieren comprar el producto correcto con confianza: claros en ajuste, precio, plazo de entrega y que pasa si algo falla.`
    },
    marketplace: {
      en: `${audience} cannot reliably find or connect with the right counterpart. The friction of searching, qualifying, and initiating a transaction causes early abandonment.`,
      es: `${audience} no pueden encontrar o conectar confiablemente con la contraparte correcta. La friccion de buscar, calificar e iniciar una transaccion provoca abandono temprano.`
    },
    general: {
      en: `${audience} need a clear, consistent path to their goal but lack the structure or system to execute it without losing time and momentum.`,
      es: `${audience} necesitan un camino claro y consistente hacia su objetivo pero les falta la estructura o el sistema para ejecutarlo sin perder tiempo e impulso.`
    }
  };
  return pain[type][language];
}

function verticalValueProp(
  type: BusinessType,
  offer: string,
  audience: string,
  language: OutputLanguage
): string {
  const props: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: `${offer} gives ${audience} a structured path to a specific skill or career outcome — with defined enrollment criteria, completion milestones, and results they can verify before enrolling.`,
      es: `${offer} da a ${audience} un camino estructurado hacia una habilidad o resultado profesional especifico, con criterios de enrolamiento definidos, hitos de finalizacion y resultados verificables antes de inscribirse.`
    },
    subscription: {
      en: `${offer} removes the manual and disconnected steps that slow ${audience} down — replacing operational drag with a reliable, measurable system from day one.`,
      es: `${offer} elimina los pasos manuales y desconectados que frenan a ${audience}, reemplazando la friccion operativa con un sistema confiable y medible desde el primer dia.`
    },
    services: {
      en: `${offer} delivers a defined outcome for ${audience} — with clear scope, fixed timeline, and full accountability established before the engagement begins.`,
      es: `${offer} entrega un resultado definido para ${audience}, con alcance claro, timeline fijo y responsabilidad completa establecida antes de iniciar el engagement.`
    },
    commerce: {
      en: `${offer} gives ${audience} everything needed to buy with confidence: product clarity, reliable delivery, and support that resolves issues without friction.`,
      es: `${offer} da a ${audience} todo lo necesario para comprar con confianza: claridad de producto, entrega confiable y soporte que resuelve problemas sin friccion.`
    },
    marketplace: {
      en: `${offer} connects ${audience} with the right counterpart faster — reducing the time and friction between intent and a qualified, completed match.`,
      es: `${offer} conecta a ${audience} con la contraparte correcta mas rapido, reduciendo el tiempo y la friccion entre la intencion y un match calificado y completado.`
    },
    general: {
      en: `${offer} gives ${audience} a structured, accountable path to their goal — without requiring them to build the system or figure out the sequence themselves.`,
      es: `${offer} da a ${audience} un camino estructurado y responsable hacia su objetivo, sin requerir que construyan el sistema o descubran la secuencia por su cuenta.`
    }
  };
  return props[type][language];
}

function verticalPositioningHypothesis(
  type: BusinessType,
  company: string,
  offer: string,
  audience: string,
  language: OutputLanguage
): string {
  const hyp: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: `${company} is positioned as the structured learning path for ${audience} who need a real, verifiable outcome — not just course content. The offer is ${offer}. This holds if the first enrollment cycle attracts students who finish and can name a concrete result.`,
      es: `${company} se posiciona como el camino de aprendizaje estructurado para ${audience} que necesitan un resultado real y verificable, no solo contenido de curso. La oferta es ${offer}. Se sostiene si el primer ciclo atrae estudiantes que terminan y pueden nombrar un resultado concreto.`
    },
    subscription: {
      en: `${company} is positioned as the operational system for ${audience} who need to eliminate manual drag and gain measurable visibility. The product is ${offer}. This holds if the first activated users report time savings and can measure an outcome within 30 days.`,
      es: `${company} se posiciona como el sistema operativo para ${audience} que necesitan eliminar friccion manual y ganar visibilidad medible. El producto es ${offer}. Se sostiene si los primeros usuarios activados reportan ahorro de tiempo y pueden medir un resultado en 30 dias.`
    },
    services: {
      en: `${company} is positioned as the accountable delivery partner for ${audience} who need defined scope, clear timeline, and a verifiable track record. The service is ${offer}. This holds if buyers can review past outcomes and agree on deliverables before signing.`,
      es: `${company} se posiciona como el partner de entrega responsable para ${audience} que necesitan alcance definido, timeline claro e historial verificable. El servicio es ${offer}. Se sostiene si los compradores pueden revisar resultados anteriores y acordar entregables antes de firmar.`
    },
    commerce: {
      en: `${company} is positioned as the trusted purchase for ${audience} who need product-fit confidence, reliable delivery, and post-purchase support. The product is ${offer}. This holds if buyers return and cite confidence — not price — as the primary reason.`,
      es: `${company} se posiciona como la compra de confianza para ${audience} que necesitan seguridad en el ajuste, entrega confiable y soporte post-compra. El producto es ${offer}. Se sostiene si los compradores vuelven y citan confianza, no precio, como razon principal.`
    },
    marketplace: {
      en: `${company} is positioned as the low-friction matching platform for ${audience} who need to find the right counterpart without the cost of manual search. The platform is ${offer}. This holds if match quality, not just match volume, improves each cycle.`,
      es: `${company} se posiciona como la plataforma de match de baja friccion para ${audience} que necesitan encontrar la contraparte correcta sin el costo de la busqueda manual. La plataforma es ${offer}. Se sostiene si la calidad del match, no solo el volumen, mejora en cada ciclo.`
    },
    general: {
      en: `${company} is positioned as the structured execution system for ${audience} who need a clear path to their goal with built-in accountability. The offer is ${offer}. This holds if the first cycle produces a concrete, measurable outcome the buyer can describe to someone else.`,
      es: `${company} se posiciona como el sistema de ejecucion estructurado para ${audience} que necesitan un camino claro hacia su objetivo con responsabilidad incorporada. La oferta es ${offer}. Se sostiene si el primer ciclo produce un resultado concreto y medible que el comprador puede describir a otro.`
    }
  };
  return hyp[type][language];
}

function verticalOneLineNarrative(
  type: BusinessType,
  company: string,
  offer: string,
  audience: string,
  language: OutputLanguage
): string {
  const narratives: Record<BusinessType, { en: string; es: string }> = {
    academy: {
      en: `${company} gives ${audience} a structured program to build a real skill and reach a defined career outcome — with clear enrollment criteria, completion milestones, and results they can verify.`,
      es: `${company} da a ${audience} un programa estructurado para desarrollar una habilidad real y alcanzar un resultado profesional definido, con criterios de enrolamiento claros, hitos de finalizacion y resultados verificables.`
    },
    subscription: {
      en: `${company} gives ${audience} a reliable system to replace manual work and gain measurable operational clarity — from the first week of use.`,
      es: `${company} da a ${audience} un sistema confiable para reemplazar trabajo manual y ganar claridad operativa medible desde la primera semana de uso.`
    },
    services: {
      en: `${company} delivers defined outcomes for ${audience} — with clear scope, fixed timeline, and full accountability before any engagement begins.`,
      es: `${company} entrega resultados definidos para ${audience}, con alcance claro, timeline fijo y responsabilidad completa antes de iniciar cualquier engagement.`
    },
    commerce: {
      en: `${company} gives ${audience} the confidence to buy the right product — with clear fit guidance, reliable delivery, and support that removes post-purchase doubt.`,
      es: `${company} da a ${audience} la confianza para comprar el producto correcto, con orientacion de ajuste clara, entrega confiable y soporte que elimina dudas post-compra.`
    },
    marketplace: {
      en: `${company} connects ${audience} with the right match faster and with less friction — from first search to completed transaction.`,
      es: `${company} conecta a ${audience} con el match correcto mas rapido y con menos friccion, desde la primera busqueda hasta la transaccion completada.`
    },
    general: {
      en: `${company} gives ${audience} a clear, accountable path to their goal — with the structure to execute it without losing time or momentum.`,
      es: `${company} da a ${audience} un camino claro y responsable hacia su objetivo, con la estructura para ejecutarlo sin perder tiempo ni impulso.`
    }
  };
  return narratives[type][language];
}

function verticalMessagePillars(
  type: BusinessType,
  audience: string,
  language: OutputLanguage
): string[] {
  const pillars: Record<BusinessType, { en: string[]; es: string[] }> = {
    academy: {
      en: [
        `Program outcome: what the student who completes this program achieves in their work or career.`,
        `Enrollment path: how to apply, what gets evaluated, and how quickly access begins.`,
        `Completion proof: what percentage of students finish and what keeps them in the program.`
      ],
      es: [
        `Resultado del programa: que logra el estudiante que completa este programa en su trabajo o carrera.`,
        `Camino de enrolamiento: como se aplica, que se evalua y que tan rapido comienza el acceso.`,
        `Prueba de finalizacion: que porcentaje de estudiantes completa y que los mantiene en el programa.`
      ]
    },
    subscription: {
      en: [
        `Time saved: how ${audience} reduce hours spent on manual or error-prone work each week.`,
        `Operational reliability: what ${audience} can count on every week without manual intervention or rework.`,
        `Measurable impact: the operational or financial signal that confirms value within the first 30 days.`
      ],
      es: [
        `Tiempo ahorrado: como ${audience} reducen las horas dedicadas a trabajo manual o propenso a errores cada semana.`,
        `Confiabilidad operativa: en que puede confiar ${audience} cada semana sin intervencion manual ni retrabajo.`,
        `Impacto medible: la senal operativa o financiera que confirma el valor en los primeros 30 dias.`
      ]
    },
    services: {
      en: [
        `Delivery confidence: ${audience} know exactly what gets delivered, by when, and who is accountable — before signing.`,
        `Strategic clarity: ${audience} receive a clear recommendation with reasoning before implementation begins.`,
        `Verifiable track record: past client outcomes ${audience} can review and reference before committing.`
      ],
      es: [
        `Confianza en entrega: ${audience} saben exactamente que se entrega, cuando y quien es responsable, antes de firmar.`,
        `Claridad estrategica: ${audience} reciben una recomendacion clara con razonamiento antes de que comience la implementacion.`,
        `Historial verificable: resultados de clientes anteriores que ${audience} pueden revisar antes de comprometerse.`
      ]
    },
    commerce: {
      en: [
        `Product fit confidence: ${audience} can identify the right product for their need without guessing or returning.`,
        `Purchase clarity: transparent pricing, delivery expectations, and return policy that remove pre-buy hesitation.`,
        `Post-purchase trust: quality consistency, fast service response, and social proof that bring ${audience} back.`
      ],
      es: [
        `Confianza de ajuste: ${audience} pueden identificar el producto correcto para su necesidad sin adivinar ni devolver.`,
        `Claridad de compra: precio transparente, expectativas de entrega y politica de devolucion que eliminan dudas pre-compra.`,
        `Confianza post-compra: consistencia de calidad, respuesta rapida de servicio y prueba social que hacen que ${audience} vuelva.`
      ]
    },
    marketplace: {
      en: [
        `Match quality: ${audience} find the right counterpart — not just any available option — before committing.`,
        `Response speed: how quickly ${audience} can act on a match without losing momentum or waiting for follow-up.`,
        `Trust signals: what proves both sides of the marketplace are reliable and qualified before transacting.`
      ],
      es: [
        `Calidad del match: ${audience} encuentran la contraparte correcta, no solo una opcion disponible, antes de comprometerse.`,
        `Velocidad de respuesta: con que rapidez puede actuar ${audience} sobre un match sin perder impulso ni esperar seguimiento.`,
        `Senales de confianza: que prueba que ambos lados del marketplace son confiables y calificados antes de transaccionar.`
      ]
    },
    general: {
      en: [
        `Outcome clarity: ${audience} know exactly what result they are working toward — and what done looks like.`,
        `Execution reliability: ${audience} can count on consistent delivery without guessing what comes next.`,
        `Measurable progress: how ${audience} know it is working within the first cycle.`
      ],
      es: [
        `Claridad de resultado: ${audience} saben exactamente hacia que resultado trabajan y como se ve el exito.`,
        `Confiabilidad de ejecucion: ${audience} pueden contar con entrega consistente sin adivinar que viene.`,
        `Progreso medible: como sabe ${audience} que esta funcionando en el primer ciclo.`
      ]
    }
  };
  return pillars[type][language];
}

function channelIntent(channel: string) {
  const normalized = channel.toLowerCase();

  if (/(referral|referido|referidos|partner|affiliate)/.test(normalized)) {
    return "referral";
  }

  if (/(linkedin|outbound|cold|dm|email)/.test(normalized)) {
    return "direct";
  }

  if (/(webinar|event|events|evento|eventos|workshop|taller|talleres|cohort|community|comunidad|networking)/.test(normalized)) {
    return "event";
  }

  if (/(paid|search|ads|google|meta|tiktok|publicidad|anuncios)/.test(normalized)) {
    return "paid";
  }

  if (/(content|seo|blog|youtube|podcast|social|contenido|redes)/.test(normalized)) {
    return "content";
  }

  if (/(waitlist|newsletter|sms|lifecycle|crm|correo|lista|boletin)/.test(normalized)) {
    return "owned";
  }

  return "general";
}

function normalizeChannelLabel(channel: string, language: OutputLanguage): string {
  // Preserve recognized platform proper nouns
  if (/^(linkedin|youtube|instagram|facebook|meta|google|tiktok|twitter|whatsapp|hubspot|mailchimp|substack|medium|pinterest|snapchat)\b/i.test(channel.trim())) {
    return channel;
  }
  const intent = channelIntent(channel);
  const intentLabels: Record<string, { en: string; es: string }> = {
    referral: { en: "Referral network", es: "Red de referidos" },
    direct: { en: "Direct outbound", es: "Outbound directo" },
    event: { en: "Events and workshops", es: "Eventos y talleres" },
    paid: { en: "Paid acquisition", es: "Adquisicion paga" },
    content: { en: "Content and SEO", es: "Contenido y SEO" },
    owned: { en: "Owned list and follow-up", es: "Lista propia y seguimiento" }
  };
  return intentLabels[intent]?.[language] ?? channel;
}

function verticalAudienceDescriptor(type: BusinessType, language: OutputLanguage): string {
  const descriptors: Record<BusinessType, { en: string; es: string }> = {
    academy: { en: "qualified program candidates", es: "candidatos calificados al programa" },
    commerce: { en: "high-intent buyers", es: "compradores de alta intencion" },
    general: { en: "your priority segment", es: "tu segmento prioritario" },
    marketplace: { en: "qualified participants", es: "participantes calificados" },
    services: { en: "qualified prospective clients", es: "clientes potenciales calificados" },
    subscription: { en: "qualified prospects", es: "prospectos calificados" }
  };
  return descriptors[type][language];
}

function verticalOfferLabel(type: BusinessType, language: OutputLanguage): string {
  const offerLabels: Record<BusinessType, { en: string; es: string }> = {
    academy: { en: "this program", es: "este programa" },
    commerce: { en: "this product", es: "este producto" },
    general: { en: "this offer", es: "esta oferta" },
    marketplace: { en: "this platform", es: "esta plataforma" },
    services: { en: "this service", es: "este servicio" },
    subscription: { en: "this product", es: "este producto" }
  };
  return offerLabels[type][language];
}

function buildChannelOperatingPlan({
  channel,
  constraint,
  language,
  opportunity,
  risk,
  type
}: {
  channel: string;
  constraint: string;
  language: OutputLanguage;
  opportunity: string;
  risk: string;
  type: BusinessType;
}): ChannelOperatingPlan {
  const intent = channelIntent(channel);
  const kpi = verticalKpi(type, language);
  const normalizedChannel = normalizeChannelLabel(channel, language);

  if (language === "es") {
    const common = {
      channel: normalizedChannel,
      primaryKpi: kpi,
      cadence: "Revision semanal con decision mantener, ajustar, pausar o escalar."
    };
    const plans: Record<string, Omit<ChannelOperatingPlan, "channel" | "primaryKpi" | "cadence">> = {
      content: {
        purpose: "Convertir expertise en demanda medible antes de aumentar volumen.",
        validationGoal: `Probar si el contenido atrae leads que encajan con el segmento y reduce: ${constraint}.`,
        decisionRule: `Escalar si dos semanas seguidas producen ${kpi} con calidad aceptable; pausar si solo genera engagement sin pipeline.`
      },
      direct: {
        purpose: "Crear conversaciones calificadas con un segmento definido.",
        validationGoal: `Validar mensaje, objeciones y fit comercial en respuestas directas.`,
        decisionRule: `Escalar si la tasa de respuesta calificada mejora; pausar si la objecion dominante confirma ${risk}.`
      },
      event: {
        purpose: "Concentrar atencion y capturar intencion en un punto de decision.",
        validationGoal: `Medir asistencia, preguntas calificadas y conversion a siguiente paso.`,
        decisionRule: `Repetir si genera ${kpi}; redisenar si la audiencia consume pero no avanza a decision.`
      },
      general: {
        purpose: "Usar el canal como experimento controlado, no como actividad permanente.",
        validationGoal: `Confirmar si este canal puede producir ${kpi} y avanzar ${opportunity} con evidencia semanal.`,
        decisionRule: "Mantener solo si tiene owner, metrica y conversion revisable al cierre de la semana."
      },
      owned: {
        purpose: "Mover leads existentes hacia una decision con seguimiento consistente.",
        validationGoal: `Validar si la base actual responde a oferta, prueba o llamada de diagnostico.`,
        decisionRule: "Escalar si aumenta conversion calificada; pausar si no mejora el siguiente paso despues de dos ciclos."
      },
      paid: {
        purpose: "Comprar aprendizaje de demanda sin confundir volumen con calidad.",
        validationGoal: `Probar si la segmentacion y promesa generan ${kpi}, no solo clicks.`,
        decisionRule: "Escalar solo si costo, calidad y conversion superan el umbral definido antes del test."
      },
      referral: {
        purpose: "Activar confianza existente para mejorar calidad de lead.",
        validationGoal: `Medir si partners o referidos entregan leads mas cercanos al segmento prioritario.`,
        decisionRule: "Escalar si los referidos avanzan mas rapido que leads frios; pausar partners sin fit o seguimiento."
      }
    };

    return { ...common, ...plans[intent] };
  }

  const common = {
    channel: normalizedChannel,
    primaryKpi: kpi,
    cadence: "Weekly review with a keep, adjust, pause, or scale decision."
  };
  const plans: Record<string, Omit<ChannelOperatingPlan, "channel" | "primaryKpi" | "cadence">> = {
    content: {
      purpose: "Turn expertise into measurable demand before increasing volume.",
      validationGoal: `Test whether content attracts leads that match the segment and reduces: ${constraint}.`,
      decisionRule: `Scale if two consecutive weeks produce ${kpi} with acceptable quality; pause if it only creates engagement without pipeline.`
    },
    direct: {
      purpose: "Create qualified conversations with a defined segment.",
      validationGoal: "Validate message, objections, and commercial fit through direct replies.",
      decisionRule: `Scale if qualified reply rate improves; pause if the dominant objection confirms ${risk}.`
    },
    event: {
      purpose: "Concentrate attention and capture intent at a decision point.",
      validationGoal: "Measure attendance, qualified questions, and conversion to the next step.",
      decisionRule: `Repeat if it generates ${kpi}; redesign if the audience consumes but does not advance.`
    },
    general: {
      purpose: "Use the channel as a controlled experiment, not a permanent activity.",
      validationGoal: `Confirm whether this channel can produce ${kpi} and advance ${opportunity} with weekly evidence.`,
      decisionRule: "Keep only if it has an owner, metric, and reviewable conversion by week end."
    },
    owned: {
      purpose: "Move existing leads toward a decision with consistent follow-up.",
      validationGoal: "Validate whether the current audience responds to an offer, proof point, or diagnostic call.",
      decisionRule: "Scale if qualified conversion improves; pause if the next step does not improve after two cycles."
    },
    paid: {
      purpose: "Buy demand learning without confusing volume for quality.",
      validationGoal: `Test whether targeting and promise generate ${kpi}, not just clicks.`,
      decisionRule: "Scale only if cost, quality, and conversion clear the threshold defined before the test."
    },
    referral: {
      purpose: "Activate existing trust to improve lead quality.",
      validationGoal: "Measure whether partners or referrals produce leads closer to the priority segment.",
      decisionRule: "Scale if referrals advance faster than cold leads; pause partners without fit or follow-up."
    }
  };

  return { ...common, ...plans[intent] };
}

function buildChecklistSteps({
  actionPlan,
  language,
  thirtyDayPlan
}: {
  actionPlan: ActionPlanRecord;
  language: OutputLanguage;
  thirtyDayPlan: ThirtyDayPlanRecord;
}): ChecklistStep[] {
  const actions = actionPlan.actions.slice(0, 4);

  return actions.map((action, index) => {
    const week = [thirtyDayPlan.week1, thirtyDayPlan.week2, thirtyDayPlan.week3, thirtyDayPlan.week4][index];
    const metric = thirtyDayPlan.metricsToWatch[index] ?? thirtyDayPlan.metricsToWatch[0];
    const safeTitle = cleanAssetSignal(
      action.title,
      language === "es" ? "Ejecutar accion operativa prioritaria" : "Execute priority operating action"
    );
    const safeDescription = cleanAssetSignal(
      action.description,
      language === "es"
        ? `Completar el trabajo necesario para avanzar "${safeTitle}" y registrar la decision operativa.`
        : `Complete the work needed to advance "${safeTitle}" and record the operating decision.`
    );

    if (language === "es") {
      return {
        title: safeTitle,
        owner: action.ownerSuggestion,
        work: safeDescription,
        evidence: week
          ? `${cleanAssetSignal(week.title, "Revision semanal")}: ${cleanAssetSignal(
              week.successSignal,
              "Decision semanal documentada"
            )}`
          : `Evidencia requerida: decision documentada y avance contra ${metric ?? "la metrica principal"}.`,
        done: `Completado significa que existe owner, evidencia visible y decision registrada sobre ${localizedCategoryLabel(action.linkedCategory, language)}.`
      };
    }

    return {
      title: safeTitle,
      owner: action.ownerSuggestion,
      work: safeDescription,
      evidence: week
        ? `${cleanAssetSignal(week.title, "Weekly review")}: ${cleanAssetSignal(
            week.successSignal,
            "Documented weekly decision"
          )}`
        : `Required evidence: documented decision and movement against ${metric ?? "the primary metric"}.`,
      done: `Done means there is an owner, visible evidence, and a recorded decision for ${localizedCategoryLabel(action.linkedCategory, language)}.`
    };
  });
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
  const trustState = resolveDownstreamTrustState({ diagnostic, language, profile });

  if (trustState?.mode === "validation_first") {
    return buildValidationFirstAssets(input, trustState);
  }

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
  const bottleneckFallback =
    profile.biggestBottlenecks[0] ??
    (language === "es" ? "restriccion operativa prioritaria" : "priority operating constraint");
  const riskFallback =
    diagnostic.topRisks[0]?.detail ??
    (language === "es" ? "riesgo operativo sin resolver" : "unresolved operating risk");
  const opportunityFallback =
    profile.primaryGoals[0] ??
    (language === "es" ? "oportunidad de mejora operativa" : "operating improvement opportunity");
  const mainBottleneck = cleanAssetSignal(
    primaryBottleneck(diagnostic, language),
    bottleneckFallback
  );
  const mainRisk = cleanAssetSignal(primaryRisk(diagnostic, language), riskFallback);
  const mainOpportunity = cleanAssetSignal(
    primaryOpportunity(diagnostic, language),
    opportunityFallback
  );
  const nowRoadmapTitles = nowRoadmapItems.map((item) =>
    cleanAssetSignal(item.title, mainOpportunity)
  );
  const topActionTitles = topActions.map((action) =>
    cleanAssetSignal(
      action.title,
      language === "es" ? "Accion operativa prioritaria" : "Priority operating action"
    )
  );
  const cleanDiagnosticSummary = cleanAssetSignal(diagnostic.summary, mainBottleneck);
  const monthObjective = cleanAssetSignal(
    thirtyDayPlan.monthObjective,
    language === "es"
      ? "Cerrar el gap operativo principal del diagnostico."
      : "Close the primary operating gap from the diagnostic."
  );
  const topPriorities = cleanList(
    thirtyDayPlan.topPriorities.map((priority, index) =>
      cleanAssetSignal(
        priority,
        topActionTitles[index] ??
          (language === "es" ? "Prioridad operativa" : "Operating priority")
      )
    ),
    3
  );
  const metricsToWatch = cleanList(
    thirtyDayPlan.metricsToWatch.map((metric) =>
      cleanAssetSignal(
        metric,
        language === "es" ? "metrica operativa principal" : "primary operating metric"
      )
    ),
    6
  );
  const quickWins = cleanList(
    thirtyDayPlan.quickWins.map((quickWin) =>
      cleanAssetSignal(
        quickWin,
        language === "es" ? "quick win operativo" : "operating quick win"
      )
    ),
    6
  );
  const successSignals = cleanList(
    thirtyDayPlan.successSignals.map((signal) =>
      cleanAssetSignal(
        signal,
        language === "es" ? "senal de exito operativa" : "operating success signal"
      )
    ),
    6
  );
  const topRisks = cleanList(
    diagnostic.topRisks.map((risk, index) =>
      cleanAssetSignal(
        risk.title,
        profile.biggestBottlenecks[index] ?? riskFallback
      )
    ),
    3
  );
  const topBottlenecks = cleanList(
    diagnostic.topBottlenecks.map((item, index) =>
      cleanAssetSignal(
        item.title,
        profile.biggestBottlenecks[index] ?? bottleneckFallback
      )
    ),
    3
  );
  const channelPlans = channels.map((channel) =>
    buildChannelOperatingPlan({
      channel,
      constraint: mainBottleneck,
      language,
      opportunity: mainOpportunity,
      risk: mainRisk,
      type
    })
  );
  const checklistSteps = buildChecklistSteps({ actionPlan, language, thirtyDayPlan });
  const labels = (assetType: BusinessAssetType) => assetLabel(assetType, language);
  const sl = (en: string, es: string) => language === "es" ? es : en;
  // Language-normalized substitutes for raw profile strings in narrative copy
  const narrativeAudience = verticalAudienceDescriptor(type, language);
  const narrativeOffer = verticalOfferLabel(type, language);
  const ns = sl("not specified", "no especificado");

  const positioning = createAsset({
    input,
    type: "positioning_summary",
    ...labels("positioning_summary"),
    sourceFocus: {
      profile: [
        `${sl("Audience", "Audiencia")}: ${audience}`,
        `${sl("Offer", "Oferta")}: ${offer}`,
        `${sl("Business model", "Modelo de negocio")}: ${fallback(profile.businessModel, ns)}`
      ],
      diagnostic: [
        `${sl("Primary bottleneck", "Cuello de botella principal")}: ${mainBottleneck}`,
        `${sl("Supporting bottlenecks", "Cuellos de botella adicionales")}: ${joinSignals(topBottlenecks, ns)}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `${sl("Positioning-relevant move", "Movimiento de posicionamiento")}: ${title}`),
      thirtyDayPlan: [`${sl("Priority decision", "Decision prioritaria")}: ${topPriorities[0] ?? monthObjective}`]
    },
    content:
      language === "es"
        ? [
            section("ICP y contexto", [
              `Comprador o usuario prioritario: ${audience}.`,
              `Categoria de negocio: ${vertical}; geografia/contexto: ${fallback(profile.geography, "no especificado")}.`
            ]),
            section("Problema del comprador", [
              verticalBuyerPain(type, narrativeAudience, language),
              `Contexto: ${vertical} para ${fallback(profile.geography, fallback(profile.industry, "mercado objetivo"))}.`
            ]),
            section("Promesa posicionable", [
              verticalValueProp(type, narrativeOffer, narrativeAudience, language)
            ]),
            section("Hipotesis de posicionamiento", [
              verticalPositioningHypothesis(type, company, narrativeOffer, narrativeAudience, language),
              type === "academy"
                ? `Calificador academico: segmentar leads por intencion de programa antes de tratar todo interes de enrolamiento como igual. Los enrolamientos dependientes de descuento deben rastrearse por separado.`
                : `Prueba de validacion: correr el canal principal un ciclo completo y medir ${verticalKpi(type, language)} contra el baseline de la semana 1.`,
              `Disparador de decision: si el primer ciclo confirma la hipotesis, afinar mensaje y extender a segundo canal. Si no, cambiar segmento u oferta antes de aumentar actividad.`
            ])
          ]
        : [
            section("ICP and context", [
              `Priority buyer or user: ${audience}.`,
              `Business category: ${vertical}; geography/context: ${fallback(profile.geography, "not specified")}.`
            ]),
            section("Buyer problem to address", [
              verticalBuyerPain(type, narrativeAudience, language),
              `Context: ${vertical} for ${fallback(profile.geography, fallback(profile.industry, "target market"))}.`
            ]),
            section("Positionable promise", [
              verticalValueProp(type, narrativeOffer, narrativeAudience, language)
            ]),
            section("Positioning hypothesis", [
              verticalPositioningHypothesis(type, company, narrativeOffer, narrativeAudience, language),
              type === "academy"
                ? `Academy qualifier: segment leads by program intent before treating all enrollment interest as equal. Discount-driven enrollments must be tracked separately.`
                : `Validation test: run the primary channel for one full review cycle and measure ${verticalKpi(type, language)} against the baseline set in week 1.`,
              `Decision trigger: if the first cycle confirms the hypothesis, sharpen message and extend to a second channel. If not, change the segment or offer before increasing activity.`
            ])
          ]
  });

  const actionSummary = createAsset({
    input,
    type: "thirty_day_action_plan_summary",
    ...labels("thirty_day_action_plan_summary"),
    sourceFocus: {
      actionPlan: topActions.map(
        (action, index) => `${localizePriority(action.priority, language)}: ${topActionTitles[index]}`
      ),
      thirtyDayPlan: [
        `${sl("Month objective", "Objetivo del mes")}: ${monthObjective}`,
        `${sl("Top priorities", "Prioridades principales")}: ${joinSignals(topPriorities, ns)}`,
        `${sl("Metrics", "Metricas")}: ${joinSignals(metricsToWatch, ns)}`
      ],
      diagnostic: [`${sl("Risk constraints", "Restricciones de riesgo")}: ${joinSignals(topRisks, ns)}`]
    },
    content:
      language === "es"
        ? [
            section("Objetivo del mes", [monthObjective]),
            section("Top 3 prioridades", topPriorities),
            section("Secuencia semanal", [
              `${cleanAssetSignal(thirtyDayPlan.week1.title, "Semana 1")}: ${cleanAssetSignal(thirtyDayPlan.week1.objective, "Definir foco y baseline")}`,
              `${cleanAssetSignal(thirtyDayPlan.week2.title, "Semana 2")}: ${cleanAssetSignal(thirtyDayPlan.week2.objective, "Ejecutar test controlado")}`,
              `${cleanAssetSignal(thirtyDayPlan.week3.title, "Semana 3")}: ${cleanAssetSignal(thirtyDayPlan.week3.objective, "Revisar aprendizaje y ajustar")}`,
              `${cleanAssetSignal(thirtyDayPlan.week4.title, "Semana 4")}: ${cleanAssetSignal(thirtyDayPlan.week4.objective, "Tomar decision de continuidad")}`
            ]),
            section("Metricas a revisar", metricsToWatch)
          ]
        : [
            section("Month objective", [monthObjective]),
            section("Top 3 priorities", topPriorities),
            section("Weekly sequence", [
              `${cleanAssetSignal(thirtyDayPlan.week1.title, "Week 1")}: ${cleanAssetSignal(thirtyDayPlan.week1.objective, "Define focus and baseline")}`,
              `${cleanAssetSignal(thirtyDayPlan.week2.title, "Week 2")}: ${cleanAssetSignal(thirtyDayPlan.week2.objective, "Run controlled test")}`,
              `${cleanAssetSignal(thirtyDayPlan.week3.title, "Week 3")}: ${cleanAssetSignal(thirtyDayPlan.week3.objective, "Review learning and adjust")}`,
              `${cleanAssetSignal(thirtyDayPlan.week4.title, "Week 4")}: ${cleanAssetSignal(thirtyDayPlan.week4.objective, "Make continuity decision")}`
            ]),
            section("Metrics to review", metricsToWatch)
          ]
  });

  const messagingPillars = verticalMessagePillars(type, narrativeAudience, language);

  const messaging = createAsset({
    input,
    type: "messaging_framework",
    ...labels("messaging_framework"),
    sourceFocus: {
      profile: [
        `${sl("Audience", "Audiencia")}: ${audience}`,
        `${sl("Offer", "Oferta")}: ${offer}`
      ],
      diagnostic: [
        `${sl("Opportunity", "Oportunidad")}: ${mainOpportunity}`,
        `${sl("Risks/objections", "Riesgos/objeciones")}: ${joinSignals(topRisks, ns)}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `${sl("Value pillar source", "Fuente de pilar de valor")}: ${title}`)
    },
    content:
      language === "es"
        ? [
            section("Narrativa de una linea", [
              verticalOneLineNarrative(type, company, narrativeOffer, narrativeAudience, language)
            ]),
            section("Pilares de mensaje", messagingPillars),
            section("Objeciones y prueba requerida", [
              ...topRisks.map((risk) => `Objecion/riesgo: ${risk}; prueba requerida antes de escalar este mensaje.`),
              `Evidencia comercial a recolectar: preguntas repetidas en ventas, motivos de no-decision y patron de calidad de lead.`
            ]),
            section("CTA de validacion", [
              `CTA primario: invitar a ${narrativeAudience} a una revision de fit o diagnostico. Siguiente paso definido: acordar un objetivo medible antes de la llamada.`,
              `Prueba a recolectar en las proximas 5 conversaciones: objeciones frecuentes, razon de no-decision y si el segmento reconoce el dolor nombrado.`
            ])
          ]
        : [
            section("One-line narrative", [
              verticalOneLineNarrative(type, company, narrativeOffer, narrativeAudience, language)
            ]),
            section("Message pillars", messagingPillars),
            section("Objections and proof required", [
              ...topRisks.map((risk) => `Objection/risk: ${risk}; proof required before scaling this message.`),
              `Commercial evidence to collect: repeated sales questions, reasons for no-decision, and lead quality patterns.`
            ]),
            section("Validation CTA", [
              `Primary CTA: invite ${narrativeAudience} to a fit review or diagnostic call. Defined next step: agree on one measurable objective before the call.`,
              `Proof to collect in the next 5 conversations: frequent objections, reasons for no-decision, and whether the segment recognizes the named pain.`
            ])
          ]
  });

  const channelPlan = createAsset({
    input,
    type: "basic_channel_plan",
    ...labels("basic_channel_plan"),
    sourceFocus: {
      profile: [`${sl("Current channels", "Canales actuales")}: ${joinSignals(channels, ns)}`],
      diagnostic: [
        `${sl("Channel constraint", "Restriccion de canal")}: ${mainBottleneck}`,
        `${sl("Channel risk", "Riesgo de canal")}: ${mainRisk}`
      ],
      thirtyDayPlan: [
        `${sl("Metrics to watch", "Metricas a revisar")}: ${joinSignals(metricsToWatch, ns)}`,
        `${sl("Review signal", "Senal de revision")}: ${cleanAssetSignal(thirtyDayPlan.week4.successSignal, sl("weekly review signal", "senal de revision semanal"))}`
      ]
    },
    content:
      language === "es"
        ? [
            ...channelPlans.map((plan) =>
              section(plan.channel, [
                `Proposito: ${plan.purpose}`,
                `Meta de validacion: ${plan.validationGoal}`,
                `KPI primario: ${plan.primaryKpi}`,
                `Cadencia: ${plan.cadence}`,
                `Regla stop/scale: ${plan.decisionRule}`
              ])
            ),
            section("Control operativo", [
              "Asignar un owner por canal antes de iniciar el test.",
              "Revisar calidad, no solo volumen.",
              `Riesgo a evitar: ${mainRisk}`
            ])
          ]
        : [
            ...channelPlans.map((plan) =>
              section(plan.channel, [
                `Purpose: ${plan.purpose}`,
                `Validation goal: ${plan.validationGoal}`,
                `Primary KPI: ${plan.primaryKpi}`,
                `Cadence: ${plan.cadence}`,
                `Stop/scale rule: ${plan.decisionRule}`
              ])
            ),
            section("Operating control", [
              "Assign one owner per channel before the test starts.",
              "Review quality, not just volume.",
              `Risk to avoid: ${mainRisk}`
            ])
          ]
  });

  const executionChecklist = createAsset({
    input,
    type: "execution_checklist",
    ...labels("execution_checklist"),
    sourceFocus: {
      actionPlan: checklistSteps.map((step) => `${sl("Checklist step", "Paso del checklist")}: ${step.title}`),
      thirtyDayPlan: [
        `${sl("Week 1", "Semana 1")}: ${cleanAssetSignal(thirtyDayPlan.week1.objective, sl("Define focus and baseline", "Definir foco y baseline"))}`,
        `${sl("Week 2", "Semana 2")}: ${cleanAssetSignal(thirtyDayPlan.week2.objective, sl("Run controlled test", "Ejecutar prueba controlada"))}`,
        `${sl("Week 3", "Semana 3")}: ${cleanAssetSignal(thirtyDayPlan.week3.objective, sl("Review learning and adjust", "Revisar aprendizaje y ajustar"))}`,
        `${sl("Week 4", "Semana 4")}: ${cleanAssetSignal(thirtyDayPlan.week4.objective, sl("Make continuity decision", "Tomar decision de continuidad"))}`
      ],
      diagnostic: [`${sl("Completion should reduce", "Completarlo debe reducir")}: ${mainBottleneck}`]
    },
    content:
      language === "es"
        ? [
            ...checklistSteps.map((step) =>
              section(step.title, [
                `Owner probable: ${step.owner}`,
                `Trabajo: ${step.work}`,
                `Evidencia de avance: ${step.evidence}`,
                `Done: ${step.done}`
              ])
            ),
            section("Revision semanal", [
              `Quick wins a comprobar: ${joinSignals(quickWins, "no definidos")}.`,
              `Senales de exito: ${joinSignals(successSignals, "no definidas")}.`,
              "Cerrar cada semana con decision registrada: continuar, ajustar, pausar o escalar."
            ])
          ]
        : [
            ...checklistSteps.map((step) =>
              section(step.title, [
                `Likely owner: ${step.owner}`,
                `Work: ${step.work}`,
                `Completion evidence: ${step.evidence}`,
                `Done: ${step.done}`
              ])
            ),
            section("Weekly review", [
              `Quick wins to verify: ${joinSignals(quickWins, "not defined")}.`,
              `Success signals: ${joinSignals(successSignals, "not defined")}.`,
              "Close every week with a recorded decision: continue, adjust, pause, or scale."
            ])
          ]
  });

  const founderStopList = type === "academy"
    ? (language === "es"
        ? [
            `No escalar el canal de mayor volumen hasta tener datos de calidad de lead por programa.`,
            `No ofrecer descuentos sin medir el impacto en calidad de enrolamiento y tasa de finalizacion.`,
            `No lanzar nuevo programa o cohorte hasta que el embudo actual sea predecible.`
          ]
        : [
            `Do not scale the highest-volume channel until lead quality by program is measured.`,
            `Do not offer discounts without tracking impact on enrollment quality and completion rate.`,
            `Do not launch a new program or cohort until the current enrollment funnel is predictable.`
          ])
    : type === "subscription"
      ? (language === "es"
          ? [
              `No invertir mas en adquisicion hasta que la tasa de activacion muestre mejora medible.`,
              `No expandir ICP hasta que el ICP actual tenga un camino de conversion definido.`,
              `No agregar features hasta que el cuello de botella de activacion este resuelto.`
            ]
          : [
              `Do not increase acquisition spend until the activation rate shows measurable improvement.`,
              `Do not expand the ICP until the current ICP has a defined conversion path.`,
              `Do not add features until the activation bottleneck is resolved.`
            ])
      : type === "services"
        ? (language === "es"
            ? [
                `No aceptar proyectos fuera de la oferta principal mientras la carga de entrega no sea predecible.`,
                `No escalar ventas sin tener criterios de descalificacion documentados.`,
                `No trabajar sin margen visible en cada proyecto.`
              ]
            : [
                `Do not take on projects outside the primary service offer while delivery load is unpredictable.`,
                `Do not scale sales without documented disqualification criteria.`,
                `Do not work without visible margin per project.`
              ])
        : (language === "es"
            ? [
                `No expandir canales sin tener un canal primario con conversion medible.`,
                `No agregar complejidad operativa antes de que la cadencia de revision sea estable.`,
                `No comprometer recursos en escala antes de tener evidencia de producto-mercado.`
              ]
            : [
                `Do not expand channels without a primary channel with measurable conversion.`,
                `Do not add operational complexity before the review cadence is stable.`,
                `Do not commit resources to scale before product-market evidence exists.`
              ]);

  const founderSummary = createAsset({
    input,
    type: "founder_summary",
    ...labels("founder_summary"),
    sourceFocus: {
      workspace: [
        `Workspace: ${workspace.name}`,
        `${sl("Plan state", "Estado del plan")}: ${workspace.plan}/${workspace.accountState}`
      ],
      diagnostic: [
        `${sl("Score", "Puntuacion")}: ${diagnostic.overallMaturityScore}/100`,
        `${sl("Confidence", "Confianza")}: ${localizeConfidence(diagnostic.confidence, language)}`,
        `${sl("Primary risk", "Riesgo principal")}: ${mainRisk}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `${sl("Immediate strategic move", "Movimiento estrategico inmediato")}: ${title}`),
      thirtyDayPlan: [
        `${sl("Month objective", "Objetivo del mes")}: ${monthObjective}`,
        `${sl("Decision metrics", "Metricas de decision")}: ${joinSignals(metricsToWatch, ns)}`
      ]
    },
    content:
      language === "es"
        ? [
            section("Prioridad del mes", [
              `Una cosa: ${topPriorities[0] ?? monthObjective}.`,
              `Por que: ${cleanDiagnosticSummary}`
            ]),
            section("Lo que dicen los datos", [
              `${company}: ${diagnostic.overallMaturityScore}/100, confianza ${localizeConfidence(diagnostic.confidence, language)}.`,
              `Restriccion principal: ${mainBottleneck}.`,
              `Riesgo principal si no se actua: ${mainRisk}.`
            ]),
            section("Decisiones requeridas esta semana", [
              `Decision 1: confirmar si ${audience} es el segmento del proximo ciclo. Si no, nombrar el cambio antes del lunes.`,
              `Decision 2: asignar owner y umbral de exito para "${topPriorities[0] ?? monthObjective}" antes de iniciar cualquier trabajo.`,
              `Decision 3: elegir que canal no se escala hasta tener evidencia de calidad.`
            ]),
            section("Lista de pausa", founderStopList),
            section("Criterios de la proxima revision", [
              `Revisar contra: ${joinSignals(metricsToWatch, "metricas aun no definidas")}.`,
              `La revision es exitosa cuando hay un dato concreto sobre ${topPriorities[0] ?? "la prioridad principal"}, no solo actividad documentada.`
            ])
          ]
        : [
            section("Priority this month", [
              `One thing: ${topPriorities[0] ?? monthObjective}.`,
              `Why: ${cleanDiagnosticSummary}`
            ]),
            section("What the data says", [
              `${company}: ${diagnostic.overallMaturityScore}/100, ${diagnostic.confidence} confidence.`,
              `Primary constraint: ${mainBottleneck}.`,
              `Primary risk if unaddressed: ${mainRisk}.`
            ]),
            section("Decisions required this week", [
              `Decision 1: confirm whether ${audience} is the right segment for this cycle. If not, name the change before Monday.`,
              `Decision 2: assign an owner and success threshold for "${topPriorities[0] ?? monthObjective}" before any work begins.`,
              `Decision 3: choose which channel does not scale until quality evidence exists.`
            ]),
            section("Stop list", founderStopList),
            section("Next review criteria", [
              `Review against: ${joinSignals(metricsToWatch, "metrics not yet defined")}.`,
              `The review succeeds when there is a concrete data point about ${topPriorities[0] ?? "the primary priority"}, not just documented activity.`
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
