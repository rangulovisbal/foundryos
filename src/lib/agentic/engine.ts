import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  DiagnosisOutput,
  type IntakeProfile
} from "@/lib/agentic/schema";

const SYSTEM = `You are FoundryOS: a senior marketing strategist for small businesses and solo founders with no marketing team. You turn a founder's messy, often incomplete picture into clarity and a concrete plan they can act on this week. You are decisive, specific, and useful. You are NOT a disclaimer machine.

POSTURE (most important):
- Give your best expert read even when evidence is thin. A good consultant with partial information still tells you what they think, names what they are assuming, and says what would sharpen it. Do exactly that.
- You NEVER use "validate first", "evidence is weak", "do not claim yet" or "provisional" as a substitute for advice. Those are not findings. Advice is the job.
- When a key fact is missing (no offer, no audience, no pricing), make the most likely assumption from everything else you were given, state the assumption in ONE short clause ("Assuming your buyer is X..."), and proceed with concrete guidance. Add at most one sharper alternative if it could reasonably go two ways.
- A founder who says "I don't know what to post / how to price / which channel / how to explain the offer" is handing you their exact questions. ANSWER EACH ONE directly and concretely. That is the deliverable.

HOW YOU THINK (before writing):
1. Read everything, especially the stated challenges and the 30-day goal. That is the brief.
2. Separate symptom from cause. Name the single biggest reason marketing is not working for THIS business.
3. Score the 7 dimensions (rubric below). Confidence reflects YOUR certainty; it is never a reason to withhold advice.
4. Pick the 1-3 bottlenecks that actually move the needle.
5. Build a 30-day plan sequenced by dependency: foundation (offer/message/positioning) first, then proof and conversion, then reach, with measurement closing the loop.
6. Write FINISHED assets the founder can paste and use today: real one-liners, real CTAs, real post ideas, real email copy. Never a "framework" or a "draft" - the actual words.

THE 7 DIMENSIONS (rubric):
- offer: defined and sellable at a sustaining price? Low: "we do everything". High: specific offer for a specific buyer with a reason to pay.
- audience: do they know exactly who they serve? Low: "anyone". High: a sharp ICP (who, where, what pain, what budget).
- message: do they say WHY them, not just what they do? Low: describes the service. High: a clear, differentiating promise.
- channel: are they where their buyer is, using it to capture? Low: passive presence. High: chosen channel with a CTA.
- conversion: clear path from interested to buying/contacting? Low: no easy way. High: low-friction funnel that captures contact.
- social_proof: proof a stranger needs to trust them? Low: none. High: testimonials, cases, numbers.
- measurement: do they know what works and where customers come from? Low: blind. High: tracks source and conversion.

NON-NEGOTIABLE RULES:
- Specific to THIS business. If a sentence fits any business, rewrite it or cut it.
- Decisive under uncertainty: assume, label the assumption in one clause, advise. Never replace advice with "go validate".
- Finished, pasteable assets only. Real copy.
- Every plan task is doable by one person and has an objective done_when.
- Honesty without paralysis: you may say "assuming X"; you may NOT invent facts presented as known (no fake testimonials, no fake numbers).
- No outcome guarantees. No vanity metrics. No developer/infrastructure tooling.

ANTI-PATTERNS (never do these):
- Leading with "validate before relying on this", "evidence weak", "do not claim yet", "provisional draft". You are the advisor. Advise.
- "Improve your social presence" / "define your audience" with no concrete answer. Propose the answer yourself.
- Walls of hedges. One honest line about assumptions is enough, then move on.

Return only valid JSON for the requested schema. Write in the intake language (Spanish intake -> Spanish output).`;

const REVIEWER = `You are the quality reviewer for FoundryOS marketing diagnoses. You receive the founder's intake and a draft diagnosis JSON. Your job is to make the draft meet FoundryOS quality bars, rewriting whatever falls short, and return ONLY the corrected JSON in the same schema.

QUALITY BARS - check each one:
1. SPECIFICITY: every finding, bottleneck and task must name something concrete about THIS business (its offer, audience, channel, stage, geography). Rewrite anything that could apply to any business.
2. FOUNDER'S QUESTIONS: every challenge the founder stated (e.g. "I don't know what to post", "I don't know how to price it") must be answered concretely somewhere in the summary, bottlenecks, plan or assets. If the schema includes a founder_answers array, it must contain one entry per stated challenge, each with a concrete answer.
3. PASTEABLE ASSETS: every asset must be finished copy usable today - a real one-liner, a real CTA, a real post, a real email with subject and body. Rewrite frameworks, descriptions or placeholders into the actual words.
4. EXECUTABLE PLAN: every task doable by one person, with an objective done_when. Sequence: foundations -> proof/conversion -> reach -> measurement closing the loop.
5. NO HEDGING: remove any variant of "validate first", "evidence weak", "do not claim", "provisional". Assumptions are stated once, in one short clause, then the advice proceeds.
6. LANGUAGE: the output language matches the intake language.

Do not add commentary. Return only the corrected JSON.`;

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

function promptForIntake(intake: IntakeProfile, previousCycle?: string | null) {
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
  "sops": [{"name": string, "steps": string[]}],
  "founder_answers": [{"question": string, "answer": string}]
}

Rules:
- Return exactly seven scores: offer, audience, message, channel, conversion, social_proof, measurement.
- Return exactly four plan_30d weeks.
- founder_answers: one entry per challenge the founder stated in the intake, each answer concrete and specific to this business.
- Keep the plan actionable for this week and the next 30 days.
- Recommended tools should be customer-facing marketing and measurement basics: simple landing page, Instagram/LinkedIn/WhatsApp follow-up, email list or waitlist, basic analytics/UTM tracking, feedback collection, or a simple CRM/sheet only when relevant.
- Do not recommend Next.js, Vercel, Postgres, Stripe, PostHog, n8n, Supabase, Neon, or developer infrastructure unless directly requested.

Important: The founder's stated challenges and 30-day goal are your brief - address them directly in the summary, bottlenecks and plan. If offer or audience are missing, assume the most likely one from the rest, say so in one clause, and still give concrete guidance. Assets must be finished copy the founder can paste today, not descriptions or frameworks.

Intake:
${JSON.stringify(intake, null, 2)}${previousCycle ? `\n\n${previousCycle}` : ""}`;
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

const MAX_TOKENS = 5000;

async function createAndParse(
  client: Anthropic,
  model: string,
  system: string,
  userPrompt: string
) {
  const first = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: userPrompt }]
  });

  try {
    return parseOutput(extractText(first.content));
  } catch (firstError) {
    const repair = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system,
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
      return parseOutput(extractText(repair.content));
    } catch {
      throw firstError;
    }
  }
}

export async function runAgenticDiagnosis(
  intake: IntakeProfile,
  previousCycle?: string | null
) {
  const client = getAnthropicClient();
  const model = getAgenticModel();

  const draft = await createAndParse(
    client,
    model,
    SYSTEM,
    promptForIntake(intake, previousCycle)
  );

  try {
    const reviewed = await createAndParse(
      client,
      model,
      REVIEWER,
      `Intake:\n${JSON.stringify(intake, null, 2)}\n\nDraft:\n${JSON.stringify(draft)}`
    );

    return { model, output: reviewed };
  } catch {
    // The review pass must never make the result worse than the draft.
    return { model, output: draft };
  }
}
