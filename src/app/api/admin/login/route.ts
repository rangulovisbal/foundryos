import { NextResponse } from "next/server";

import { bootstrapInternalAdminFromToken } from "@/lib/auth";
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
        error: error instanceof Error ? error.message : "Login failed."
      },
      { status: 400 }
    );
  }
}
