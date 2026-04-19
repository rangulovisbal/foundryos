import { NextResponse } from "next/server";

import { createSupportRequest } from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import {
  canSubmitSupportRequest,
  supportRequestSchema,
  type SupportRequestRecord
} from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canSubmitSupportRequest()) {
      return NextResponse.json(
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

    return NextResponse.json({ ok: true, requestId: record.id });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Support request could not be created.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
