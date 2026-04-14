import { NextResponse } from "next/server";

import { authenticateUser, startSessionForUser } from "@/lib/auth";
import { loginSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const result = await authenticateUser(payload);

    if (result.requiresVerification || !result.user) {
      return NextResponse.json(
        {
          error: "Email verification required.",
          requiresVerification: true,
          verificationPreviewUrl: result.verificationPreviewUrl
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true });
    await startSessionForUser(result.user.id, response);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Login failed."
      },
      { status: 400 }
    );
  }
}
