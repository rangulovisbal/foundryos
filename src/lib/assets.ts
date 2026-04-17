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
  const plan = getPlanDefinition(workspace.plan);
  const defaultProfileSignals = [
    `Company: ${fallback(profile.companyName, workspace.name)}`,
    `Audience: ${fallback(profile.targetAudience, "not specified")}`,
    `Offer: ${fallback(profile.primaryOffer, "not specified")}`,
    `Channels: ${joinSignals(profile.currentChannels, "not specified")}`
  ];
  const defaultDiagnosticSignals = [
    `Score: ${diagnostic.overallMaturityScore}/100`,
    `Confidence: ${diagnostic.confidence}`,
    `Bottleneck: ${cleanAssetSignal(
      diagnostic.topBottlenecks[0]?.title,
      "not specified"
    )}`,
    `Risk: ${cleanAssetSignal(diagnostic.topRisks[0]?.title, "not specified")}`
  ];
  const defaultRoadmapSignals = roadmap.items
    .filter((item) => item.phase === "now")
    .slice(0, 3)
    .map((item) => `${item.phase}: ${cleanAssetSignal(item.title, "operating move")}`);
  const defaultActionSignals = actionPlan.actions
    .slice(0, 4)
    .map((action) => `${action.priority}: ${cleanAssetSignal(action.title, "operating action")}`);
  const defaultPlanSignals = [
    `Objective: ${cleanAssetSignal(
      thirtyDayPlan.monthObjective,
      "operating objective"
    )}`,
    `Metrics: ${joinSignals(
      thirtyDayPlan.metricsToWatch.map((metric) =>
        cleanAssetSignal(metric, "operating metric")
      ),
      "not specified"
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
          `Plan: ${plan.label}`,
          `State: ${workspace.accountState}`,
          `Language: ${workspace.outputLanguage}`
        ],
        `${workspace.name} / ${plan.label} / ${workspace.accountState}`
      )
    },
    {
      sourceType: "business_profile",
      label: "Business profile",
      referenceId: profile.id,
      detail: joinSignals(focus.profile ?? defaultProfileSignals, fallback(profile.companyName, workspace.name))
    },
    {
      sourceType: "diagnostic",
      label: "Diagnostic result",
      referenceId: diagnostic.id,
      detail: joinSignals(
        focus.diagnostic ?? defaultDiagnosticSignals,
        `${diagnostic.overallMaturityScore}/100, confidence ${diagnostic.confidence}`
      )
    },
    {
      sourceType: "roadmap",
      label: "Roadmap",
      referenceId: roadmap.id,
      detail: joinSignals(
        focus.roadmap ?? defaultRoadmapSignals,
        `${roadmap.items.length} staged recommendations`
      )
    },
    {
      sourceType: "action_plan",
      label: "Action plan",
      referenceId: actionPlan.id,
      detail: joinSignals(
        focus.actionPlan ?? defaultActionSignals,
        `${actionPlan.actions.length} action cards`
      )
    },
    {
      sourceType: "thirty_day_plan",
      label: "30-day plan",
      referenceId: thirtyDayPlan.id,
      detail: joinSignals(
        focus.thirtyDayPlan ?? defaultPlanSignals,
        cleanAssetSignal(thirtyDayPlan.monthObjective, "operating objective")
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

function channelIntent(channel: string) {
  const normalized = channel.toLowerCase();

  if (/(referral|referido|partner|affiliate)/.test(normalized)) {
    return "referral";
  }

  if (/(linkedin|outbound|cold|dm|email)/.test(normalized)) {
    return "direct";
  }

  if (/(webinar|event|workshop|cohort|community)/.test(normalized)) {
    return "event";
  }

  if (/(paid|search|ads|google|meta|tiktok)/.test(normalized)) {
    return "paid";
  }

  if (/(content|seo|blog|youtube|podcast|social)/.test(normalized)) {
    return "content";
  }

  if (/(waitlist|newsletter|sms|lifecycle|crm)/.test(normalized)) {
    return "owned";
  }

  return "general";
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

  if (language === "es") {
    const common = {
      channel,
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
    channel,
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
        done: `Done significa que existe owner, evidencia visible y decision registrada sobre ${action.linkedCategory}.`
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
      done: `Done means there is an owner, visible evidence, and a recorded decision for ${action.linkedCategory}.`
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

  const positioning = createAsset({
    input,
    type: "positioning_summary",
    ...labels("positioning_summary"),
    sourceFocus: {
      profile: [
        `Audience: ${audience}`,
        `Offer: ${offer}`,
        `Business model: ${fallback(profile.businessModel, "not specified")}`
      ],
      diagnostic: [
        `Primary bottleneck: ${mainBottleneck}`,
        `Supporting bottlenecks: ${joinSignals(topBottlenecks, "not specified")}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `Positioning-relevant move: ${title}`),
      thirtyDayPlan: [`Priority decision: ${topPriorities[0] ?? monthObjective}`]
    },
    content:
      language === "es"
        ? [
            section("ICP y contexto", [
              `Comprador o usuario prioritario: ${audience}.`,
              `Categoria de negocio: ${vertical}; geografia/contexto: ${fallback(profile.geography, "no especificado")}.`
            ]),
            section("Dolor que debe nombrarse", [
              `Problema dominante del diagnostico: ${mainBottleneck}.`,
              `Detalle de evidencia: ${cleanAssetSignal(
                diagnostic.topBottlenecks[0]?.detail,
                cleanDiagnosticSummary
              )}`
            ]),
            section("Promesa posicionable", [
              `Oferta a empaquetar: ${offer}.`,
              `La promesa debe conectar audiencia, dolor y resultado verificable sin prometer crecimiento garantizado.`
            ]),
            section("Hipotesis de posicionamiento", [
              `${company} sirve a ${audience} con ${offer} para resolver ${profile.biggestBottlenecks[0] ?? mainBottleneck}. Esta hipotesis se sostiene si el proximo ciclo de canal produce conversaciones calificadas.`,
              type === "academy"
                ? `Calificador academico: segmentar leads por intencion de programa antes de tratar todo interes de enrolamiento como igual. Los enrolamientos dependientes de descuento deben rastrearse por separado.`
                : `Prueba de validacion: correr el canal principal un ciclo completo y medir ${verticalKpi(type, language)} contra el baseline de la semana 1.`,
              `Disparador de decision: si el primer ciclo produce conversaciones calificadas, afinar mensaje y extender a segundo canal. Si no, cambiar segmento u oferta antes de aumentar actividad.`
            ])
          ]
        : [
            section("ICP and context", [
              `Priority buyer or user: ${audience}.`,
              `Business category: ${vertical}; geography/context: ${fallback(profile.geography, "not specified")}.`
            ]),
            section("Pain that must be named", [
              `Dominant diagnostic problem: ${mainBottleneck}.`,
              `Evidence detail: ${cleanAssetSignal(
                diagnostic.topBottlenecks[0]?.detail,
                cleanDiagnosticSummary
              )}`
            ]),
            section("Positionable promise", [
              `Offer to package: ${offer}.`,
              `The promise should connect audience, pain, and verifiable outcome without promising guaranteed growth.`
            ]),
            section("Positioning hypothesis", [
              `${company} serves ${audience} with ${offer} to solve ${profile.biggestBottlenecks[0] ?? mainBottleneck}. This hypothesis holds if the next channel cycle produces qualified conversations.`,
              type === "academy"
                ? `Academy qualifier: segment leads by program intent before treating all enrollment interest as equal. Discount-driven enrollments must be tracked separately.`
                : `Validation test: run the primary channel for one full review cycle and measure ${verticalKpi(type, language)} against the baseline set in week 1.`,
              `Decision trigger: if the first cycle produces qualified conversations, sharpen message and extend to a second channel. If not, change the segment or offer before increasing activity.`
            ])
          ]
  });

  const actionSummary = createAsset({
    input,
    type: "thirty_day_action_plan_summary",
    ...labels("thirty_day_action_plan_summary"),
    sourceFocus: {
      actionPlan: topActions.map(
        (action, index) => `${action.priority}: ${topActionTitles[index]}`
      ),
      thirtyDayPlan: [
        `Month objective: ${monthObjective}`,
        `Top priorities: ${joinSignals(topPriorities, "not specified")}`,
        `Metrics: ${joinSignals(metricsToWatch, "not specified")}`
      ],
      diagnostic: [`Risk constraints: ${joinSignals(topRisks, "not specified")}`]
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

  const messagingPain = fallback(profile.biggestBottlenecks[0], mainBottleneck);
  const messagingPillars = type === "academy"
    ? (language === "es"
        ? [
            `Resultado del programa: que logra el estudiante que completa este programa en su trabajo o carrera.`,
            `Camino de enrolamiento: como se aplica, que se evalua y que tan rapido comienza el acceso.`,
            `Prueba de finalizacion: que porcentaje de estudiantes completa y que los mantiene en el programa.`
          ]
        : [
            `Program outcome: what the student who completes this program achieves in their work or career.`,
            `Enrollment path: how to apply, what gets evaluated, and how quickly access begins.`,
            `Completion proof: what percentage of students finish and what keeps them in the program.`
          ])
    : cleanList(nowRoadmapTitles, 3).map(
        (item) =>
          language === "es"
            ? `Pilar: ${item}; convertirlo en beneficio observable para ${audience}, no en claim de resultado interno.`
            : `Pillar: ${item}; translate this into observable value for ${audience}, not an internal outcome claim.`
      );

  const messaging = createAsset({
    input,
    type: "messaging_framework",
    ...labels("messaging_framework"),
    sourceFocus: {
      profile: [`Audience language: ${audience}`, `Offer language: ${offer}`],
      diagnostic: [
        `Opportunity: ${mainOpportunity}`,
        `Risks/objections: ${joinSignals(topRisks, "not specified")}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `Value pillar source: ${title}`)
    },
    content:
      language === "es"
        ? [
            section("Narrativa de una linea", [
              `${company} ayuda a ${audience} a resolver ${messagingPain} con ${offer}.`
            ]),
            section("Pilares de mensaje", messagingPillars),
            section("Objeciones y prueba requerida", [
              ...topRisks.map((risk) => `Objecion/riesgo: ${risk}; prueba requerida antes de escalar este mensaje.`),
              `Evidencia comercial a recolectar: preguntas repetidas en ventas, motivos de no-decision y patron de calidad de lead.`
            ]),
            section("CTA de validacion", [
              `CTA primario: invitar a ${audience} a una revision de fit o diagnostico. Siguiente paso definido: acordar un objetivo medible antes de la llamada.`,
              `Prueba a recolectar en las proximas 5 conversaciones: objeciones frecuentes, razon de no-decision y si el segmento reconoce el dolor nombrado.`
            ])
          ]
        : [
            section("One-line narrative", [
              `${company} helps ${audience} resolve ${messagingPain} with ${offer}.`
            ]),
            section("Message pillars", messagingPillars),
            section("Objections and proof required", [
              ...topRisks.map((risk) => `Objection/risk: ${risk}; proof required before scaling this message.`),
              `Commercial evidence to collect: repeated sales questions, reasons for no-decision, and lead quality patterns.`
            ]),
            section("Validation CTA", [
              `Primary CTA: invite ${audience} to a fit review or diagnostic call. Defined next step: agree on one measurable objective before the call.`,
              `Proof to collect in the next 5 conversations: frequent objections, reasons for no-decision, and whether the segment recognizes the named pain.`
            ])
          ]
  });

  const channelPlan = createAsset({
    input,
    type: "basic_channel_plan",
    ...labels("basic_channel_plan"),
    sourceFocus: {
      profile: [`Current channels: ${joinSignals(channels, "not specified")}`],
      diagnostic: [
        `Channel constraint: ${mainBottleneck}`,
        `Channel risk: ${mainRisk}`
      ],
      thirtyDayPlan: [
        `Metrics to watch: ${joinSignals(metricsToWatch, "not specified")}`,
        `Review signal: ${cleanAssetSignal(thirtyDayPlan.week4.successSignal, "weekly review signal")}`
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
      actionPlan: checklistSteps.map((step) => `Checklist step: ${step.title}`),
      thirtyDayPlan: [
        `Week 1: ${cleanAssetSignal(thirtyDayPlan.week1.objective, "Define focus and baseline")}`,
        `Week 2: ${cleanAssetSignal(thirtyDayPlan.week2.objective, "Run controlled test")}`,
        `Week 3: ${cleanAssetSignal(thirtyDayPlan.week3.objective, "Review learning and adjust")}`,
        `Week 4: ${cleanAssetSignal(thirtyDayPlan.week4.objective, "Make continuity decision")}`
      ],
      diagnostic: [`Completion should reduce: ${mainBottleneck}`]
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
      workspace: [`Workspace: ${workspace.name}`, `Plan state: ${workspace.plan}/${workspace.accountState}`],
      diagnostic: [
        `Score: ${diagnostic.overallMaturityScore}/100`,
        `Confidence: ${diagnostic.confidence}`,
        `Primary risk: ${mainRisk}`
      ],
      roadmap: nowRoadmapTitles.map((title) => `Immediate strategic move: ${title}`),
      thirtyDayPlan: [
        `Month objective: ${monthObjective}`,
        `Decision metrics: ${joinSignals(metricsToWatch, "not specified")}`
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
              `${company}: ${diagnostic.overallMaturityScore}/100, confianza ${diagnostic.confidence}.`,
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
