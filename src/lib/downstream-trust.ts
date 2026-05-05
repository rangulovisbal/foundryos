import type {
  BusinessProfileRecord,
  DiagnosticEvidenceCard,
  DiagnosticResultRecord,
  OutputLanguage
} from "@/lib/foundation";

export type DownstreamTrustMode = "operating_plan" | "validation_first";

export type DownstreamTrustLevel = "clear" | "provisional" | "weak" | "contradictory";

export type DownstreamTrustState = {
  mode: DownstreamTrustMode;
  level: DownstreamTrustLevel;
  confidence: DiagnosticResultRecord["confidence"];
  label: string;
  summary: string;
  evidenceGaps: string[];
  validationTasks: string[];
  intakeRepairPriorities: string[];
  cannotClaim: string[];
  hasContradiction: boolean;
  hasWeakEvidence: boolean;
};

function sl(language: OutputLanguage, en: string, es: string) {
  return language === "es" ? es : en;
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function hasAlternativeMarketingEvidence(profile: BusinessProfileRecord | null) {
  if (!profile) return false;

  const text = [
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

  return /instagram|tiktok|facebook|meta|whatsapp|dm|social|waitlist|newsletter|pop[- ]?up|popup|event|market|tasting|dinner|booking|reservation|customer comment|customer feedback|testimonial|review|stories|followers|attendees|asistentes|comentarios|resenas|testimonios|feria|mercado|evento|cena|reserva/.test(text);
}

function unique(values: Array<string | null | undefined>, limit = 6) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = clean(value);
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
    if (result.length >= limit) break;
  }

  return result;
}

function weakEvidenceCards(cards: DiagnosticEvidenceCard[]) {
  return cards.filter(
    (card) =>
      card.evidenceQuality === "weak" ||
      card.evidenceQuality === "missing" ||
      card.signalQuality === "weak"
  );
}

function contradictoryEvidenceCards(cards: DiagnosticEvidenceCard[]) {
  return cards.filter((card) => card.evidenceQuality === "contradictory");
}

function missingProfileFields(profile: BusinessProfileRecord | null, language: OutputLanguage) {
  if (!profile) {
    return [sl(language, "saved business profile", "perfil de negocio guardado")];
  }

  const fields: string[] = [];
  if (!clean(profile.website) && !hasAlternativeMarketingEvidence(profile)) {
    fields.push(sl(language, "primary website or visible social/event evidence", "website principal o evidencia social/de evento visible"));
  }
  if (!clean(profile.positioningStatement)) {
    fields.push(sl(language, "one-line positioning statement", "posicionamiento en una linea"));
  }
  if (!clean(profile.primaryOffer)) fields.push(sl(language, "primary offer", "oferta principal"));
  if (!clean(profile.targetAudience)) fields.push(sl(language, "target audience", "audiencia objetivo"));
  if (!clean(profile.conversionAction)) fields.push(sl(language, "current CTA or conversion action", "CTA o accion de conversion"));
  if (!clean(profile.pricingModel)) fields.push(sl(language, "pricing or ticket model", "modelo de precio o ticket"));
  if (!clean(profile.acquisitionMethod)) fields.push(sl(language, "current acquisition method", "metodo de adquisicion actual"));
  if (!clean(profile.salesProcess)) fields.push(sl(language, "sales process", "proceso de venta"));
  if (profile.currentChannels.length === 0) fields.push(sl(language, "current channel mix", "mix de canales actual"));
  if (profile.currentTools.length === 0) fields.push(sl(language, "current marketing measurement tools", "herramientas actuales de medicion de marketing"));

  return fields;
}

function evidenceGapFromCard(card: DiagnosticEvidenceCard, language: OutputLanguage) {
  if (card.evidenceQuality === "contradictory") {
    return sl(
      language,
      `Contradiction to resolve: ${card.title} - ${card.observation}`,
      `Contradiccion por resolver: ${card.title} - ${card.observation}`
    );
  }

  if (card.evidenceQuality === "missing") {
    return sl(
      language,
      `Missing evidence: ${card.title} - ${card.observation}`,
      `Evidencia faltante: ${card.title} - ${card.observation}`
    );
  }

  return sl(
    language,
    `Weak evidence: ${card.title} - ${card.observation}`,
    `Evidencia debil: ${card.title} - ${card.observation}`
  );
}

function validationTasksFromGaps(gaps: string[], language: OutputLanguage) {
  return gaps.map((gap) =>
    sl(
      language,
      `Validate or replace this input before treating downstream advice as final: ${gap}`,
      `Validar o reemplazar este input antes de tratar las recomendaciones como definitivas: ${gap}`
    )
  );
}

