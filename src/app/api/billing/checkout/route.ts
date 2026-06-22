import { z } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { canAccessWorkspace } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { createCheckoutSession } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  planId: z.enum(["growth-os", "operator"])
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const ipLimit = await rateLimit(`billing-checkout:ip:${clientIp(request)}`, 10, 600);
    const userLimit = await rateLimit(
      `billing-checkout:user:${context.user.id}`,
      10,
      600
    );

    if (!ipLimit.ok || !userLimit.ok) {
      const result = ipLimit.ok ? userLimit : ipLimit;
      return noStoreJson(
        { error: "Too many checkout attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSec) }
        }
      );
    }

    const payload = checkoutSchema.parse(await request.json());

    await captureAnalyticsEvent({
      event: "checkout_started",
      distinctId: context.user.id,
      properties: {
        plan_id: payload.planId,
        user_id: context.user.id,
        workspace_id: context.workspace.id
      }
    });

    const session = await createCheckoutSession({
      planId: payload.planId,
      email: context.user.email,
      company: context.workspace.name,
      userId: context.user.id,
      workspaceId: context.workspace.id
    });

    return noStoreJson({ url: session.url });
  } catch (error) {
    return publicErrorJson(error, "Checkout is not available.");
  }
}
