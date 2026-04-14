import { NextResponse } from "next/server";

import { verifyEmailAndCreateSession } from "@/lib/auth";

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
  } catch {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", request.url));
  }
}
