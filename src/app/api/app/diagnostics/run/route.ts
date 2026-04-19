import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createDiagnosticJob,
  createDiagnosticResult,
  getBusinessProfile,
  incrementWorkspaceUsageCounter,
  updateDiagnosticJob
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { buildDiagnosticResult } from "@/lib/diagnostics";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import {
  canRunDiagnostics,
  getUsageCounter,
  type DiagnosticJobRecord
} from "@/lib/foundation";

export async function POST() {
  let job: DiagnosticJobRecord | null = null;

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canRunDiagnostics(context)) {
      const counter = getUsageCounter(context, "diagnostic_runs");
      const limitMessage = counter
        ? `Diagnostic run limit reached: ${counter.usedCount}/${counter.limitCount}.`
        : "Diagnostic run entitlement is missing for this workspace.";

      return NextResponse.json(
        {
          error:
            context.workspace.accountState === "past_due"
              ? "Diagnostics are read-only while the workspace is past due."
              : limitMessage
        },
        { status: 403 }
      );
    }

    const profile = await getBusinessProfile(context.workspace.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Complete and save the business profile before running diagnostics." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    job = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      status: "queued",
      jobType: "business_profile_diagnostic",
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createDiagnosticJob(job);
    await updateDiagnosticJob(job.id, {
      status: "processing",
      startedAt: new Date().toISOString()
    });

    const result = buildDiagnosticResult({
      jobId: job.id,
      workspace: context.workspace,
      profile
    });

    await createDiagnosticResult(result);
    await updateDiagnosticJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString()
    });
    await incrementWorkspaceUsageCounter(context.workspace.id, "diagnostic_runs");

    await captureAnalyticsEvent({
      event: "diagnostic_generated",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        job_id: job.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: context.workspace.outputLanguage,
        overall_maturity_score: result.overallMaturityScore,
        confidence: result.confidence
      }
    });

    return NextResponse.json({ ok: true, jobId: job.id, result });
  } catch (error) {
    if (job) {
      try {
        await updateDiagnosticJob(job.id, {
          status: "failed",
          error: getErrorMessage(error, "Diagnostic run failed."),
          completedAt: new Date().toISOString()
        });
      } catch {
        // Preserve the original error response if the failure happened before persistence.
      }
    }

    return NextResponse.json(
      {
        error: getErrorMessage(error, "Diagnostic run could not be created.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
