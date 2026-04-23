import {
  getCurrentWorkspaceContext,
  getRequestAppUrl,
  inviteUserToWorkspace
} from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export async function POST(request: Request) {
  let language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return noStoreJson(
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

    language = context.workspace.outputLanguage;

    const payload = inviteMemberSchema.parse(await request.json());
    const result = await inviteUserToWorkspace({
      appUrl,
      workspaceId: context.workspace.id,
      actor: context,
      email: payload.email,
      role: payload.role
    });

    return noStoreJson({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery
    });
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(
        language,
        "Invitation could not be created.",
        "No se pudo crear la invitación."
      )
    );
  }
}
