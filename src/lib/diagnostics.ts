import type {
  BusinessProfileRecord,
  DiagnosticCategoryScore,
  DiagnosticEvidenceCard,
  DiagnosticFinding,
  DiagnosticNextAction,
  DiagnosticOpportunity,
  DiagnosticResultRecord,
  OutputLanguage,
  WorkspaceRecord
} from "@/lib/foundation";

type BusinessType =
  | "academy"
  | "commerce"
  | "marketplace"
  | "services"
  | "subscription"
  | "general";

type IssueKey =
  | "unclear_positioning"
  | "no_niche_clarity"
  | "undefined_funnel"
  | "weak_reporting"
  | "poor_lead_quality"
  | "unclear_offer"
  | "no_operating_cadence"
  | "manual_operations"
  | "low_evidence"
  | "contradictory_scale";

type Issue = {
  key: IssueKey;
  severity: DiagnosticFinding["severity"];
  categories: Array<"acquisition" | "data" | "execution" | "operations" | "positioning">;
};

type SignalMap = {
  businessType: BusinessType;
  completeness: number;
  hasCadence: boolean;
  hasDataVisibility: boolean;
  hasDefinedFunnel: boolean;
  hasNicheClarity: boolean;
  hasOfferStructure: boolean;
  hasPositioningClarity: boolean;
  hasLeadQualityConcern: boolean;
  contradictions: string[];
  issues: Issue[];
};

const labels: Record<
  OutputLanguage,
  Record<"acquisition" | "data" | "execution" | "operations" | "positioning", string>
> = {
  en: {
    positioning: "Positioning",
    acquisition: "Acquisition",
    operations: "Operations",
    data: "Data visibility",
    execution: "Execution cadence"
  },
  es: {
    positioning: "Posicionamiento",
    acquisition: "Adquisicion",
    operations: "Operaciones",
    data: "Visibilidad de datos",
    execution: "Cadencia de ejecucion"
  }
};

const issueCopy: Record<
  IssueKey,
  Record<OutputLanguage, { title: string; detail: string; risk: string }>
