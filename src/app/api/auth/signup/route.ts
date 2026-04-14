import { NextResponse } from "next/server";

import { registerUser } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { signupSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const result = await registerUser(payload);

    return NextResponse.json({
      ok: true,
      verificationPreviewUrl: result.verificationPreviewUrl,
      emailDelivery: result.emailDelivery
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Signup failed.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
