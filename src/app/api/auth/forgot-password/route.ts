import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const payload = forgotPasswordSchema.parse(await request.json());
    const result = await requestPasswordReset(payload.email);

    return NextResponse.json({
      ok: true,
      previewUrl: result.previewUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Reset request failed."
      },
      { status: 400 }
    );
  }
}
