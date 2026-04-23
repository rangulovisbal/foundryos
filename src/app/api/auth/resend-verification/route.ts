import { z } from "zod";

import { getRequestAppUrl, resendVerificationEmail } from "@/lib/auth";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

const resendVerificationSchema = z.object({
  email: z.string().email("Enter a valid email."),
  redirectTo: z.string().optional()
});

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = resendVerificationSchema.parse(body);
    const result = await resendVerificationEmail({
      appUrl,
      email: payload.email,
      redirectTo: payload.redirectTo,
      language
    });

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
        "Verification email could not be prepared.",
        "No se pudo preparar el correo de verificación."
      )
    );
  }
}
