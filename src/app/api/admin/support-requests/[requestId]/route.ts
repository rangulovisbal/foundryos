import { captureAnalyticsEvent } from "@/lib/analytics";
import { updateSupportRequest } from "@/db/foundation";
import { requireInternalAdmin } from "@/lib/auth";
import { supportRequestAdminUpdateSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

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

    await captureAnalyticsEvent({
      event: "admin_request_status_updated",
      distinctId: admin.id,
      properties: {
        admin_user_id: admin.id,
        request_kind: "support",
        request_id: requestId,
        status: payload.status,
        has_admin_notes: payload.adminNotes.trim().length > 0
      }
    });

    return noStoreJson({ ok: true });
  } catch (error) {
    return publicErrorJson(error, "Support request could not be updated.");
  }
}
