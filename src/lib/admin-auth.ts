import { createHash } from "node:crypto";

import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "__Host-ago-admin";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAdminTokenHash() {
  const token = process.env.ADMIN_ACCESS_TOKEN;
  return token ? hashToken(token) : null;
}

export async function isAdminSessionValid() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const expected = getAdminTokenHash();

  if (!value || !expected) {
    return false;
  }

  return value === expected;
}

export function buildAdminCookieValue(rawToken: string) {
  return hashToken(rawToken);
}
