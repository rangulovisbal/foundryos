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

type EvidenceKey =
  | "founder_inputs"
  | "visible_positioning"
  | "offer_audience"
  | "channel_mix"
  | "conversion_model"
  | "operating_tools"
  | "goals_bottlenecks"
  | "stage_budget"
  | "operating_maturity"
  | "missing_evidence"
  | "contradictory_evidence";

type ContradictionKey =
  | "low_budget_high_complexity"
  | "data_goal_no_tools"
  | "reporting_claim_conflict"
  | "mature_stage_weak_foundation"
  | "visible_positioning_audience_conflict"
  | "conversion_without_acquisition_evidence"
  | "pricing_offer_conflict";

type Contradiction = {
  key: ContradictionKey;
  title: string;
  detail: string;
  evidenceKeys: EvidenceKey[];
};

type ScoreDriver = {
  label: string;
  points: number;
  tone: "positive" | "negative";
  basedOn: string[];
};

type SignalMap = {
  businessType: BusinessType;
  completeness: number;
  specificity: number;
  evidenceQuality: number;
  visibleEvidenceScore: number;
  consistency: number;
  insufficientSignal: boolean;
  hasVisiblePositioningEvidence: boolean;
  hasConversionEvidence: boolean;
  hasAcquisitionEvidence: boolean;
  hasCadence: boolean;
  hasDataVisibility: boolean;
  hasDefinedFunnel: boolean;
  hasNicheClarity: boolean;
  hasOfferStructure: boolean;
  hasPositioningClarity: boolean;
  hasSocialOrEventEvidence: boolean;
  hasMarketingMeasurementBasics: boolean;
  hasLeadQualityConcern: boolean;
  contradictions: Contradiction[];
  issues: Issue[];
};

const labels: Record<
  OutputLanguage,
  Record<"acquisition" | "data" | "execution" | "operations" | "positioning", string>
> = {
  en: {
    positioning: "Positioning",
    acquisition: "Acquisition",
    operations: "Marketing execution",
    data: "Marketing measurement",
    execution: "30-day action readiness"
  },
  es: {
    positioning: "Posicionamiento",
    acquisition: "Adquisicion",
    operations: "Ejecucion de marketing",
    data: "Medicion de marketing",
    execution: "Preparacion del plan de 30 dias"
  }
};

const evidenceLabels: Record<OutputLanguage, Record<EvidenceKey, string>> = {
  en: {
    founder_inputs: "founder-stated inputs",
    visible_positioning: "website, positioning, and channel evidence entered by you",
    offer_audience: "your offer and audience",
    channel_mix: "your current channel mix",
    conversion_model: "your CTA, pricing, acquisition, and sales-process evidence",
    operating_tools: "your marketing tools and measurement setup",
    goals_bottlenecks: "your stated goals and bottlenecks",
    stage_budget: "your stage, team, and budget context",
    operating_maturity: "your current marketing execution rhythm",
    missing_evidence: "missing or unclear marketing evidence",
    contradictory_evidence: "contradictions between declared state and supporting evidence"
  },
  es: {
    founder_inputs: "entradas declaradas por el fundador",
    visible_positioning: "evidencia de web, posicionamiento y canales introducida por ti",
    offer_audience: "tu oferta y audiencia",
    channel_mix: "tu mezcla actual de canales",
    conversion_model: "tu evidencia de CTA, precio, adquisición y proceso comercial",
    operating_tools: "tus herramientas de marketing y medicion",
    goals_bottlenecks: "tus objetivos y cuellos de botella declarados",
    stage_budget: "tu contexto de etapa, equipo y presupuesto",
    operating_maturity: "tu ritmo actual de ejecucion de marketing",
    missing_evidence: "evidencia de marketing faltante o poco clara",
    contradictory_evidence: "contradicciones entre estado declarado y evidencia de soporte"
  }
};

const issueEvidenceMap: Record<IssueKey, EvidenceKey[]> = {
  unclear_positioning: ["founder_inputs", "visible_positioning", "offer_audience"],
  no_niche_clarity: ["founder_inputs", "offer_audience", "visible_positioning"],
  undefined_funnel: ["channel_mix", "conversion_model", "goals_bottlenecks"],
  weak_reporting: ["operating_tools", "goals_bottlenecks"],
  poor_lead_quality: ["goals_bottlenecks", "channel_mix"],
  unclear_offer: ["offer_audience", "conversion_model"],
  no_operating_cadence: ["operating_maturity", "goals_bottlenecks"],
  manual_operations: ["operating_maturity", "goals_bottlenecks"],
  low_evidence: [
    "missing_evidence",
    "offer_audience",
    "visible_positioning",
    "channel_mix",
    "conversion_model",
    "operating_tools"
  ],
  contradictory_scale: [
    "contradictory_evidence",
    "stage_budget",
    "operating_tools",
    "goals_bottlenecks"
  ]
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
      title: "Marketing measurement is weak",
      detail:
        "The profile does not yet show a simple way to measure channel response, CTA activity, qualified demand, or customer feedback.",
      risk:
        "The founder may keep choosing channels from anecdotes instead of seeing which message or channel creates real response."
    },
    es: {
      title: "La medicion de marketing es debil",
      detail:
        "El perfil todavia no muestra una forma simple de medir respuesta de canal, actividad de CTA, demanda calificada o feedback de clientes.",
      risk:
        "El founder puede seguir eligiendo canales por anecdotas en vez de ver que mensaje o canal crea respuesta real."
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
      title: "Marketing review rhythm is missing",
      detail:
        "There is not enough evidence that marketing activity is reviewed weekly with one metric, one owner, and one decision.",
      risk:
        "The 30-day plan can become scattered activity instead of a focused marketing test."
    },
    es: {
      title: "Falta ritmo de revision de marketing",
      detail:
        "No hay suficiente evidencia de que la actividad de marketing se revise semanalmente con una metrica, un owner y una decision.",
      risk:
        "El plan de 30 dias puede convertirse en actividad dispersa en vez de una prueba de marketing enfocada."
    }
  },
  manual_operations: {
    en: {
      title: "Manual follow-up is constraining marketing execution",
      detail:
        "The profile points to repeated manual follow-up, handoff friction, or founder-dependent handling that affects leads, content, or conversion.",
      risk:
        "More marketing activity can create more unfinished follow-up instead of more qualified demand."
    },
    es: {
      title: "El seguimiento manual limita la ejecucion de marketing",
      detail:
        "El perfil apunta a seguimiento manual repetido, friccion en handoffs o gestion dependiente del fundador que afecta leads, contenido o conversion.",
      risk:
        "Mas actividad de marketing puede crear mas seguimiento incompleto en vez de mas demanda calificada."
    }
  },
  low_evidence: {
    en: {
      title: "Evidence depth is low",
      detail:
        "The profile has too little structured marketing evidence, visible positioning, conversion context, or customer proof to support a high-confidence diagnosis.",
      risk:
        "Recommendations may sound plausible but remain provisional until the marketing evidence is validated."
    },
    es: {
      title: "La profundidad de evidencia es baja",
      detail:
        "El perfil tiene poca evidencia estructurada de marketing, posicionamiento visible, contexto de conversion o prueba de cliente para sostener un diagnostico de alta confianza.",
      risk:
        "Las recomendaciones pueden sonar plausibles pero seguir provisionales hasta validar la evidencia de marketing."
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

function hasSocialOrEventEvidence(profile: BusinessProfileRecord) {
  const text = [
    profile.website,
    profile.positioningStatement,
    profile.acquisitionMethod,
    profile.salesProcess,
    profile.evidenceNotes,
    ...profile.currentChannels,
    ...profile.channelUrls,
    ...profile.biggestBottlenecks
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hasPattern(
    text,
    /instagram|tiktok|facebook|meta|whatsapp|dm|dms|social|community|waitlist|newsletter|pop[- ]?up|popup|event|events|market|tasting|dinner|booking|reservation|customer comment|customer feedback|testimonial|review|stories|story|followers|attendees|asistentes|comentarios|resenas|testimonios|feria|mercado|evento|cena|reserva/
  );
}

function websiteEvidenceNote(profile: BusinessProfileRecord, language: OutputLanguage) {
  if (filled(profile.website)) {
    return language === "es"
      ? "Hay evidencia de website aportada."
      : "Website evidence is provided.";
  }

  if (hasSocialOrEventEvidence(profile)) {
    return language === "es"
      ? "Todavia no se ha aportado evidencia de website; se usa evidencia social, de evento o feedback aportado como senal de marketing."
      : "No website evidence provided yet; social, event, or feedback evidence is used as marketing signal.";
  }

  return language === "es"
    ? "Todavia no se ha aportado evidencia de website."
    : "No website evidence provided yet.";
}

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items));
}

function evidenceLabel(language: OutputLanguage, key: EvidenceKey) {
  return evidenceLabels[language][key];
}

function evidenceList(language: OutputLanguage, keys: EvidenceKey[]) {
  return dedupe(keys).map((key) => evidenceLabel(language, key));
}

function factorStatus(score: number) {
  if (score >= 75) return "strong" as const;
  if (score >= 50) return "mixed" as const;
  return "weak" as const;
}

function allText(profile: BusinessProfileRecord) {
  return [
    profile.companyName,
    profile.website,
    profile.positioningStatement,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.conversionAction,
    profile.pricingModel,
    profile.acquisitionMethod,
    profile.salesProcess,
    profile.evidenceNotes,
    profile.budgetBand,
    profile.lifecycleStage,
    ...profile.channelUrls,
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
    profile.positioningStatement,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.conversionAction,
    profile.pricingModel,
    profile.acquisitionMethod,
    profile.salesProcess,
    profile.evidenceNotes,
    profile.budgetBand,
    profile.lifecycleStage
  ];
  const listFields = [
    profile.channelUrls,
    profile.currentChannels,
    profile.currentTools,
    profile.primaryGoals,
    profile.biggestBottlenecks
  ];
  const filledText = textFields.filter(filled).length;
  const filledLists = listFields.filter((items) => items.length > 0).length;

  return Math.round(((filledText + filledLists) / (textFields.length + listFields.length)) * 100);
}

