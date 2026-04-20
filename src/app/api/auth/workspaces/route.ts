import { NextResponse } from "next/server";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { createWorkspaceForUser, getCurrentUserSession } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { workspaceCreationSchema } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage, setLanguageCookie } from "@/lib/language-server";

export async function POST(request: Request) {
  let language = await getCookieLanguage();

  try {
    const current = await getCurrentUserSession();

    if (!current) {
      return NextResponse.json(
        {
          error: copyForLanguage(
            language,
            "Authentication required.",
            "Necesitas iniciar sesión."
          )
        },
        { status: 401 }
      );
    }

    language = current.user.preferredLanguage ?? language;
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
        error: getErrorMessage(
          error,
          copyForLanguage(
            language,
            "Workspace could not be created.",
            "No se pudo crear el espacio."
          )
        )
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
