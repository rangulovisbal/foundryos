import { NextResponse } from "next/server";

import { getRequestAppUrl, logoutCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/login?loggedOut=1", getRequestAppUrl(request)),
    303
  );
  await logoutCurrentSession(response);
  return response;
}