function profileSpecificity(profile: BusinessProfileRecord) {
  const offerLength = profile.primaryOffer?.trim().length ?? 0;
  const audienceLength = profile.targetAudience?.trim().length ?? 0;
  const positioningLength = profile.positioningStatement?.trim().length ?? 0;
  const conversionLength = profile.conversionAction?.trim().length ?? 0;
  const salesProcessLength = profile.salesProcess?.trim().length ?? 0;
  const audience = normalize(profile.targetAudience);
  const genericAudience = hasPattern(
    audience,
    /\b(everyone|any business|all companies|small businesses|startups|customers|clients|todos|cualquier empresa|empresas|clientes)\b/
  );

  let score = 0;

  if (offerLength >= 90) score += 22;
  else if (offerLength >= 60) score += 16;
  else if (offerLength >= 30) score += 10;
  else if (offerLength > 0) score += 5;

  if (audienceLength >= 70 && !genericAudience) score += 22;
  else if (audienceLength >= 45 && !genericAudience) score += 16;
  else if (audienceLength > 0) score += genericAudience ? 6 : 10;

  if (profile.currentChannels.length >= 3) score += 16;
  else if (profile.currentChannels.length >= 2) score += 12;
  else if (profile.currentChannels.length >= 1) score += 6;

  if (positioningLength >= 70) score += 10;
  else if (positioningLength >= 35) score += 6;
  else if (positioningLength > 0) score += 3;

  if (conversionLength >= 25) score += 6;
  else if (conversionLength > 0) score += 3;

  if (salesProcessLength >= 45) score += 8;
  else if (salesProcessLength > 0) score += 4;

  if (filled(profile.pricingModel)) score += 5;

  if (profile.channelUrls.length >= 2) score += 5;
  else if (profile.channelUrls.length >= 1) score += 3;

  if (profile.currentTools.length >= 3) score += 14;
  else if (profile.currentTools.length >= 2) score += 10;
  else if (profile.currentTools.length >= 1) score += 5;

  if (profile.primaryGoals.length >= 2) score += 14;
  else if (profile.primaryGoals.length >= 1) score += 7;

  if (profile.biggestBottlenecks.length >= 2) score += 12;
  else if (profile.biggestBottlenecks.length >= 1) score += 6;

  return clamp(score, 0, 100);
}

function detectBusinessType(profile: BusinessProfileRecord): BusinessType {
  const text = allText(profile);

  if (hasPattern(text, /academy|course|cohort|training|education|school|skill|bootcamp|curso|formacion|academia/)) {
    return "academy";
  }

  if (hasPattern(text, /saas|subscription|software|platform|fintech|ledger|workflow|suscripcion|plataforma/)) {
    return "subscription";
  }

  if (hasPattern(text, /ecommerce|commerce|shop|retail|store|inventory|restaurant|food|catering|pop[- ]?up|popup|dinner|tasting|menu|booking|reservation|tienda|comercio|restaurante|comida|cena|degustacion|reserva/)) {
    return "commerce";
  }

  if (hasPattern(text, /studio|agency|service|consulting|retainer|client work|creative|design|consultoria|servicios|agencia|estudio/)) {
    return "services";
  }

  if (hasPattern(text, /marketplace|two-sided|supply|demand|mercado/)) {
    return "marketplace";
  }

  return "general";
}

