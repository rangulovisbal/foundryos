import { NextResponse } from "next/server";

import {
  getRequestAppUrl,
  getPostAuthRedirectPath,
  resolvePrimaryLanguageForUser,
  sanitizeRedirectPath,
  verifyEmailAndCreateSession
} from "@/lib/auth";
import { isConfigurationError } from "@/lib/errors";
import { setLanguageCookie } from "@/lib/language-server";

export async function GET(request: Request) {
  const appUrl = getRequestAppUrl(request);
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectTo = sanitizeRedirectPath(url.searchParams.get("redirectTo"));

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", appUrl));
  }

  try {
    const response = NextResponse.redirect(new URL("/app", appUrl), 303);
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
      return NextResponse.redirect(new URL("/verify-email?status=unavailable", appUrl));
    }

    return NextResponse.redirect(new URL("/verify-email?status=invalid", appUrl));
  }
}
