import { NextResponse } from "next/server";

import {
  createSopArtifacts,
  createSopJob,
  getBusinessProfile,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan,
  updateSopJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { buildSopArtifacts } from "@/lib/sops";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { canGenerateSops, type SopJobRecord } from "@/lib/foundation";

export async function POST() {
  let job: SopJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canGenerateSops(context)) {
      return NextResponse.json(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "SOP generation is read-only while the workspace is past due."
              : "SOP generation is unavailable for this role, plan, or account state."
        },
        { status: 403 }
      );
    }

    const [profile, diagnostic, roadmap, thirtyDayPlan] = await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestRoadmap(context.workspace.id),
      getLatestThirtyDayPlan(context.workspace.id)
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Complete and save the business profile before generating SOPs." },
        { status: 400 }
      );
    }

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Run diagnostics before generating SOPs." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    job = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      sourceBusinessProfileId: profile.id,
      sourceDiagnosticResultId: diagnostic.id,
      sourceRoadmapId: roadmap?.id ?? null,
      sourceThirtyDayPlanId: thirtyDayPlan?.id ?? null,
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

    return NextResponse.json({ ok: true, jobId: job.id, artifacts });
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

    return NextResponse.json(
      { error: getErrorMessage(error, "SOPs could not be generated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
