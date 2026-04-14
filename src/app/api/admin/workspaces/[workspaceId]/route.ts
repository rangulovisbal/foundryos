import { NextResponse } from "next/server";

import { getCurrentUserSession } from "@/lib/auth";
import { workspaceAdminUpdateSchema } from "@/lib/foundation";
import { updateWorkspace } from "@/db/foundation";

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
    const payload = workspaceAdminUpdateSchema.parse(await request.json());
    const workspace = await updateWorkspace(workspaceId, {
      accountState: payload.accountState,
      plan: payload.plan
    });

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Workspace state could not be updated."
      },
      { status: 400 }
    );
  }
}
