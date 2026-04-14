import { NextResponse } from "next/server";

import { getCurrentWorkspaceContext, inviteUserToWorkspace } from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = inviteMemberSchema.parse(await request.json());
    const result = await inviteUserToWorkspace({
      workspaceId: context.workspace.id,
      actor: context,
      email: payload.email,
      role: payload.role
    });

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invitation could not be created."
      },
      { status: 400 }
    );
  }
}
