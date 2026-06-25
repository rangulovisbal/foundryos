import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  DiagnosisOutput,
  type IntakeProfile
} from "@/lib/agentic/schema";

const SYSTEM = `You are FoundryOS: a senior marketing strategist for early-stage small businesses (1-20 people) with no marketing team. You are not a generic assistant or a list generator. You reason about THIS specific business and return clear, actionable judgement.

HOW YOU THINK (before writing):
1. Read all evidence. Establish what the business sells, to whom, and what it depends on today to get customers.
2. Separate SYMPTOM from CAUSE. "No leads" is a symptom. The cause is usually one of: undefined offer, wrong audience, message that does not position, channel used passively, no conversion path, no social proof, or no measurement. Name the CAUSE in the summary.
3. Score the 7 dimensions with the rubric below; for each, judge evidence and confidence and state what is missing.
4. Find the 1-3 bottlenecks that actually move the needle. Ignore cosmetics.
5. Sequence the 30-day plan by dependency: foundations (offer/message/positioning) first, then proof and conversion, then reach, with measurement closing the loop. Never put "post more" in week 1 if the message does not exist yet.

THE 7 DIMENSIONS (rubric):
- offer: is the offer defined and sellable at a price that sustains the business? Low: "we do everything". High: specific offer for a specific buyer with a reason to pay more.
- audience: do they know exactly who they serve? Low: "anyone who needs it". High: a sharp ICP (who, where, what pain, what budget).
- message: do they communicate WHY them and not a competitor? Low: they describe what they do. High: a clear promise that positions and differentiates.
- channel: are they where their audience is, using it to capture and not just exist? Low: passive presence. High: chosen channel with a call to action.
- conversion: is there a clear path from "interested" to "we talk / I buy"? Low: no easy way to contact or buy. High: low-friction funnel that captures contact.
- social_proof: do they have the proof a stranger needs to trust them? Low: zero testimonials/cases. High: testimonials, cases with results, numbers.
- measurement: do they know what works and where each customer comes from? Low: blind. High: they track lead source and conversion.

NON-NEGOTIABLE RULES:
- Specificity or nothing: if a sentence could apply to any business, rewrite it until it only fits THIS one, or drop it.
- Confidence honesty: if evidence is weak for a dimension, lower its confidence and say so in evidence_gap. Never invent facts, numbers, or assumptions.
- Cause, not symptom, in the summary.
- One-person executable: every task is doable by the owner alone, with an objective, verifiable done_when.
- Sequence with meaning: foundations before reach; measurement closes the loop.
- No outcome guarantees. You promise clarity and structure, not "X sales".
- No vanity metrics. No "use this tool" without explaining why for THIS business.

ANTI-PATTERNS (never do these):
- "Improve your social presence" -> empty. Say WHAT to post, WHY, and to capture WHOM.
- "Define your target audience" -> propose it yourself, named.
- A list of 10 tactics -> prioritise the 3 that matter.
- Repeating what the business already told you as if it were a finding.

Return only valid JSON for the requested schema. Write in the intake language (Spanish intake -> Spanish output). If evidence is missing, state the gap instead of inventing facts. Do not recommend developer or infrastructure tooling unless explicitly asked.`;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for agentic diagnosis.");
  }

  return new Anthropic({ apiKey });
}

export function getAgenticModel() {
  return process.env.FOUNDRYOS_MODEL || "claude-sonnet-4-6";
}

function promptForIntake(intake: IntakeProfile) {
  return `Create a FoundryOS diagnosis as JSON.

Schema:
{
  "summary": string,
  "overall_confidence": "low" | "medium" | "high",
  "scores": [
    {"dimension": "offer" | "audience" | "message" | "channel" | "conversion" | "social_proof" | "measurement", "score": 0-100, "confidence": "low" | "medium" | "high", "finding": string, "evidence_gap": string | null}
  ],
  "top_bottlenecks": string[1..3],
  "plan_30d": [{"week": 1-4, "focus": string, "tasks": [{"title": string, "why": string, "effort": "S" | "M" | "L", "done_when": string}]}],
  "assets": [{"type": "one_liner" | "cta" | "headline" | "content_idea" | "email", "text": string}],
  "sops": [{"name": string, "steps": string[]}]
}

Rules:
- Return exactly seven scores: offer, audience, message, channel, conversion, social_proof, measurement.
- Return exactly four plan_30d weeks.
- Keep the plan actionable for this week and the next 30 days.
- Recommended tools should be customer-facing marketing and measurement basics: simple landing page, Instagram/LinkedIn/WhatsApp follow-up, email list or waitlist, basic analytics/UTM tracking, feedback collection, or a simple CRM/sheet only when relevant.
- Do not recommend Next.js, Vercel, Postgres, Stripe, PostHog, n8n, Supabase, Neon, or developer infrastructure unless directly requested.

Intake:
${JSON.stringify(intake, null, 2)}`;
}

function extractText(content: Anthropic.Messages.Message["content"]) {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

function parseOutput(text: string): DiagnosisOutput {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Agentic diagnosis did not return JSON.");
  }

  return DiagnosisOutput.parse(JSON.parse(text.slice(start, end + 1)));
}

export async function runAgenticDiagnosis(intake: IntakeProfile) {
  const client = getAnthropicClient();
  const model = getAgenticModel();
  const userPrompt = promptForIntake(intake);

  const first = await client.messages.create({
    model,
    max_tokens: 5000,
    temperature: 0.2,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }]
  });

  try {
    return {
      model,
      output: parseOutput(extractText(first.content))
    };
  } catch (firstError) {
    const repair = await client.messages.create({
      model,
      max_tokens: 5000,
      temperature: 0,
      system: SYSTEM,
      messages: [
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: extractText(first.content)
        },
        {
          role: "user",
          content:
            "Repair the previous response into strict valid JSON only. Do not add markdown."
        }
      ]
    });

    try {
      return {
        model,
        output: parseOutput(extractText(repair.content))
      };
    } catch {
      throw firstError;
    }
  }
}
