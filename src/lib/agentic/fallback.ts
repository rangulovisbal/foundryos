import "server-only";

import {
  DiagnosisOutput,
  type DiagnosisOutput as DiagnosisOutputValue,
  type IntakeProfile
} from "@/lib/agentic/schema";
import type { BusinessProfileRecord, WorkspaceRecord } from "@/lib/foundation";

type DimensionKey = DiagnosisOutputValue["scores"][number]["dimension"];
type Confidence = DiagnosisOutputValue["overall_confidence"];

const dimensions: DimensionKey[] = [
  "offer",
  "audience",
  "message",
  "channel",
  "conversion",
  "social_proof",
  "measurement"
];

const dimensionNames: Record<DimensionKey, { en: string; es: string }> = {
  offer: { en: "offer", es: "oferta" },
  audience: { en: "audience", es: "audiencia" },
  message: { en: "message", es: "mensaje" },
  channel: { en: "channel", es: "canal" },
  conversion: { en: "conversion path", es: "ruta de conversión" },
  social_proof: { en: "social proof", es: "prueba social" },
  measurement: { en: "measurement", es: "medición" }
};

const genericAudiencePattern =
  /\b(anyone|everyone|all|people|businesses|companies|todo|todos|todas|cualquiera|personas|negocios|empresas|clientes)\b/i;
const proofPattern =
  /\b(testimonial|review|case|result|proof|client|customer|before|after|reseña|testimonio|caso|resultado|prueba|cliente|antes|despu[eé]s)\b/i;
const measurementPattern =
  /\b(analytics|utm|ga4|search console|crm|sheet|spreadsheet|pipeline|conversion|source|tracking|m[eé]trica|anal[ií]tica|seguimiento|fuente|hoja|embudo)\b/i;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceFromSignals(score: number, signals: number): Confidence {
  if (signals >= 4 && score >= 65) return "high";
  if (signals >= 2 && score >= 45) return "medium";
  return "low";
}

function scoreDimension(input: {
  dimension: DimensionKey;
  score: number;
  signals: number;
  finding: string;
  evidenceGap: string | null;
}) {
  return {
    dimension: input.dimension,
    score: clamp(input.score),
    confidence: confidenceFromSignals(input.score, input.signals),
    finding: input.finding,
    evidence_gap: input.evidenceGap
  };
}

