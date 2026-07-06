import { z } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createAgenticDiagnosisRecord,
  createDiagnosticJob,
  createDiagnosticResult,
  getBusinessProfile,
  incrementWorkspaceUsageCounter,
  updateDiagnosticJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import type { IntakeProfile } from "@/lib/agentic/schema";
import { buildFallbackDiagnosisOutput } from "@/lib/agentic/fallback";
import { fetchEvidenceFromUrl } from "@/lib/agentic/evidence";
import { runAgenticDiagnosis } from "@/lib/agentic/engine";
import { encryptJson } from "@/lib/crypto";
import { buildDiagnosticResult } from "@/lib/diagnostics";
import { getErrorMessage } from "@/lib/errors";
import {
  canAccessWorkspace,
  canRunDiagnostics,
  getUsageCounter,
  type BusinessProfileRecord,
  type DiagnosticJobRecord,
  type WorkspaceRecord
} from "@/lib/foundation";
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

async function appendFetchedWebsiteEvidence(
  intake: IntakeProfile,
  profile: BusinessProfileRecord
) {
  const urls = [profile.website, profile.channelUrls[0]]
    .map((value) => value?.trim())
    .filter((value): value is string =>
      Boolean(value && /^https?:\/\//i.test(value))
    )
    .slice(0, 2);

  const fetched = await Promise.all(
    urls.map(async (url) => ({ url, text: await fetchEvidenceFromUrl(url) }))
  );

  for (const { url, text } of fetched) {
    if (text) {
      intake.evidence.push(`Observed website content (fetched from ${url}): ${text}`);
    }
  }
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

async function createCompatibilityDiagnosticResult({
  workspace,
  requestedByUserId,
  profile
}: {
  workspace: WorkspaceRecord;
  requestedByUserId: string | null;
  profile: BusinessProfileRecord;
}) {
  const now = new Date().toISOString();
  const job: DiagnosticJobRecord = {
    id: crypto.randomUUID(),
    workspaceId: workspace.id,
    requestedByUserId,
    status: "queued",
    jobType: "agentic_diagnosis_compatibility",
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };

  await createDiagnosticJob(job);

  try {
    await updateDiagnosticJob(job.id, {
      status: "processing",
      startedAt: new Date().toISOString()
    });

    const result = buildDiagnosticResult({
      jobId: job.id,
      workspace,
      profile
    });

    await createDiagnosticResult(result);
    await updateDiagnosticJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    return result;
  } catch (error) {
    await updateDiagnosticJob(job.id, {
      status: "failed",
      error: getErrorMessage(error, "Agentic diagnosis compatibility layer failed."),
      completedAt: new Date().toISOString()
    });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    if (!canRunDiagnostics(context)) {
      const counter = getUsageCounter(context, "diagnostic_runs");
      const limitMessage = counter
        ? `Diagnostic run limit reached: ${counter.usedCount}/${counter.limitCount}.`
        : "Diagnostic run entitlement is missing for this workspace.";

      return noStoreJson(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "Diagnostics are read-only while the workspace is past due."
              : limitMessage
        },
        { status: 403 }
      );
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

    await appendFetchedWebsiteEvidence(intake, profile);

    let result: Awaited<ReturnType<typeof runAgenticDiagnosis>>;
    let source: "anthropic" | "deterministic_fallback" = "anthropic";

    try {
      result = await runAgenticDiagnosis(intake);
    } catch (error) {
      console.warn("Agentic diagnosis provider failed; using FoundryOS fallback.", {
        message: getErrorMessage(error, "Agentic provider unavailable.")
      });
      source = "deterministic_fallback";
      result = {
        model: "foundryos-deterministic-fallback",
        output: buildFallbackDiagnosisOutput({
          profile,
          workspace: context.workspace,
          intake
        })
      };
    }

    const diagnosticResult = await createCompatibilityDiagnosticResult({
      workspace: context.workspace,
      requestedByUserId: context.user.id,
      profile
    });

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

    await incrementWorkspaceUsageCounter(context.workspace.id, "diagnostic_runs");

    await captureAnalyticsEvent({
      event: "diagnostic_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: diagnosticResult.jobId,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        overall_maturity_score: diagnosticResult.overallMaturityScore,
        confidence: diagnosticResult.confidence,
        agentic_record_id: record.id,
        agentic_model: result.model,
        agentic_source: source,
        agentic_confidence: result.output.overall_confidence
      }
    });

    return noStoreJson({
      ok: true,
      diagnosis: result.output,
      recordId: record.id,
      diagnosticResultId: diagnosticResult.id,
      source,
      model: result.model
    });
  } catch (error) {
    return publicErrorJson(error, "Agentic diagnosis could not be generated.");
  }
}
