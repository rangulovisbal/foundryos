import { z } from "zod";

import { getRequestAppUrl, resendVerificationEmail } from "@/lib/auth";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const resendVerificationSchema = z.object({
  email: z.string().email("Enter a valid email."),
  redirectTo: z.string().optional()
});

function limited(result: Awaited<ReturnType<typeof rateLimit>>, language: "en" | "es") {
  return noStoreJson(
    {
      error: copyForLanguage(
        language,
        "Too many verification requests. Try again later.",
        "Demasiadas solicitudes de verificación. Inténtalo más tarde."
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
    const payload = resendVerificationSchema.parse(body);

    // This endpoint is unauthenticated and sends email: without limits it is
    // a one-line inbox-bombing and token-flooding loop.
    const ipLimit = await rateLimit(
      `resend-verification:ip:${clientIp(request)}`,
      5,
      600
    );
    if (!ipLimit.ok) {
      return limited(ipLimit, language);
    }

    const emailLimit = await rateLimit(
      `resend-verification:email:${payload.email.trim().toLowerCase()}`,
      3,
      3600
    );
    if (!emailLimit.ok) {
      return limited(emailLimit, language);
    }
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
