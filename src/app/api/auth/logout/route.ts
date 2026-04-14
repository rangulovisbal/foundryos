import { NextResponse } from "next/server";

import { logoutCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  await logoutCurrentSession(response);
  return response;
}