function analyzeSignals(profile: BusinessProfileRecord): SignalMap {
  const offer = normalize(profile.primaryOffer);
  const audience = normalize(profile.targetAudience);
  const positioning = normalize(profile.positioningStatement);
  const conversionAction = normalize(profile.conversionAction);
  const pricingModel = normalize(profile.pricingModel);
  const acquisitionMethod = normalize(profile.acquisitionMethod);
  const salesProcess = normalize(profile.salesProcess);
  const evidenceNotes = normalize(profile.evidenceNotes);
  const tools = profile.currentTools.join(" ").toLowerCase();
  const channels = profile.currentChannels.join(" ").toLowerCase();
  const channelUrls = profile.channelUrls.join(" ").toLowerCase();
  const goals = profile.primaryGoals.join(" ").toLowerCase();
  const bottlenecks = profile.biggestBottlenecks.join(" ").toLowerCase();
  const commercialEvidence = `${conversionAction} ${pricingModel} ${acquisitionMethod} ${salesProcess}`;
  const visibleEvidence = `${positioning} ${channelUrls} ${normalize(profile.website)} ${evidenceNotes}`;
  const businessType = detectBusinessType(profile);
  const completeness = profileCompleteness(profile);
  const specificity = profileSpecificity(profile);
  const explicitUndefinedFunnel = hasPattern(
    `${goals} ${bottlenecks}`,
    /undefined funnel|no funnel|missing funnel|unclear funnel|no embudo|embudo no definido|sin embudo/
  );
  const explicitWeakReporting = hasPattern(
    `${goals} ${bottlenecks}`,
    /low .*report|weak .*report|no reporting|missing report|no weekly report|weak .*visibility|poor .*visibility|missing .*visibility|no .*visibility|no hay reporting|sin reporting|sin visibilidad|baja visibilidad|poca visibilidad|visibilidad debil/
  );
  const explicitNoCadence = hasPattern(
    `${goals} ${bottlenecks}`,
    /no operating cadence|no cadence|missing cadence|no weekly|no review rhythm|sin cadencia|no hay cadencia|no hay revision|sin revision semanal/
  );
  const explicitMessageConcern = hasPattern(
    `${goals} ${bottlenecks} ${evidenceNotes}`,
    /positioning|too broad|generic|sounds similar|do not always understand|do not understand|difference between|unclear message|unclear offer|proof page|trust comes from|message unclear|posicionamiento|demasiado amplio|generico|suena similar|no entienden|diferencia entre|mensaje poco claro|oferta poco clara|prueba publica|confianza viene/
  );
  const broadMarketingLanguage = hasPattern(
    `${audience} ${positioning}`,
    /\b(everyone|any business|all companies|all teams|all founders|small businesses|startups|founders and teams|founders and managers|help businesses grow|strategy, systems, and execution|growth support|strategy support|business support|marketing help|operations help|todos|cualquier empresa|todas las empresas|para todos|empresas pequeñas|emprendedores|ayuda de crecimiento|soporte estrategico)\b/
  );
  const socialOrEventEvidence = hasSocialOrEventEvidence(profile);

  const hasNicheClarity =
    audience.length >= 42 &&
    !hasPattern(audience, /\b(everyone|any business|all companies|small businesses|startups|customers|clients|founders and teams|founders and managers|todos|cualquier empresa|empresas|clientes|emprendedores)\b/);
  const hasVisiblePositioningEvidence =
    filled(profile.website) ||
    filled(profile.positioningStatement) ||
    profile.channelUrls.length > 0 ||
    socialOrEventEvidence;
  const hasConversionEvidence =
    filled(profile.conversionAction) &&
    (filled(profile.pricingModel) || filled(profile.salesProcess));
  const hasAcquisitionEvidence =
    profile.currentChannels.length > 0 ||
    profile.channelUrls.length > 0 ||
    filled(profile.acquisitionMethod) ||
    socialOrEventEvidence;
  const visibleEvidenceScore = clamp(
    (filled(profile.website) ? 8 : 0) +
      (profile.channelUrls.length >= 2 ? 16 : profile.channelUrls.length === 1 ? 10 : 0) +
      (socialOrEventEvidence ? 14 : 0) +
      (positioning.length >= 70 ? 18 : positioning.length >= 35 ? 12 : positioning.length > 0 ? 5 : 0) +
      (conversionAction.length >= 20 ? 14 : conversionAction.length > 0 ? 7 : 0) +
      (pricingModel.length >= 8 ? 10 : pricingModel.length > 0 ? 4 : 0) +
      (acquisitionMethod.length >= 35 ? 12 : acquisitionMethod.length > 0 ? 5 : 0) +
      (salesProcess.length >= 45 ? 14 : salesProcess.length > 0 ? 6 : 0) +
      (evidenceNotes.length >= 60 ? 14 : evidenceNotes.length > 0 ? 6 : 0),
    0,
    100
  );
  const hasOfferStructure =
    (offer.length >= 55 || positioning.length >= 60) &&
    hasPattern(
      `${offer} ${positioning} ${pricingModel} ${normalize(profile.businessModel)}`,
      /subscription|monthly|retainer|package|plan|course|cohort|audit|implementation|license|per seat|project|fixed|ticket|ticketed|booking|reservation|catering|menu|dinner|demo|trial|setup|workshop|suscripcion|mensual|paquete|plan|curso|implementacion|licencia|proyecto|reserva|cena|degustacion|demo/
    );
  const hasPositioningClarity =
    hasNicheClarity &&
    hasOfferStructure &&
    !broadMarketingLanguage &&
    (filled(profile.industry) || hasVisiblePositioningEvidence);
  const hasDefinedFunnel =
    !explicitUndefinedFunnel &&
    hasAcquisitionEvidence &&
    (filled(profile.conversionAction) || hasConversionEvidence) &&
    (profile.currentChannels.length >= 2 || filled(profile.acquisitionMethod) || socialOrEventEvidence) &&
    hasPattern(
      `${channels} ${channelUrls} ${tools} ${goals} ${commercialEvidence}`,
      /seo|paid|ads|content|email|referral|linkedin|instagram|tiktok|social|dm|whatsapp|outbound|inbound|webinar|event|pop[- ]?up|popup|waitlist|booking|reservation|sales|crm|hubspot|pipeline|conversion|demo|lead|cta|trafico|referidos|ventas|embudo|conversion|evento|reserva/
    );
  const hasMarketingMeasurementBasics =
    hasPattern(
      `${tools} ${evidenceNotes} ${goals} ${bottlenecks}`,
      /analytics|insights|instagram insights|metric|kpi|spreadsheet|sheet|google sheets|crm|hubspot|posthog|ga4|report|tracking|feedback|comments|reviews|bookings|attendees|inquiries|demo requests|qualified leads|analitica|metricas|hoja|comentarios|resenas|reservas|asistentes|consultas|leads calificados/
    );
  const hasDataVisibility =
    hasMarketingMeasurementBasics ||
    hasPattern(
      tools,
      /analytics|dashboard|crm|hubspot|salesforce|posthog|ga4|looker|metabase|mixpanel|segment|report|reporting|analitica|datos|dashboard|panel|crm/
    ) && hasPattern(`${goals} ${bottlenecks} ${tools} ${commercialEvidence} ${evidenceNotes}`, /metric|kpi|conversion|pipeline|report|quality|qualified|cohort|retention|mrr|cac|datos|metrica|conversion|calidad|retencion/);
  const hasReliableDataVisibility = hasDataVisibility && !explicitWeakReporting;
  const hasLeadQualityConcern = hasPattern(
    `${goals} ${bottlenecks} ${salesProcess} ${evidenceNotes}`,
    /lead quality|qualified lead|poor lead|bad lead|low conversion|wrong customer|poor fit|noisy demand|discount dependent|discount reliance|wrong program|program fit|enrollment quality|funnel not segmented|unsegmented funnel|calidad de lead|lead malo|baja conversion|mal cliente|prospectos incorrectos|dependencia de descuento|calidad de enrolamiento|programa incorrecto|embudo sin segmentar/
  ) || (
    businessType === "academy" &&
    hasPattern(
      `${goals} ${bottlenecks} ${offer} ${audience}`,
      /which program|per program|by program|discount|promo|completion rate|dropout|referral rate|enrollment criteria|lead source|source quality|tasa de finalizacion|abandono|por programa|descuento|fuente de lead/
    )
  );
  const hasCadence = !explicitNoCadence && hasPattern(
    `${goals} ${bottlenecks} ${tools} ${salesProcess} ${evidenceNotes}`,
    /weekly|cadence|review|standup|operating rhythm|dashboard review|reporting rhythm|owner|ownership|sprint|semanal|cadencia|revision|ritmo|responsable/
  );
  const manualOps = hasPattern(
    `${bottlenecks} ${goals} ${salesProcess} ${acquisitionMethod}`,
    /manual follow[- ]?up|manual lead|manual dm|manual outreach|manual whatsapp|handoff|spreadsheet|founder dependent|lead routing|sales follow[- ]?up|content approval|campaign follow[- ]?up|repetitive follow[- ]?up|seguimiento manual|lead manual|whatsapp manual|hoja de calculo|dependiente del fundador|aprobacion de contenido|seguimiento de campana/
  );
  const contradictions: Contradiction[] = [];

  const addContradiction = (
    key: ContradictionKey,
    title: string,
    detail: string,
    evidenceKeys: EvidenceKey[]
  ) => contradictions.push({ key, title, detail, evidenceKeys });

  if (
    hasPattern(normalize(profile.budgetBand), /under|<|low|bajo|menos/) &&
    hasPattern(`${goals} ${offer}`, /enterprise|scale|international|custom integration|global|integracion custom|escala/)
  ) {
    addContradiction(
      "low_budget_high_complexity",
      "Scale ambition is ahead of current budget",
      "The profile combines low budget language with enterprise, global, or custom-complexity ambition.",
      ["stage_budget", "offer_audience", "goals_bottlenecks"]
    );
  }

  if (profile.currentTools.length === 0 && hasPattern(goals, /data|analytics|report|dashboard|datos|analitica|reporte/)) {
    addContradiction(
      "data_goal_no_tools",
      "Data visibility is a goal, but no supporting tools are listed",
      "The profile asks for reporting or analytics clarity without naming any current CRM, analytics, or dashboard tooling.",
      ["operating_tools", "goals_bottlenecks"]
    );
  }

  if (
    hasPattern(
      tools,
      /analytics|dashboard|crm|hubspot|salesforce|posthog|ga4|looker|metabase|mixpanel|segment|report|reporting|analitica|datos|dashboard|panel|crm/
    ) &&
    explicitWeakReporting
  ) {
    addContradiction(
      "reporting_claim_conflict",
      "Reporting tools are listed, but visibility is still described as weak",
      "The profile names analytics or CRM tooling while also saying reporting visibility is weak or missing. That usually means instrumentation, ownership, or review cadence is not reliable yet.",
      ["operating_tools", "goals_bottlenecks", "operating_maturity"]
    );
  }

  if (
    hasPattern(normalize(profile.lifecycleStage), /growing|established|scale|scaled|mature|establecida|creciendo|madura/) &&
    (!hasDefinedFunnel || !hasReliableDataVisibility || !hasCadence)
  ) {
    addContradiction(
      "mature_stage_weak_foundation",
      "The stated maturity is stronger than the operating foundation",
      "The profile claims a growing or established stage while still missing funnel clarity, data visibility, or cadence signals.",
      ["stage_budget", "channel_mix", "operating_tools", "operating_maturity"]
    );
  }

  if (
    hasNicheClarity &&
    hasPattern(
      visibleEvidence,
      /\b(everyone|any business|all companies|all teams|all founders|for everyone|todos|cualquier empresa|todas las empresas|para todos)\b/
    )
  ) {
    addContradiction(
      "visible_positioning_audience_conflict",
      "Visible positioning is broader than the declared target audience",
      "The stated audience is relatively specific, but the visible positioning evidence still reads broad. The diagnostic treats positioning conclusions as provisional until the homepage or channel message is checked.",
      ["visible_positioning", "offer_audience", "contradictory_evidence"]
    );
  }

  if (
    filled(profile.conversionAction) &&
    !hasAcquisitionEvidence
  ) {
    addContradiction(
      "conversion_without_acquisition_evidence",
      "A conversion action is named without supporting acquisition evidence",
      "The profile names a CTA or conversion action, but does not show channels, channel URLs, or an acquisition method that can drive that conversion.",
      ["conversion_model", "channel_mix", "contradictory_evidence"]
    );
  }

  if (
    hasPattern(pricingModel, /custom|proposal|enterprise|bespoke|contact|personalizado|propuesta|enterprise/) &&
    hasPattern(offer, /self serve|fixed|standard|one package|buy now|autoservicio|fijo|estandar|comprar ahora/)
  ) {
    addContradiction(
      "pricing_offer_conflict",
      "Pricing model and offer packaging point in different directions",
      "The offer sounds standardized or self-serve, while pricing evidence sounds custom or proposal-led. That limits confidence in conversion and sales-process recommendations.",
      ["offer_audience", "conversion_model", "contradictory_evidence"]
    );
  }

  const issues: Issue[] = [];
  const addIssue = (
    key: IssueKey,
    severity: DiagnosticFinding["severity"],
    categories: Issue["categories"]
  ) => {
    if (!issues.some((issue) => issue.key === key)) {
      issues.push({ key, severity, categories });
    }
  };

  if (!hasPositioningClarity || explicitMessageConcern) {
    addIssue("unclear_positioning", "high", ["positioning", "acquisition"]);
  }

  if (!hasNicheClarity) {
    addIssue("no_niche_clarity", "high", ["positioning"]);
  }

  if (!hasDefinedFunnel) {
    addIssue("undefined_funnel", "high", ["acquisition", "data"]);
  }

  if (!hasReliableDataVisibility) {
    addIssue(
      "weak_reporting",
      hasDefinedFunnel || filled(profile.conversionAction) ? "medium" : "high",
      ["data", "execution"]
    );
  }

  if (hasLeadQualityConcern) {
    addIssue("poor_lead_quality", "high", ["acquisition", "positioning"]);
  }

  if (!hasOfferStructure) {
    addIssue("unclear_offer", "high", ["positioning", "execution"]);
  }

  if (!hasCadence && (hasDefinedFunnel || hasAcquisitionEvidence || hasConversionEvidence)) {
    addIssue("no_operating_cadence", "low", ["execution", "operations"]);
  }

  if (manualOps) {
    addIssue("manual_operations", "medium", ["operations", "execution"]);
  }

  const evidenceQuality = clamp(
    (completeness >= 80 ? 25 : completeness >= 60 ? 18 : completeness >= 40 ? 10 : 4) +
      (specificity >= 75 ? 25 : specificity >= 55 ? 18 : specificity >= 40 ? 10 : 4) +
      (profile.primaryGoals.length > 0 && profile.biggestBottlenecks.length > 0 ? 15 : 8) +
      (profile.currentChannels.length > 0 ? 12 : 4) +
      (profile.currentTools.length > 0 || hasMarketingMeasurementBasics ? 10 : 4) +
      (visibleEvidenceScore >= 75 ? 20 : visibleEvidenceScore >= 50 ? 14 : visibleEvidenceScore >= 25 ? 8 : 0) +
      (hasConversionEvidence ? 8 : 0) +
      (hasAcquisitionEvidence ? 6 : 0) +
      (hasDefinedFunnel ? 12 : 0) +
      (hasReliableDataVisibility ? 10 : hasMarketingMeasurementBasics ? 6 : 0) +
      (hasCadence ? 3 : 0) -
      contradictions.length * 10,
    0,
    100
  );

  const consistency = clamp(100 - contradictions.length * 25, 20, 100);
  const hasMinimumMarketingEvidence =
    hasVisiblePositioningEvidence &&
    hasAcquisitionEvidence &&
    (hasConversionEvidence || filled(profile.conversionAction) || socialOrEventEvidence);
  const insufficientSignal =
    completeness < 55 ||
    specificity < 45 ||
    evidenceQuality < 45 ||
    (!hasMinimumMarketingEvidence && visibleEvidenceScore < 35) ||
    !filled(profile.primaryOffer) ||
    !filled(profile.targetAudience) ||
    (profile.primaryGoals.length === 0 && profile.biggestBottlenecks.length === 0);

  if (insufficientSignal || completeness < 55) {
    addIssue(
      "low_evidence",
      insufficientSignal || completeness < 40 || specificity < 40 ? "high" : "medium",
      ["execution", "data", "positioning"]
    );
  }

  if (contradictions.length > 0) {
    addIssue(
      "contradictory_scale",
      contradictions.length >= 2 ? "high" : "medium",
      ["execution", "operations", "data"]
    );
  }

  const issuePriority: Record<IssueKey, number> = {
    contradictory_scale: 0,
    unclear_offer: 1,
    unclear_positioning: 2,
    no_niche_clarity: 3,
    undefined_funnel: 4,
    poor_lead_quality: 5,
    weak_reporting: 6,
    low_evidence: 7,
    no_operating_cadence: 8,
    manual_operations: 9
  };
  issues.sort((a, b) => {
    const severityWeight = { high: 0, medium: 1, low: 2 };
    const severityDelta = severityWeight[a.severity] - severityWeight[b.severity];
    return severityDelta || issuePriority[a.key] - issuePriority[b.key];
  });

  return {
    businessType,
    completeness,
    specificity,
    evidenceQuality,
    visibleEvidenceScore,
    consistency,
    insufficientSignal,
    hasVisiblePositioningEvidence,
    hasConversionEvidence,
    hasAcquisitionEvidence,
    hasCadence,
    hasDataVisibility: hasReliableDataVisibility,
    hasDefinedFunnel,
    hasNicheClarity,
    hasOfferStructure,
    hasPositioningClarity,
    hasSocialOrEventEvidence: socialOrEventEvidence,
    hasMarketingMeasurementBasics,
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
  const channelDepth =
    Math.min(profile.currentChannels.length, 3) * 3 +
    Math.min(profile.channelUrls.length, 2) * 2;
  const toolDepth = Math.min(profile.currentTools.length, 4) * 2;
  const goalDepth = Math.min(profile.primaryGoals.length, 3) * 3;

  const buildCategory = ({
    key,
    base,
    floor,
    ceiling,
    positives
  }: {
    key: keyof typeof labels.en;
    base: number;
    floor: number;
    ceiling: number;
    positives: ScoreDriver[];
  }): DiagnosticCategoryScore => {
    const negatives: ScoreDriver[] = signals.issues
      .filter((issue) => issue.categories.includes(key))
      .map((issue) => ({
        label: issueCopy[issue.key][language].title,
        points: -issuePenalty({ ...signals, issues: [issue] }, key),
        tone: "negative",
        basedOn: evidenceList(language, issueEvidenceMap[issue.key])
      }));
    const drivers = [...positives, ...negatives]
      .filter((driver) => driver.points !== 0)
      .sort((left, right) => Math.abs(right.points) - Math.abs(left.points));
    const score = clamp(
      base + drivers.reduce((total, driver) => total + driver.points, 0),
      floor,
      ceiling
    );
    const strongestNegative = drivers.find((driver) => driver.tone === "negative");
    const strongestPositive = drivers.find((driver) => driver.tone === "positive");
    const rationale =
      strongestNegative
        ? language === "es"
          ? `La puntuacion baja sobre todo por ${strongestNegative.label.toLowerCase()} y se apoya en ${strongestNegative.basedOn.join(", ")}.`
          : `This score is mainly pulled down by ${strongestNegative.label.toLowerCase()} and is grounded in ${strongestNegative.basedOn.join(", ")}.`
        : strongestPositive
          ? language === "es"
            ? `La puntuacion se sostiene sobre todo por ${strongestPositive.label.toLowerCase()} a partir de ${strongestPositive.basedOn.join(", ")}.`
            : `This score is mainly supported by ${strongestPositive.label.toLowerCase()} based on ${strongestPositive.basedOn.join(", ")}.`
          : language === "es"
            ? "La puntuacion se basa en la informacion capturada del perfil actual."
            : "This score is based on the currently captured profile evidence.";

    return {
      key,
      label: labels[language][key],
      score,
      rationale,
      basedOn: dedupe(drivers.flatMap((driver) => driver.basedOn)).slice(0, 4),
      drivers: drivers.slice(0, 4)
    };
  };

  return [
    buildCategory({
      key: "positioning",
      base: 60,
      floor: 18,
      ceiling: 92,
      positives: [
        {
          label:
            language === "es"
              ? "la oferta esta descrita con estructura"
              : "the offer is described with real structure",
          points: signals.hasOfferStructure ? 11 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["offer_audience", "conversion_model"])
        },
        {
          label:
            language === "es"
              ? "la audiencia es suficientemente especifica"
              : "the audience is specific enough to reason about",
          points: signals.hasNicheClarity ? 11 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["offer_audience", "visible_positioning"])
        },
        {
          label:
            language === "es"
              ? "hay evidencia visible de posicionamiento"
              : "visible positioning evidence is present",
          points: signals.hasVisiblePositioningEvidence ? 7 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["visible_positioning"])
        },
        {
          label:
            language === "es"
              ? "la especificidad del perfil evita una lectura generica"
              : "the profile is specific enough to avoid a generic read",
          points: signals.specificity >= 70 ? 4 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["offer_audience", "goals_bottlenecks"])
        }
      ]
    }),
    buildCategory({
      key: "acquisition",
      base: 58,
      floor: 18,
      ceiling: 90,
      positives: [
        {
          label:
            language === "es"
              ? "los canales actuales ya estan nombrados"
              : "the current channel mix is named",
          points: channelDepth,
          tone: "positive",
          basedOn: evidenceList(language, ["channel_mix", "visible_positioning"])
        },
        {
          label:
            language === "es"
              ? "hay un camino de embudo reconocible"
              : "there is a recognizable funnel path",
          points: signals.hasDefinedFunnel ? 12 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["channel_mix", "conversion_model"])
        },
        {
          label:
            language === "es"
              ? "el metodo de adquisicion esta descrito"
              : "the acquisition method is described",
          points: signals.hasAcquisitionEvidence ? 7 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["channel_mix", "conversion_model"])
        },
        {
          label:
            language === "es"
              ? "no aparece una alarma fuerte de calidad de lead"
              : "lead quality is not the main warning signal",
          points: signals.hasDefinedFunnel && !signals.hasLeadQualityConcern ? 4 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["goals_bottlenecks", "channel_mix", "conversion_model"])
        }
      ]
    }),
    buildCategory({
      key: "operations",
      base: 52,
      floor: 18,
      ceiling: 78,
      positives: [
        {
          label:
            language === "es"
              ? "hay herramientas de marketing o seguimiento listadas"
              : "marketing or tracking tools are listed",
          points: toolDepth,
          tone: "positive",
          basedOn: evidenceList(language, ["operating_tools"])
        },
        {
          label:
            language === "es"
              ? "existe un ritmo de revision de marketing"
              : "a marketing review rhythm is present",
          points: signals.hasCadence ? 4 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["operating_maturity", "goals_bottlenecks"])
        }
      ]
    }),
    buildCategory({
      key: "data",
      base: 50,
      floor: 15,
      ceiling: 88,
      positives: [
        {
          label:
            language === "es"
              ? "hay evidencia de medicion de marketing util"
              : "there is useful marketing measurement evidence",
          points: signals.hasDataVisibility ? 18 : signals.hasMarketingMeasurementBasics ? 12 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["operating_tools", "goals_bottlenecks", "conversion_model"])
        },
        {
          label:
            language === "es"
              ? "el embudo actual permite medir mejor"
              : "the current funnel makes measurement more usable",
          points: signals.hasDefinedFunnel ? 4 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["channel_mix", "operating_tools"])
        }
      ]
    }),
    buildCategory({
      key: "execution",
      base: 56,
      floor: 18,
      ceiling: 86,
      positives: [
        {
          label:
            language === "es"
              ? "los objetivos actuales estan explicitados"
              : "the current goals are explicit",
          points: goalDepth,
          tone: "positive",
          basedOn: evidenceList(language, ["goals_bottlenecks"])
        },
        {
          label:
            language === "es"
              ? "hay senales suficientes para elegir una prueba de marketing"
              : "there is enough signal to choose a marketing test",
          points: signals.hasDefinedFunnel || signals.hasConversionEvidence ? 10 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["channel_mix", "conversion_model", "goals_bottlenecks"])
        },
        {
          label:
            language === "es"
              ? "los cuellos de botella estan nombrados"
              : "the main bottlenecks are explicitly named",
          points: profile.biggestBottlenecks.length > 0 ? 3 : 0,
          tone: "positive",
          basedOn: evidenceList(language, ["goals_bottlenecks"])
        }
      ]
    })
  ];
}