> = {
  unclear_positioning: {
    en: {
      title: "Positioning is still too broad",
      detail:
        "The offer and audience do not yet create a sharp enough buying context.",
      risk:
        "Marketing and sales activity can create motion without improving conversion because the market promise is still broad."
    },
    es: {
      title: "El posicionamiento sigue siendo demasiado amplio",
      detail:
        "La oferta y la audiencia todavia no crean un contexto de compra suficientemente claro.",
      risk:
        "El marketing y las ventas pueden generar actividad sin mejorar conversion porque la promesa de mercado sigue siendo amplia."
    }
  },
  no_niche_clarity: {
    en: {
      title: "Niche clarity is missing",
      detail:
        "The target audience reads like a general market instead of a specific buyer segment.",
      risk:
        "Without niche clarity, messaging, channel selection, and roadmap priorities will keep pulling in different directions."
    },
    es: {
      title: "Falta claridad de nicho",
      detail:
        "La audiencia objetivo parece un mercado general en vez de un segmento de comprador especifico.",
      risk:
        "Sin claridad de nicho, el mensaje, los canales y las prioridades seguiran moviendose en direcciones distintas."
    }
  },
  undefined_funnel: {
    en: {
      title: "The funnel is not defined",
      detail:
        "Channels are either missing or not connected to a clear conversion path.",
      risk:
        "Acquisition spend or founder effort can increase without showing where prospects are lost."
    },
    es: {
      title: "El embudo no esta definido",
      detail:
        "Los canales faltan o no estan conectados a una ruta clara de conversion.",
      risk:
        "El gasto de adquisicion o el esfuerzo del fundador puede subir sin mostrar donde se pierden los prospectos."
    }
  },
  weak_reporting: {
    en: {
      title: "Reporting visibility is weak",
      detail:
        "The tool stack does not show enough CRM, analytics, dashboard, or reporting evidence.",
      risk:
        "The team may keep making decisions from anecdotes instead of seeing which activity changes pipeline quality."
    },
    es: {
      title: "La visibilidad de reporting es debil",
      detail:
        "El stack de herramientas no muestra suficiente evidencia de CRM, analitica, dashboard o reporting.",
      risk:
        "El equipo puede seguir decidiendo por anecdotas en vez de ver que actividad cambia la calidad del pipeline."
    }
  },
  poor_lead_quality: {
    en: {
      title: "Lead quality is a visible constraint",
      detail:
        "The profile references weak qualification, poor-fit leads, low conversion, or noisy demand.",
      risk:
        "More top-of-funnel activity can amplify the wrong leads and consume sales capacity."
    },
    es: {
      title: "La calidad de leads es una restriccion visible",
      detail:
        "El perfil menciona baja calificacion, leads mal ajustados, baja conversion o demanda ruidosa.",
      risk:
        "Mas actividad en la parte alta del embudo puede amplificar leads incorrectos y consumir capacidad comercial."
    }
  },
  unclear_offer: {
    en: {
      title: "Offer structure is unclear",
      detail:
        "The profile does not explain packaging, pricing motion, delivery model, or the concrete buying promise.",
      risk:
        "Buyers may understand the category but still fail to understand what they are actually buying."
    },
    es: {
      title: "La estructura de oferta no esta clara",
      detail:
        "El perfil no explica el paquete, el modelo de precio, la entrega o la promesa concreta de compra.",
      risk:
        "Los compradores pueden entender la categoria pero no entender exactamente que estan comprando."
    }
  },
  no_operating_cadence: {
    en: {
      title: "Operating cadence is missing",
      detail:
        "There is not enough evidence of weekly review, ownership rhythm, KPI review, or decision cadence.",
      risk:
        "Priorities can stay valid in theory but fail to become repeatable execution."
    },
    es: {
      title: "Falta cadencia operativa",
      detail:
        "No hay suficiente evidencia de revision semanal, ritmo de ownership, revision de KPIs o cadencia de decision.",
      risk:
        "Las prioridades pueden ser correctas en teoria pero no convertirse en ejecucion repetible."
    }
  },
  manual_operations: {
    en: {
      title: "Manual operations are constraining scale",
      detail:
        "The profile points to repeated manual work, handoff friction, or founder-dependent operations.",
      risk:
        "Growth will add operational load before the team has the systems to absorb it."
    },
    es: {
      title: "Las operaciones manuales limitan la escala",
      detail:
        "El perfil apunta a trabajo manual repetido, friccion en handoffs u operaciones dependientes del fundador.",
      risk:
        "El crecimiento anadira carga operativa antes de que el equipo tenga sistemas para absorberla."
    }
  },
  low_evidence: {
    en: {
      title: "Evidence depth is low",
      detail:
        "The profile has too little structured context to support a high-confidence diagnostic.",
      risk:
        "Recommendations may sound plausible but remain too generic to guide planning."
    },
    es: {
      title: "La profundidad de evidencia es baja",
      detail:
        "El perfil tiene poco contexto estructurado para sostener un diagnostico de alta confianza.",
      risk:
        "Las recomendaciones pueden sonar plausibles pero seguir demasiado genericas para guiar la planificacion."
    }
  },
  contradictory_scale: {
    en: {
      title: "Scale signals are contradictory",
      detail:
        "The profile mixes scale ambition with weak budget, tooling, or operating structure.",
      risk:
        "The team may attempt expansion before the operating base can support it."
    },
    es: {
      title: "Las senales de escala son contradictorias",
      detail:
        "El perfil mezcla ambicion de escala con presupuesto, herramientas o estructura operativa debiles.",
      risk:
        "El equipo puede intentar expandirse antes de que la base operativa lo soporte."
    }
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function filled(value: string | null) {
  return Boolean(value?.trim());
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function allText(profile: BusinessProfileRecord) {
  return [
    profile.companyName,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.budgetBand,
    profile.lifecycleStage,
    ...profile.currentChannels,
    ...profile.currentTools,
    ...profile.primaryGoals,
    ...profile.biggestBottlenecks
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasPattern(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function profileCompleteness(profile: BusinessProfileRecord) {
  const textFields = [
    profile.companyName,
    profile.website,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.budgetBand,
    profile.lifecycleStage
  ];
  const listFields = [
    profile.currentChannels,
    profile.currentTools,
    profile.primaryGoals,
    profile.biggestBottlenecks
  ];
  const filledText = textFields.filter(filled).length;
  const filledLists = listFields.filter((items) => items.length > 0).length;

  return Math.round(((filledText + filledLists) / (textFields.length + listFields.length)) * 100);
}

function detectBusinessType(profile: BusinessProfileRecord): BusinessType {
  const text = allText(profile);

  if (hasPattern(text, /academy|course|cohort|training|education|school|skill|bootcamp|curso|formacion|academia/)) {
    return "academy";
  }

  if (hasPattern(text, /saas|subscription|software|platform|fintech|ledger|workflow|suscripcion|plataforma/)) {
    return "subscription";
  }

  if (hasPattern(text, /studio|agency|service|consulting|retainer|client work|creative|design|consultoria|servicios|agencia|estudio/)) {
    return "services";
  }

  if (hasPattern(text, /ecommerce|commerce|shop|retail|store|inventory|tienda|comercio/)) {
    return "commerce";
  }

  if (hasPattern(text, /marketplace|two-sided|supply|demand|mercado/)) {
    return "marketplace";
  }

  return "general";
}

function analyzeSignals(profile: BusinessProfileRecord): SignalMap {
  const offer = normalize(profile.primaryOffer);
  const audience = normalize(profile.targetAudience);
  const tools = profile.currentTools.join(" ").toLowerCase();
  const channels = profile.currentChannels.join(" ").toLowerCase();
  const goals = profile.primaryGoals.join(" ").toLowerCase();
  const bottlenecks = profile.biggestBottlenecks.join(" ").toLowerCase();
  const businessType = detectBusinessType(profile);
  const completeness = profileCompleteness(profile);
  const explicitUndefinedFunnel = hasPattern(
    `${goals} ${bottlenecks}`,
    /undefined funnel|no funnel|missing funnel|unclear funnel|no embudo|embudo no definido|sin embudo/
  );
  const explicitWeakReporting = hasPattern(
    `${goals} ${bottlenecks}`,
    /low .*report|weak .*report|no reporting|missing report|no weekly report|visibility|no hay reporting|sin reporting|sin visibilidad|baja visibilidad/
  );
  const explicitNoCadence = hasPattern(
    `${goals} ${bottlenecks}`,
    /no operating cadence|no cadence|missing cadence|no weekly|no review rhythm|sin cadencia|no hay cadencia|no hay revision|sin revision semanal/
  );

  const hasNicheClarity =
    audience.length >= 42 &&
    !hasPattern(audience, /\b(everyone|any business|all companies|small businesses|startups|customers|clients|todos|cualquier empresa|empresas|clientes)\b/);
  const hasOfferStructure =
    offer.length >= 55 &&
    hasPattern(
      `${offer} ${normalize(profile.businessModel)}`,
      /subscription|monthly|retainer|package|plan|course|cohort|audit|implementation|license|per seat|project|fixed|suscripcion|mensual|paquete|plan|curso|implementacion|licencia|proyecto/
    );
  const hasPositioningClarity =
    hasNicheClarity &&
    hasOfferStructure &&
    filled(profile.industry);
  const hasDefinedFunnel =
    !explicitUndefinedFunnel &&
    profile.currentChannels.length >= 2 &&
    hasPattern(
      `${channels} ${tools} ${goals}`,
      /seo|paid|ads|content|email|referral|linkedin|outbound|inbound|webinar|sales|crm|hubspot|pipeline|conversion|demo|lead|trafico|referidos|ventas|embudo|conversion/
    );
  const hasDataVisibility =
    hasPattern(
      tools,
      /analytics|dashboard|crm|hubspot|salesforce|posthog|ga4|looker|metabase|mixpanel|segment|report|reporting|analitica|datos|dashboard|panel|crm/
    ) && hasPattern(`${goals} ${bottlenecks} ${tools}`, /metric|kpi|conversion|pipeline|report|quality|qualified|cohort|retention|mrr|cac|datos|metrica|conversion|calidad|retencion/);
  const hasReliableDataVisibility = hasDataVisibility && !explicitWeakReporting;
  const hasLeadQualityConcern = hasPattern(
    `${goals} ${bottlenecks}`,
    /lead quality|qualified lead|poor lead|bad lead|low conversion|wrong customer|poor fit|noisy demand|discount dependent|discount reliance|wrong program|program fit|enrollment quality|funnel not segmented|unsegmented funnel|calidad de lead|lead malo|baja conversion|mal cliente|prospectos incorrectos|dependencia de descuento|calidad de enrolamiento|programa incorrecto|embudo sin segmentar/
  ) || (
    businessType === "academy" &&
    hasPattern(
      `${goals} ${bottlenecks} ${offer} ${audience}`,
      /which program|per program|by program|discount|promo|completion rate|dropout|referral rate|enrollment criteria|lead source|source quality|tasa de finalizacion|abandono|por programa|descuento|fuente de lead/
    )
  );
  const hasCadence = !explicitNoCadence && hasPattern(
    `${goals} ${bottlenecks} ${tools}`,
    /weekly|cadence|review|standup|operating rhythm|dashboard review|reporting rhythm|owner|ownership|sprint|semanal|cadencia|revision|ritmo|responsable/
  );
  const manualOps = hasPattern(
    `${bottlenecks} ${goals}`,
    /manual|handoff|spreadsheet|founder dependent|ops chaos|onboarding|delivery|repetitive|manual|hoja de calculo|fundador|caos|entrega|repetitivo/
  );
  const contradictions: string[] = [];

  if (
    hasPattern(normalize(profile.budgetBand), /under|<|low|bajo|menos/) &&
    hasPattern(`${goals} ${offer}`, /enterprise|scale|international|custom integration|global|integracion custom|escala/)
  ) {
    contradictions.push("low-budget/high-complexity");
  }

  if (profile.currentTools.length === 0 && hasPattern(goals, /data|analytics|report|dashboard|datos|analitica|reporte/)) {
    contradictions.push("data-goal/no-data-tools");
  }

  const issues: Issue[] = [];
  const addIssue = (
    key: IssueKey,
    severity: DiagnosticFinding["severity"],
    categories: Issue["categories"]
  ) => issues.push({ key, severity, categories });

  if (!hasPositioningClarity) {
    addIssue("unclear_positioning", "high", ["positioning", "acquisition"]);
  }

  if (!hasNicheClarity) {
    addIssue("no_niche_clarity", "high", ["positioning"]);
  }

  if (!hasDefinedFunnel) {
    addIssue("undefined_funnel", "high", ["acquisition", "data"]);
  }

  if (!hasReliableDataVisibility) {
    addIssue("weak_reporting", "high", ["data", "execution"]);
  }

  if (hasLeadQualityConcern) {
    addIssue("poor_lead_quality", "high", ["acquisition", "positioning"]);
  }

  if (!hasOfferStructure) {
    addIssue("unclear_offer", "high", ["positioning", "execution"]);
  }

  if (!hasCadence) {
    addIssue("no_operating_cadence", "medium", ["execution", "operations"]);
  }

  if (manualOps) {
    addIssue("manual_operations", "medium", ["operations", "execution"]);
  }

  if (completeness < 55) {
    addIssue("low_evidence", "medium", ["execution"]);
  }

  if (contradictions.length > 0) {
    addIssue("contradictory_scale", "medium", ["execution", "operations"]);
  }

  return {
    businessType,
    completeness,
    hasCadence,
    hasDataVisibility: hasReliableDataVisibility,
    hasDefinedFunnel,
    hasNicheClarity,
    hasOfferStructure,
    hasPositioningClarity,
    hasLeadQualityConcern,
    contradictions,
    issues
  };
}

function issuePenalty(
  signals: SignalMap,
  category: Issue["categories"][number]
) {
  return signals.issues
    .filter((issue) => issue.categories.includes(category))
    .reduce((total, issue) => {
      if (issue.severity === "high") return total + 14;
      if (issue.severity === "medium") return total + 8;
      return total + 4;
    }, 0);
}

function scoreCategories(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticCategoryScore[] {
  const channelDepth = Math.min(profile.currentChannels.length, 3) * 3;
  const toolDepth = Math.min(profile.currentTools.length, 4) * 2;
  const goalDepth = Math.min(profile.primaryGoals.length, 3) * 3;
  const scores = {
    positioning: clamp(
      72 +
        (signals.hasPositioningClarity ? 8 : 0) +
        (signals.hasNicheClarity ? 5 : 0) -
        issuePenalty(signals, "positioning"),
      18,
      88
    ),
    acquisition: clamp(
      66 +
        (signals.hasDefinedFunnel && !signals.hasLeadQualityConcern ? 10 : signals.hasDefinedFunnel ? 4 : 0) +
        channelDepth -
        issuePenalty(signals, "acquisition"),
      18,
      86
    ),
    operations: clamp(
      64 +
        toolDepth +
        (signals.hasCadence ? 8 : 0) -
        issuePenalty(signals, "operations"),
      18,
      84
    ),
    data: clamp(
      58 +
        (signals.hasDataVisibility ? 18 : 0) +
        (signals.hasDefinedFunnel ? 4 : 0) -
        issuePenalty(signals, "data"),
      15,
      86
    ),
    execution: clamp(
      64 +
        goalDepth +
        (signals.hasCadence ? 10 : 0) -
        issuePenalty(signals, "execution"),
      18,
      86
    )
  };

  const rationale: Record<
    keyof typeof scores,
    Record<OutputLanguage, string>
  > = {
    positioning: {
      en: signals.hasPositioningClarity
        ? "Offer, audience, and industry signals are specific enough to support a focused diagnostic."
        : "Score is held down because offer, niche, or audience clarity is not strong enough yet.",
      es: signals.hasPositioningClarity
        ? "Las senales de oferta, audiencia e industria son suficientemente especificas para sostener un diagnostico enfocado."
        : "La puntuacion baja porque la oferta, el nicho o la audiencia aun no estan suficientemente claros."
    },
    acquisition: {
      en: signals.hasDefinedFunnel && !signals.hasLeadQualityConcern
        ? "Channels are connected and lead quality signals support qualified conversion reasoning."
        : signals.hasDefinedFunnel
          ? "Channels are present but lead quality concern limits the funnel score: the path exists but produces unreliable or unsegmented leads."
          : "Score is penalized because the acquisition path is not mapped to qualified conversion.",
      es: signals.hasDefinedFunnel && !signals.hasLeadQualityConcern
        ? "Los canales estan conectados y las senales de calidad de lead soportan razonamiento de conversion calificada."
        : signals.hasDefinedFunnel
          ? "Hay canales pero la preocupacion por calidad de lead limita el puntaje: el camino existe pero produce leads poco fiables o sin segmentar."
          : "La puntuacion baja porque la ruta de adquisicion no esta conectada a conversion calificada."
    },
    operations: {
      en: signals.hasCadence
        ? "The profile shows some operating rhythm, ownership, or recurring review evidence."
        : "Operational score is limited by missing cadence, ownership rhythm, or repeated manual work.",
      es: signals.hasCadence
        ? "El perfil muestra alguna evidencia de ritmo operativo, ownership o revision recurrente."
        : "La puntuacion operativa queda limitada por falta de cadencia, ownership o trabajo manual repetido."
    },
    data: {
      en: signals.hasDataVisibility
        ? "There is enough analytics, CRM, or reporting evidence to support measurement decisions."
        : "Data score is heavily penalized because reporting and pipeline visibility are weak.",
      es: signals.hasDataVisibility
        ? "Hay suficiente evidencia de analitica, CRM o reporting para sostener decisiones de medicion."
        : "La puntuacion de datos baja fuerte porque la visibilidad de reporting y pipeline es debil."
    },
    execution: {
      en: signals.hasCadence
        ? "Goals can be translated into an operating rhythm because cadence signals are present."
        : "Execution score is limited because goals are not yet tied to a repeatable operating cadence.",
      es: signals.hasCadence
        ? "Los objetivos pueden convertirse en ritmo operativo porque hay senales de cadencia."
        : "La puntuacion de ejecucion queda limitada porque los objetivos aun no estan ligados a una cadencia repetible."
    }
  };

  return (Object.keys(scores) as Array<keyof typeof scores>).map((key) => ({
    key,
    label: labels[language][key],
    score: scores[key],
    rationale: rationale[key][language]
  }));
}

function fallbackCompany(profile: BusinessProfileRecord, workspace: WorkspaceRecord) {
  return profile.companyName ?? workspace.name;
}

function buildBottlenecks(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticFinding[] {
  const explicit = profile.biggestBottlenecks.slice(0, 3).map((item) => {
    const normalized = item.toLowerCase();
    const matchedIssue =
      signals.issues.find((issue) => normalized.includes(issue.key.replaceAll("_", " "))) ??
      signals.issues.find((issue) => {
        if (issue.key === "manual_operations") return /manual|handoff|onboarding|delivery|operacion|entrega/.test(normalized);
        if (issue.key === "poor_lead_quality") return /lead|conversion|qualified|calidad|prospecto/.test(normalized);
        if (issue.key === "undefined_funnel") return /funnel|channel|canal|embudo/.test(normalized);
        if (issue.key === "weak_reporting") return /report|data|metric|dato|metrica/.test(normalized);
        return false;
      });

    return {
      title: matchedIssue
        ? issueCopy[matchedIssue.key][language].title
        : language === "es"
          ? "Restriccion operativa capturada"
          : "Captured operating constraint",
      detail:
        language === "es"
          ? `La entrada capturada menciona "${item}". Se trata como una restriccion que debe resolverse antes de planificar la siguiente fase.`
          : `The captured input references "${item}". This is treated as a constraint to resolve before planning the next phase.`,
      severity: matchedIssue?.severity ?? ("medium" as const)
    };
  });

  if (explicit.length > 0) {
    return explicit;
  }

  return signals.issues.slice(0, 3).map((issue) => ({
    title: issueCopy[issue.key][language].title,
    detail: issueCopy[issue.key][language].detail,
    severity: issue.severity
  }));
}

function buildRisks(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticFinding[] {
  const seriousIssues = signals.issues.filter((issue) => issue.severity !== "low");
  const risks = seriousIssues.slice(0, 4).map((issue) => ({
    title: issueCopy[issue.key][language].title,
    detail: issueCopy[issue.key][language].risk,
    severity: issue.severity
  }));

  if (profile.biggestBottlenecks.length > 0 && risks.length < 2) {
    risks.push({
      title:
        language === "es"
          ? "Los cuellos de botella pueden bloquear el plan"
          : "Bottlenecks may block the plan",
      detail:
        language === "es"
          ? "Hay restricciones capturadas en el perfil, pero aun falta convertirlas en prioridades operativas medibles."
          : "The profile contains constraints, but they still need to be converted into measurable operating priorities.",
      severity: "medium"
    });
  }

  if (profile.biggestBottlenecks.length > 1 && risks.length < 3) {
    risks.push({
      title:
        language === "es"
          ? "El roadmap podria basarse en sintomas, no en causas"
          : "The roadmap may target symptoms instead of causes",
      detail:
        language === "es"
          ? "Multiples cuellos de botella indican que el equipo debe separar senales capturadas de conclusiones inferidas antes de planificar."
          : "Multiple bottlenecks mean the team should separate captured signals from inferred causes before planning.",
      severity: "medium"
    });
  }

  if (risks.length < 2 && seriousIssues.length > 0) {
    risks.push({
      title:
        language === "es"
          ? "La evidencia aun no sostiene una planificacion agresiva"
          : "Evidence does not yet support aggressive planning",
      detail:
        language === "es"
          ? "Antes de crear un roadmap, el equipo deberia cerrar los vacios principales de oferta, embudo, datos o cadencia."
          : "Before creating a roadmap, the team should close the main gaps in offer, funnel, data, or cadence.",
      severity: "medium"
    });
  }

  return risks.slice(0, 3);
}

function businessTypeOpportunity(
  businessType: BusinessType,
  profile: BusinessProfileRecord,
  language: OutputLanguage
): DiagnosticOpportunity {
  const channel = profile.currentChannels[0] ?? (language === "es" ? "el canal principal" : "the primary channel");

  const copy: Record<BusinessType, Record<OutputLanguage, DiagnosticOpportunity>> = {
    academy: {
      en: {
        title: "Segment leads by program intent and map the enrollment-to-completion loop",
        detail:
          "Split lead sources by program fit, map enrollment trigger, onboarding, completion, and referral. Flag discount-dependent enrollments separately. Measure each stage independently before scaling any channel.",
        impact: "high"
      },
      es: {
        title: "Segmentar leads por intencion de programa y mapear el ciclo enrolamiento-finalizacion",
        detail:
          "Dividir fuentes de lead por fit de programa, mapear activador de enrolamiento, onboarding, finalizacion y referidos. Marcar enrolamientos dependientes de descuento por separado. Medir cada etapa antes de escalar.",
        impact: "high"
      }
    },
    commerce: {
      en: {
        title: "Separate acquisition, conversion, and repeat purchase signals",
        detail:
          "Treat traffic quality, product-page conversion, and repeat order behavior as separate operating systems.",
        impact: "high"
      },
      es: {
        title: "Separar adquisicion, conversion y recompra",
        detail:
          "Tratar calidad de trafico, conversion de producto y recompra como sistemas operativos separados.",
        impact: "high"
      }
    },
    marketplace: {
      en: {
        title: "Instrument both sides of the marketplace",
        detail:
          "Track supply activation and demand conversion separately before scaling either side.",
        impact: "high"
      },
      es: {
        title: "Instrumentar ambos lados del marketplace",
        detail:
          "Medir activacion de oferta y conversion de demanda por separado antes de escalar cualquiera de los lados.",
        impact: "high"
      }
    },
    services: {
      en: {
        title: "Productize intake-to-delivery operations",
        detail:
          "Turn the studio or service workflow into defined packages, handoffs, review points, and delivery templates.",
        impact: "high"
      },
      es: {
        title: "Productizar operaciones de intake a entrega",
        detail:
          "Convertir el flujo de estudio o servicios en paquetes, handoffs, revisiones y plantillas de entrega.",
        impact: "high"
      }
    },
    subscription: {
      en: {
        title: "Define the activation-to-retention operating loop",
        detail:
          "Connect acquisition quality, activation, usage, and renewal signals before adding more demand.",
        impact: "high"
      },
      es: {
        title: "Definir el loop operativo de activacion a retencion",
        detail:
          "Conectar calidad de adquisicion, activacion, uso y renovacion antes de sumar mas demanda.",
        impact: "high"
      }
    },
    general: {
      en: {
        title: `Use ${channel} as the first measurable operating lane`,
        detail:
          "Pick one channel, one conversion event, and one review cadence before expanding the operating model.",
        impact: "medium"
      },
      es: {
        title: `Usar ${channel} como primer carril operativo medible`,
        detail:
          "Elegir un canal, un evento de conversion y una cadencia de revision antes de ampliar el modelo operativo.",
        impact: "medium"
      }
    }
  };

  return copy[businessType][language];
}

function issueOpportunity(
  issue: Issue,
  language: OutputLanguage
): DiagnosticOpportunity {
  const title = issueCopy[issue.key][language].title;
  const detail =
    language === "es"
      ? `Convertir esta restriccion en una prueba operativa pequena antes de construir el roadmap: ${issueCopy[issue.key][language].detail}`
      : `Turn this constraint into a small operating test before building the roadmap: ${issueCopy[issue.key][language].detail}`;

  return {
    title,
    detail,
    impact: issue.severity === "high" ? "high" : "medium"
  };
}

function buildOpportunities(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticOpportunity[] {
  const opportunities = [
    businessTypeOpportunity(signals.businessType, profile, language),
    ...signals.issues.slice(0, 3).map((issue) => issueOpportunity(issue, language))
  ];

  if (opportunities.length < 3) {
    opportunities.push({
      title:
        language === "es"
          ? "Crear una revision operativa semanal"
          : "Create a weekly operating review",
      detail:
        language === "es"
          ? "Revisar un objetivo, un cuello de botella y una metrica por semana para evitar recomendaciones genericas."
          : "Review one goal, one bottleneck, and one metric each week so recommendations stay specific.",
      impact: "medium"
    });
  }

  return opportunities.slice(0, 3);
}

function buildActions(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticNextAction[] {
  const firstIssue = signals.issues[0];
  const typeOwner =
    signals.businessType === "services"
      ? "Founder / Delivery lead"
      : signals.businessType === "academy"
        ? "Founder / Program owner"
        : signals.businessType === "subscription"
          ? "Founder / Product lead"
          : "Workspace owner";

  if (language === "es") {
    return [
      {
        title: "Cerrar la hipotesis principal de posicionamiento",
        detail: firstIssue
          ? `Resolver primero: ${issueCopy[firstIssue.key].es.detail}`
          : "Confirmar audiencia, promesa y oferta antes de convertir el diagnostico en roadmap.",
        owner: "Owner o admin",
        timeframe: "Hoy"
      },
      {
        title: "Definir una prueba de embudo medible",
        detail:
          profile.currentChannels.length > 0
            ? `Usar ${profile.currentChannels[0]} como canal de prueba y asignar una metrica de conversion.`
            : "Elegir un canal principal y una metrica de conversion antes de expandir adquisicion.",
        owner: typeOwner,
        timeframe: "Esta semana"
      },
      {
        title: "Instalar una cadencia de revision",
        detail:
          "Revisar semanalmente score, calidad de leads, avance de acciones y decisiones bloqueadas.",
        owner: "Founder u operador",
        timeframe: "Proximos 7 dias"
      }
    ];
  }

  return [
    {
      title: "Close the primary positioning hypothesis",
      detail: firstIssue
        ? `Resolve this first: ${issueCopy[firstIssue.key].en.detail}`
        : "Confirm audience, promise, and offer before converting the diagnostic into a roadmap.",
      owner: "Owner or admin",
      timeframe: "Today"
    },
    {
      title: "Define one measurable funnel test",
      detail:
        profile.currentChannels.length > 0
          ? `Use ${profile.currentChannels[0]} as the test channel and assign one conversion metric.`
          : "Choose one primary channel and one conversion metric before expanding acquisition.",
      owner: typeOwner,
      timeframe: "This week"
    },
    {
      title: "Install an operating review cadence",
      detail:
        "Review score, lead quality, action progress, and blocked decisions every week.",
      owner: "Founder or operator",
      timeframe: "Next 7 days"
    }
  ];
}

function buildEvidence(
  profile: BusinessProfileRecord,
  workspace: WorkspaceRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticEvidenceCard[] {
  if (language === "es") {
    return [
      {
        title: "Senales capturadas",
        observation: `${fallbackCompany(profile, workspace)} tiene ${profile.currentChannels.length} canales, ${profile.currentTools.length} herramientas, ${profile.primaryGoals.length} objetivos y ${profile.biggestBottlenecks.length} cuellos de botella capturados.`,
        implication:
          "Estas entradas se tratan como evidencia, no como conclusiones finales."
      },
      {
        title: "Conclusiones inferidas",
        observation: `Se detectaron ${signals.issues.length} restricciones: ${signals.issues.slice(0, 3).map((issue) => issueCopy[issue.key].es.title).join("; ") || "sin restricciones criticas"}.`,
        implication:
          "Las puntuaciones bajan cuando las restricciones afectan posicionamiento, embudo, datos o cadencia."
      },
      {
        title: "Base de accion recomendada",
        observation: `Tipo de negocio inferido: ${signals.businessType}. Confianza basada en completitud ${signals.completeness}/100, visibilidad de datos y coherencia del perfil.`,
        implication:
          "Las acciones recomendadas deben validarse antes de convertirse en roadmap."
      }
    ];
  }

  return [
    {
      title: "Captured input signals",
      observation: `${fallbackCompany(profile, workspace)} has ${profile.currentChannels.length} channels, ${profile.currentTools.length} tools, ${profile.primaryGoals.length} goals, and ${profile.biggestBottlenecks.length} bottlenecks captured.`,
      implication:
        "These inputs are treated as evidence, not as final conclusions."
    },
    {
      title: "Inferred conclusions",
      observation: `${signals.issues.length} constraints were detected: ${signals.issues.slice(0, 3).map((issue) => issueCopy[issue.key].en.title).join("; ") || "no critical constraints"}.`,
      implication:
        "Scores drop when constraints affect positioning, funnel, data, or cadence."
    },
    {
      title: "Recommended action basis",
      observation: `Inferred business type: ${signals.businessType}. Confidence uses completeness ${signals.completeness}/100, data visibility, and profile consistency.`,
      implication:
        "Recommended actions should be validated before becoming roadmap items."
    }
  ];
}

function resolveConfidence(signals: SignalMap): DiagnosticResultRecord["confidence"] {
  const highSeverityCount = signals.issues.filter((issue) => issue.severity === "high").length;

  if (
    signals.completeness >= 85 &&
    signals.hasPositioningClarity &&
    signals.hasDefinedFunnel &&
    signals.hasDataVisibility &&
    signals.hasCadence &&
    signals.contradictions.length === 0 &&
    highSeverityCount === 0
  ) {
    return "high";
  }

  if (
    signals.completeness >= 60 &&
    signals.contradictions.length <= 1 &&
    highSeverityCount <= 2 &&
    (signals.hasDataVisibility || signals.hasDefinedFunnel)
  ) {
    return "medium";
  }

  return "low";
}

function localizedConfidence(
  confidence: DiagnosticResultRecord["confidence"],
  language: OutputLanguage
) {
  if (language === "es") {
    return confidence === "high" ? "alta" : confidence === "medium" ? "media" : "baja";
  }

  return confidence;
}

const nextStepByIssue: Record<IssueKey, Record<OutputLanguage, string>> = {
  unclear_positioning: {
    en: "Name the segment, problem, and offer in one sentence before any channel or roadmap work.",
    es: "Nombrar segmento, problema y oferta en una frase antes de cualquier trabajo de canal o roadmap."
  },
  no_niche_clarity: {
    en: "Narrow the target audience to one specific segment with clear buying intent before expanding acquisition.",
    es: "Reducir la audiencia objetivo a un segmento especifico con intencion de compra antes de expandir adquisicion."
  },
  undefined_funnel: {
    en: "Define one funnel path with a named conversion event and one owner before adding channels.",
    es: "Definir un camino de embudo con un evento de conversion nombrado y un owner antes de agregar canales."
  },
  weak_reporting: {
    en: "Install a weekly scorecard for the primary metric before making channel or spend decisions.",
    es: "Instalar un scorecard semanal de la metrica principal antes de tomar decisiones de canal o gasto."
  },
  poor_lead_quality: {
    en: "Add a lead qualification filter and measure quality by source before increasing volume.",
    es: "Agregar filtro de calificacion de leads y medir calidad por fuente antes de aumentar volumen."
  },
  unclear_offer: {
    en: "Write the offer with price, delivery, and expected outcome before any outbound or paid activity.",
    es: "Escribir la oferta con precio, entrega y resultado esperado antes de cualquier actividad outbound o paga."
  },
  no_operating_cadence: {
    en: "Install a weekly operating review with one owner and one primary metric to track.",
    es: "Instalar revision operativa semanal con un owner y una metrica primaria."
  },
  manual_operations: {
    en: "Document the most repeated manual step and assign it an owner or a removal decision this week.",
    es: "Documentar el paso manual mas repetido y asignarle owner o decision de eliminacion esta semana."
  },
  low_evidence: {
    en: "Complete the business profile with audience, offer, channels, and tools before generating a roadmap.",
    es: "Completar el perfil con audiencia, oferta, canales y herramientas antes de crear un roadmap."
  },
  contradictory_scale: {
    en: "Resolve the gap between scale ambition and current operating capacity before adding complexity.",
    es: "Resolver la brecha entre la ambicion de escala y la capacidad operativa actual antes de agregar complejidad."
  }
};

function buildSummary({
  company,
  confidence,
  language,
  overallMaturityScore,
  signals
}: {
  company: string;
  confidence: DiagnosticResultRecord["confidence"];
  language: OutputLanguage;
  overallMaturityScore: number;
  signals: SignalMap;
}) {
  const topIssue = signals.issues[0];
  const nextStep = topIssue ? nextStepByIssue[topIssue.key][language] : null;

  if (language === "es") {
    return (
      `${company} obtiene ${overallMaturityScore}/100 con confianza ${localizedConfidence(confidence, language)}. ` +
      (topIssue
        ? `La restriccion principal es: ${issueCopy[topIssue.key].es.title}. `
        : "No se detecto una restriccion critica unica. ") +
      (nextStep ?? "El siguiente paso debe cerrar la brecha operativa de mayor riesgo antes de crear un roadmap.")
    );
  }

  return (
    `${company} scores ${overallMaturityScore}/100 with ${confidence} confidence. ` +
    (topIssue
      ? `The primary constraint is: ${issueCopy[topIssue.key].en.title}. `
      : "No single critical constraint was detected. ") +
    (nextStep ?? "The next step should close the highest-risk operating gap before roadmap creation.")
  );
}

export function buildDiagnosticResult({
  jobId,
  workspace,
  profile
}: {
  jobId: string;
  workspace: WorkspaceRecord;
  profile: BusinessProfileRecord;
}): DiagnosticResultRecord {
  const language = workspace.outputLanguage;
  const signals = analyzeSignals(profile);
  const categoryScores = scoreCategories(profile, language, signals);
  const rawOverall = Math.round(
    categoryScores.reduce((total, item) => total + item.score, 0) /
      categoryScores.length
  );
  const highSeverityCount = signals.issues.filter((issue) => issue.severity === "high").length;
  const overallMaturityScore = clamp(
    rawOverall - Math.max(0, highSeverityCount - 2) * 3,
    15,
    90
  );
  const confidence = resolveConfidence(signals);
  const company = fallbackCompany(profile, workspace);

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId: workspace.id,
    overallMaturityScore,
    categoryScores,
    topBottlenecks: buildBottlenecks(profile, language, signals),
    topRisks: buildRisks(profile, language, signals),
    topOpportunities: buildOpportunities(profile, language, signals),
    confidence,
    recommendedNextActions: buildActions(profile, language, signals),
    evidenceCards: buildEvidence(profile, workspace, language, signals),
    summary: buildSummary({
      company,
      confidence,
      language,
      overallMaturityScore,
      signals
    }),
    createdAt: new Date().toISOString()
  };
}
