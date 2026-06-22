import { z } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { canSignup } from "@/lib/access";
import { getRequestAppUrl, registerUser } from "@/lib/auth";
import { signupSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage, setLanguageCookie } from "@/lib/language-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function limited(result: Awaited<ReturnType<typeof rateLimit>>, language: "en" | "es") {
  return noStoreJson(
    {
      error: copyForLanguage(
        language,
        "Too many signup attempts. Try again later.",
        "Demasiados intentos de registro. Inténtalo más tarde."
      )
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) }
    }
  );
}

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const body = (await request.json()) as Record<string, unknown>;
    const ipLimit = await rateLimit(`signup:ip:${clientIp(request)}`, 10, 600);
    if (!ipLimit.ok) {
      return limited(ipLimit, language);
    }

    const payload = signupSchema
      .extend({
        accessToken: z.string().optional(),
        redirectTo: z.string().optional()
      })
      .parse(body);
    const emailLimit = await rateLimit(
      `signup:email:${payload.email.trim().toLowerCase()}`,
      5,
      3600
    );
    if (!emailLimit.ok) {
      return limited(emailLimit, language);
    }

    const { accessToken, ...registrationPayload } = payload;
    const access = canSignup({ accessToken });
    if (!access.ok) {
      return noStoreJson(
        {
          error: copyForLanguage(
            language,
            "Signup access is restricted in this environment.",
            "El registro está restringido en este entorno."
          )
        },
        { status: 403 }
      );
    }

    const result = await registerUser({
      ...registrationPayload,
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
