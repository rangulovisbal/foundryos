import { bootstrapInternalAdminFromToken, getCurrentUserSession } from "@/lib/auth";
import { adminBootstrapRequestSchema, adminBootstrapSchema } from "@/lib/foundation";
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
