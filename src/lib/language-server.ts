import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { OutputLanguage } from "@/lib/foundation";
import { APP_LANGUAGE_COOKIE_NAME, normalizeLanguage } from "@/lib/language";

const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getCookieLanguage() {
  const cookieStore = await cookies();
  return normalizeLanguage(cookieStore.get(APP_LANGUAGE_COOKIE_NAME)?.value);
}

export function setLanguageCookie(
  response: NextResponse,
  language: OutputLanguage
) {
  response.cookies.set({
    name: APP_LANGUAGE_COOKIE_NAME,
    value: language,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE
  });
}
