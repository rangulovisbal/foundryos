import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createActionPlan,
  createPlanningJob,
  createThirtyDayPlan,
  getBusinessProfile,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  updatePlanningJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { canGenerateThirtyDayPlan, type PlanningJobRecord } from "@/lib/foundation";
import { buildActionPlan, buildThirtyDayPlan } from "@/lib/planning";

export async function POST() {
  let job: PlanningJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canGenerateThirtyDayPlan(context)) {
      return NextResponse.json(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "30-day plan generation is read-only while the workspace is past due."
              : "30-day plan generation is unavailable for this role, plan, or account state."
        },
        { status: 403 }
      );
    }

    const [profile, diagnostic, roadmap] = await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestRoadmap(context.workspace.id)
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Complete and save the business profile before generating actions." },
        { status: 400 }
      );
    }

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Run diagnostics before generating actions and a 30-day plan." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    job = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      sourceDiagnosticResultId: diagnostic.id,
      jobType: "thirty_day_plan_generation",
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

    const actionPlan = buildActionPlan({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic,
      roadmap
    });
    const thirtyDayPlan = buildThirtyDayPlan({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic,
      actionPlan
    });

    await createActionPlan(actionPlan);
    await createThirtyDayPlan(thirtyDayPlan);
    await updatePlanningJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    await captureAnalyticsEvent({
      event: "actions_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: job.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        action_count: actionPlan.actions.length
      }
    });

    return NextResponse.json({ ok: true, jobId: job.id, actionPlan, thirtyDayPlan });
  } catch (error) {
    if (job) {
      try {
        await updatePlanningJob(job.id, {
          status: "failed",
          error: getErrorMessage(error, "30-day plan generation failed."),
          completedAt: new Date().toISOString()
        });
      } catch {
        // Preserve the original error response if failure handling also fails.
      }
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "30-day plan could not be generated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
