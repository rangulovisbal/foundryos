import { NextResponse } from "next/server";

import { getCurrentUserSession, logWorkspaceAdminChange } from "@/lib/auth";
import { findWorkspaceById, updateWorkspace } from "@/db/foundation";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { workspaceAdminUpdateSchema } from "@/lib/foundation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const current = await getCurrentUserSession();

    if (!current || current.user.globalRole !== "internal_admin") {
      return NextResponse.json({ error: "Internal admin access required." }, { status: 403 });
    }

    const { workspaceId } = await params;
    const existing = await findWorkspaceById(workspaceId);

    if (!existing) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const payload = workspaceAdminUpdateSchema.parse(await request.json());
    const workspace = await updateWorkspace(workspaceId, {
      accountState: payload.accountState,
      plan: payload.plan
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
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

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Workspace state could not be updated.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
