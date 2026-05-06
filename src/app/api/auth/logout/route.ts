import { NextResponse } from "next/server";

import { getRequestAppUrl, logoutCurrentSession } from "@/lib/auth";
import { applyNoStoreHeaders, noStoreJson } from "@/lib/http";

export async function POST(request: Request) {
  let response: NextResponse;

  try {
    const redirectPath = await getLogoutRedirectPath(request);

    response = applyNoStoreHeaders(
      NextResponse.redirect(new URL(redirectPath, getRequestAppUrl(request)), 303)
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

async function getLogoutRedirectPath(request: Request) {
  const requestUrl = new URL(request.url);
  let requestedPath = requestUrl.searchParams.get("next");
  const contentType = request.headers.get("content-type") ?? "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await request.formData();
      const formNext = formData.get("next");

      if (typeof formNext === "string") {
        requestedPath = formNext;
      }
    } catch {
      requestedPath = null;
    }
  }

  return normalizeLogoutRedirectPath(requestedPath);
}

function normalizeLogoutRedirectPath(requestedPath: string | null) {
  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//")
  ) {
    return "/login?loggedOut=1";
  }

  const target = new URL(requestedPath, "https://foundry.local");

  if (target.pathname !== "/login" && target.pathname !== "/signup") {
    return "/login?loggedOut=1";
  }

  target.searchParams.set("loggedOut", "1");
  return `${target.pathname}${target.search}`;
}
