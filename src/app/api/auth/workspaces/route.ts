import { NextResponse } from "next/server";

import { createWorkspaceForUser, getCurrentUserSession } from "@/lib/auth";
import { workspaceCreationSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserSession();

    if (!current) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = workspaceCreationSchema.parse(await request.json());
    const workspace = await createWorkspaceForUser({
      user: current.user,
      name: payload.name,
      plan: payload.plan
    });

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Workspace could not be created."
      },
      { status: 400 }
    );
  }
}
