import { getCurrentUserSession, logWorkspaceAdminChange } from "@/lib/auth";
import {
  createDeletionRequest,
  deleteWorkspaceById,
  findLatestOpenDeletionRequestForWorkspace,
  findUserById,
  findWorkspaceById,
  updateDeletionRequest,
  updateWorkspace
} from "@/db/foundation";
import {
  getDeleteWorkspaceConfirmationPhrase,
  getWorkspaceAdminConfirmationPhrase,
  isClearlyTestLikeWorkspace,
  isDestructiveWorkspaceAdminAction,
  workspaceAdminClosureActionSchema,
  workspaceAdminUpdateSchema
} from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

function normalizeAdminNote(note: string | undefined) {
  const trimmed = note?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function mergeAdminNotes(existing: string | null, next: string | null) {
  if (!next) {
    return existing;
  }

  return [existing?.trim(), next].filter(Boolean).join("\n\n");
}

function buildWorkspaceAuditMetadata(input: {
  workspace: { id: string; name: string; slug: string };
  note: string | null;
  confirmationText?: string | null;
  extra?: Record<string, unknown>;
}) {
  return {
    workspaceId: input.workspace.id,
    workspaceName: input.workspace.name,
    workspaceSlug: input.workspace.slug,
    note: input.note,
    confirmationText: input.confirmationText ?? null,
    ...(input.extra ?? {})
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const current = await getCurrentUserSession();

    if (!current || current.user.globalRole !== "internal_admin") {
      return noStoreJson({ error: "Internal admin access required." }, { status: 403 });
    }

    const { workspaceId } = await params;
    const existing = await findWorkspaceById(workspaceId);

    if (!existing) {
      return noStoreJson({ error: "Workspace not found." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (body.mode === "closure_action") {
      const payload = workspaceAdminClosureActionSchema.parse(body);
      const note = normalizeAdminNote(payload.note);
      const ownerUser = await findUserById(existing.ownerUserId);

      if (isDestructiveWorkspaceAdminAction(payload.action)) {
        const phrase =
          payload.action === "delete_test_workspace"
            ? getDeleteWorkspaceConfirmationPhrase()
            : getWorkspaceAdminConfirmationPhrase(payload.action);

        if (payload.confirmationText !== phrase) {
          throw new Error(`Type "${phrase}" to confirm this admin action.`);
        }
      }

      if (payload.action === "suspend_access") {
        const workspace = await updateWorkspace(workspaceId, {
          accountState: "suspended"
        });

        if (!workspace) {
          return noStoreJson({ error: "Workspace not found." }, { status: 404 });
        }

        await logWorkspaceAdminChange({
          adminUserId: current.user.id,
          workspaceId: workspace.id,
          previousPlan: existing.plan,
          nextPlan: workspace.plan,
          previousAccountState: existing.accountState,
          nextAccountState: workspace.accountState,
          action: "workspace.access.suspended",
          metadata: buildWorkspaceAuditMetadata({
            workspace: existing,
            note,
            confirmationText: payload.confirmationText
          })
        });

        return noStoreJson({ ok: true, workspace });
      }

      if (payload.action === "restore_access") {
        const workspace = await updateWorkspace(workspaceId, {
          accountState: payload.restoreState
        });

        if (!workspace) {
          return noStoreJson({ error: "Workspace not found." }, { status: 404 });
        }

        await logWorkspaceAdminChange({
          adminUserId: current.user.id,
          workspaceId: workspace.id,
          previousPlan: existing.plan,
          nextPlan: workspace.plan,
          previousAccountState: existing.accountState,
          nextAccountState: workspace.accountState,
          action: "workspace.access.restored",
          metadata: buildWorkspaceAuditMetadata({
            workspace: existing,
            note,
            extra: {
              restoreState: payload.restoreState
            }
          })
        });

        return noStoreJson({ ok: true, workspace });
      }

      if (payload.action === "archive_workspace") {
        const workspace = await updateWorkspace(workspaceId, {
          accountState: "archived"
        });

        if (!workspace) {
          return noStoreJson({ error: "Workspace not found." }, { status: 404 });
        }

        await logWorkspaceAdminChange({
          adminUserId: current.user.id,
          workspaceId: workspace.id,
          previousPlan: existing.plan,
          nextPlan: workspace.plan,
          previousAccountState: existing.accountState,
          nextAccountState: workspace.accountState,
          action: "workspace.archived",
          metadata: buildWorkspaceAuditMetadata({
            workspace: existing,
            note,
            confirmationText: payload.confirmationText
          })
        });

        return noStoreJson({ ok: true, workspace });
      }

      if (payload.action === "mark_deletion_review") {
        const existingOpenRequest = await findLatestOpenDeletionRequestForWorkspace({
          workspaceId,
          requestType: "workspace_deletion"
        });
        const now = new Date().toISOString();
        const reason = note
          ? `Admin-initiated deletion review. ${note}`
          : "Admin-initiated deletion review.";
        const adminNote = mergeAdminNotes(
          existingOpenRequest?.adminNotes ?? null,
          note
            ? `Admin marked this workspace for deletion review. Reason: ${note}`
            : "Admin marked this workspace for deletion review."
        );
        const deletionRequestId = existingOpenRequest?.id ?? crypto.randomUUID();

        if (existingOpenRequest) {
          await updateDeletionRequest(existingOpenRequest.id, {
            status: "under_review",
            adminNotes: adminNote,
            reviewedByUserId: current.user.id,
            reviewedAt: now,
            completedAt: null
          });
        } else {
          await createDeletionRequest({
            id: deletionRequestId,
            workspaceId,
            requestedByUserId: current.user.id,
            requestType: "workspace_deletion",
            reason,
            status: "under_review",
            adminNotes: adminNote,
            reviewedByUserId: current.user.id,
            reviewedAt: now,
            completedAt: null,
            createdAt: now,
            updatedAt: now
          });
        }

        await logWorkspaceAdminChange({
          adminUserId: current.user.id,
          workspaceId: existing.id,
          previousPlan: existing.plan,
          nextPlan: existing.plan,
          previousAccountState: existing.accountState,
          nextAccountState: existing.accountState,
          action: "workspace.deletion_review.marked",
          metadata: buildWorkspaceAuditMetadata({
            workspace: existing,
            note,
            confirmationText: payload.confirmationText,
            extra: {
              deletionRequestId,
              origin: "internal_admin"
            }
          })
        });

        return noStoreJson({
          ok: true,
          workspace: existing,
          deletionRequestId
        });
      }

      if (payload.action === "cancel_deletion_mark") {
        const existingOpenRequest = await findLatestOpenDeletionRequestForWorkspace({
          workspaceId,
          requestType: "workspace_deletion"
        });

        if (!existingOpenRequest) {
          return noStoreJson(
            { error: "No open deletion review exists for this workspace." },
            { status: 400 }
          );
        }

        const now = new Date().toISOString();
        const adminNote = mergeAdminNotes(
          existingOpenRequest.adminNotes,
          note
            ? `Admin canceled the deletion review. Reason: ${note}`
            : "Admin canceled the deletion review."
        );

        await updateDeletionRequest(existingOpenRequest.id, {
          status: "rejected",
          adminNotes: adminNote,
          reviewedByUserId: current.user.id,
          reviewedAt: now,
          completedAt: null
        });

        await logWorkspaceAdminChange({
          adminUserId: current.user.id,
          workspaceId: existing.id,
          previousPlan: existing.plan,
          nextPlan: existing.plan,
          previousAccountState: existing.accountState,
          nextAccountState: existing.accountState,
          action: "workspace.deletion_review.canceled",
          metadata: buildWorkspaceAuditMetadata({
            workspace: existing,
            note,
            extra: {
              deletionRequestId: existingOpenRequest.id
            }
          })
        });

        return noStoreJson({
          ok: true,
          workspace: existing,
          deletionRequestId: existingOpenRequest.id
        });
      }

      if (payload.action !== "delete_test_workspace") {
        return noStoreJson({ error: "Unsupported workspace admin action." }, { status: 400 });
      }

      if (!payload.confirmedTestData) {
        return noStoreJson(
          {
            error:
              "Confirm that you want to delete this workspace from admin before continuing."
          },
          { status: 400 }
        );
      }

      const autoMarkedTestLike = isClearlyTestLikeWorkspace(existing, ownerUser);

      await logWorkspaceAdminChange({
        adminUserId: current.user.id,
        workspaceId: existing.id,
        previousPlan: existing.plan,
        nextPlan: null,
        previousAccountState: existing.accountState,
        nextAccountState: null,
        action: "workspace.admin.deleted",
        metadata: buildWorkspaceAuditMetadata({
          workspace: existing,
          note,
          confirmationText: payload.confirmationText,
          extra: {
            confirmedTestData: payload.confirmedTestData,
            autoMarkedTestLike,
            ownerUserId: ownerUser?.id ?? null,
            ownerEmail: ownerUser?.email ?? null
          }
        })
      });

      await deleteWorkspaceById(existing.id);

      return noStoreJson({
        ok: true,
        deletedWorkspaceId: existing.id
      });
    }

    const payload = workspaceAdminUpdateSchema.parse(body);
    const workspace = await updateWorkspace(workspaceId, {
      accountState: payload.accountState,
      plan: payload.plan
    });

    if (!workspace) {
      return noStoreJson({ error: "Workspace not found." }, { status: 404 });
    }

    if (
      existing.plan !== workspace.plan ||
      existing.accountState !== workspace.accountState
    ) {
      await logWorkspaceAdminChange({
        adminUserId: current.user.id,
        workspaceId: workspace.id,
        previousPlan: existing.plan,
        nextPlan: workspace.plan,
        previousAccountState: existing.accountState,
        nextAccountState: workspace.accountState,
        action: "workspace.state.updated"
      });
    }

    return noStoreJson({ ok: true, workspace });
  } catch (error) {
    return publicErrorJson(error, "Workspace state could not be updated.");
  }
}
