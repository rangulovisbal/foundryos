import { NextResponse } from "next/server";

import { verifyEmailAndCreateSession } from "@/lib/auth";
import { isConfigurationError } from "@/lib/errors";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", request.url));
  }

  try {
    const response = NextResponse.redirect(new URL("/app?verified=1", request.url));
    await verifyEmailAndCreateSession(token, response);
    return response;
  } catch (error) {
    if (isConfigurationError(error)) {
      return NextResponse.redirect(
        new URL("/verify-email?status=unavailable", request.url)
      );
    }

    return NextResponse.redirect(new URL("/verify-email?status=invalid", request.url));
  }
}
