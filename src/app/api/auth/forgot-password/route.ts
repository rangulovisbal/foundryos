import { NextResponse } from "next/server";

import { getRequestAppUrl, requestPasswordReset } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const appUrl = getRequestAppUrl(request);
    const payload = forgotPasswordSchema.parse(await request.json());
    const result = await requestPasswordReset(payload.email, appUrl);

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl,
      emailDelivery: result.emailDelivery,
      deliveryMode: result.deliveryMode
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Reset request failed.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
