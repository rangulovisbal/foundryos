import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { createWorkspaceForUser, getCurrentUserSession } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
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

    await captureAnalyticsEvent({
      event: "workspace_created",
      distinctId: current.user.id,
      properties: {
        user_id: current.user.id,
        workspace_id: workspace.id,
        workspace_plan: workspace.plan,
        account_state: workspace.accountState,
        output_language: workspace.outputLanguage
      }
    });

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Workspace could not be created.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
