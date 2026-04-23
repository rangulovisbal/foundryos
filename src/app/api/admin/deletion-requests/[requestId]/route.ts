import { captureAnalyticsEvent } from "@/lib/analytics";
import { updateDeletionRequest } from "@/db/foundation";
import { requireInternalAdmin } from "@/lib/auth";
import { deletionRequestAdminUpdateSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

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

    await captureAnalyticsEvent({
      event: "admin_request_status_updated",
      distinctId: admin.id,
      properties: {
        admin_user_id: admin.id,
        request_kind: "deletion",
        request_id: requestId,
        status: payload.status,
        has_admin_notes: payload.adminNotes.trim().length > 0
      }
    });

    return noStoreJson({ ok: true });
  } catch (error) {
    return publicErrorJson(error, "Deletion request could not be updated.");
  }
}
