import "server-only";

import { verifySecret } from "@/lib/security";

export type AccessMode = "self_serve" | "invite";

export function getAccessMode(): AccessMode {
  return process.env.ACCESS_MODE === "invite" ? "invite" : "self_serve";
}

export function canSignup(input?: { accessToken?: string | null }) {
  const mode = getAccessMode();

  if (mode === "self_serve") {
    return { ok: true as const, mode };
  }

  const expected = process.env.SIGNUP_ACCESS_TOKEN?.trim();
  const provided = input?.accessToken?.trim();

  if (expected && provided && verifySecret(provided, expected)) {
    return { ok: true as const, mode };
  }

  return {
    ok: false as const,
    mode,
    reason: "signup_access_token_required" as const
  };
}
