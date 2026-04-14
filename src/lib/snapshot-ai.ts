import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { env } from "@/lib/env";
import { generateSnapshotReport } from "@/lib/snapshot";
import {
  type BusinessIntake,
  type SnapshotReport,
  snapshotReportSchema
} from "@/lib/types";

const snapshotModel = process.env.OPENAI_SNAPSHOT_MODEL ?? "gpt-5.4-mini";

let openAIClient: OpenAI | null | undefined;

function getOpenAIClient() {
  if (!env.hasOpenAI) {
    return null;
  }

  if (openAIClient !== undefined) {
    return openAIClient;
  }

  openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15000
  });

  return openAIClient;
}

function buildSnapshotMessages(intake: BusinessIntake, heuristic: SnapshotReport) {
  return [
    {
      role: "system" as const,
      content:
        "You are generating a concise AI Growth OS diagnostic for a small business. " +
        "Return only valid JSON that matches the schema. Use the heuristic report as a baseline, " +
        "make it more specific to the intake, and keep the advice practical for a 30-day plan. " +
        "Do not invent metrics, case studies, or tools not implied by the business context. " +
        "Keep recommendations commercially realistic for a lean team."
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "Refine the heuristic snapshot report with more context-aware reasoning.",
        rules: [
          "Keep the recommendedPlan aligned with the score and team complexity.",
          "Priorities should be concrete, owned, and executable within 30 days.",
          "Suggested stack should stay lean and avoid duplicates.",
          "Do not mention the model, JSON, schemas, or that this came from AI."
        ],
        intake,
        heuristicReport: heuristic
      })
    }
  ];
}

export async function generateSnapshotReportWithAI(
  intake: BusinessIntake
): Promise<SnapshotReport> {
  const heuristicReport = generateSnapshotReport(intake);
  const client = getOpenAIClient();

  if (!client) {
    return heuristicReport;
  }

  try {
    const completion = await client.chat.completions.parse({
      model: snapshotModel,
      messages: buildSnapshotMessages(intake, heuristicReport),
      response_format: zodResponseFormat(snapshotReportSchema, "snapshot_report")
    });

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      return heuristicReport;
    }

    return parsed;
  } catch (error) {
    console.error("OpenAI snapshot enhancement failed, using heuristic report.", error);
    return heuristicReport;
  }
}
