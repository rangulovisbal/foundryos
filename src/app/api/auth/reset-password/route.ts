import { resetPasswordFromToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const payload = resetPasswordSchema.parse(await request.json());
    await resetPasswordFromToken(payload.token, payload.password, language);

    return noStoreJson({ ok: true });
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(
        language,
        "Password reset could not be completed.",
        "No se pudo completar el restablecimiento de la contraseña."
      )
    );
  }
}
