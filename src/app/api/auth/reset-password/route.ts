import { resetPasswordFromToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function limited(result: Awaited<ReturnType<typeof rateLimit>>, language: "en" | "es") {
  return noStoreJson(
    {
      error: copyForLanguage(
        language,
        "Too many password reset attempts. Try again later.",
        "Demasiados intentos de restablecimiento. Inténtalo más tarde."
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
    const ipLimit = await rateLimit(`password-reset:ip:${clientIp(request)}`, 10, 600);
    if (!ipLimit.ok) {
      return limited(ipLimit, language);
    }

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
