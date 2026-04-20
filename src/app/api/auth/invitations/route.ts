import { NextResponse } from "next/server";

import {
  getCurrentWorkspaceContext,
  getRequestAppUrl,
  inviteUserToWorkspace
} from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { inviteMemberSchema } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export async function POST(request: Request) {
  let language: "en" | "es" = "en";

  try {
    const appUrl = getRequestAppUrl(request);
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json(
        {
          error: copyForLanguage(
            "en",
            "Authentication required.",
            "Necesitas iniciar sesión."
          )
        },
        { status: 401 }
      );
    }

    language = context.workspace.outputLanguage;

    const payload = inviteMemberSchema.parse(await request.json());
    const result = await inviteUserToWorkspace({
      appUrl,
      workspaceId: context.workspace.id,
      actor: context,
      email: payload.email,
      role: payload.role
    });

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          copyForLanguage(
            language,
            "Invitation could not be created.",
            "No se pudo crear la invitación."
          )
        )
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
