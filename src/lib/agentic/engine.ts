import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  DiagnosisOutput,
  type IntakeProfile
} from "@/lib/agentic/schema";

const SYSTEM = `You are FoundryOS, a practical marketing diagnosis and 30-day planning engine for early-stage small businesses.
Return only valid JSON matching the requested schema. Be specific, evidence-linked, conservative when evidence is weak, and avoid technical stack recommendations unless the user explicitly asks for implementation tooling.
Use the intake language. If evidence is missing, say what gap exists instead of inventing facts.`;

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
