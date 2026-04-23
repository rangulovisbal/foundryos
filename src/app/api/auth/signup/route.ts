import { z } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { getRequestAppUrl, registerUser } from "@/lib/auth";
import { signupSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage, setLanguageCookie } from "@/lib/language-server";

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = signupSchema
      .extend({
        redirectTo: z.string().optional()
      })
      .parse(body);
    const result = await registerUser({
      ...payload,
      appUrl
    });

    await captureAnalyticsEvent({
      event: "signup_completed",
      distinctId: result.user.id,
      properties: {
        user_id: result.user.id,
        email_delivery: result.emailDelivery,
        delivery_mode: result.deliveryMode,
        has_preview_verification_link: Boolean(result.verificationPreviewUrl),
        global_role: result.user.globalRole,
        language: result.user.preferredLanguage
      }
    });

    const response = noStoreJson({
      ok: true,
      verificationPreviewUrl: result.verificationPreviewUrl,
      emailDelivery: result.emailDelivery,
      deliveryMode: result.deliveryMode
    });
    setLanguageCookie(response, result.user.preferredLanguage ?? "en");
    return response;
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(language, "Signup failed.", "No se pudo crear la cuenta.")
    );
  }
}
