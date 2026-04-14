export async function verifyTurnstile({
  token,
  ip
}: {
  token?: string | null;
  ip?: string;
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, mode: "disabled" as const };
  }

  if (!token) {
    return { ok: false, mode: "enabled" as const, reason: "missing-token" };
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip ?? ""
      })
    }
  );

  const result = (await response.json()) as { success?: boolean };
  return {
    ok: Boolean(result.success),
    mode: "enabled" as const
  };
}
