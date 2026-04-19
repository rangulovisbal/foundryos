import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createAssetJob,
  createBusinessAssets,
  getBusinessProfile,
  getLatestActionPlan,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan,
  incrementWorkspaceUsageCounter,
  updateAssetJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { buildBusinessAssets } from "@/lib/assets";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { canGenerateAssets, type AssetJobRecord } from "@/lib/foundation";

export async function POST() {
  let job: AssetJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canGenerateAssets(context)) {
      return NextResponse.json(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "Asset generation is read-only while the workspace is past due."
              : "Asset generation is unavailable for this role, plan, usage limit, or account state."
        },
        { status: 403 }
      );
    }

    const [profile, diagnostic, roadmap, actionPlan, thirtyDayPlan] = await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestRoadmap(context.workspace.id),
      getLatestActionPlan(context.workspace.id),
      getLatestThirtyDayPlan(context.workspace.id)
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Complete and save the business profile before generating assets." },
        { status: 400 }
      );
    }

    if (!diagnostic) {
      return NextResponse.json(
        { error: "Run diagnostics before generating assets." },
        { status: 400 }
      );
    }

    if (!roadmap || !actionPlan || !thirtyDayPlan) {
      return NextResponse.json(
        { error: "Generate roadmap, actions, and a 30-day plan before generating assets." },
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
      sourceRoadmapId: roadmap.id,
      sourceActionPlanId: actionPlan.id,
      sourceThirtyDayPlanId: thirtyDayPlan.id,
      status: "queued",
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createAssetJob(job);
    await updateAssetJob(job.id, {
      status: "processing",
      startedAt: new Date().toISOString()
    });

    const assets = buildBusinessAssets({
      jobId: job.id,
      workspace: context.workspace,
      profile,
      diagnostic,
      roadmap,
      actionPlan,
      thirtyDayPlan
    });

    await createBusinessAssets(assets);
    await incrementWorkspaceUsageCounter(context.workspace.id, "asset_exports");
    await updateAssetJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });

    await captureAnalyticsEvent({
      event: "assets_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: job.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        asset_count: assets.length
      }
    });

    return NextResponse.json({ ok: true, jobId: job.id, assets });
  } catch (error) {
    if (job) {
      try {
        await updateAssetJob(job.id, {
          status: "failed",
          error: getErrorMessage(error, "Asset generation failed."),
          completedAt: new Date().toISOString()
        });
      } catch {
        // Preserve the original error response if failure handling also fails.
      }
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "Assets could not be generated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
