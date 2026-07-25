import { bootstrapInternalAdminFromToken, getCurrentUserSession } from "@/lib/auth";
import { adminBootstrapRequestSchema, adminBootstrapSchema } from "@/lib/foundation";
import { getClientIp, noStoreJson, publicErrorJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Durable (DB-backed) limit: the in-memory fallback resets on every cold
    // serverless instance, which is useless against admin-token brute force.
    const ipLimit = await rateLimit(`admin-login:ip:${ip}`, 5, 300);

    if (!ipLimit.ok) {
      return noStoreJson(
        { error: "Too many admin login attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSec) }
        }
      );
    }

    const current = await getCurrentUserSession();

    if (current?.user.globalRole === "internal_admin") {
      return noStoreJson({ ok: true, redirectTo: "/admin", reusedSession: true });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { token: requestedToken } = adminBootstrapRequestSchema.parse(body);

    if (!requestedToken) {
      return noStoreJson(
        {
          error:
            "Admin token is required unless you are already signed in as an internal admin."
        },
        { status: 400 }
      );
    }

    const { token } = adminBootstrapSchema.parse({ token: requestedToken });
    const response = noStoreJson({ ok: true, redirectTo: "/admin" });
    await bootstrapInternalAdminFromToken(token, response);
    return response;
  } catch (error) {
    return publicErrorJson(error, "Admin login failed.");
  }
}
