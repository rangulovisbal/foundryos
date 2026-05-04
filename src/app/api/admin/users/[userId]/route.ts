import {
  deleteUserById,
  findUserById,
  listUsers
} from "@/db/foundation";
import { getCurrentUserSession, logWorkspaceAdminChange } from "@/lib/auth";
import {
  adminUserDeleteSchema,
  getDeleteTestAccountConfirmationPhrase,
  isClearlyTestLikeUser
} from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

function normalizeAdminNote(note: string | undefined) {
  const trimmed = note?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const current = await getCurrentUserSession();

    if (!current || current.user.globalRole !== "internal_admin") {
      return noStoreJson({ error: "Internal admin access required." }, { status: 403 });
    }

    const { userId } = await params;
    const target = await findUserById(userId);

    if (!target) {
      return noStoreJson({ error: "User not found." }, { status: 404 });
    }

    if (target.id === current.user.id) {
      return noStoreJson(
        { error: "You cannot delete your own internal admin account." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payload = adminUserDeleteSchema.parse(body);
    const note = normalizeAdminNote(payload.note);

    if (!payload.confirmedTestData) {
      return noStoreJson(
        {
          error: "Confirm that you want to delete this account from admin before continuing."
        },
        { status: 400 }
      );
    }

    const confirmationPhrase = getDeleteTestAccountConfirmationPhrase();

    if (payload.confirmationText !== confirmationPhrase) {
      return noStoreJson(
        { error: `Type "${confirmationPhrase}" to confirm this admin action.` },
        { status: 400 }
      );
    }

    if (target.globalRole === "internal_admin") {
      const allUsers = await listUsers();
      const internalAdminCount = allUsers.filter(
        (user) => user.globalRole === "internal_admin"
      ).length;

      if (internalAdminCount <= 1) {
        return noStoreJson(
          { error: "You cannot delete the last internal admin account." },
          { status: 400 }
        );
      }
    }

    const autoMarkedTestLike = isClearlyTestLikeUser(target);

    await logWorkspaceAdminChange({
      adminUserId: current.user.id,
      workspaceId: null,
      previousPlan: null,
      nextPlan: null,
      previousAccountState: null,
      nextAccountState: null,
      action: "user.admin.deleted",
      metadata: {
        targetUserId: target.id,
        targetUserEmail: target.email,
        targetUserFullName: target.fullName,
        previousGlobalRole: target.globalRole,
        newDisposition: "deleted",
        confirmationText: payload.confirmationText,
        confirmedTestData: payload.confirmedTestData,
        autoMarkedTestLike,
        note
      }
    });

    await deleteUserById(target.id);

    return noStoreJson({ ok: true, deletedUserId: target.id });
  } catch (error) {
    return publicErrorJson(error, "Account could not be deleted.");
  }
}
