import { NextResponse } from "next/server";

import { authenticateUser, startSessionForUser } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
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
          verificationPreviewUrl: result.verificationPreviewUrl,
          emailDelivery: result.emailDelivery
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
        error: getErrorMessage(error, "Login failed.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
