import type {
  BusinessProfileRecord,
  DiagnosticResultRecord,
  OutputLanguage,
  RoadmapRecord,
  SopArtifactRecord,
  SopArtifactSourceReference,
  SopArtifactType,
  ThirtyDayPlanRecord,
  WorkspaceRecord
} from "@/lib/foundation";
import { resolveDownstreamTrustState, type DownstreamTrustState } from "@/lib/downstream-trust";

type BusinessType =
  | "academy"
  | "subscription"
  | "services"
  | "commerce"
  | "marketplace"
  | "general";

function detectBusinessType(profile: BusinessProfileRecord): BusinessType {
  const text = [
    profile.businessModel ?? "",
    profile.industry ?? "",
    profile.primaryOffer ?? "",
    profile.targetAudience ?? "",
    ...profile.currentChannels,
    ...profile.biggestBottlenecks
  ]
    .join(" ")
    .toLowerCase();

  if (/academy|course|cohort|bootcamp|certif|curriculum|enroll|student|learner|workshop/.test(text)) {
    return "academy";
  }
  if (/saas|subscri|recurring|software|platform|trial|freemium|license/.test(text)) {
    return "subscription";
  }
  if (/ecomm|store|shop|product|inventory|checkout|order|buyer|merch|restaurant|food|catering|pop[- ]?up|popup|dinner|tasting|menu|booking|reservation/.test(text)) {
    return "commerce";
  }
  if (/consult|agency|freelan|service|implementation|retainer|project|client/.test(text)) {
    return "services";
  }
  if (/marketplace|platform|supplier|vendor|listing|match|two-sided|two sided/.test(text)) {
    return "marketplace";
  }
  return "general";
}

// ─── Lead handling ────────────────────────────────────────────────────────────

