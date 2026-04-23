import { captureAnalyticsEvent } from "@/lib/analytics";
import { createSupportRequest } from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import {
  canSubmitSupportRequest,
  supportRequestSchema,
  type SupportRequestRecord
} from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    if (!canSubmitSupportRequest()) {
      return noStoreJson(
        { error: "Support requests are unavailable in this workspace." },
        { status: 403 }
      );
    }

    const payload = supportRequestSchema.parse(await request.json());
    const now = new Date().toISOString();
    const record: SupportRequestRecord = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      issueType: payload.issueType,
      message: payload.message,
      status: "submitted",
      adminNotes: null,
      reviewedByUserId: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createSupportRequest(record);

    await captureAnalyticsEvent({
      event: "support_request_submitted",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        request_id: record.id,
        issue_type: record.issueType,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState
      }
    });

    return noStoreJson({ ok: true, requestId: record.id });
  } catch (error) {
    return publicErrorJson(error, "Support request could not be created.");
  }
}
