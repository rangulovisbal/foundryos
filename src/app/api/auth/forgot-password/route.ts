import { getRequestAppUrl, requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function limited(result: Awaited<ReturnType<typeof rateLimit>>, language: "en" | "es") {
  return noStoreJson(
    {
      error: copyForLanguage(
        language,
        "Too many reset requests. Try again later.",
        "Demasiadas solicitudes de restablecimiento. Inténtalo más tarde."
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
    const payload = forgotPasswordSchema.parse(await request.json());

    // Per-IP limit first: without it an attacker rotating target emails can
    // spray reset emails across the user base and burn the email quota.
    const ipLimit = await rateLimit(
      `password-reset-request:ip:${clientIp(request)}`,
      10,
      3600
    );
    if (!ipLimit.ok) {
      return limited(ipLimit, language);
    }

    const emailLimit = await rateLimit(
      `password-reset-request:email:${payload.email.trim().toLowerCase()}`,
      3,
      3600
    );
    if (!emailLimit.ok) {
      return limited(emailLimit, language);
    }

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
