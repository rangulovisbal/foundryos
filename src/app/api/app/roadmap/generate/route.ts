import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createActionPlan,
  createPlanningJob,
  createRoadmap,
  getBusinessProfile,
  getLatestDiagnosticResult,
  updatePlanningJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { canGenerateRoadmap, type PlanningJobRecord } from "@/lib/foundation";
import { buildActionPlan, buildRoadmap } from "@/lib/planning";

export async function POST() {
  let job: PlanningJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canGenerateRoadmap(context)) {
      return NextResponse.json(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "Roadmap generation is read-only while the workspace is past due."
              : "Roadmap generation is unavailable for this role, plan, or account state."
        },
        { status: 403 }
      );
    }

    const [profile, diagnostic] = await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id)
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Complete and save the business profile before generating a roadmap." },
        { status: 400 }
      );
    }

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Run diagnostics before generating a roadmap." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    job = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      sourceDiagnosticResultId: diagnostic.id,
      jobType: "roadmap_generation",
      status: "queued",
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createPlanningJob(job);
    await updatePlanningJob(job.id, {
      status: "processing",
      startedAt: new Date().toISOString()
    });

    const roadmap = buildRoadmap({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic
    });
    const actionPlan = buildActionPlan({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic,
      roadmap
    });

    await createRoadmap(roadmap);
    await createActionPlan(actionPlan);
    await updatePlanningJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    await captureAnalyticsEvent({
      event: "roadmap_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: job.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        roadmap_item_count: roadmap.items.length
      }
    });

    return NextResponse.json({ ok: true, jobId: job.id, roadmap, actionPlan });
  } catch (error) {
    if (job) {
      try {
        await updatePlanningJob(job.id, {
          status: "failed",
          error: getErrorMessage(error, "Roadmap generation failed."),
          completedAt: new Date().toISOString()
        });
      } catch {
        // Preserve the original error response if failure handling also fails.
      }
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "Roadmap could not be generated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