function fallbackCompany(profile: BusinessProfileRecord, workspace: WorkspaceRecord) {
  return profile.companyName ?? workspace.name;
}

function localizeContradiction(
  contradiction: Contradiction,
  language: OutputLanguage
) {
  if (language === "es") {
    const copy: Record<ContradictionKey, { title: string; detail: string }> = {
      low_budget_high_complexity: {
        title: "La ambicion de escala va por delante del presupuesto actual",
        detail:
          "El perfil mezcla lenguaje de presupuesto bajo con ambicion enterprise, global o de alta complejidad."
      },
      data_goal_no_tools: {
        title: "Se pide visibilidad de datos, pero no hay herramientas declaradas",
        detail:
          "El perfil quiere claridad de reporting o analitica sin nombrar CRM, analytics o dashboards actuales."
      },
      reporting_claim_conflict: {
        title: "Hay herramientas de reporting, pero la visibilidad sigue siendo debil",
        detail:
          "El perfil nombra herramientas de analitica o CRM y a la vez dice que el reporting sigue siendo debil o inexistente. Eso suele indicar instrumentacion, ownership o cadencia de revision poco fiables."
      },
      mature_stage_weak_foundation: {
        title: "La etapa declarada es mas madura que la base operativa",
        detail:
          "El perfil dice estar creciendo o establecido pero aun faltan senales claras de embudo, datos o cadencia."
      },
      visible_positioning_audience_conflict: {
        title: "El posicionamiento visible es mas amplio que la audiencia declarada",
        detail:
          "La audiencia declarada es relativamente especifica, pero la evidencia visible de posicionamiento sigue sonando amplia. El diagnostico trata las conclusiones de posicionamiento como provisionales hasta revisar homepage o mensajes de canal."
      },
      conversion_without_acquisition_evidence: {
        title: "Hay una accion de conversion sin evidencia de adquisicion suficiente",
        detail:
          "El perfil nombra un CTA o accion de conversion, pero no muestra canales, URLs o metodo de adquisicion que puedan alimentar esa conversion."
      },
      pricing_offer_conflict: {
        title: "El modelo de precio y el empaquetado de oferta apuntan en direcciones distintas",
        detail:
          "La oferta suena estandarizada o autoservicio, mientras la evidencia de precio parece personalizada o basada en propuesta. Eso limita la confianza en recomendaciones de conversion y proceso comercial."
      }
    };

    return copy[contradiction.key];
  }

  return { title: contradiction.title, detail: contradiction.detail };
}

function evidenceQualityState(
  score: number,
  signals: Pick<SignalMap, "contradictions">
) {
  if (signals.contradictions.length > 0) return "contradictory" as const;
  if (score >= 70) return "clear" as const;
  if (score >= 35) return "weak" as const;
  return "missing" as const;
}

