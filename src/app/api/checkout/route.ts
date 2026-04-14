import { NextResponse } from "next/server";
import { z } from "zod";

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
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "local";
    const rateLimit = consumeRateLimit(`checkout:${ip}`, {
      max: 8,
      windowMs: 60_000
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const payload = checkoutSchema.parse(json);
    const session = await createCheckoutSession(payload);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checkout is not available."
      },
      { status: 400 }
    );
  }
}
