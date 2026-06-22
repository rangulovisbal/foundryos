import { z } from "zod";

import {
  authenticateUser,
  getRequestAppUrl,
  getPostAuthRedirectPath,
  resolvePrimaryLanguageForUser,
  startSessionForUser
} from "@/lib/auth";
import { loginSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage, setLanguageCookie } from "@/lib/language-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function limited(result: Awaited<ReturnType<typeof rateLimit>>, language: "en" | "es") {
  return noStoreJson(
    {
      error: copyForLanguage(
        language,
        "Too many login attempts. Try again later.",
        "Demasiados intentos de acceso. Inténtalo más tarde."
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
    const ipLimit = await rateLimit(`login:ip:${clientIp(request)}`, 10, 600);
    if (!ipLimit.ok) {
      return limited(ipLimit, language);
    }

    const payload = loginSchema
      .extend({
        redirectTo: z.string().optional()
      })
      .parse(body);
    const emailLimit = await rateLimit(
      `login:email:${payload.email.trim().toLowerCase()}`,
      5,
      900
    );
    if (!emailLimit.ok) {
      return limited(emailLimit, language);
    }

    const result = await authenticateUser({
      ...payload,
      appUrl
    });

    if (result.requiresVerification || !result.user) {
      return noStoreJson(
        {
          error: copyForLanguage(
            language,
            "Email verification required.",
            "Necesitas verificar tu correo."
          ),
          requiresVerification: true,
          verificationPreviewUrl: result.verificationPreviewUrl,
          emailDelivery: result.emailDelivery,
          deliveryMode: result.deliveryMode
        },
        { status: 403 }
      );
    }

    const resolvedLanguage = await resolvePrimaryLanguageForUser(result.user);
    const redirectTo = await getPostAuthRedirectPath(result.user.id, payload.redirectTo);
    const response = noStoreJson({ ok: true, redirectTo });
    await startSessionForUser(result.user.id, response);
    setLanguageCookie(response, resolvedLanguage);
    return response;
  } catch (error) {
    return publicErrorJson(
      error,
      copyForLanguage(language, "Login failed.", "No se pudo iniciar sesión.")
    );
  }
}