function validationNeeds(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
) {
  const needs: string[] = [];

  if (!signals.hasVisiblePositioningEvidence || !filled(profile.positioningStatement)) {
    needs.push(
      !filled(profile.website)
        ? language === "es"
          ? "Todavia no hay evidencia de website. Validar posicionamiento y mensaje visible de canal antes de tratar el gap de oferta como verdad fuerte."
          : "No website evidence provided yet. Validate positioning and visible channel message before treating the offer gap as firm truth."
        : language === "es"
          ? "Validar homepage, posicionamiento y mensaje visible antes de tratar el gap de oferta como verdad fuerte."
          : "Validate the homepage, positioning, and visible message before treating the offer gap as firm truth."
    );
  }

  if (!signals.hasConversionEvidence) {
    needs.push(
      language === "es"
        ? "Confirmar CTA, precio o modelo de ticket y proceso comercial antes de hacer recomendaciones fuertes de conversion."
        : "Confirm the CTA, price or ticket model, and sales process before making strong conversion recommendations."
    );
  }

  if (!signals.hasAcquisitionEvidence || !signals.hasDefinedFunnel) {
    needs.push(
      language === "es"
        ? "Confirmar metodo de adquisicion, canal principal y evento de conversion antes de escalar recomendaciones de canal."
        : "Confirm acquisition method, primary channel, and conversion event before scaling channel recommendations."
    );
  }

  if (!signals.hasDataVisibility) {
    needs.push(
      language === "es"
        ? "Verificar datos de pipeline, reporting o CRM antes de convertir la lectura en plan de medicion firme."
        : "Verify pipeline, reporting, or CRM data before turning the read into a firm measurement plan."
    );
  }

  if (signals.contradictions.length > 0) {
    needs.push(localizeContradiction(signals.contradictions[0], language).detail);
  }

  return dedupe(needs).slice(0, 4);
}

