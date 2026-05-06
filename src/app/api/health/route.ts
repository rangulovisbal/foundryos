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
      database: env.foundationDbMode,
      stripeCredentials: env.hasStripeCredentials,
      stripeCheckout: env.stripeCheckoutEnabled,
      llmRefinementConfigured: env.hasOpenAI,
      llmSnapshotRefinement: env.llmSnapshotRefinementEnabled,
      posthog: env.hasPostHog
    }
  });
}
