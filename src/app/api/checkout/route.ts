import { z } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { getClientIp, noStoreJson, publicErrorJson } from "@/lib/http";
import { createCheckoutSession } from "@/lib/payments";
import { consumeRateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  planId: z.enum(["snapshot", "growth-os", "operator"]),
  email: z.string().email().optional(),
  company: z.string().optional()
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`checkout:${ip}`, {
      max: 8,
      windowMs: 60_000
    });

    if (!rateLimit.success) {
      return noStoreJson(
        { error: "Too many checkout attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const payload = checkoutSchema.parse(json);

    await captureAnalyticsEvent({
      event: "checkout_started",
      distinctId: payload.email?.trim().toLowerCase() || `checkout:${payload.planId}`,
      properties: {
        plan_id: payload.planId,
        has_email: Boolean(payload.email),
        has_company: Boolean(payload.company)
      }
    });

    const session = await createCheckoutSession(payload);

    return noStoreJson({ url: session.url });
  } catch (error) {
    return publicErrorJson(error, "Checkout is not available.");
  }
}
