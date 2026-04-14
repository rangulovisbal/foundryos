import { NextResponse } from "next/server";

import { acceptWorkspaceInvite, getCurrentUserSession } from "@/lib/auth";
import { acceptInvitationSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserSession();

    if (!current) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = acceptInvitationSchema.parse(await request.json());
    const workspaceId = await acceptWorkspaceInvite(payload.token, current.user);

    return NextResponse.json({
      ok: true,
      workspaceId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invitation could not be accepted."
      },
      { status: 400 }
    );
  }
}
