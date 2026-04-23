import { env } from "@/lib/env";
import { noStoreJson } from "@/lib/http";

export async function GET() {
  if (env.isProduction) {
    return noStoreJson({
      ok: true,
      service: "foundryos",
      environment: env.vercelEnv
    });
  }

  return noStoreJson({
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
