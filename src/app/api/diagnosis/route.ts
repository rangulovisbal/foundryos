import { z } from "zod";

import {
  createAgenticDiagnosisRecord,
  getBusinessProfile
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import type { IntakeProfile } from "@/lib/agentic/schema";
import { runAgenticDiagnosis } from "@/lib/agentic/engine";
import { encryptJson } from "@/lib/crypto";
import { canAccessWorkspace } from "@/lib/foundation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { noStoreJson, publicErrorJson } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const diagnosisRequestSchema = z
  .object({
    notes: z.string().trim().max(2000).optional()
  })
  .optional();

function joinList(label: string, values: string[]) {
  return values.length > 0 ? `${label}: ${values.join(", ")}` : null;
}

function toEvidence(input: Array<string | null | undefined>) {
  return input
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0));
}

function buildIntakeProfile(
  profile: NonNullable<Awaited<ReturnType<typeof getBusinessProfile>>>,
  workspaceName: string,
  language: "en" | "es",
  notes?: string
): IntakeProfile {
  return {
    businessName: profile.companyName || workspaceName,
    offer: profile.primaryOffer || profile.positioningStatement || "",
    audience: profile.targetAudience || "",
    channels: [
      ...profile.currentChannels,
      ...profile.channelUrls
    ].filter(Boolean),
    goals: profile.primaryGoals,
    evidence: toEvidence([
      profile.website ? `Website: ${profile.website}` : null,
      profile.positioningStatement
        ? `Positioning: ${profile.positioningStatement}`
        : null,
      profile.conversionAction ? `CTA / conversion action: ${profile.conversionAction}` : null,
      profile.pricingModel ? `Pricing / ticket model: ${profile.pricingModel}` : null,
      profile.acquisitionMethod ? `Acquisition: ${profile.acquisitionMethod}` : null,
      profile.salesProcess ? `Sales process: ${profile.salesProcess}` : null,
      joinList("Current tools", profile.currentTools),
      joinList("Bottlenecks", profile.biggestBottlenecks),
      profile.evidenceNotes ? `Evidence notes: ${profile.evidenceNotes}` : null,
      profile.lifecycleStage ? `Business stage: ${profile.lifecycleStage}` : null,
      notes ? `Additional request notes: ${notes}` : null
    ]),
    language
  };
}

function rateLimitResponse(result: Awaited<ReturnType<typeof rateLimit>>) {
  return noStoreJson(
    {
      error: "Generation limit reached. Try again after the current window resets."
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec)
      }
    }
  );
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const ipLimit = await rateLimit(`diagnosis:ip:${clientIp(request)}`, 20, 3600);
    if (!ipLimit.ok) {
      return rateLimitResponse(ipLimit);
    }

    const userLimit = await rateLimit(`diagnosis:user:${context.user.id}`, 5, 3600);
    if (!userLimit.ok) {
      return rateLimitResponse(userLimit);
    }

    const body =
      request.headers.get("content-type")?.includes("application/json")
        ? diagnosisRequestSchema.parse(await request.json())
        : undefined;
    const profile = await getBusinessProfile(context.workspace.id);

    if (!profile) {
      return noStoreJson(
        { error: "Complete and save the business profile before running a diagnosis." },
        { status: 400 }
      );
    }

    const intake = buildIntakeProfile(
      profile,
      context.workspace.name,
      context.workspace.outputLanguage,
      body?.notes
    );

    if (!intake.offer || !intake.audience) {
      return noStoreJson(
        {
          error:
            "Add at least a current offer and target audience before running a diagnosis."
        },
        { status: 400 }
      );
    }

    const result = await runAgenticDiagnosis(intake);
    const record = await createAgenticDiagnosisRecord({
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      sourceBusinessProfileId: profile.id,
      intake,
      outputCiphertext: encryptJson(result.output),
      outputSummary: result.output.summary,
      overallConfidence: result.output.overall_confidence,
      model: result.model
    });

    return noStoreJson({
      ok: true,
      diagnosis: result.output,
      recordId: record.id,
      model: result.model
    });
  } catch (error) {
    return publicErrorJson(error, "Agentic diagnosis could not be generated.");
  }
}
