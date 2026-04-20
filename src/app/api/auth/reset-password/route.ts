import { NextResponse } from "next/server";

import { resetPasswordFromToken } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export async function POST(request: Request) {
  const language = await getCookieLanguage();

  try {
    const payload = resetPasswordSchema.parse(await request.json());
    await resetPasswordFromToken(payload.token, payload.password, language);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          copyForLanguage(
            language,
            "Password reset could not be completed.",
            "No se pudo completar el restablecimiento de la contraseña."
          )
        )
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
