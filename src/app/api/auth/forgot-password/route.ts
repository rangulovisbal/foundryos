import { NextResponse } from "next/server";

import { getRequestAppUrl, requestPasswordReset } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const appUrl = getRequestAppUrl(request);
    const payload = forgotPasswordSchema.parse(await request.json());
    const result = await requestPasswordReset(payload.email, appUrl);

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery,
      deliveryMode: result.deliveryMode
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          copyForLanguage(
            language,
            "Reset request failed.",
            "No se pudo preparar el restablecimiento."
          )
        )
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
