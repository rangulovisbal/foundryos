import { acceptWorkspaceInvite, getCurrentUserSession } from "@/lib/auth";
import { acceptInvitationSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage, setLanguageCookie } from "@/lib/language-server";

export async function POST(request: Request) {
  let language = await getCookieLanguage();

  try {
    const current = await getCurrentUserSession();

    if (!current) {
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

    language = current.user.preferredLanguage ?? language;
    const payload = acceptInvitationSchema.parse(await request.json());
    const workspace = await acceptWorkspaceInvite(payload.token, current.user);

    const response = noStoreJson({
      ok: true,
      workspaceId: workspace.id
    });
    setLanguageCookie(response, workspace.outputLanguage);
    return response;
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(
        language,
        "Invitation could not be accepted.",
        "No se pudo aceptar la invitación."
      )
    );
  }
}
