import { NextResponse } from "next/server";

import { bootstrapInternalAdminFromToken } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import { adminBootstrapSchema } from "@/lib/foundation";

export async function POST(request: Request) {
  try {
    const { token } = adminBootstrapSchema.parse(await request.json());
    const response = NextResponse.json({ ok: true });
    await bootstrapInternalAdminFromToken(token, response);
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
