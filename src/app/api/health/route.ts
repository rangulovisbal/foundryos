import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "foundryos",
    environment: env.vercelEnv,
    integrations: {
      supabase: env.hasSupabase,
      stripe: env.hasStripe,
      openai: env.hasOpenAI,
      posthog: env.hasPostHog
    }
  });
}