function listChannels(profile: BusinessProfileRecord, intake: IntakeProfile) {
  return [
    ...profile.currentChannels,
    ...profile.channelUrls,
    ...intake.channels
  ]
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstChannel(channels: string[], language: IntakeProfile["language"]) {
  return channels[0] || (language === "es" ? "el canal principal" : "the main channel");
}

function evidenceGap(
  language: IntakeProfile["language"],
  en: string,
  es: string,
  present: boolean
) {
  return present ? null : language === "es" ? es : en;
}

function buildScores({
  profile,
  workspace,
  intake
}: {
  profile: BusinessProfileRecord;
  workspace: WorkspaceRecord;
  intake: IntakeProfile;
}) {
  const language = intake.language;
  const es = language === "es";
  const company = clean(profile.companyName) || workspace.name || intake.businessName;
  const offer = clean(profile.primaryOffer) || intake.offer;
  const audience = clean(profile.targetAudience) || intake.audience;
  const positioning = clean(profile.positioningStatement);
  const cta = clean(profile.conversionAction);
  const pricing = clean(profile.pricingModel);
  const acquisition = clean(profile.acquisitionMethod);
  const salesProcess = clean(profile.salesProcess);
  const evidenceNotes = clean(profile.evidenceNotes);
  const channels = listChannels(profile, intake);
  const tools = profile.currentTools.join(" ");
  const genericAudience = genericAudiencePattern.test(audience);
  const proofSignals = [evidenceNotes, positioning, salesProcess]
    .filter((value) => proofPattern.test(value))
    .length;
  const measurementSignals = [tools, evidenceNotes, acquisition, salesProcess]
    .filter((value) => measurementPattern.test(value))
    .length;

  return [
    scoreDimension({
      dimension: "offer",
      score:
        28 +
        (hasText(offer) ? 28 : 0) +
        (hasText(pricing) ? 16 : 0) +
        (hasText(cta) ? 12 : 0) +
        (hasText(positioning) ? 10 : 0) +
        (hasText(profile.lifecycleStage) ? 6 : 0),
      signals: [
        offer,
        pricing,
        cta,
        positioning,
        clean(profile.lifecycleStage)
      ].filter(Boolean).length,
      finding: es
        ? `${company} tiene como punto de partida "${offer}", pero la oferta solo se vuelve vendible cuando precio/ticket, promesa y siguiente paso quedan conectados para ${audience}.`
        : `${company} starts from "${offer}", but the offer only becomes sellable when price/ticket, promise, and next step are connected for ${audience}.`,
      evidenceGap: evidenceGap(
        language,
        "Add the pricing/ticket model and the concrete reason a buyer would choose this offer now.",
        "Añade el modelo de precio/ticket y la razón concreta por la que el comprador elegiría esta oferta ahora.",
        hasText(pricing) && hasText(positioning)
      )
    }),
    scoreDimension({
      dimension: "audience",
      score:
        25 +
        (hasText(audience) ? 30 : 0) +
        (hasText(profile.geography) ? 10 : 0) +
        (hasText(profile.businessModel) ? 8 : 0) +
        (profile.primaryGoals.length > 0 ? 8 : 0) +
        (genericAudience ? -18 : 10),
      signals: [
        audience,
        clean(profile.geography),
        clean(profile.businessModel),
        profile.primaryGoals.join(",")
      ].filter(Boolean).length,
      finding: es
        ? `${company} apunta a ${audience}. El riesgo es tratar esa audiencia como demasiado amplia si no se define quién compra primero, en qué contexto y con qué urgencia.`
        : `${company} is aimed at ${audience}. The risk is treating that audience too broadly unless the first buyer, context, and urgency are named.`,
      evidenceGap: evidenceGap(
        language,
        "Name the first buyer segment: who they are, where they are, what pain they feel, and what budget context they likely have.",
        "Nombra el primer segmento comprador: quién es, dónde está, qué dolor siente y qué contexto de presupuesto suele tener.",
        hasText(audience) && !genericAudience
      )
    }),
    scoreDimension({
      dimension: "message",
      score:
        22 +
        (hasText(positioning) ? 30 : 0) +
        (hasText(offer) && hasText(audience) ? 16 : 0) +
        (proofSignals > 0 ? 12 : 0) +
        (profile.biggestBottlenecks.length > 0 ? 8 : 0) +
        (hasText(cta) ? 6 : 0),
      signals: [
        positioning,
        offer,
        audience,
        proofSignals ? "proof" : "",
        profile.biggestBottlenecks.join(",")
      ].filter(Boolean).length,
      finding: es
        ? `El mensaje debe explicar por qué ${audience} debería elegir "${offer}" y no solo describir lo que hace ${company}.`
        : `The message needs to explain why ${audience} should choose "${offer}", not just describe what ${company} does.`,
      evidenceGap: evidenceGap(
        language,
        "Add a one-sentence positioning promise with buyer, pain, outcome, and proof.",
        "Añade una promesa de posicionamiento en una frase con comprador, dolor, resultado y prueba.",
        hasText(positioning)
      )
    }),
    scoreDimension({
      dimension: "channel",
      score:
        24 +
        Math.min(channels.length, 3) * 12 +
        (hasText(acquisition) ? 16 : 0) +
        (profile.channelUrls.length > 0 ? 8 : 0) +
        (hasText(cta) ? 8 : 0),
      signals: [
        channels.join(","),
        acquisition,
        profile.channelUrls.join(","),
        cta
      ].filter(Boolean).length,
      finding: es
        ? `El canal más accionable ahora parece ser ${firstChannel(channels, language)}; debe usarse para capturar conversación o contacto, no solo para publicar.`
        : `The most actionable channel now appears to be ${firstChannel(channels, language)}; it should capture conversation or contact, not just host posts.`,
      evidenceGap: evidenceGap(
        language,
        "State the primary channel, why that audience is there, and the call to action every channel should support.",
        "Define el canal principal, por qué esa audiencia está ahí y la llamada a la acción que debe sostener cada canal.",
        channels.length > 0 && hasText(cta)
      )
    }),
    scoreDimension({
      dimension: "conversion",
      score:
        22 +
        (hasText(cta) ? 28 : 0) +
        (hasText(salesProcess) ? 20 : 0) +
        (hasText(profile.website) ? 8 : 0) +
        (hasText(pricing) ? 8 : 0) +
        (hasText(acquisition) ? 6 : 0),
      signals: [cta, salesProcess, clean(profile.website), pricing, acquisition].filter(Boolean)
        .length,
      finding: es
        ? `La conversión depende de que una persona interesada en ${offer} sepa exactamente qué hacer después: ${cta || "pedir información, reservar o dejar sus datos"}.`
        : `Conversion depends on someone interested in ${offer} knowing exactly what to do next: ${cta || "ask for information, book, or leave their details"}.`,
      evidenceGap: evidenceGap(
        language,
        "Define the lowest-friction next step and what happens after someone takes it.",
        "Define el siguiente paso con menos fricción y qué ocurre después de que alguien lo toma.",
        hasText(cta) && hasText(salesProcess)
      )
    }),
    scoreDimension({
      dimension: "social_proof",
      score:
        18 +
        proofSignals * 18 +
        (hasText(evidenceNotes) ? 12 : 0) +
        (profile.channelUrls.length > 0 ? 6 : 0) +
        (hasText(profile.website) ? 6 : 0),
      signals: [
        proofSignals ? "proof" : "",
        evidenceNotes,
        profile.channelUrls.join(","),
        clean(profile.website)
      ].filter(Boolean).length,
      finding: es
        ? `${company} necesita prueba que reduzca el riesgo percibido para un comprador nuevo de ${audience}: casos, reseñas, antes/después o señales concretas de confianza.`
        : `${company} needs proof that lowers perceived risk for a new ${audience} buyer: cases, reviews, before/after examples, or concrete trust signals.`,
      evidenceGap: evidenceGap(
        language,
        "Collect at least three specific proof points: who the customer was, what changed, and what they said or measured.",
        "Recoge al menos tres pruebas concretas: quién era el cliente, qué cambió y qué dijo o midió.",
        proofSignals > 0
      )
    }),
    scoreDimension({
      dimension: "measurement",
      score:
        18 +
        measurementSignals * 18 +
        (profile.currentTools.length > 0 ? 10 : 0) +
        (hasText(acquisition) ? 8 : 0) +
        (hasText(cta) ? 6 : 0),
      signals: [
        measurementSignals ? "measurement" : "",
        tools,
        acquisition,
        cta
      ].filter(Boolean).length,
      finding: es
        ? `La medición debe decir de dónde llega cada oportunidad para ${offer} y qué paso convierte; sin eso, ${company} no sabrá qué repetir.`
        : `Measurement should show where each opportunity for ${offer} comes from and which step converts; without that, ${company} will not know what to repeat.`,
      evidenceGap: evidenceGap(
        language,
        "Track lead source, CTA taken, follow-up status, and result in a simple sheet or CRM.",
        "Registra fuente del lead, CTA tomado, estado de seguimiento y resultado en una hoja o CRM simple.",
        measurementSignals > 0
      )
    })
  ];
}

function lowest(scores: DiagnosisOutputValue["scores"], count: number) {
  const order = new Map(dimensions.map((dimension, index) => [dimension, index]));
  return [...scores]
    .sort(
      (a, b) =>
        a.score - b.score ||
        (order.get(a.dimension) ?? 0) - (order.get(b.dimension) ?? 0)
    )
    .slice(0, count);
}

function buildBottlenecks(
  scores: DiagnosisOutputValue["scores"],
  input: {
    company: string;
    offer: string;
    audience: string;
    language: IntakeProfile["language"];
  }
) {
  return lowest(scores, 3).map((score) => {
    const name =
      input.language === "es"
        ? dimensionNames[score.dimension].es
        : dimensionNames[score.dimension].en;

    return input.language === "es"
      ? `${name}: ${score.finding}`
      : `${name}: ${score.finding}`;
  });
}

function buildPlan(input: {
  company: string;
  offer: string;
  audience: string;
  channel: string;
  language: IntakeProfile["language"];
}) {
  const { company, offer, audience, channel, language } = input;

  if (language === "es") {
    return [
      {
        week: 1,
        focus: "Cerrar oferta, comprador y promesa antes de buscar más alcance",
        tasks: [
          {
            title: `Escribir la oferta principal de ${company} para ${audience}`,
            why: `Sin una oferta nítida, cualquier acción en ${channel} generará atención difícil de convertir.`,
            effort: "S",
            done_when: `Existe una frase con comprador, problema, promesa y siguiente paso para "${offer}".`
          },
          {
            title: "Elegir un único CTA de baja fricción",
            why: "La conversión necesita una puerta clara antes de pedir más tráfico o publicaciones.",
            effort: "S",
            done_when: "El CTA aparece igual en web, perfil social y mensajes de seguimiento."
          },
          {
            title: "Nombrar el primer segmento comprador",
            why: "El plan necesita priorizar a quien puede comprar primero, no a toda la audiencia posible.",
            effort: "M",
            done_when: "Hay una descripción de 5 líneas con quién compra, dolor, urgencia, presupuesto aproximado y objeción principal."
          }
        ]
      },
      {
        week: 2,
        focus: "Crear prueba y ruta de conversión",
        tasks: [
          {
            title: "Recoger tres pruebas de confianza",
            why: `${audience} necesita señales concretas antes de confiar en ${offer}.`,
            effort: "M",
            done_when: "Hay 3 pruebas listas: testimonio, caso corto, antes/después, reseña o dato verificable."
          },
          {
            title: "Diseñar el seguimiento de una oportunidad",
            why: "Una oportunidad se pierde si no existe una secuencia simple después del primer interés.",
            effort: "S",
            done_when: "Hay 3 mensajes escritos: respuesta inicial, seguimiento 48h y cierre/feedback."
          },
          {
            title: "Actualizar el punto de conversión principal",
            why: "El interés debe pasar de canal a conversación, reserva, formulario o lista.",
            effort: "M",
            done_when: "La web, landing, bio o mensaje fijado explica oferta, prueba y CTA en menos de una pantalla."
          }
        ]
      },
      {
        week: 3,
        focus: `Usar ${channel} para atraer conversaciones correctas`,
        tasks: [
          {
            title: "Publicar una pieza de dolor, prueba y CTA",
            why: `El alcance solo importa si atrae a ${audience} hacia una acción concreta.`,
            effort: "M",
            done_when: "Se publican 3 piezas: problema frecuente, prueba/caso y oferta con CTA."
          },
          {
            title: "Hacer seguimiento manual a interesados previos",
            why: "Los primeros pilotos suelen aprender más de conversaciones existentes que de campañas nuevas.",
            effort: "S",
            done_when: "Se contactan 10 personas relevantes con un mensaje específico y se registra la respuesta."
          },
          {
            title: "Pedir feedback a una persona que encaje con el comprador",
            why: "La claridad del mensaje mejora más rápido con una conversación real que con más supuestos.",
            effort: "S",
            done_when: "Hay una nota con qué entendió, qué dudó y qué objeción apareció."
          }
        ]
      },
      {
        week: 4,
        focus: "Medir qué funcionó y decidir la siguiente repetición",
        tasks: [
          {
            title: "Crear una hoja simple de seguimiento",
            why: "FoundryOS necesita evidencia de fuente, CTA y resultado para que el siguiente plan sea más específico.",
            effort: "S",
            done_when: "Cada oportunidad tiene fuente, fecha, CTA, estado, siguiente acción y resultado."
          },
          {
            title: "Revisar los tres aprendizajes del mes",
            why: "La decisión del siguiente ciclo debe salir de evidencia, no de sensación.",
            effort: "S",
            done_when: "Hay una lista con qué mensaje funcionó, qué objeción apareció y qué canal merece repetirse."
          },
          {
            title: "Elegir la prioridad del próximo ciclo",
            why: "Un negocio pequeño necesita una prioridad clara para no dispersar esfuerzo.",
            effort: "S",
            done_when: "Se elige una sola prioridad: oferta, prueba, conversión, canal o medición."
          }
        ]
      }
    ];
  }

  return [
    {
      week: 1,
      focus: "Lock the offer, buyer, and promise before adding reach",
      tasks: [
        {
          title: `Write ${company}'s core offer for ${audience}`,
          why: `Without a sharp offer, activity in ${channel} will create attention that is hard to convert.`,
          effort: "S",
          done_when: `One sentence exists with buyer, problem, promise, and next step for "${offer}".`
        },
        {
          title: "Choose one low-friction CTA",
          why: "Conversion needs one clear door before asking for more traffic or posts.",
          effort: "S",
          done_when: "The same CTA appears on the site, social profile, and follow-up messages."
        },
        {
          title: "Name the first buyer segment",
          why: "The plan needs to prioritize who can buy first, not every possible audience.",
          effort: "M",
          done_when: "A five-line buyer description names who buys, pain, urgency, budget context, and main objection."
        }
      ]
    },
    {
      week: 2,
      focus: "Create proof and a conversion path",
      tasks: [
        {
          title: "Collect three trust proof points",
          why: `${audience} needs concrete signals before trusting ${offer}.`,
          effort: "M",
          done_when: "Three proof points are ready: testimonial, short case, before/after, review, or verifiable result."
        },
        {
          title: "Design the follow-up path for one opportunity",
          why: "An opportunity is lost when there is no simple sequence after first interest.",
          effort: "S",
          done_when: "Three messages are written: first reply, 48-hour follow-up, and close/feedback."
        },
        {
          title: "Update the main conversion point",
          why: "Interest must move from channel to conversation, booking, form, or list.",
          effort: "M",
          done_when: "The site, landing page, bio, or pinned message explains offer, proof, and CTA within one screen."
        }
      ]
    },
    {
      week: 3,
      focus: `Use ${channel} to attract the right conversations`,
      tasks: [
        {
          title: "Publish one pain, proof, and CTA sequence",
          why: `Reach only matters if it pulls ${audience} toward a concrete action.`,
          effort: "M",
          done_when: "Three pieces are published: common problem, proof/case, and offer with CTA."
        },
        {
          title: "Manually follow up with warm contacts",
          why: "Early pilots usually learn more from existing conversations than from new campaigns.",
          effort: "S",
          done_when: "Ten relevant people are contacted with a specific message and the response is logged."
        },
        {
          title: "Ask one buyer-fit person for feedback",
          why: "Message clarity improves faster with a real conversation than with more assumptions.",
          effort: "S",
          done_when: "A note captures what they understood, where they hesitated, and what objection appeared."
        }
      ]
    },
    {
      week: 4,
      focus: "Measure what worked and choose the next repeatable move",
      tasks: [
        {
          title: "Create a simple tracking sheet",
          why: "FoundryOS needs source, CTA, and result evidence so the next plan becomes more specific.",
          effort: "S",
          done_when: "Every opportunity has source, date, CTA, status, next action, and result."
        },
        {
          title: "Review the three lessons from the month",
          why: "The next-cycle decision should come from evidence, not mood.",
          effort: "S",
          done_when: "A list names which message worked, which objection appeared, and which channel is worth repeating."
        },
        {
          title: "Choose the next cycle priority",
          why: "A small business needs one clear priority to avoid scattered effort.",
          effort: "S",
          done_when: "One priority is chosen: offer, proof, conversion, channel, or measurement."
        }
      ]
    }
  ];
}

function buildAssets(input: {
  company: string;
  offer: string;
  audience: string;
  channel: string;
  language: IntakeProfile["language"];
}) {
  const { company, offer, audience, channel, language } = input;

  if (language === "es") {
    return [
      {
        type: "one_liner",
        text: `${company} ayuda a ${audience} a resolver su bloqueo principal con ${offer}, empezando por una conversación clara y sin prometer resultados que todavía no se han probado.`
      },
      {
        type: "cta",
        text: `Si eres ${audience} y quieres validar si ${offer} encaja contigo, responde "diagnóstico" y revisamos el siguiente paso.`
      },
      {
        type: "headline",
        text: `${offer} para ${audience}: claridad primero, ejecución después.`
      },
      {
        type: "content_idea",
        text: `En ${channel}, publica una historia corta de un problema real de ${audience}, muestra cómo ${offer} lo aborda y termina con una pregunta que invite a conversación.`
      },
      {
        type: "email",
        text: `Hola, estoy revisando si ${offer} puede ayudar a ${audience} con un problema muy concreto. Si tiene sentido, puedo compartirte un diagnóstico inicial y una recomendación de siguiente paso.`
      }
    ];
  }

  return [
    {
      type: "one_liner",
      text: `${company} helps ${audience} address their main growth blocker with ${offer}, starting with a clear conversation and without promising outcomes that have not been proven yet.`
    },
    {
      type: "cta",
      text: `If you are ${audience} and want to see whether ${offer} fits, reply "diagnosis" and we will review the next step.`
    },
    {
      type: "headline",
      text: `${offer} for ${audience}: clarity first, execution second.`
    },
    {
      type: "content_idea",
      text: `On ${channel}, publish one short story about a real ${audience} problem, show how ${offer} addresses it, and end with a question that invites conversation.`
    },
    {
      type: "email",
      text: `Hi, I am checking whether ${offer} can help ${audience} with one specific problem. If useful, I can share an initial diagnosis and one recommended next step.`
    }
  ];
}

function buildSops(input: {
  offer: string;
  audience: string;
  language: IntakeProfile["language"];
}) {
  const { offer, audience, language } = input;

  if (language === "es") {
    return [
      {
        name: "Rutina semanal de diagnóstico y seguimiento",
        steps: [
          `Revisa cada nuevo interesado para ${offer} y marca si encaja con ${audience}.`,
          "Registra fuente, CTA, objeción principal y siguiente acción en una hoja simple.",
          "Elige una conversación para convertir en prueba: testimonio, caso corto o aprendizaje.",
          "Ajusta una sola frase de la oferta o CTA según la evidencia de esa semana."
        ]
      },
      {
        name: "Rutina de contenido orientada a conversión",
        steps: [
          `Escoge un dolor concreto de ${audience} relacionado con ${offer}.`,
          "Escribe una pieza breve: problema, por qué importa, prueba o ejemplo, y CTA.",
          "Publica en el canal principal y responde manualmente a cada señal de interés.",
          "Anota qué mensaje generó conversación real y qué objeción se repitió."
        ]
      }
    ];
  }

  return [
    {
      name: "Weekly diagnosis and follow-up routine",
      steps: [
        `Review every new interested person for ${offer} and mark whether they fit ${audience}.`,
        "Log source, CTA, main objection, and next action in a simple sheet.",
        "Choose one conversation to turn into proof: testimonial, short case, or learning.",
        "Adjust one offer or CTA sentence based on the evidence from that week."
      ]
    },
    {
      name: "Conversion-oriented content routine",
      steps: [
        `Pick one concrete ${audience} pain related to ${offer}.`,
        "Write a short piece: problem, why it matters, proof or example, and CTA.",
        "Publish on the main channel and manually reply to every sign of interest.",
        "Record which message created a real conversation and which objection repeated."
      ]
    }
  ];
}

function overallConfidence(scores: DiagnosisOutputValue["scores"]): Confidence {
  const value = scores.reduce((total, score) => {
    if (score.confidence === "high") return total + 2;
    if (score.confidence === "medium") return total + 1;
    return total;
  }, 0);

  if (value >= 10) return "high";
  if (value >= 5) return "medium";
  return "low";
}

export function buildFallbackDiagnosisOutput({
  profile,
  workspace,
  intake
}: {
  profile: BusinessProfileRecord;
  workspace: WorkspaceRecord;
  intake: IntakeProfile;
}): DiagnosisOutputValue {
  const language = intake.language;
  const company = clean(profile.companyName) || workspace.name || intake.businessName;
  const offer = clean(profile.primaryOffer) || intake.offer;
  const audience = clean(profile.targetAudience) || intake.audience;
  const channels = listChannels(profile, intake);
  const channel = firstChannel(channels, language);
  const scores = buildScores({ profile, workspace, intake });
  const lowestScores = lowest(scores, 2);
  const causeNames = lowestScores
    .map((score) =>
      language === "es"
        ? dimensionNames[score.dimension].es
        : dimensionNames[score.dimension].en
    )
    .join(language === "es" ? " y " : " and ");

  const output = {
    summary:
      language === "es"
        ? `La causa principal no es "hacer más marketing"; es la debilidad en ${causeNames}. Para ${company}, el plan debe convertir "${offer}" en una promesa clara para ${audience}, probarla con evidencia visible y llevar cada acción en ${channel} hacia un siguiente paso medible.`
        : `The main cause is not "do more marketing"; it is weakness in ${causeNames}. For ${company}, the plan should turn "${offer}" into a clear promise for ${audience}, support it with visible proof, and move every ${channel} action toward a measurable next step.`,
    overall_confidence: overallConfidence(scores),
    scores,
    top_bottlenecks: buildBottlenecks(scores, {
      company,
      offer,
      audience,
      language
    }),
    plan_30d: buildPlan({
      company,
      offer,
      audience,
      channel,
      language
    }),
    assets: buildAssets({
      company,
      offer,
      audience,
      channel,
      language
    }),
    sops: buildSops({
      offer,
      audience,
      language
    })
  };

  return DiagnosisOutput.parse(output);
}