export function resolveDownstreamTrustState({
  diagnostic,
  language,
  profile
}: {
  diagnostic: DiagnosticResultRecord | null;
  language: OutputLanguage;
  profile?: BusinessProfileRecord | null;
}): DownstreamTrustState | null {
  if (!diagnostic) return null;

  const cards = diagnostic.evidenceCards ?? [];
  const contradictoryCards = contradictoryEvidenceCards(cards);
  const weakCards = weakEvidenceCards(cards);
  const missingCards = cards.filter((card) => card.evidenceQuality === "missing");
  const missingFields = missingProfileFields(profile ?? null, language);
  const hasAlternativeEvidence = hasAlternativeMarketingEvidence(profile ?? null);
  const savedProfile = profile ?? null;
  const hasCoreMarketingInputs =
    savedProfile !== null &&
    clean(savedProfile.primaryOffer).length > 0 &&
    clean(savedProfile.targetAudience).length > 0 &&
    (clean(savedProfile.conversionAction).length > 0 || hasAlternativeEvidence) &&
    (savedProfile.currentChannels.length > 0 ||
      savedProfile.channelUrls.length > 0 ||
      hasAlternativeEvidence);
  const hasContradiction = contradictoryCards.length > 0;
  const hasWeakEvidence =
    diagnostic.confidence === "low" || weakCards.length > 0 || missingFields.length >= 4;
  const canUsePracticalMarketingPlan =
    hasCoreMarketingInputs &&
    hasAlternativeEvidence &&
    !hasContradiction &&
    missingCards.length < 2 &&
    missingFields.length <= 4;
  const mode: DownstreamTrustMode =
    hasContradiction ||
    (diagnostic.confidence === "low" && !canUsePracticalMarketingPlan) ||
    missingCards.length >= 2
      ? "validation_first"
      : "operating_plan";
  const level: DownstreamTrustLevel = hasContradiction
    ? "contradictory"
    : diagnostic.confidence === "low" || weakCards.length >= 2 || missingFields.length >= 5
      ? "weak"
      : diagnostic.confidence === "medium" || weakCards.length > 0 || missingFields.length >= 3
        ? "provisional"
        : "clear";
  const label =
    level === "contradictory"
      ? sl(language, "Contradiction unresolved", "Contradiccion sin resolver")
      : level === "weak"
        ? sl(language, "Evidence weak", "Evidencia debil")
        : level === "provisional"
          ? sl(language, "Provisional", "Provisional")
          : sl(language, "Evidence clear", "Evidencia clara");
  const evidenceGaps = unique(
    [
      ...contradictoryCards.map((card) => evidenceGapFromCard(card, language)),
      ...weakCards.map((card) => evidenceGapFromCard(card, language)),
      ...missingFields.map((field) =>
        sl(language, `Profile input missing: ${field}`, `Input faltante del perfil: ${field}`)
      )
    ],
    8
  );
  const validationTasks = unique(
    [
      ...cards.flatMap((card) => card.needsValidation ?? []),
      ...validationTasksFromGaps(evidenceGaps, language),
      sl(
        language,
        "Confirm the offer, audience, CTA, channel source, proof, and basic measurement evidence before executing the plan.",
        "Confirmar oferta, audiencia, CTA, fuente de canal, prueba y evidencia de medicion basica antes de ejecutar el plan."
      )
    ],
    8
  );
  const intakeRepairPriorities = unique(
    [
      ...missingFields.map((field) =>
        sl(language, `Add or clarify ${field}.`, `Anadir o aclarar ${field}.`)
      ),
      ...diagnostic.recommendedNextActions.map((action) => action.title)
    ],
    6
  );
  const cannotClaim = unique(
    [
      hasContradiction
        ? sl(
            language,
            "The downstream plan cannot be treated as strong advice until contradictions are resolved.",
            "El plan posterior no puede tratarse como recomendacion fuerte hasta resolver contradicciones."
          )
        : null,
      hasWeakEvidence
        ? sl(
            language,
            "Positioning, channel, conversion, and marketing workflow recommendations are provisional until missing evidence is confirmed.",
            "Las recomendaciones de posicionamiento, canal, conversion y flujos de marketing son provisionales hasta confirmar la evidencia faltante."
          )
        : null,
      sl(
        language,
        "This product does not verify websites, CRM data, analytics, payment data, or live channel performance yet.",
        "Este producto aun no verifica websites, CRM, analitica, pagos ni rendimiento real de canales."
      )
    ],
    4
  );

  const summary =
    mode === "validation_first"
      ? sl(
          language,
          `${label}: downstream outputs should repair evidence and validate assumptions before becoming a practical marketing plan.`,
          `${label}: los outputs posteriores deben reparar evidencia y validar supuestos antes de convertirse en plan practico de marketing.`
        )
      : sl(
          language,
          `${label}: downstream outputs can be used as a marketing planning draft, with the diagnostic confidence set to ${diagnostic.confidence}.`,
          `${label}: los outputs posteriores pueden usarse como borrador de planificacion de marketing, con confianza diagnostica ${diagnostic.confidence}.`
        );

  return {
    mode,
    level,
    confidence: diagnostic.confidence,
    label,
    summary,
    evidenceGaps,
    validationTasks,
    intakeRepairPriorities,
    cannotClaim,
    hasContradiction,
    hasWeakEvidence
  };
}

export function downstreamTrustBadge(state: DownstreamTrustState | null, language: OutputLanguage) {
  if (!state) return sl(language, "No diagnostic", "Sin diagnostico");

  if (state.mode === "validation_first") {
    return state.hasContradiction
      ? sl(language, "Needs validation - contradiction unresolved", "Requiere validacion - contradiccion sin resolver")
      : sl(language, "Needs validation - evidence weak", "Requiere validacion - evidencia debil");
  }

  return state.level === "clear"
    ? sl(language, "Evidence-backed planning draft", "Borrador respaldado por evidencia")
    : sl(language, "Provisional planning draft", "Borrador provisional");
}
