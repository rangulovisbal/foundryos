import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authenticateUser,
  getRequestAppUrl,
  getPostAuthRedirectPath,
  resolvePrimaryLanguageForUser,
  startSessionForUser
} from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { loginSchema } from "@/lib/foundation";
import { setLanguageCookie } from "@/lib/language-server";

export async function POST(request: Request) {
  try {
    const appUrl = getRequestAppUrl(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = loginSchema
      .extend({
        redirectTo: z.string().optional()
      })
      .parse(body);
    const result = await authenticateUser({
      ...payload,
      appUrl
    });

    if (result.requiresVerification || !result.user) {
      return NextResponse.json(
        {
          error: "Email verification required.",
          requiresVerification: true,
          verificationPreviewUrl: result.verificationPreviewUrl,
          emailDelivery: result.emailDelivery,
          deliveryMode: result.deliveryMode
        },
        { status: 403 }
      );
    }

    const language = await resolvePrimaryLanguageForUser(result.user);
    const redirectTo = await getPostAuthRedirectPath(result.user.id, payload.redirectTo);
    const response = NextResponse.json({ ok: true, redirectTo });
    await startSessionForUser(result.user.id, response);
    setLanguageCookie(response, language);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Login failed.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
