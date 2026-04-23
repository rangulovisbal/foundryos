import { getRequestAppUrl, requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const payload = forgotPasswordSchema.parse(await request.json());
    const result = await requestPasswordReset(payload.email, appUrl);

    return noStoreJson({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery,
      deliveryMode: result.deliveryMode
    });
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(
        language,
        "Reset request failed.",
        "No se pudo preparar el restablecimiento."
      )
    );
  }
}
