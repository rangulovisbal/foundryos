import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_COOKIE_NAME, buildAdminCookieValue } from "@/lib/admin-auth";

const loginSchema = z.object({
  token: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { token } = loginSchema.parse(await request.json());
    const expected = process.env.ADMIN_ACCESS_TOKEN;

    if (!expected) {
      return NextResponse.json(
        { error: "Admin access is not configured." },
        { status: 500 }
      );
    }

    if (token !== expected) {
      return NextResponse.json(
        { error: "Invalid access token." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: buildAdminCookieValue(token),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });

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
