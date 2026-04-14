import { NextResponse } from "next/server";

import { resetPasswordFromToken } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const payload = resetPasswordSchema.parse(await request.json());
    await resetPasswordFromToken(payload.token, payload.password);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Password reset could not be completed.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
