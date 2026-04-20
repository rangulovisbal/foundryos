import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { createWorkspaceForUser, getCurrentUserSession } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { workspaceCreationSchema } from "@/lib/foundation";
import { setLanguageCookie } from "@/lib/language-server";

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
      plan: payload.plan,
      language: payload.language
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

    const response = NextResponse.json({ ok: true, workspace });
    setLanguageCookie(response, workspace.outputLanguage);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Workspace could not be created.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
