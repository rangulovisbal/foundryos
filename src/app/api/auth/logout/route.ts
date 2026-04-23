import { NextResponse } from "next/server";

import { getRequestAppUrl, logoutCurrentSession } from "@/lib/auth";
import { applyNoStoreHeaders, noStoreJson } from "@/lib/http";

export async function POST(request: Request) {
  let response: NextResponse;

  try {
    response = applyNoStoreHeaders(
      NextResponse.redirect(
        new URL("/login?loggedOut=1", getRequestAppUrl(request)),
        303
      )
    );
  } catch {
    response = noStoreJson(
      { error: "Logout is temporarily unavailable." },
      { status: 503 }
    );
  }

  await logoutCurrentSession(response);
  return response;
}
