import { NextResponse } from "next/server";

import { logoutCurrentSession } from "@/lib/auth";
import { applyNoStoreHeaders } from "@/lib/http";

export async function POST(request: Request) {
  const response = applyNoStoreHeaders(
    NextResponse.redirect(new URL("/admin/login", request.url))
  );
  await logoutCurrentSession(response);
  return response;
}
