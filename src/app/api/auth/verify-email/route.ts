import { NextResponse } from "next/server";

import {
  getRequestAppUrl,
  getPostAuthRedirectPath,
  resolvePrimaryLanguageForUser,
  sanitizeRedirectPath,
  verifyEmailAndCreateSession
} from "@/lib/auth";
import { isConfigurationError } from "@/lib/errors";
import { applyNoStoreHeaders, noStoreJson } from "@/lib/http";
import { setLanguageCookie } from "@/lib/language-server";

export async function GET(request: Request) {
  let appUrl: string;

  try {
    appUrl = getRequestAppUrl(request);
  } catch {
    return noStoreJson(
      { error: "Email verification is temporarily unavailable." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectTo = sanitizeRedirectPath(url.searchParams.get("redirectTo"));

  if (!token) {
    return applyNoStoreHeaders(
      NextResponse.redirect(new URL("/verify-email?status=invalid", appUrl))
    );
  }

  try {
    const response = applyNoStoreHeaders(
      NextResponse.redirect(new URL("/app", appUrl), 303)
    );
    const user = await verifyEmailAndCreateSession(token, response);

    if (!user) {
      throw new Error("User not found after verification.");
    }

    const language = await resolvePrimaryLanguageForUser(user);
    setLanguageCookie(response, language);

    const destination = await getPostAuthRedirectPath(user.id, redirectTo);
    const finalUrl = new URL(destination, appUrl);
    finalUrl.searchParams.set("verified", "1");
    response.headers.set("Location", finalUrl.toString());
    return response;
  } catch (error) {
    if (isConfigurationError(error)) {
      return applyNoStoreHeaders(
        NextResponse.redirect(new URL("/verify-email?status=unavailable", appUrl))
      );
    }

    return applyNoStoreHeaders(
      NextResponse.redirect(new URL("/verify-email?status=invalid", appUrl))
    );
  }
}
