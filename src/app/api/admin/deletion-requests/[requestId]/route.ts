import { NextResponse } from "next/server";

import { updateDeletionRequest } from "@/db/foundation";
import { requireInternalAdmin } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { deletionRequestAdminUpdateSchema } from "@/lib/foundation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const admin = await requireInternalAdmin();
    const { requestId } = await params;
    const payload = deletionRequestAdminUpdateSchema.parse(await request.json());
    const now = new Date().toISOString();

    await updateDeletionRequest(requestId, {
      status: payload.status,
      adminNotes: payload.adminNotes,
      reviewedByUserId: admin.id,
      reviewedAt: now,
      completedAt: payload.status === "completed" ? now : null
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Deletion request could not be updated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