function buildLeadHandlingSop(
  jobId: string,
  workspaceId: string,
  type: BusinessType,
  profile: BusinessProfileRecord,
  diagnostic: DiagnosticResultRecord,
  language: OutputLanguage
): SopArtifactRecord {
  const now = new Date().toISOString();
  const company = profile.companyName ?? "Your business";
  const bottleneck = diagnostic.topBottlenecks[0]?.title ?? "";

  const en = language === "en";

  const qualCriteria: Record<BusinessType, string[]> = {
    academy: [
      "Confirm the lead's target program before any follow-up",
      "Score lead by program intent: specific program interest scores higher than generic inquiry",
      "Flag leads with no stated program interest for nurture sequence, not direct outreach",
      "Disqualify leads whose timeline or budget does not match enrollment window",
      en ? `Record qualification outcome in CRM: qualified, nurture, or disqualify` : `Registrar resultado en CRM: calificado, nutricion, o descartado`
    ],
    subscription: [
      "Confirm company size and use case before routing to sales",
      "Score by ICP fit: company size, industry, role, and stated problem",
      "Flag leads with no stated activation intent for nurture, not demo",
      "Confirm trial eligibility or direct to self-serve based on segment",
      en ? `Record ICP fit score and next step in CRM` : `Registrar puntaje de ajuste ICP y proximo paso en CRM`
    ],
    services: [
      "Run discovery call within 48 hours of inbound request",
      "Qualify by: project scope, timeline, budget band, and decision-maker access",
      "Disqualify leads outside defined service scope or below minimum project size",
      "Confirm whether lead is a direct buyer or a referral-chain contact",
      en ? `Record qualification outcome and next step in CRM` : `Registrar resultado de calificacion y proximo paso en CRM`
    ],
    commerce: [
      "Tag lead source and purchase intent on first capture",
      "Segment by product category interest before any follow-up",
      "Flag abandoned checkout leads for recovery sequence",
      "Score repeat-purchaser leads separately from first-time buyer leads",
      en ? `Record segment tag and follow-up sequence in order management system` : `Registrar etiqueta de segmento y secuencia de seguimiento`
    ],
    marketplace: [
      "Determine whether the lead is a supply-side or demand-side participant",
      "Qualify supply-side leads by: capacity, category, and compliance readiness",
      "Qualify demand-side leads by: purchase intent, category fit, and activation likelihood",
      "Route supply and demand leads through separate onboarding flows",
      en ? `Record side, category, and onboarding status in platform CRM` : `Registrar lado, categoria y estado de incorporacion en CRM`
    ],
    general: [
      "Confirm contact information and source on first capture",
      "Score lead by: segment fit, stated problem, and timeline",
      "Route qualified leads to owner or assigned team member within 24 hours",
      "Flag unqualified leads for nurture sequence",
      en ? `Record qualification outcome and routing decision in CRM` : `Registrar resultado de calificacion y decision de asignacion en CRM`
    ]
  };

  const ownerLabel: Record<BusinessType, string> = {
    academy: en ? "Enrollment lead or founder" : "Responsable de matriculas o fundador",
    subscription: en ? "Growth lead or founder" : "Responsable de crecimiento o fundador",
    services: en ? "Business development lead or founder" : "Responsable de desarrollo o fundador",
    commerce: en ? "Sales or marketing lead" : "Responsable de ventas o marketing",
    marketplace: en ? "Growth or marketplace lead" : "Responsable de crecimiento o marketplace",
    general: en ? "Founder or assigned team member" : "Fundador o miembro del equipo asignado"
  };

  const triggerLabel: Record<BusinessType, string> = {
    academy: en ? "New inquiry or enrollment interest received" : "Nueva consulta o interes de matricula recibido",
    subscription: en ? "New trial signup or inbound demo request" : "Nuevo registro de prueba o solicitud de demo entrante",
    services: en ? "New inbound inquiry or referral received" : "Nueva consulta entrante o referido recibido",
    commerce: en ? "New lead capture or abandoned checkout event" : "Nueva captura de prospecto o evento de carrito abandonado",
    marketplace: en ? "New participant registration or inquiry received" : "Nuevo registro de participante o consulta recibida",
    general: en ? "New lead captured via any channel" : "Nuevo prospecto capturado por cualquier canal"
  };

  const title = en ? `Lead Qualification and Routing — ${company}` : `Calificacion y asignacion de prospectos — ${company}`;
  const purpose = en
    ? `Ensure every inbound lead is qualified, scored, and routed within a defined window. Reduce time wasted on unqualified contacts and prevent qualified leads from stalling.`
    : `Garantizar que cada prospecto entrante sea calificado, puntuado y asignado dentro de un plazo definido. Reducir el tiempo en contactos no calificados y evitar que los calificados se estanquen.`;

  const tools = profile.currentTools.length > 0
    ? profile.currentTools.slice(0, 4)
    : (en ? ["CRM or contact management tool", "Email or messaging tool", "Calendar for scheduling discovery calls"] : ["CRM o herramienta de gestion de contactos", "Correo electronico o mensajeria", "Calendario para llamadas de calificacion"]);

  const content = [
    {
      heading: en ? "Purpose and trigger" : "Proposito y detonador",
      items: [
        purpose,
        `${en ? "Trigger" : "Detonador"}: ${triggerLabel[type]}`
      ]
    },
    {
      heading: en ? "Owner and responsibilities" : "Responsable y responsabilidades",
      items: [
        `${en ? "Owner" : "Responsable"}: ${ownerLabel[type]}`,
        en ? "Responsibilities: qualify every lead before routing, update CRM after each interaction, escalate edge cases to founder" : "Responsabilidades: calificar cada prospecto antes de asignar, actualizar CRM despues de cada interaccion, escalar casos limite al fundador"
      ]
    },
    {
      heading: en ? "Required tools" : "Herramientas requeridas",
      items: tools
    },
    {
      heading: en ? "Steps" : "Pasos",
      items: qualCriteria[type]
    },
    {
      heading: en ? "QA checkpoint" : "Punto de control de calidad",
      items: [
        en ? "Every lead has a qualification outcome recorded within 24 hours of capture" : "Cada prospecto tiene un resultado de calificacion registrado en 24 horas desde su captura",
        en ? "No lead sits in 'new' status for more than 48 hours without an action recorded" : "Ningun prospecto permanece en estado 'nuevo' mas de 48 horas sin una accion registrada",
        bottleneck
          ? (en ? `Review leads rejected due to: ${bottleneck.toLowerCase()} — confirm disqualification criteria apply` : `Revisar prospectos rechazados por: ${bottleneck.toLowerCase()} — confirmar que aplican los criterios de descarte`)
          : (en ? "Review disqualification reasons weekly to refine qualification criteria" : "Revisar las razones de descarte semanalmente para refinar los criterios")
      ]
    },
    {
      heading: en ? "Expected output" : "Resultado esperado",
      items: [
        en ? "Each lead has a status: qualified, nurture, or disqualified" : "Cada prospecto tiene un estado: calificado, nutricion, o descartado",
        en ? "Qualified leads have a next step and owner assigned" : "Los prospectos calificados tienen un proximo paso y responsable asignado",
        en ? "CRM reflects current state of all active leads" : "El CRM refleja el estado actual de todos los prospectos activos"
      ]
    }
  ];

  const sourceReferences: SopArtifactSourceReference[] = [
    {
      sourceType: "business_profile",
      label: en ? "Business profile" : "Perfil de negocio",
      referenceId: profile.id,
      detail: en
        ? `Audience: ${profile.targetAudience?.slice(0, 120) ?? "not specified"}. Channels: ${profile.currentChannels.join(", ") || "not specified"}.`
        : `Audiencia: ${profile.targetAudience?.slice(0, 120) ?? "no especificada"}. Canales: ${profile.currentChannels.join(", ") || "no especificados"}.`
    },
    {
      sourceType: "diagnostic",
      label: en ? "Top bottleneck" : "Principal cuello de botella",
      referenceId: diagnostic.id,
      detail: bottleneck || (en ? "No bottleneck identified" : "Sin cuello de botella identificado")
    }
  ];

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId,
    sopType: "lead_handling" as SopArtifactType,
    title,
    purpose,
    content,
    sourceReferences,
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

// ─── Reporting cadence ────────────────────────────────────────────────────────

function buildReportingCadenceSop(
  jobId: string,
  workspaceId: string,
  type: BusinessType,
  profile: BusinessProfileRecord,
  diagnostic: DiagnosticResultRecord,
  thirtyDayPlan: ThirtyDayPlanRecord | null,
  language: OutputLanguage
): SopArtifactRecord {
  const now = new Date().toISOString();
  const company = profile.companyName ?? "Your business";
  const en = language === "en";

  const metrics: Record<BusinessType, string[]> = {
    academy: [
      en ? "New leads by program (weekly)" : "Nuevos prospectos por programa (semanal)",
      en ? "Enrollment rate by program and by source (weekly)" : "Tasa de matricula por programa y por fuente (semanal)",
      en ? "Completion rate by active cohort (weekly)" : "Tasa de finalizacion por cohorte activa (semanal)",
      en ? "Referral count and source (weekly)" : "Cantidad de referidos y fuente (semanal)",
      en ? "Discount-dependent enrollment percentage (monthly)" : "Porcentaje de matricula dependiente de descuento (mensual)"
    ],
    subscription: [
      en ? "CTA clicks and demo requests by channel (weekly)" : "Clicks de CTA y solicitudes de demo por canal (semanal)",
      en ? "Trial or signup activation rate (weekly)" : "Tasa de activacion de prueba o registro (semanal)",
      en ? "Qualified demo-to-activation conversion (weekly)" : "Conversion de demo calificada a activacion (semanal)",
      en ? "Top objection or no-decision reason (weekly)" : "Objecion principal o razon de no-decision (semanal)",
      en ? "Customer feedback captured from activated users (monthly)" : "Feedback de clientes capturado de usuarios activados (mensual)"
    ],
    services: [
      en ? "New inquiries and qualified leads (weekly)" : "Nuevas consultas y prospectos calificados (semanal)",
      en ? "Discovery calls booked by source (weekly)" : "Llamadas discovery agendadas por fuente (semanal)",
      en ? "Qualified lead-to-proposal conversion (weekly)" : "Conversion de lead calificado a propuesta (semanal)",
      en ? "Repeated objections or unclear-fit reasons (weekly)" : "Objeciones repetidas o razones de fit poco claro (semanal)",
      en ? "Proof points or client feedback captured (monthly)" : "Pruebas o feedback de clientes capturados (mensual)"
    ],
    commerce: [
      en ? "Bookings, inquiries, or orders by channel (weekly)" : "Reservas, consultas o pedidos por canal (semanal)",
      en ? "CTA clicks, DMs, or waitlist joins (weekly)" : "Clicks de CTA, DMs o registros en waitlist (semanal)",
      en ? "Pop-up attendance, tasting interest, or checkout conversion (weekly)" : "Asistencia a pop-up, interes en degustacion o conversion de checkout (semanal)",
      en ? "Customer comments, reviews, or story replies captured (weekly)" : "Comentarios, resenas o respuestas a stories capturadas (semanal)",
      en ? "Repeat purchase or repeat booking signal (monthly)" : "Senal de recompra o reserva repetida (mensual)"
    ],
    marketplace: [
      en ? "New supply-side and demand-side registrations (weekly)" : "Nuevos registros de oferta y demanda (semanal)",
      en ? "Match rate and transaction count (weekly)" : "Tasa de coincidencia y cantidad de transacciones (semanal)",
      en ? "Liquidity ratio: active listings to active buyers (weekly)" : "Ratio de liquidez: listados activos vs compradores activos (semanal)",
      en ? "Repeat usage rate by side (monthly)" : "Tasa de uso repetido por lado (mensual)",
      en ? "Dispute and escalation count (monthly)" : "Cantidad de disputas y escalaciones (mensual)"
    ],
    general: [
      en ? "New leads and qualified leads by channel (weekly)" : "Nuevos prospectos y prospectos calificados por canal (semanal)",
      en ? "CTA clicks or next-step actions by channel (weekly)" : "Clicks de CTA o acciones de siguiente paso por canal (semanal)",
      en ? "Customer feedback or proof captured (weekly)" : "Feedback de cliente o prueba capturada (semanal)",
      en ? "Top performing channel (monthly)" : "Canal de mejor rendimiento (mensual)",
      en ? "Primary marketing metric movement (monthly)" : "Movimiento de la metrica principal de marketing (mensual)"
    ]
  };

  const reviewCadence: Record<BusinessType, string> = {
    academy: en ? "Weekly review every Monday morning: review all four metrics independently before the week begins" : "Revision semanal cada lunes por la manana: revisar las cuatro metricas de forma independiente antes de iniciar la semana",
    subscription: en ? "Weekly review every Monday: CTA response, demo requests, activation, and objections. Monthly proof review on the 1st." : "Revision semanal cada lunes: respuesta al CTA, solicitudes de demo, activacion y objeciones. Revision mensual de prueba el dia 1.",
    services: en ? "Weekly review every Friday: inquiries, qualified calls, objections, and proof captured." : "Revision semanal cada viernes: consultas, llamadas calificadas, objeciones y prueba capturada.",
    commerce: en ? "Weekly review every Monday: bookings, inquiries, purchases, CTA response, and customer feedback." : "Revision semanal cada lunes: reservas, consultas, compras, respuesta al CTA y feedback de clientes.",
    marketplace: en ? "Weekly review every Monday: registrations, match rate, and liquidity. Monthly repeat usage review." : "Revision semanal cada lunes: registros, tasa de coincidencia y liquidez. Revision mensual de uso repetido.",
    general: en ? "Weekly review every Monday: leads, CTA response, proof captured, and channel quality." : "Revision semanal cada lunes: prospectos, respuesta al CTA, prueba capturada y calidad de canal."
  };

  const title = en ? `Marketing Reporting Cadence — ${company}` : `Cadencia de reportes de marketing — ${company}`;
  const purpose = en
    ? `Maintain a consistent weekly and monthly marketing reporting cadence that gives the founder a decision-ready view of channel response, conversion, proof, and customer feedback.`
    : `Mantener una cadencia semanal y mensual de reportes de marketing que le da al fundador una vision lista para decidir sobre respuesta de canal, conversion, prueba y feedback de clientes.`;

  const decisionTriggers = [
    en ? "If any primary marketing metric declines two weeks in a row, review message, channel, CTA, and proof before the third week begins" : "Si cualquier metrica primaria de marketing cae dos semanas seguidas, revisar mensaje, canal, CTA y prueba antes de iniciar la tercera semana",
    en ? "If conversion response drops below the baseline, pause channel spend or extra activity and investigate before renewing" : "Si la respuesta de conversion cae por debajo del baseline, pausar gasto o actividad extra de canal e investigar antes de renovar",
    thirtyDayPlan
      ? (en ? `30-day objective: ${thirtyDayPlan.monthObjective.slice(0, 120)}` : `Objetivo de 30 dias: ${thirtyDayPlan.monthObjective.slice(0, 120)}`)
      : (en ? "Review metrics against the current month objective each week" : "Revisar las metricas contra el objetivo del mes actual cada semana")
  ];

  const content = [
    {
      heading: en ? "Purpose and trigger" : "Proposito y detonador",
      items: [
        purpose,
        `${en ? "Trigger" : "Detonador"}: ${reviewCadence[type]}`
      ]
    },
    {
      heading: en ? "Owner and responsibilities" : "Responsable y responsabilidades",
      items: [
        en ? "Owner: Founder or designated marketing lead" : "Responsable: Fundador o responsable de marketing designado",
        en ? "Responsibilities: pull response data, prepare the review brief, surface objections or proof, record decisions" : "Responsabilidades: extraer datos de respuesta, preparar el resumen de revision, identificar objeciones o prueba, registrar decisiones"
      ]
    },
    {
      heading: en ? "Required tools" : "Herramientas requeridas",
      items: profile.currentTools.length > 0
        ? profile.currentTools.slice(0, 4)
        : (en ? ["Analytics or channel insights", "CRM or lead tracker", "Feedback log or spreadsheet"] : ["Analytics o insights de canal", "CRM o tracker de leads", "Registro de feedback u hoja de calculo"])
    },
    {
      heading: en ? "Metrics to track" : "Metricas a seguir",
      items: metrics[type]
    },
    {
      heading: en ? "Decision triggers" : "Detonadores de decision",
      items: decisionTriggers
    },
    {
      heading: en ? "QA checkpoint" : "Punto de control de calidad",
      items: [
        en ? "Every metric has a current value and a comparison to the prior period" : "Cada metrica tiene un valor actual y una comparacion con el periodo anterior",
        en ? "No metric is left blank or marked 'pending' without an explanation" : "Ninguna metrica se deja en blanco o marcada como 'pendiente' sin una explicacion",
        en ? "Each review session produces at least one decision or a confirmed hold" : "Cada sesion de revision produce al menos una decision o una confirmacion de continuar igual"
      ]
    },
    {
      heading: en ? "Expected output" : "Resultado esperado",
      items: [
        en ? "A completed weekly review record with all metrics filled" : "Un registro de revision semanal completo con todas las metricas llenadas",
        en ? "At least one documented decision or an explicit hold decision" : "Al menos una decision documentada o una decision explicita de mantener el rumbo",
        en ? "Flagged anomalies are assigned an owner and a review date" : "Las anomalias identificadas tienen un responsable y una fecha de revision asignada"
      ]
    }
  ];

  const sourceReferences: SopArtifactSourceReference[] = [
    {
      sourceType: "diagnostic",
      label: en ? "Diagnostic risks" : "Riesgos diagnosticos",
      referenceId: diagnostic.id,
      detail: diagnostic.topRisks.slice(0, 2).map((r) => r.title).join("; ") || (en ? "None identified" : "Ninguno identificado")
    },
    ...(thirtyDayPlan
      ? [{
          sourceType: "thirty_day_plan" as const,
          label: en ? "Month objective" : "Objetivo del mes",
          referenceId: thirtyDayPlan.id,
          detail: thirtyDayPlan.monthObjective.slice(0, 150)
        }]
      : [])
  ];

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId,
    sopType: "reporting_cadence" as SopArtifactType,
    title,
    purpose,
    content,
    sourceReferences,
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

// ─── Campaign setup ───────────────────────────────────────────────────────────

function buildCampaignSetupSop(
  jobId: string,
  workspaceId: string,
  type: BusinessType,
  profile: BusinessProfileRecord,
  diagnostic: DiagnosticResultRecord,
  roadmap: RoadmapRecord | null,
  language: OutputLanguage
): SopArtifactRecord {
  const now = new Date().toISOString();
  const company = profile.companyName ?? "Your business";
  const en = language === "en";
  const channels = profile.currentChannels.slice(0, 3);

  const channelNote = channels.length > 0
    ? (en ? `Channels in scope: ${channels.join(", ")}` : `Canales en alcance: ${channels.join(", ")}`)
    : (en ? "Channel scope: confirm with founder before launch" : "Alcance de canales: confirmar con el fundador antes del lanzamiento");

  const campaignSteps: Record<BusinessType, string[]> = {
    academy: [
      en ? "Define the target program and enrollment window before writing any campaign content" : "Definir el programa objetivo y la ventana de matricula antes de escribir contenido de campana",
      en ? "Segment the audience by program intent — do not run a single campaign for all programs" : "Segmentar la audiencia por intención de programa — no ejecutar una sola campana para todos los programas",
      en ? "Set the primary KPI: qualified enrollments, not raw leads" : "Establecer el KPI principal: matriculas calificadas, no prospectos en bruto",
      en ? "Set a stop rule: if qualified enrollment rate falls below target after week 2, pause and review the offer or targeting" : "Establecer una regla de parada: si la tasa de matricula calificada cae por debajo del objetivo en la semana 2, pausar y revisar la oferta o el targeting",
      en ? "Route campaign responses through the lead qualification SOP before follow-up" : "Enrutar las respuestas de la campana a traves del SOP de calificacion de prospectos antes del seguimiento"
    ],
    subscription: [
      en ? "Define the ICP segment and activation event before writing any campaign content" : "Definir el segmento ICP y el evento de activacion antes de escribir contenido de campana",
      en ? "Set the primary KPI: trial signups from target ICP, not total click volume" : "Establecer el KPI principal: registros de prueba del ICP objetivo, no volumen total de clics",
      en ? "Set a stop rule: if trial-to-activated conversion drops below baseline after week 2, pause and review targeting" : "Establecer una regla de parada: si la conversion de prueba a activacion cae por debajo del valor base en la semana 2, pausar y revisar el targeting",
      en ? "Confirm onboarding and activation flow is ready before launching demand-generation campaign" : "Confirmar que el flujo de onboarding y activacion esta listo antes de lanzar la campana de generacion de demanda",
      en ? "Route campaign responses through the lead qualification SOP" : "Enrutar las respuestas de la campana a traves del SOP de calificacion de prospectos"
    ],
    services: [
      en ? "Define the service offer, delivery scope, and ideal client profile before writing any campaign content" : "Definir la oferta de servicio, el alcance de entrega y el perfil de cliente ideal antes de escribir contenido de campana",
      en ? "Set the primary KPI: qualified discovery calls booked, not form fills" : "Establecer el KPI principal: llamadas de calificacion agendadas, no formularios completados",
      en ? "Set a stop rule: if qualified call booking rate falls below target after week 2, pause and revise the offer or segment" : "Establecer una regla de parada: si la tasa de agendado de llamadas calificadas cae por debajo del objetivo en la semana 2, pausar y revisar la oferta o el segmento",
      en ? "Confirm capacity before launching demand-generation — do not generate leads the team cannot service" : "Confirmar capacidad antes de lanzar generacion de demanda — no generar prospectos que el equipo no pueda atender",
      en ? "Route campaign responses through the lead qualification SOP" : "Enrutar las respuestas de la campana a traves del SOP de calificacion de prospectos"
    ],
    commerce: [
      en ? "Define the offer, pricing, and target buyer segment before writing any campaign content" : "Definir la oferta, el precio y el segmento de compradores objetivo antes de escribir contenido de campana",
      en ? "Set the primary KPI: checkout conversions from target segment, not impressions or clicks" : "Establecer el KPI principal: conversiones en checkout del segmento objetivo, no impresiones o clics",
      en ? "Set a stop rule: if checkout conversion rate falls below the week-1 baseline after week 2, pause and review the offer or checkout flow" : "Establecer una regla de parada: si la tasa de conversion en checkout cae por debajo del valor base de la semana 1 en la semana 2, pausar y revisar la oferta o el flujo de checkout",
      en ? "Confirm inventory levels and fulfillment capacity before launching any campaign" : "Confirmar niveles de inventario y capacidad de cumplimiento antes de lanzar cualquier campana",
      en ? "Route campaign responses through the lead qualification SOP for high-value segments" : "Enrutar las respuestas de la campana a traves del SOP de calificacion para segmentos de alto valor"
    ],
    marketplace: [
      en ? "Define whether the campaign targets supply-side or demand-side participants" : "Definir si la campana apunta al lado de oferta o al lado de demanda",
      en ? "Set the primary KPI: qualified registrations from the target side, not total signups" : "Establecer el KPI principal: registros calificados del lado objetivo, no registros totales",
      en ? "Set a stop rule: if match rate does not improve after the first activation cycle, pause and review supply/demand imbalance" : "Establecer una regla de parada: si la tasa de coincidencia no mejora despues del primer ciclo de activacion, pausar y revisar el desequilibrio de oferta/demanda",
      en ? "Confirm that onboarding flow is ready for the targeted side before launching" : "Confirmar que el flujo de incorporacion esta listo para el lado objetivo antes del lanzamiento",
      en ? "Route campaign responses through the lead qualification SOP" : "Enrutar las respuestas de la campana a traves del SOP de calificacion de prospectos"
    ],
    general: [
      en ? "Define the target segment and offer before writing any campaign content" : "Definir el segmento objetivo y la oferta antes de escribir contenido de campana",
      en ? "Set the primary KPI: qualified responses from target segment, not total impressions" : "Establecer el KPI principal: respuestas calificadas del segmento objetivo, no impresiones totales",
      en ? "Set a stop rule: if qualified response rate falls below target after week 2, pause and review targeting or offer" : "Establecer una regla de parada: si la tasa de respuesta calificada cae por debajo del objetivo en la semana 2, pausar y revisar el targeting o la oferta",
      en ? "Confirm downstream capacity before launching — do not generate demand the team cannot handle" : "Confirmar capacidad antes de lanzar — no generar demanda que el equipo no pueda manejar",
      en ? "Route campaign responses through the lead qualification SOP" : "Enrutar las respuestas de la campana a traves del SOP de calificacion de prospectos"
    ]
  };

  const nowItem = roadmap?.items.find((i) => i.phase === "now");
  const roadmapContext = nowItem
    ? (en ? `Priority roadmap move: ${nowItem.title}` : `Movimiento prioritario en el roadmap: ${nowItem.title}`)
    : null;

  const title = en ? `Campaign Setup and Launch Checklist — ${company}` : `Lista de verificacion de campana — ${company}`;
  const purpose = en
    ? `Ensure every campaign is launched with a defined segment, KPI, stop rule, and downstream capacity confirmation. Prevent wasted spend on underprepared launches.`
    : `Garantizar que cada campana se lance con un segmento definido, un KPI, una regla de parada y una confirmacion de capacidad. Prevenir gasto desperdiciado en lanzamientos sin preparacion.`;

  const content = [
    {
      heading: en ? "Purpose and trigger" : "Proposito y detonador",
      items: [
        purpose,
        en ? "Trigger: decision to launch a new campaign or activate a channel" : "Detonador: decision de lanzar una nueva campana o activar un canal",
        channelNote
      ]
    },
    {
      heading: en ? "Owner and responsibilities" : "Responsable y responsabilidades",
      items: [
        en ? "Owner: Founder or marketing lead" : "Responsable: Fundador o responsable de marketing",
        en ? "Responsibilities: complete pre-launch checklist, confirm KPI and stop rule, obtain approval before spend is committed" : "Responsabilidades: completar la lista de verificacion previa al lanzamiento, confirmar KPI y regla de parada, obtener aprobacion antes de comprometer el gasto"
      ]
    },
    {
      heading: en ? "Required tools" : "Herramientas requeridas",
      items: profile.currentTools.length > 0
        ? profile.currentTools.slice(0, 4)
        : (en ? ["Ad platform or outreach tool", "CRM or tracking system", "Landing page or destination URL"] : ["Plataforma de anuncios o herramienta de alcance", "CRM o sistema de seguimiento", "Pagina de destino o URL de destino"])
    },
    {
      heading: en ? "Pre-launch steps" : "Pasos previos al lanzamiento",
      items: campaignSteps[type]
    },
    {
      heading: en ? "QA checkpoint" : "Punto de control de calidad",
      items: [
        en ? "Target segment is named, not described as 'everyone interested'" : "El segmento objetivo esta nombrado, no descrito como 'todos los interesados'",
        en ? "KPI is quantified: a specific number or rate, not just a category" : "El KPI esta cuantificado: un numero o tasa especifica, no solo una categoria",
        en ? "Stop rule is written down before spend is committed" : "La regla de parada esta escrita antes de comprometer el gasto",
        roadmapContext ?? (en ? "Campaign objective aligns with current roadmap priority" : "El objetivo de la campana se alinea con la prioridad actual del roadmap")
      ]
    },
    {
      heading: en ? "Expected output" : "Resultado esperado",
      items: [
        en ? "A completed pre-launch checklist on file before any spend is committed" : "Una lista de verificacion previa al lanzamiento completada antes de comprometer cualquier gasto",
        en ? "First-week performance reviewed against the defined KPI" : "El rendimiento de la primera semana revisado contra el KPI definido",
        en ? "A documented go or stop decision at the end of week 2" : "Una decision documentada de continuar o detener al final de la semana 2"
      ]
    }
  ];

  const sourceReferences: SopArtifactSourceReference[] = [
    {
      sourceType: "business_profile",
      label: en ? "Current channels" : "Canales actuales",
      referenceId: profile.id,
      detail: channels.length > 0 ? channels.join(", ") : (en ? "Not specified" : "No especificado")
    },
    {
      sourceType: "diagnostic",
      label: en ? "Top opportunity" : "Principal oportunidad",
      referenceId: diagnostic.id,
      detail: diagnostic.topOpportunities[0]?.title ?? (en ? "None identified" : "Ninguna identificada")
    },
    ...(roadmap && nowItem
      ? [{
          sourceType: "roadmap" as const,
          label: en ? "Now-phase roadmap item" : "Elemento del roadmap en fase ahora",
          referenceId: roadmap.id,
          detail: nowItem.title
        }]
      : [])
  ];

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId,
    sopType: "campaign_setup" as SopArtifactType,
    title,
    purpose,
    content,
    sourceReferences,
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

// ─── Content workflow ─────────────────────────────────────────────────────────

function buildContentWorkflowSop(
  jobId: string,
  workspaceId: string,
  type: BusinessType,
  profile: BusinessProfileRecord,
  diagnostic: DiagnosticResultRecord,
  language: OutputLanguage
): SopArtifactRecord {
  const now = new Date().toISOString();
  const company = profile.companyName ?? "Your business";
  const en = language === "en";
  const channels = profile.currentChannels.slice(0, 4);

  const contentFocusLabel: Record<BusinessType, string> = {
    academy: en ? "Program-specific content: enrollment path, program promise, and completion stories" : "Contenido especifico por programa: ruta de matricula, promesa del programa e historias de finalizacion",
    subscription: en ? "Activation and retention content: feature value, use-case proof, and upgrade rationale" : "Contenido de activacion y retencion: valor de funciones, prueba de casos de uso y razon para mejorar",
    services: en ? "Authority and proof content: client outcomes, delivery methodology, and case examples" : "Contenido de autoridad y prueba: resultados de clientes, metodologia de entrega y ejemplos de casos",
    commerce: en ? "Product and conversion content: buyer reviews, use-case images, and offer comparisons" : "Contenido de producto y conversion: resenas de compradores, imagenes de casos de uso y comparaciones de oferta",
    marketplace: en ? "Trust and liquidity content: participant stories, match-quality proof, and platform credibility" : "Contenido de confianza y liquidez: historias de participantes, prueba de calidad de coincidencia y credibilidad de la plataforma",
    general: en ? "Segment-specific content: positioning proof, problem-solution framing, and conversion path" : "Contenido especifico por segmento: prueba de posicionamiento, encuadre problema-solucion y ruta de conversion"
  };

  const reviewGateLabel: Record<BusinessType, string> = {
    academy: en ? "Founder reviews any content that names program promises, outcomes, or enrollment terms before publication" : "El fundador revisa cualquier contenido que mencione promesas del programa, resultados o terminos de matricula antes de publicar",
    subscription: en ? "Founder reviews any content that names pricing, feature availability, or uptime claims before publication" : "El fundador revisa cualquier contenido que mencione precios, disponibilidad de funciones o reclamaciones de tiempo de actividad antes de publicar",
    services: en ? "Founder reviews any content that names client results, timelines, or delivery guarantees before publication" : "El fundador revisa cualquier contenido que mencione resultados de clientes, plazos o garantias de entrega antes de publicar",
    commerce: en ? "Founder reviews any content that names pricing, inventory availability, or shipping promises before publication" : "El fundador revisa cualquier contenido que mencione precios, disponibilidad de inventario o promesas de envio antes de publicar",
    marketplace: en ? "Founder reviews any content that names platform guarantees, match rates, or earnings claims before publication" : "El fundador revisa cualquier contenido que mencione garantias de la plataforma, tasas de coincidencia o reclamaciones de ganancias antes de publicar",
    general: en ? "Founder reviews any content that names commercial claims, outcomes, or pricing before publication" : "El fundador revisa cualquier contenido que mencione reclamaciones comerciales, resultados o precios antes de publicar"
  };

  const title = en ? `Content Creation and Publication Workflow — ${company}` : `Flujo de trabajo de creacion y publicacion de contenido — ${company}`;
  const purpose = en
    ? `Define how content is created, reviewed, approved, and published so that every piece has a defined audience, a clear channel destination, and a review gate before publication.`
    : `Definir como se crea, revisa, aprueba y publica el contenido para que cada pieza tenga una audiencia definida, un destino de canal claro y una puerta de revision antes de publicar.`;

  const content = [
    {
      heading: en ? "Purpose and trigger" : "Proposito y detonador",
      items: [
        purpose,
        en ? "Trigger: new content piece enters the creation queue or publishing deadline approaches" : "Detonador: nueva pieza de contenido entra a la cola de creacion o se aproxima la fecha de publicacion",
        contentFocusLabel[type]
      ]
    },
    {
      heading: en ? "Owner and responsibilities" : "Responsable y responsabilidades",
      items: [
        en ? "Content creator: drafts, formats, and submits for review" : "Creador de contenido: redacta, da formato y envia para revision",
        en ? "Reviewer (founder or assigned lead): checks for accuracy, claims, and brand alignment" : "Revisor (fundador o responsable asignado): verifica exactitud, reclamaciones y alineacion de marca",
        en ? "Publisher: schedules and publishes after approval is confirmed" : "Publicador: programa y publica despues de confirmar la aprobacion"
      ]
    },
    {
      heading: en ? "Required tools" : "Herramientas requeridas",
      items: profile.currentTools.length > 0
        ? profile.currentTools.slice(0, 4)
        : (en ? ["Content drafting tool", "Publishing or scheduling platform", "Asset storage (shared folder or CMS)"] : ["Herramienta de redaccion de contenido", "Plataforma de publicacion o programacion", "Almacenamiento de recursos (carpeta compartida o CMS)"])
    },
    {
      heading: en ? "Steps" : "Pasos",
      items: [
        en ? "Define: target audience segment, destination channel, and publishing date before any drafting begins" : "Definir: segmento de audiencia objetivo, canal de destino y fecha de publicacion antes de iniciar cualquier redaccion",
        en ? `Draft content for these channels: ${channels.length > 0 ? channels.join(", ") : (en ? "channels defined in profile" : "canales definidos en el perfil")}` : `Redactar contenido para estos canales: ${channels.length > 0 ? channels.join(", ") : "canales definidos en el perfil"}`,
        en ? "Submit draft for review with: audience label, channel destination, and key message summary" : "Enviar borrador para revision con: etiqueta de audiencia, destino de canal y resumen del mensaje clave",
        reviewGateLabel[type],
        en ? "After approval: publish according to schedule, record publication date and URL, and tag content in tracking system" : "Despues de la aprobacion: publicar segun el calendario, registrar fecha de publicacion y URL, y etiquetar el contenido en el sistema de seguimiento",
        en ? "Archive published content with: date, channel, audience, and performance notes after 2 weeks" : "Archivar el contenido publicado con: fecha, canal, audiencia y notas de rendimiento despues de 2 semanas"
      ]
    },
    {
      heading: en ? "QA checkpoint" : "Punto de control de calidad",
      items: [
        en ? "No content is published without a named audience segment and channel destination" : "Ningun contenido se publica sin un segmento de audiencia nombrado y un destino de canal",
        en ? "No commercial claims or outcome promises are published without founder review" : "Ninguna reclamacion comercial o promesa de resultados se publica sin revision del fundador",
        en ? "Published content is logged within 24 hours of publication" : "El contenido publicado se registra en las 24 horas posteriores a la publicacion"
      ]
    },
    {
      heading: en ? "Expected output" : "Resultado esperado",
      items: [
        en ? "A published content log with: date, channel, audience, and performance tag" : "Un registro de contenido publicado con: fecha, canal, audiencia y etiqueta de rendimiento",
        en ? "All review-gated content has a documented approval before publication" : "Todo el contenido sujeto a revision tiene una aprobacion documentada antes de publicar",
        en ? "Top-performing content is flagged for reuse in the next creation cycle" : "El contenido de mejor rendimiento se marca para reutilizacion en el siguiente ciclo de creacion"
      ]
    }
  ];

  const sourceReferences: SopArtifactSourceReference[] = [
    {
      sourceType: "business_profile",
      label: en ? "Active channels" : "Canales activos",
      referenceId: profile.id,
      detail: channels.length > 0 ? channels.join(", ") : (en ? "Not specified" : "No especificado")
    },
    {
      sourceType: "diagnostic",
      label: en ? "Acquisition bottleneck" : "Cuello de botella de adquisicion",
      referenceId: diagnostic.id,
      detail: diagnostic.topBottlenecks.find((b) => /acqui|content|channel|lead|traffic/i.test(b.title))?.title
        ?? (diagnostic.topBottlenecks[0]?.title ?? (en ? "None identified" : "Ninguno identificado"))
    }
  ];

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId,
    sopType: "content_workflow" as SopArtifactType,
    title,
    purpose,
    content,
    sourceReferences,
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

// ─── Internal approval ────────────────────────────────────────────────────────

function buildInternalApprovalSop(
  jobId: string,
  workspaceId: string,
  type: BusinessType,
  profile: BusinessProfileRecord,
  diagnostic: DiagnosticResultRecord,
  roadmap: RoadmapRecord | null,
  language: OutputLanguage
): SopArtifactRecord {
  const now = new Date().toISOString();
  const company = profile.companyName ?? "Your business";
  const en = language === "en";

  const approvalScopes: Record<BusinessType, string[]> = {
    academy: [
      en ? "New program launch or program modification" : "Lanzamiento de nuevo programa o modificacion de programa",
      en ? "Discount or pricing change on any program" : "Descuento o cambio de precio en cualquier programa",
      en ? "Enrollment window extension or cohort size change" : "Extension de la ventana de matricula o cambio en el tamano del cohorte",
      en ? "New channel activation for enrollment campaigns" : "Activacion de nuevo canal para campanas de matricula",
      en ? "External partnership or affiliate agreement" : "Acuerdo de alianza o afiliado externo"
    ],
    subscription: [
      en ? "Pricing change or new plan introduction" : "Cambio de precio o introduccion de nuevo plan",
      en ? "Feature removal, downgrade, or deprecation" : "Eliminacion de funcion, reduccion o deprecacion",
      en ? "New channel activation or ad spend above threshold" : "Activacion de nuevo canal o gasto en anuncios por encima del umbral",
      en ? "Customer refund or exception above defined limit" : "Reembolso o excepcion de cliente por encima del limite definido",
      en ? "New integration or third-party data sharing agreement" : "Nueva integracion o acuerdo de intercambio de datos con terceros"
    ],
    services: [
      en ? "New project proposal above standard scope" : "Nueva propuesta de proyecto por encima del alcance estandar",
      en ? "Scope change or budget increase on active project" : "Cambio de alcance o aumento de presupuesto en un proyecto activo",
      en ? "New subcontractor or delivery partner engagement" : "Contratacion de nuevo subcontratista o socio de entrega",
      en ? "Client refund or credit above defined limit" : "Reembolso o credito de cliente por encima del limite definido",
      en ? "New service offering or pricing model introduction" : "Introduccion de nueva oferta de servicio o modelo de precios"
    ],
    commerce: [
      en ? "New product or bundle introduction" : "Introduccion de nuevo producto o paquete",
      en ? "Discount or promotion above standard threshold" : "Descuento o promocion por encima del umbral estandar",
      en ? "Refund or return above defined limit" : "Reembolso o devolucion por encima del limite definido",
      en ? "New channel activation or ad spend above threshold" : "Activacion de nuevo canal o gasto en anuncios por encima del umbral",
      en ? "New supplier or fulfillment partner agreement" : "Nuevo acuerdo con proveedor o socio de cumplimiento"
    ],
    marketplace: [
      en ? "New supply-side category or tier introduction" : "Introduccion de nueva categoria o nivel del lado de oferta",
      en ? "Platform fee change or incentive structure modification" : "Cambio de tarifa de plataforma o modificacion de estructura de incentivos",
      en ? "New demand-side activation channel" : "Nuevo canal de activacion del lado de demanda",
      en ? "Dispute resolution decision above standard policy" : "Decision de resolucion de disputas por encima de la politica estandar",
      en ? "New third-party data or integration agreement" : "Nuevo acuerdo de datos o integracion con terceros"
    ],
    general: [
      en ? "New spend commitment above defined threshold" : "Nuevo compromiso de gasto por encima del umbral definido",
      en ? "New vendor, partner, or contractor engagement" : "Contratacion de nuevo proveedor, socio o contratista",
      en ? "Pricing or offer change" : "Cambio de precio u oferta",
      en ? "Customer refund or exception above standard policy" : "Reembolso o excepcion de cliente por encima de la politica estandar",
      en ? "New channel activation or campaign above budget threshold" : "Activacion de nuevo canal o campana por encima del umbral de presupuesto"
    ]
  };

  const blockedProcedure = en
    ? "If the approver is unavailable, the decision is held — not delegated without explicit written authorization from the founder"
    : "Si el aprobador no esta disponible, la decision se retiene — no se delega sin autorizacion escrita explicita del fundador";

  const nowItem = roadmap?.items.find((i) => i.phase === "now");

  const title = en ? `Internal Approval Procedure — ${company}` : `Procedimiento de aprobacion interna — ${company}`;
  const purpose = en
    ? `Define which decisions require explicit approval, who holds approval authority, what artifacts are required before approval is granted, and what happens when approval is blocked.`
    : `Definir que decisiones requieren aprobacion explicita, quien tiene autoridad de aprobacion, que documentos se requieren antes de otorgar la aprobacion y que sucede cuando la aprobacion esta bloqueada.`;

  const content = [
    {
      heading: en ? "Purpose and trigger" : "Proposito y detonador",
      items: [
        purpose,
        en ? "Trigger: any decision in the defined approval scope is proposed or requires commitment" : "Detonador: cualquier decision en el alcance de aprobacion definido es propuesta o requiere compromiso"
      ]
    },
    {
      heading: en ? "Owner and responsibilities" : "Responsable y responsabilidades",
      items: [
        en ? "Approval authority: Founder (primary) or designated co-signer for specific categories" : "Autoridad de aprobacion: Fundador (principal) o cofirmante designado para categorias especificas",
        en ? "Requester: team member or operator who proposes the decision and prepares the approval package" : "Solicitante: miembro del equipo u operador que propone la decision y prepara el paquete de aprobacion",
        en ? "Responsibilities of requester: submit approval request with required artifacts before any commitment is made" : "Responsabilidades del solicitante: enviar solicitud de aprobacion con los documentos requeridos antes de realizar cualquier compromiso"
      ]
    },
    {
      heading: en ? "Decisions that require approval" : "Decisiones que requieren aprobacion",
      items: approvalScopes[type]
    },
    {
      heading: en ? "Required artifacts before approval" : "Documentos requeridos antes de la aprobacion",
      items: [
        en ? "Written description of the decision: what is being proposed and why" : "Descripcion escrita de la decision: que se propone y por que",
        en ? "Expected cost or commitment: dollar amount, resource hours, or scope change" : "Costo o compromiso esperado: monto en dolares, horas de recursos o cambio de alcance",
        en ? "Downstream impact: which current marketing plan, channel, or metric is affected" : "Impacto posterior: que plan de marketing, canal o metrica actual se ve afectado",
        nowItem
          ? (en ? `Alignment check: does this decision support or conflict with the current roadmap priority: ${nowItem.title}` : `Verificacion de alineacion: esta decision apoya o entra en conflicto con la prioridad actual del roadmap: ${nowItem.title}`)
          : (en ? "Alignment check: does this decision support or conflict with the current marketing priority" : "Verificacion de alineacion: esta decision apoya o entra en conflicto con la prioridad actual de marketing"),
        en ? "Reversibility: can this decision be undone if results are negative?" : "Reversibilidad: puede deshacerse esta decision si los resultados son negativos?"
      ]
    },
    {
      heading: en ? "QA checkpoint" : "Punto de control de calidad",
      items: [
        en ? "No approval is granted verbally — all approvals are confirmed in writing (email or message with timestamp)" : "Ninguna aprobacion se otorga verbalmente — todas las aprobaciones se confirman por escrito (correo electronico o mensaje con marca de tiempo)",
        en ? "No commitment is made before approval is confirmed and documented" : "Ningun compromiso se realiza antes de confirmar y documentar la aprobacion",
        blockedProcedure
      ]
    },
    {
      heading: en ? "Expected output" : "Resultado esperado",
      items: [
        en ? "A written approval record with: decision description, approver, date, and approval outcome" : "Un registro de aprobacion escrito con: descripcion de la decision, aprobador, fecha y resultado de la aprobacion",
        en ? "Rejected decisions have a documented reason and an alternative path if applicable" : "Las decisiones rechazadas tienen una razon documentada y un camino alternativo si aplica",
        en ? "Approval log is reviewed monthly to confirm process compliance" : "El registro de aprobaciones se revisa mensualmente para confirmar el cumplimiento del proceso"
      ]
    }
  ];

  const sourceReferences: SopArtifactSourceReference[] = [
    {
      sourceType: "diagnostic",
      label: en ? "Top risk" : "Principal riesgo",
      referenceId: diagnostic.id,
      detail: diagnostic.topRisks[0]?.title ?? (en ? "None identified" : "Ninguno identificado")
    },
    ...(roadmap && nowItem
      ? [{
          sourceType: "roadmap" as const,
          label: en ? "Now-phase roadmap item" : "Elemento del roadmap en fase ahora",
          referenceId: roadmap.id,
          detail: nowItem.title
        }]
      : [])
  ];

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId,
    sopType: "internal_approval" as SopArtifactType,
    title,
    purpose,
    content,
    sourceReferences,
    generationStatus: "completed",
    createdAt: now,
    updatedAt: now
  };
}

function applySopTrustMode(
  artifact: SopArtifactRecord,
  trustState: DownstreamTrustState,
  language: OutputLanguage
): SopArtifactRecord {
  if (trustState.mode !== "validation_first") {
    return artifact;
  }

  const en = language === "en";
  const prefix = trustState.hasContradiction
    ? en
      ? "Conditional template"
      : "Plantilla condicional"
    : en
      ? "Draft template"
      : "Plantilla borrador";
  const validationItems = trustState.validationTasks.length
    ? trustState.validationTasks
    : [
        en
          ? "Validate the missing business evidence before operationalizing this SOP."
          : "Validar la evidencia de negocio faltante antes de operar este SOP."
      ];
  const cannotClaim = trustState.cannotClaim.length
    ? trustState.cannotClaim
    : [
        en
          ? "This SOP is not operationally ready until evidence gaps are closed."
          : "Este SOP no esta listo para operar hasta cerrar los gaps de evidencia."
      ];

  return {
    ...artifact,
    title: `${prefix}: ${artifact.title}`,
    purpose: en
      ? `Draft only. ${artifact.purpose} Use after validation confirms the required evidence and ownership.`
      : `Solo borrador. ${artifact.purpose} Usar despues de que la validacion confirme evidencia y ownership requeridos.`,
    content: [
      {
        heading: en ? "Trust status" : "Estado de confianza",
        items: [
          trustState.summary,
          en
            ? `Diagnostic confidence: ${trustState.confidence}.`
            : `Confianza diagnostica: ${trustState.confidence}.`
        ]
      },
      {
        heading: en ? "Validate before operationalizing" : "Validar antes de operar",
        items: validationItems.slice(0, 5)
      },
      {
        heading: en ? "Do not claim yet" : "No afirmar todavia",
        items: cannotClaim.slice(0, 4)
      },
      ...artifact.content
    ],
    sourceReferences: [
      ...artifact.sourceReferences,
      {
        sourceType: "diagnostic",
        label: en ? "Downstream trust state" : "Estado de confianza posterior",
        detail: trustState.label
      }
    ]
  };
}

// ─── Public builder ───────────────────────────────────────────────────────────

export function buildSopArtifacts({
  jobId,
  workspace,
  profile,
  diagnostic,
  roadmap,
  thirtyDayPlan
}: {
  jobId: string;
  workspace: WorkspaceRecord;
  profile: BusinessProfileRecord;
  diagnostic: DiagnosticResultRecord;
  roadmap: RoadmapRecord | null;
  thirtyDayPlan: ThirtyDayPlanRecord | null;
}): SopArtifactRecord[] {
  const type = detectBusinessType(profile);
  const language = workspace.outputLanguage;
  const workspaceId = workspace.id;
  const trustState = resolveDownstreamTrustState({ diagnostic, language, profile });

  const artifacts = [
    buildLeadHandlingSop(jobId, workspaceId, type, profile, diagnostic, language),
    buildReportingCadenceSop(jobId, workspaceId, type, profile, diagnostic, thirtyDayPlan, language),
    buildCampaignSetupSop(jobId, workspaceId, type, profile, diagnostic, roadmap, language),
    buildContentWorkflowSop(jobId, workspaceId, type, profile, diagnostic, language),
    buildInternalApprovalSop(jobId, workspaceId, type, profile, diagnostic, roadmap, language)
  ];

  return trustState
    ? artifacts.map((artifact) => applySopTrustMode(artifact, trustState, language))
    : artifacts;
}
