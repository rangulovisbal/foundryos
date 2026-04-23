import { bootstrapInternalAdminFromToken } from "@/lib/auth";
import { adminBootstrapSchema } from "@/lib/foundation";
import { getClientIp, noStoreJson, publicErrorJson } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`admin-login:${ip}`, {
      max: 5,
      windowMs: 5 * 60_000
    });

    if (!rateLimit.success) {
      return noStoreJson(
        { error: "Too many admin login attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const { token } = adminBootstrapSchema.parse(await request.json());
    const response = noStoreJson({ ok: true });
    await bootstrapInternalAdminFromToken(token, response);
    return response;
  } catch (error) {
    return publicErrorJson(error, "Admin login failed.");
  }
}
