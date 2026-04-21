import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  createDeletionRequest,
  findOpenDeletionRequest
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import {
  canRequestAccountDeletion,
  canRequestWorkspaceDeletion,
  deletionRequestSchema,
  getDeletionConfirmationPhrase,
  type DeletionRequestRecord
} from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = deletionRequestSchema.parse(await request.json());
    const expectedPhrase = getDeletionConfirmationPhrase(
      payload.requestType,
      context.workspace.outputLanguage
    );

    if (payload.confirmationText !== expectedPhrase) {
      return NextResponse.json(
        { error: `Type exactly "${expectedPhrase}" to submit this request.` },
        { status: 400 }
      );
    }

    if (
      payload.requestType === "account_deletion" &&
      !canRequestAccountDeletion()
    ) {
      return NextResponse.json(
        { error: "Account deletion requests are unavailable for this user." },
        { status: 403 }
      );
    }

    if (
      payload.requestType === "workspace_deletion" &&
      !canRequestWorkspaceDeletion(context.membership.role)
    ) {
      return NextResponse.json(
        {
          error:
            "Only workspace owners and admins can submit workspace deletion requests."
        },
        { status: 403 }
      );
    }

    const existingRequest = await findOpenDeletionRequest({
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      requestType: payload.requestType
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "An open deletion request of this type already exists." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const record: DeletionRequestRecord = {
      id: crypto.randomUUID(),
      workspaceId: context.workspace.id,
      requestedByUserId: context.user.id,
      requestType: payload.requestType,
      reason: payload.reason.trim().length > 0 ? payload.reason.trim() : null,
      status: "submitted",
      adminNotes: null,
      reviewedByUserId: null,
      reviewedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await createDeletionRequest(record);

    await captureAnalyticsEvent({
      event: "deletion_request_submitted",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        request_id: record.id,
        request_type: record.requestType,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState
      }
    });

    return NextResponse.json({ ok: true, requestId: record.id });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Deletion request could not be created.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