function confidenceFactorCards(
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticEvidenceCard[] {
  const factors = [
    {
      key: "completeness",
      label: language === "es" ? "Cobertura del perfil" : "Profile coverage",
      score: signals.completeness,
      basedOn: evidenceList(language, [
        "offer_audience",
        "channel_mix",
        "operating_tools",
        "goals_bottlenecks",
        "stage_budget"
      ])
    },
    {
      key: "consistency",
      label: language === "es" ? "Consistencia de entradas" : "Input consistency",
      score: signals.consistency,
      basedOn: evidenceList(language, [
        "stage_budget",
        "operating_tools",
        "goals_bottlenecks"
      ])
    },
    {
      key: "specificity",
      label: language === "es" ? "Especificidad" : "Specificity",
      score: signals.specificity,
      basedOn: evidenceList(language, ["offer_audience", "channel_mix", "goals_bottlenecks"])
    },
    {
      key: "evidence_quality",
      label: language === "es" ? "Calidad de evidencia" : "Evidence quality",
      score: signals.evidenceQuality,
      basedOn: evidenceList(language, [
        "operating_tools",
        "channel_mix",
        "conversion_model"
      ])
    }
  ];

  return factors.map((factor) => ({
    title: factor.label,
    observation:
      language === "es"
        ? `${factor.score}/100.`
        : `${factor.score}/100.`,
    implication:
      factor.key === "completeness"
        ? language === "es"
          ? factorStatus(factor.score) === "strong"
            ? "La mayor parte de las entradas clave esta cubierta."
            : factorStatus(factor.score) === "mixed"
              ? "Hay suficiente cobertura para orientar, pero aun faltan piezas importantes."
              : "Faltan campos clave, asi que el diagnostico solo puede ser direccional."
          : factorStatus(factor.score) === "strong"
            ? "Most core inputs are covered."
            : factorStatus(factor.score) === "mixed"
              ? "There is enough coverage to orient the read, but important gaps remain."
              : "Key fields are missing, so the diagnostic can only be directional."
        : factor.key === "consistency"
          ? language === "es"
            ? factorStatus(factor.score) === "strong"
              ? "Las entradas no muestran conflictos importantes."
              : factorStatus(factor.score) === "mixed"
                ? "Hay alguna tension entre senales, pero todavia se puede orientar el resultado."
                : "Hay conflictos entre senales, por eso la confianza baja intencionalmente."
            : factorStatus(factor.score) === "strong"
              ? "The inputs do not show major conflicts."
              : factorStatus(factor.score) === "mixed"
                ? "There is some tension between signals, but the output can still be directional."
                : "Conflicting signals are present, so confidence is intentionally reduced."
          : factor.key === "specificity"
            ? language === "es"
              ? factorStatus(factor.score) === "strong"
                ? "La oferta, la audiencia y los problemas estan descritos con suficiente precision."
                : factorStatus(factor.score) === "mixed"
                  ? "Parte del perfil es concreta, pero aun hay descripciones amplias."
                  : "La oferta, la audiencia o los problemas siguen demasiado vagos para una lectura firme."
              : factorStatus(factor.score) === "strong"
                ? "The offer, audience, and problems are described with enough precision."
                : factorStatus(factor.score) === "mixed"
                  ? "Parts of the profile are concrete, but some descriptions remain broad."
                  : "The offer, audience, or problems are still too vague for a firm read."
            : language === "es"
              ? factorStatus(factor.score) === "strong"
                ? "Las senales actuales permiten sostener una lectura mas confiable."
                : factorStatus(factor.score) === "mixed"
                  ? "La evidencia alcanza para orientar, pero no para afirmar demasiado."
                  : "La evidencia actual no sostiene conclusiones fuertes."
              : factorStatus(factor.score) === "strong"
                ? "The current signals support a more reliable read."
                : factorStatus(factor.score) === "mixed"
                  ? "There is enough evidence to orient the output, but not to overstate it."
                  : "The current evidence does not support strong conclusions.",
    basedOn: factor.basedOn,
    signalQuality: factorStatus(factor.score),
    evidenceQuality:
      factor.key === "consistency" && signals.contradictions.length > 0
        ? "contradictory"
        : factor.key === "evidence_quality"
          ? evidenceQualityState(factor.score, signals)
          : factorStatus(factor.score) === "strong"
            ? "clear"
            : factorStatus(factor.score) === "mixed"
              ? "weak"
              : "missing"
  }));
}

function buildBottlenecks(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  if (signals.insufficientSignal) {
    findings.push({
      title:
        language === "es"
          ? "No hay suficiente senal para un diagnostico firme"
          : "There is not enough signal for a firm diagnostic",
      detail:
        language === "es"
          ? "Faltan detalles especificos de oferta, audiencia, canales, herramientas, objetivos o cuellos de botella. El resto del resultado debe leerse como orientacion y no como conclusion fuerte."
          : "Specific detail is still missing across the offer, audience, channels, tools, goals, or bottlenecks. The rest of the output should be read as directional guidance, not as a strong conclusion.",
      severity: "high",
      basedOn: evidenceList(language, [
        "offer_audience",
        "channel_mix",
        "operating_tools",
        "goals_bottlenecks"
      ])
    });
  }

  const explicit = profile.biggestBottlenecks.slice(0, 3).map((item) => {
    const normalized = item.toLowerCase();
    const matchedIssue =
      signals.issues.find((issue) => normalized.includes(issue.key.replaceAll("_", " "))) ??
      signals.issues.find((issue) => {
        if (issue.key === "manual_operations") return /manual|handoff|onboarding|delivery|operacion|entrega/.test(normalized);
        if (issue.key === "poor_lead_quality") return /lead|conversion|qualified|calidad|prospecto/.test(normalized);
        if (issue.key === "undefined_funnel") return /funnel|channel|canal|embudo/.test(normalized);
        if (issue.key === "weak_reporting") return /report|data|metric|dato|metrica/.test(normalized);
        if (issue.key === "unclear_positioning") return /position|broad|generic|similar|understand|difference|proof|trust|message|posicion|amplio|generico|entiende|diferencia|prueba|confianza|mensaje/.test(normalized);
        if (issue.key === "unclear_offer") return /offer|package|pricing|scope|what they buy|oferta|paquete|precio|alcance|que compran/.test(normalized);
        if (issue.key === "no_niche_clarity") return /audience|segment|buyer|cliente|audiencia|segmento|comprador/.test(normalized);
        return false;
      });

    return {
      title: matchedIssue
        ? issueCopy[matchedIssue.key][language].title
        : language === "es"
          ? "Restriccion de marketing capturada"
          : "Captured marketing constraint",
      detail:
        language === "es"
          ? `La entrada capturada menciona "${item}". Se trata como una restriccion que debe resolverse antes de elegir el proximo test de marketing.`
          : `The captured input references "${item}". This is treated as a marketing constraint to resolve before choosing the next test.`,
      severity: matchedIssue?.severity ?? ("medium" as const),
      basedOn: matchedIssue
        ? evidenceList(language, issueEvidenceMap[matchedIssue.key])
        : evidenceList(language, ["goals_bottlenecks"])
    };
  });
  const uniqueExplicit = explicit.filter(
    (finding, index, allFindings) =>
      allFindings.findIndex((item) => item.title === finding.title) === index
  );

  if (uniqueExplicit.length > 0) {
    return [...findings, ...uniqueExplicit].slice(0, 3);
  }

  return [
    ...findings,
    ...signals.issues.slice(0, 3).map((issue) => ({
      title: issueCopy[issue.key][language].title,
      detail: issueCopy[issue.key][language].detail,
      severity: issue.severity,
      basedOn: evidenceList(language, issueEvidenceMap[issue.key])
    }))
  ].slice(0, 3);
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
    severity: issue.severity,
    basedOn: evidenceList(language, issueEvidenceMap[issue.key])
  }));

  if (signals.contradictions.length > 0) {
    const contradiction = localizeContradiction(signals.contradictions[0], language);
    risks.unshift({
      title: contradiction.title,
      detail:
        language === "es"
          ? `${contradiction.detail} Hasta resolver esta ambiguedad, el sistema reduce la confianza en el resultado.`
          : `${contradiction.detail} Until this ambiguity is resolved, the system intentionally lowers confidence in the output.`,
      severity: "high",
      basedOn: evidenceList(language, signals.contradictions[0].evidenceKeys)
    });
  }

  if (profile.biggestBottlenecks.length > 0 && risks.length < 2) {
    risks.push({
      title:
        language === "es"
          ? "Los cuellos de botella pueden bloquear el plan"
          : "Bottlenecks may block the plan",
      detail:
        language === "es"
          ? "Hay restricciones capturadas en el perfil, pero aun falta convertirlas en prioridades de marketing medibles."
          : "The profile contains constraints, but they still need to be converted into measurable marketing priorities.",
      severity: "medium",
      basedOn: evidenceList(language, ["goals_bottlenecks"])
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
      severity: "medium",
      basedOn: evidenceList(language, ["goals_bottlenecks"])
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
          ? "Antes de crear un plan, el equipo deberia cerrar los vacios principales de oferta, audiencia, CTA, embudo, prueba o medicion."
          : "Before creating a plan, the team should close the main gaps in offer, audience, CTA, funnel, proof, or measurement.",
      severity: "medium",
      basedOn: evidenceList(language, [
        "offer_audience",
        "channel_mix",
        "operating_tools",
        "operating_maturity"
      ])
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
        impact: "high",
        basedOn: evidenceList(language, [
          "channel_mix",
          "goals_bottlenecks",
          "offer_audience"
        ])
      },
      es: {
        title: "Segmentar leads por intencion de programa y mapear el ciclo enrolamiento-finalizacion",
        detail:
          "Dividir fuentes de lead por fit de programa, mapear activador de enrolamiento, onboarding, finalizacion y referidos. Marcar enrolamientos dependientes de descuento por separado. Medir cada etapa antes de escalar.",
        impact: "high",
        basedOn: evidenceList(language, [
          "channel_mix",
          "goals_bottlenecks",
          "offer_audience"
        ])
      }
    },
    commerce: {
      en: {
        title: "Separate channel response, conversion, and repeat purchase signals",
        detail:
          "Track how each channel creates inquiries, bookings, purchases, repeat interest, or customer feedback before increasing activity.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "goals_bottlenecks"])
      },
      es: {
        title: "Separar respuesta de canal, conversion y recompra",
        detail:
          "Medir como cada canal crea consultas, reservas, compras, interes repetido o feedback de cliente antes de aumentar actividad.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "goals_bottlenecks"])
      }
    },
    marketplace: {
      en: {
        title: "Instrument both sides of the marketplace",
        detail:
          "Track supply activation and demand conversion separately before scaling either side.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "offer_audience"])
      },
      es: {
        title: "Instrumentar ambos lados del marketplace",
        detail:
          "Medir activacion de oferta y conversion de demanda por separado antes de escalar cualquiera de los lados.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "offer_audience"])
      }
    },
    services: {
      en: {
        title: "Package the service into a clearer market-facing offer",
        detail:
          "Turn the service into one clear promise, one buyer segment, one proof point, and one next step before asking channels to create more demand.",
        impact: "high",
        basedOn: evidenceList(language, ["offer_audience", "operating_maturity", "goals_bottlenecks"])
      },
      es: {
        title: "Empaquetar el servicio como una oferta mas clara de cara al mercado",
        detail:
          "Convertir el servicio en una promesa clara, un segmento comprador, una prueba y un siguiente paso antes de pedir mas demanda a los canales.",
        impact: "high",
        basedOn: evidenceList(language, ["offer_audience", "operating_maturity", "goals_bottlenecks"])
      }
    },
    subscription: {
      en: {
        title: "Define the CTA-to-activation path",
        detail:
          "Connect the first CTA, qualified demo or signup, activation event, and proof of value before adding more demand.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "goals_bottlenecks"])
      },
      es: {
        title: "Definir el camino de CTA a activacion",
        detail:
          "Conectar primer CTA, demo o registro calificado, evento de activacion y prueba de valor antes de sumar mas demanda.",
        impact: "high",
        basedOn: evidenceList(language, ["channel_mix", "operating_tools", "goals_bottlenecks"])
      }
    },
    general: {
      en: {
        title: `Use ${channel} as the first measurable marketing test`,
        detail:
          "Pick one channel, one conversion event, one proof point, and one weekly decision before expanding the marketing plan.",
        impact: "medium",
        basedOn: evidenceList(language, ["channel_mix", "goals_bottlenecks"])
      },
      es: {
        title: `Usar ${channel} como primera prueba de marketing medible`,
        detail:
          "Elegir un canal, un evento de conversion, una prueba y una decision semanal antes de ampliar el plan de marketing.",
        impact: "medium",
        basedOn: evidenceList(language, ["channel_mix", "goals_bottlenecks"])
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
      ? `Convertir esta restriccion en una prueba pequena de marketing antes de construir el plan: ${issueCopy[issue.key][language].detail}`
      : `Turn this constraint into a small marketing test before building the plan: ${issueCopy[issue.key][language].detail}`;

  return {
    title,
    detail,
    impact: issue.severity === "high" ? "high" : "medium",
    basedOn: evidenceList(language, issueEvidenceMap[issue.key])
  };
}

function buildOpportunities(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticOpportunity[] {
  const opportunities: DiagnosticOpportunity[] = [];

  if (signals.insufficientSignal) {
    opportunities.push({
      title:
        language === "es"
          ? "Fortalecer la base de marketing antes de escalar decisiones"
          : "Strengthen the marketing baseline before scaling decisions",
      detail:
        language === "es"
          ? "Completa oferta, audiencia, CTA, canales, prueba, medicion y cuellos de botella para que el siguiente diagnostico sea mas util que una orientacion general."
          : "Complete the offer, audience, CTA, channels, proof, measurement, and bottlenecks so the next diagnostic can be more than directional guidance.",
      impact: "high",
      basedOn: evidenceList(language, [
        "offer_audience",
        "channel_mix",
        "operating_tools",
        "goals_bottlenecks"
      ])
    });
  }

  opportunities.push(
    businessTypeOpportunity(signals.businessType, profile, language),
    ...signals.issues.slice(0, 3).map((issue) => issueOpportunity(issue, language))
  );

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
      impact: "medium",
      basedOn: evidenceList(language, ["operating_maturity", "goals_bottlenecks"])
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
  const needs = validationNeeds(profile, language, signals);
  const typeOwner =
    signals.businessType === "services"
      ? "Founder / Delivery lead"
      : signals.businessType === "academy"
        ? "Founder / Program owner"
        : signals.businessType === "subscription"
        ? "Founder / Product lead"
        : "Workspace owner";

  if (language === "es") {
    const actions: DiagnosticNextAction[] = [];

    if (signals.insufficientSignal) {
      actions.push({
        title: "Completar la senal minima del perfil",
        detail:
          "Antes de tratar el resultado como firme, completa oferta, audiencia, canales, herramientas, objetivos y cuellos de botella con mas precision.",
        owner: "Owner o admin",
        timeframe: "Hoy",
        basedOn: evidenceList(language, [
          "offer_audience",
          "channel_mix",
          "operating_tools",
          "goals_bottlenecks"
        ])
      });
    }

    if (signals.contradictions.length > 0) {
      actions.push({
        title: "Resolver la ambiguedad principal del perfil",
        detail: `${localizeContradiction(signals.contradictions[0], language).detail}`,
        owner: "Owner o admin",
        timeframe: "Hoy",
        basedOn: evidenceList(language, signals.contradictions[0].evidenceKeys)
      });
    }

    if (needs.length > 0) {
      actions.push({
        title: "Validar la evidencia que falta",
        detail: needs[0],
        owner: "Owner o admin",
        timeframe: "Hoy",
        basedOn: evidenceList(language, ["missing_evidence", "visible_positioning", "conversion_model"])
      });
    }

    actions.push(
      {
        title: "Cerrar la hipotesis principal de posicionamiento",
        detail: firstIssue
          ? `Resolver primero: ${issueCopy[firstIssue.key].es.detail}`
          : "Confirmar audiencia, promesa y oferta antes de convertir el diagnostico en roadmap.",
        owner: "Owner o admin",
        timeframe: "Hoy",
        basedOn: firstIssue
          ? evidenceList(language, issueEvidenceMap[firstIssue.key])
          : evidenceList(language, ["offer_audience"])
      },
      {
        title: "Definir una prueba de embudo medible",
        detail:
          profile.currentChannels.length > 0
            ? `Usar ${profile.currentChannels[0]} como canal de prueba y asignar una metrica de conversion.`
            : "Elegir un canal principal y una metrica de conversion antes de expandir adquisicion.",
        owner: typeOwner,
        timeframe: "Esta semana",
        basedOn: evidenceList(language, ["channel_mix", "goals_bottlenecks"])
      },
      {
        title: "Instalar una cadencia de revision",
        detail:
          "Revisar semanalmente score, calidad de leads, avance de acciones y decisiones bloqueadas.",
        owner: "Founder u operador",
        timeframe: "Proximos 7 dias",
        basedOn: evidenceList(language, ["operating_maturity", "operating_tools"])
      }
    );

    return actions.slice(0, 3);
  }

  const actions: DiagnosticNextAction[] = [];

  if (signals.insufficientSignal) {
    actions.push({
      title: "Complete the minimum signal set",
      detail:
        "Before treating this output as firm, fill the offer, audience, channels, tools, goals, and bottlenecks with more specificity.",
      owner: "Owner or admin",
      timeframe: "Today",
      basedOn: evidenceList(language, [
        "offer_audience",
        "channel_mix",
        "operating_tools",
        "goals_bottlenecks"
      ])
    });
  }

  if (signals.contradictions.length > 0) {
    actions.push({
      title: "Resolve the main profile ambiguity",
      detail: `${localizeContradiction(signals.contradictions[0], language).detail}`,
      owner: "Owner or admin",
      timeframe: "Today",
      basedOn: evidenceList(language, signals.contradictions[0].evidenceKeys)
    });
  }

  if (needs.length > 0) {
    actions.push({
      title: "Validate the missing evidence",
      detail: needs[0],
      owner: "Owner or admin",
      timeframe: "Today",
      basedOn: evidenceList(language, ["missing_evidence", "visible_positioning", "conversion_model"])
    });
  }

  actions.push(
    {
      title: "Close the primary positioning hypothesis",
      detail: firstIssue
        ? `Resolve this first: ${issueCopy[firstIssue.key].en.detail}`
        : "Confirm audience, promise, and offer before converting the diagnostic into a roadmap.",
      owner: "Owner or admin",
      timeframe: "Today",
      basedOn: firstIssue
        ? evidenceList(language, issueEvidenceMap[firstIssue.key])
        : evidenceList(language, ["offer_audience"])
    },
    {
      title: "Define one measurable funnel test",
      detail:
        profile.currentChannels.length > 0
          ? `Use ${profile.currentChannels[0]} as the test channel and assign one conversion metric.`
          : "Choose one primary channel and one conversion metric before expanding acquisition.",
      owner: typeOwner,
      timeframe: "This week",
      basedOn: evidenceList(language, ["channel_mix", "goals_bottlenecks"])
    },
    {
      title: "Install an operating review cadence",
      detail:
        "Review score, lead quality, action progress, and blocked decisions every week.",
      owner: "Founder or operator",
      timeframe: "Next 7 days",
      basedOn: evidenceList(language, ["operating_maturity", "operating_tools"])
    }
  );

  return actions.slice(0, 3);
}

function buildEvidence(
  profile: BusinessProfileRecord,
  language: OutputLanguage,
  signals: SignalMap
): DiagnosticEvidenceCard[] {
  const cards: DiagnosticEvidenceCard[] = [];
  const needs = validationNeeds(profile, language, signals);
  const visibleQuality = evidenceQualityState(signals.visibleEvidenceScore, signals);
  const conversionQuality = signals.contradictions.some((item) =>
    ["conversion_without_acquisition_evidence", "pricing_offer_conflict"].includes(item.key)
  )
    ? "contradictory"
    : signals.hasConversionEvidence
      ? "clear"
      : filled(profile.conversionAction) ||
          filled(profile.pricingModel) ||
          filled(profile.acquisitionMethod) ||
          filled(profile.salesProcess)
        ? "weak"
        : "missing";
  const channelQuality = signals.contradictions.some(
    (item) => item.key === "conversion_without_acquisition_evidence"
  )
    ? "contradictory"
    : signals.hasDefinedFunnel
      ? "clear"
      : signals.hasAcquisitionEvidence
        ? "weak"
        : "missing";

  if (language === "es") {
    cards.push(
      {
        title: "Oferta y audiencia",
        observation:
          filled(profile.primaryOffer) && filled(profile.targetAudience)
            ? `Oferta declarada, audiencia declarada y posicionamiento visible ${profile.positioningStatement ? "capturado" : "pendiente"}. ${websiteEvidenceNote(profile, language)} Especificidad ${signals.specificity}/100.`
            : `Falta detalle claro de oferta o audiencia. ${websiteEvidenceNote(profile, language)}`,
        implication:
          signals.hasPositioningClarity
            ? "Esta base permite una lectura mas enfocada del posicionamiento."
            : "Cuando oferta o audiencia siguen amplias, el diagnostico debe bajar la certeza.",
        basedOn: evidenceList(language, ["founder_inputs", "offer_audience", "visible_positioning"]),
        signalQuality:
          signals.hasPositioningClarity && signals.specificity >= 70 ? "strong" : signals.specificity >= 50 ? "mixed" : "weak",
        evidenceQuality: visibleQuality,
        needsValidation: needs.filter((need) => need.toLowerCase().includes("homepage") || need.toLowerCase().includes("posicionamiento"))
      },
      {
        title: "Canales y ruta de embudo",
        observation:
          profile.currentChannels.length > 0
            ? `Canales actuales: ${profile.currentChannels.join(", ")}. URLs aportadas: ${profile.channelUrls.length}. Metodo de adquisicion ${profile.acquisitionMethod ? "capturado" : "pendiente"}.`
            : "No se declararon canales actuales.",
        implication:
          signals.hasDefinedFunnel
            ? "El sistema puede conectar estos canales a una ruta de conversion reconocible."
            : "Sin una ruta de conversion clara, el resultado solo puede orientar sobre el embudo.",
        basedOn: evidenceList(language, ["channel_mix", "visible_positioning", "conversion_model", "goals_bottlenecks"]),
        signalQuality: signals.hasDefinedFunnel ? "strong" : profile.currentChannels.length > 0 || profile.channelUrls.length > 0 ? "mixed" : "weak",
        evidenceQuality: channelQuality,
        needsValidation: needs.filter((need) => need.toLowerCase().includes("adquisicion") || need.toLowerCase().includes("canal"))
      },
      {
        title: "Conversion, precio y proceso comercial",
        observation:
          signals.hasConversionEvidence
            ? `CTA, precio o ticket y proceso comercial estan capturados. Evidencia visible ${signals.visibleEvidenceScore}/100.`
            : `CTA ${profile.conversionAction ? "capturado" : "pendiente"}, precio ${profile.pricingModel ? "capturado" : "pendiente"} y proceso comercial ${profile.salesProcess ? "capturado" : "pendiente"}.`,
        implication:
          signals.hasConversionEvidence
            ? "El diagnostico puede hacer recomendaciones de conversion con mas base."
            : "Las recomendaciones de conversion y ventas siguen siendo provisionales hasta completar esta evidencia.",
        basedOn: evidenceList(language, ["conversion_model", "visible_positioning", "missing_evidence"]),
        signalQuality: signals.hasConversionEvidence ? "strong" : conversionQuality === "missing" ? "weak" : "mixed",
        evidenceQuality: conversionQuality,
        needsValidation: needs.filter((need) => need.toLowerCase().includes("cta") || need.toLowerCase().includes("precio") || need.toLowerCase().includes("conversion"))
      },
      {
        title: "Medicion y ejecucion de marketing",
        observation:
          profile.currentTools.length > 0
            ? `Herramientas actuales: ${profile.currentTools.join(", ")}. Medicion basica ${signals.hasMarketingMeasurementBasics ? "presente" : "por afinar"}.`
            : `No se declararon herramientas actuales. Medicion basica ${signals.hasMarketingMeasurementBasics ? "presente" : "pendiente"}.`,
        implication:
          signals.hasDataVisibility
            ? "Hay base para revisar respuesta de canal, conversion o feedback con mas confianza."
            : "La medicion de marketing sigue demasiado debil para afirmar de mas.",
        basedOn: evidenceList(language, ["operating_tools", "operating_maturity", "conversion_model"]),
        signalQuality:
          signals.hasDataVisibility ? "strong" : profile.currentTools.length > 0 || signals.hasMarketingMeasurementBasics ? "mixed" : "weak",
        evidenceQuality: signals.hasDataVisibility ? "clear" : profile.currentTools.length > 0 || signals.hasMarketingMeasurementBasics ? "weak" : "missing",
        needsValidation: needs.filter((need) => need.toLowerCase().includes("datos") || need.toLowerCase().includes("crm") || need.toLowerCase().includes("reporting"))
      },
      {
        title: "Objetivos, cuellos de botella y confianza",
        observation: `Objetivos: ${profile.primaryGoals.length}. Cuellos de botella: ${profile.biggestBottlenecks.length}. Completitud ${signals.completeness}/100, consistencia ${signals.consistency}/100, calidad de evidencia ${signals.evidenceQuality}/100, evidencia visible ${signals.visibleEvidenceScore}/100.`,
        implication: signals.insufficientSignal
          ? "La salida debe tratarse como direccional hasta completar mas senales."
          : signals.contradictions.length > 0
            ? "Hay ambiguedades reales en el perfil, por eso la confianza se reduce intencionalmente."
            : "La confianza refleja cobertura, consistencia, especificidad y calidad de evidencia, no optimismo del sistema.",
        basedOn: evidenceList(language, [
          "goals_bottlenecks",
          "stage_budget",
          "offer_audience",
          "operating_tools"
        ]),
        signalQuality: factorStatus(Math.round((signals.evidenceQuality + signals.consistency) / 2))
        ,
        evidenceQuality: evidenceQualityState(signals.evidenceQuality, signals),
        needsValidation: needs
      }
    );

    if (needs.length > 0) {
      cards.push({
        title: "Lo que todavia necesita validacion",
        observation: needs.join(" "),
        implication:
          "Estas validaciones separan una hipotesis util de una conclusion fuerte para pilotos reales.",
        basedOn: evidenceList(language, ["missing_evidence", "contradictory_evidence"]),
        signalQuality: "weak",
        evidenceQuality: signals.contradictions.length > 0 ? "contradictory" : "weak",
        needsValidation: needs
      });
    }

    if (signals.contradictions.length > 0) {
      const contradiction = localizeContradiction(signals.contradictions[0], language);
      cards.push({
        title: "Ambiguedad detectada",
        observation: contradiction.title,
        implication: contradiction.detail,
        basedOn: evidenceList(language, signals.contradictions[0].evidenceKeys),
        signalQuality: "weak"
      });
    }

    if (signals.insufficientSignal || signals.contradictions.length > 0) {
      cards.push(...confidenceFactorCards(language, signals));
    }

    return cards;
  }

  cards.push(
    {
      title: "Offer and audience",
      observation:
        filled(profile.primaryOffer) && filled(profile.targetAudience)
          ? `Offer, target audience, and visible positioning are ${profile.positioningStatement ? "captured" : "partly captured"}. ${websiteEvidenceNote(profile, language)} Specificity is ${signals.specificity}/100.`
          : `Offer or audience detail is still missing. ${websiteEvidenceNote(profile, language)}`,
      implication:
        signals.hasPositioningClarity
          ? "This gives the diagnostic a more focused positioning base."
          : "When the offer or audience remains broad, the output should reduce certainty instead of sounding authoritative.",
      basedOn: evidenceList(language, ["founder_inputs", "offer_audience", "visible_positioning"]),
      signalQuality:
        signals.hasPositioningClarity && signals.specificity >= 70 ? "strong" : signals.specificity >= 50 ? "mixed" : "weak",
      evidenceQuality: visibleQuality,
      needsValidation: needs.filter((need) => need.toLowerCase().includes("homepage") || need.toLowerCase().includes("positioning"))
    },
    {
      title: "Channel mix and funnel path",
      observation:
        profile.currentChannels.length > 0
          ? `Current channels: ${profile.currentChannels.join(", ")}. URLs provided: ${profile.channelUrls.length}. Acquisition method is ${profile.acquisitionMethod ? "captured" : "pending"}.`
          : "No current channels are listed.",
      implication:
        signals.hasDefinedFunnel
          ? "The system can connect these channels to a recognizable conversion path."
          : "Without a clear conversion path, the output can only be directional about funnel issues.",
      basedOn: evidenceList(language, ["channel_mix", "visible_positioning", "conversion_model", "goals_bottlenecks"]),
      signalQuality: signals.hasDefinedFunnel ? "strong" : profile.currentChannels.length > 0 || profile.channelUrls.length > 0 ? "mixed" : "weak",
      evidenceQuality: channelQuality,
      needsValidation: needs.filter((need) => need.toLowerCase().includes("acquisition") || need.toLowerCase().includes("channel"))
    },
    {
      title: "Conversion, pricing, and sales process",
      observation:
        signals.hasConversionEvidence
          ? `CTA, price or ticket model, and sales process are captured. Visible evidence is ${signals.visibleEvidenceScore}/100.`
          : `CTA is ${profile.conversionAction ? "captured" : "pending"}, pricing is ${profile.pricingModel ? "captured" : "pending"}, and sales process is ${profile.salesProcess ? "captured" : "pending"}.`,
      implication:
        signals.hasConversionEvidence
          ? "The diagnostic can make conversion recommendations from a stronger base."
          : "Conversion and sales recommendations remain provisional until this evidence is filled in.",
      basedOn: evidenceList(language, ["conversion_model", "visible_positioning", "missing_evidence"]),
      signalQuality: signals.hasConversionEvidence ? "strong" : conversionQuality === "missing" ? "weak" : "mixed",
      evidenceQuality: conversionQuality,
      needsValidation: needs.filter((need) => need.toLowerCase().includes("cta") || need.toLowerCase().includes("price") || need.toLowerCase().includes("conversion"))
    },
    {
      title: "Measurement and marketing execution",
      observation:
        profile.currentTools.length > 0
          ? `Current tools: ${profile.currentTools.join(", ")}. Basic measurement is ${signals.hasMarketingMeasurementBasics ? "present" : "still to sharpen"}.`
          : `No current tools are listed. Basic measurement is ${signals.hasMarketingMeasurementBasics ? "present" : "pending"}.`,
      implication:
        signals.hasDataVisibility
          ? "There is enough structure to review channel response, conversion, or feedback with more confidence."
          : "Marketing measurement is still too weak to justify strong certainty.",
      basedOn: evidenceList(language, ["operating_tools", "operating_maturity", "conversion_model"]),
      signalQuality:
        signals.hasDataVisibility ? "strong" : profile.currentTools.length > 0 || signals.hasMarketingMeasurementBasics ? "mixed" : "weak",
      evidenceQuality: signals.hasDataVisibility ? "clear" : profile.currentTools.length > 0 || signals.hasMarketingMeasurementBasics ? "weak" : "missing",
      needsValidation: needs.filter((need) => need.toLowerCase().includes("data") || need.toLowerCase().includes("crm") || need.toLowerCase().includes("reporting"))
    },
    {
      title: "Goals, bottlenecks, and confidence basis",
      observation: `Goals: ${profile.primaryGoals.length}. Bottlenecks: ${profile.biggestBottlenecks.length}. Completeness ${signals.completeness}/100, consistency ${signals.consistency}/100, evidence quality ${signals.evidenceQuality}/100, visible evidence ${signals.visibleEvidenceScore}/100.`,
      implication: signals.insufficientSignal
        ? "This output should be treated as directional until more signal is captured."
        : signals.contradictions.length > 0
          ? "Real ambiguity is present in the profile, so confidence is intentionally reduced."
          : "Confidence reflects coverage, consistency, specificity, and evidence quality, not system optimism.",
      basedOn: evidenceList(language, [
        "goals_bottlenecks",
        "stage_budget",
        "offer_audience",
        "operating_tools"
      ]),
      signalQuality: factorStatus(Math.round((signals.evidenceQuality + signals.consistency) / 2)),
      evidenceQuality: evidenceQualityState(signals.evidenceQuality, signals),
      needsValidation: needs
    }
  );

  if (needs.length > 0) {
    cards.push({
      title: "What still needs validation",
      observation: needs.join(" "),
      implication:
        "These validations separate a useful hypothesis from a strong conclusion for real pilot use.",
      basedOn: evidenceList(language, ["missing_evidence", "contradictory_evidence"]),
      signalQuality: "weak",
      evidenceQuality: signals.contradictions.length > 0 ? "contradictory" : "weak",
      needsValidation: needs
    });
  }

  if (signals.contradictions.length > 0) {
    const contradiction = localizeContradiction(signals.contradictions[0], language);
    cards.push({
      title: "Ambiguity detected",
      observation: contradiction.title,
      implication: contradiction.detail,
      basedOn: evidenceList(language, signals.contradictions[0].evidenceKeys),
      signalQuality: "weak"
    });
  }

  if (signals.insufficientSignal || signals.contradictions.length > 0) {
    cards.push(...confidenceFactorCards(language, signals));
  }

  return cards;
}

function resolveConfidence(signals: SignalMap): DiagnosticResultRecord["confidence"] {
  const highSeverityCount = signals.issues.filter((issue) => issue.severity === "high").length;
  const averageFactor = Math.round(
    (signals.completeness + signals.consistency + signals.specificity + signals.evidenceQuality) /
      4
  );

  if (
    !signals.insufficientSignal &&
    averageFactor >= 82 &&
    signals.completeness >= 80 &&
    signals.consistency >= 85 &&
    signals.specificity >= 75 &&
    signals.evidenceQuality >= 78 &&
    signals.visibleEvidenceScore >= 65 &&
    signals.hasPositioningClarity &&
    signals.hasDefinedFunnel &&
    signals.hasDataVisibility &&
    signals.hasConversionEvidence &&
    signals.contradictions.length === 0 &&
    highSeverityCount === 0
  ) {
    return "high";
  }

  if (
    !signals.insufficientSignal &&
    averageFactor >= 58 &&
    signals.consistency >= 50 &&
    signals.specificity >= 50 &&
    signals.evidenceQuality >= 50 &&
    (signals.visibleEvidenceScore >= 35 || signals.hasSocialOrEventEvidence) &&
    signals.contradictions.length <= 1 &&
    highSeverityCount <= 2 &&
    (signals.hasDataVisibility ||
      signals.hasMarketingMeasurementBasics ||
      signals.hasDefinedFunnel ||
      signals.hasConversionEvidence)
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
    en: "Choose one primary marketing metric before making channel or spend decisions.",
    es: "Elegir una metrica primaria de marketing antes de tomar decisiones de canal o gasto."
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
    en: "Review the active marketing test weekly with one owner, one metric, and one decision.",
    es: "Revisar la prueba de marketing activa cada semana con un owner, una metrica y una decision."
  },
  manual_operations: {
    en: "Document the manual follow-up step that affects leads or conversion and assign one owner this week.",
    es: "Documentar el seguimiento manual que afecta leads o conversion y asignarle un owner esta semana."
  },
  low_evidence: {
    en: "Complete the profile with audience, offer, CTA, channel, proof, and measurement evidence before treating the plan as final.",
    es: "Completar el perfil con audiencia, oferta, CTA, canal, prueba y medicion antes de tratar el plan como final."
  },
  contradictory_scale: {
    en: "Resolve the gap between scale ambition and current marketing evidence before adding complexity.",
    es: "Resolver la brecha entre la ambicion de escala y la evidencia de marketing actual antes de agregar complejidad."
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
    if (signals.insufficientSignal) {
      return (
        `${company} obtiene ${overallMaturityScore}/100 con confianza ${localizedConfidence(confidence, language)}. ` +
        `El perfil actual no aporta suficiente evidencia para una conclusion firme; la evidencia visible puntua ${signals.visibleEvidenceScore}/100. ` +
        "Completa oferta, audiencia, posicionamiento visible, CTA, canales, prueba y medicion antes de tratar este resultado como base del plan de marketing."
      );
    }

    if (signals.contradictions.length > 0) {
      const contradiction = localizeContradiction(signals.contradictions[0], language);
      return (
        `${company} obtiene ${overallMaturityScore}/100 con confianza ${localizedConfidence(confidence, language)}. ` +
        `La principal ambiguedad es: ${contradiction.title}. ` +
        "El resultado sigue siendo util para orientar, pero no debe leerse como una verdad cerrada hasta resolver esa contradiccion y validar la evidencia visible."
      );
    }

    return (
      `${company} obtiene ${overallMaturityScore}/100 con confianza ${localizedConfidence(confidence, language)}. ` +
      (topIssue
        ? `La restriccion principal es: ${issueCopy[topIssue.key].es.title}. `
        : "No se detecto una restriccion critica unica. ") +
      (nextStep ?? "El siguiente paso debe cerrar la brecha de marketing de mayor riesgo antes de crear el plan de 30 dias.")
    );
  }

  if (signals.insufficientSignal) {
    return (
      `${company} scores ${overallMaturityScore}/100 with ${confidence} confidence. ` +
      `The current profile does not provide enough evidence for a firm diagnostic; visible evidence scores ${signals.visibleEvidenceScore}/100. ` +
      "Complete the offer, audience, visible positioning, CTA, channels, proof, and measurement before treating this as marketing-plan-ready truth."
    );
  }

  if (signals.contradictions.length > 0) {
    const contradiction = localizeContradiction(signals.contradictions[0], language);
    return (
      `${company} scores ${overallMaturityScore}/100 with ${confidence} confidence. ` +
      `The main ambiguity is: ${contradiction.title}. ` +
      "The output is still useful for direction, but it should not be read as settled truth until that contradiction and the visible evidence are validated."
    );
  }

  return (
    `${company} scores ${overallMaturityScore}/100 with ${confidence} confidence. ` +
    (topIssue
      ? `The primary constraint is: ${issueCopy[topIssue.key].en.title}. `
      : "No single critical constraint was detected. ") +
    (nextStep ?? "The next step should close the highest-risk marketing gap before creating the 30-day plan.")
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
    rawOverall -
      Math.max(0, highSeverityCount - 2) * 3 -
      signals.contradictions.length * 3 -
      (signals.insufficientSignal ? 6 : 0),
    15,
    88
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
    evidenceCards: buildEvidence(profile, language, signals),
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
