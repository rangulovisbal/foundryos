import { getCurrentUserSession, logWorkspaceAdminChange } from "@/lib/auth";
import { findWorkspaceById, updateWorkspace } from "@/db/foundation";
import { workspaceAdminUpdateSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

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

    const payload = workspaceAdminUpdateSchema.parse(await request.json());
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
        nextAccountState: workspace.accountState
      });
    }

    return noStoreJson({ ok: true, workspace });
  } catch (error) {
    return publicErrorJson(error, "Workspace state could not be updated.");
  }
}
