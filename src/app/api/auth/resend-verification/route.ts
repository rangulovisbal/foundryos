import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestAppUrl, resendVerificationEmail } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { getCookieLanguage } from "@/lib/language-server";

const resendVerificationSchema = z.object({
  email: z.string().email("Enter a valid email."),
  redirectTo: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const appUrl = getRequestAppUrl(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = resendVerificationSchema.parse(body);
    const language = await getCookieLanguage();
    const result = await resendVerificationEmail({
      appUrl,
      email: payload.email,
      redirectTo: payload.redirectTo,
      language
    });

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery,
      deliveryMode: result.deliveryMode
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Verification email could not be prepared.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
