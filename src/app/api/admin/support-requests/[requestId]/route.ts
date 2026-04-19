import { NextResponse } from "next/server";

import { updateSupportRequest } from "@/db/foundation";
import { requireInternalAdmin } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { supportRequestAdminUpdateSchema } from "@/lib/foundation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const admin = await requireInternalAdmin();
    const { requestId } = await params;
    const payload = supportRequestAdminUpdateSchema.parse(await request.json());
    const now = new Date().toISOString();

    await updateSupportRequest(requestId, {
      status: payload.status,
      adminNotes: payload.adminNotes,
      reviewedByUserId: admin.id,
      reviewedAt: now
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Support request could not be updated.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
