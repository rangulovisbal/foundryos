import { NextResponse } from "next/server";

import { registerUser } from "@/lib/auth";
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
        error: error instanceof Error ? error.message : "Signup failed."
      },
      { status: 400 }
    );
  }
}
