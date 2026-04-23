import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createSopArtifacts,
  createSopJob,
  findLatestCompletedSopJobByInputHash,
  getBusinessProfile,
  getLatestBusinessAssets,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan,
  updateSopJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { buildSopArtifacts } from "@/lib/sops";
import { getErrorMessage } from "@/lib/errors";
import { canGenerateSops, type SopJobRecord } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

/**
 * Compute a deterministic SHA-256 hash of the SOP generation inputs.
 * Keys are sorted alphabetically before serialisation so insertion order
 * never affects the output.
 */
async function computeSopInputHash(
  inputs: Record<string, string | null>
): Promise<string> {
  const sorted = Object.fromEntries(
    Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b))
  );
  const json = JSON.stringify(sorted);
  const encoded = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 64);
}

export async function POST() {
  let job: SopJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    if (!canGenerateSops(context)) {
      return noStoreJson(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "SOP generation is read-only while the workspace is past due."
              : "SOP generation is unavailable for this role, plan, or account state."
        },
        { status: 403 }
      );
    }

    const [profile, diagnostic, roadmap, thirtyDayPlan, latestAssets] = await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestRoadmap(context.workspace.id),
      getLatestThirtyDayPlan(context.workspace.id),
      getLatestBusinessAssets(context.workspace.id)
    ]);

    if (!profile) {
      return noStoreJson(
        { error: "Complete and save the business profile before generating SOPs." },
        { status: 400 }
      );
    }

    if (!diagnostic) {
      return noStoreJson(
        { error: "Run diagnostics before generating SOPs." },
        { status: 400 }
      );
    }

    // Freeze source snapshot and compute deterministic input hash.
    const latestAssetJobId = latestAssets[0]?.jobId ?? null;

    const inputHash = await computeSopInputHash({
      accountState: context.workspace.accountState,
      diagnosticId: diagnostic.id,
      latestAssetJobId,
      outputLanguage: context.workspace.outputLanguage,
      plan: context.workspace.plan,
      profileId: profile.id,
      profileUpdatedAt: profile.updatedAt,
      roadmapId: roadmap?.id ?? null,
      thirtyDayPlanId: thirtyDayPlan?.id ?? null
    });

    // Idempotency check: if a completed SOP set with the same input hash
    // already exists for this workspace, return it without creating a new job.
    const existingSet = await findLatestCompletedSopJobByInputHash(
      context.workspace.id,
      inputHash
    );

    if (existingSet) {
      return noStoreJson({
        ok: true,
        cached: true,
        jobId: existingSet.job.id,
        artifacts: existingSet.artifacts
      });
    }

    // No matching set found — proceed with generation.
    const now = new Date().toISOString();
    job = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      sourceBusinessProfileId: profile.id,
      sourceDiagnosticResultId: diagnostic.id,
      sourceRoadmapId: roadmap?.id ?? null,
      sourceThirtyDayPlanId: thirtyDayPlan?.id ?? null,
      sourceAssetJobId: latestAssetJobId,
      inputHash,
      status: "queued",
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createSopJob(job);
    await updateSopJob(job.id, {
      status: "processing",
      startedAt: new Date().toISOString()
    });

    const artifacts = buildSopArtifacts({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic,
      roadmap: roadmap ?? null,
      thirtyDayPlan: thirtyDayPlan ?? null
    });

    await createSopArtifacts(artifacts);
    await updateSopJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    await captureAnalyticsEvent({
      event: "sops_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: job.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        sop_count: artifacts.length,
        cached: false
      }
    });

    return noStoreJson({ ok: true, cached: false, jobId: job.id, artifacts });
  } catch (error) {
    if (job) {
      try {
        await updateSopJob(job.id, {
          status: "failed",
          error: getErrorMessage(error, "SOP generation failed."),
          completedAt: new Date().toISOString()
        });
      } catch {
        // Preserve the original error response if failure handling also fails.
      }
    }

    return publicErrorJson(error, "SOPs could not be generated.");
  }
}
