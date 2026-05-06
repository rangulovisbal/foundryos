const vercelEnv = process.env.VERCEL_ENV ?? "development";
const isProduction = vercelEnv === "production";
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const hasRemoteFoundationDb = Boolean(process.env.DATABASE_URL);
const usesEmbeddedFoundationDb = !hasRemoteFoundationDb && vercelEnv === "development";
const requestedAuthPreviewLinks = process.env.AUTH_PREVIEW_LINKS === "true";
const hasStripeCredentials = Boolean(
  process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);
const stripeCheckoutEnabled =
  process.env.ENABLE_STRIPE_CHECKOUT === "true" && hasStripeCredentials;
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const llmSnapshotRefinementEnabled =
  process.env.ENABLE_LLM_SNAPSHOT_REFINEMENT === "true" && hasOpenAI;

export const env = {
  appUrl: configuredAppUrl ?? "http://localhost:3000",
  vercelEnv,
  isProduction,
  hasConfiguredAppUrl: Boolean(configuredAppUrl),
  hasRemotePostgres: hasRemoteFoundationDb,
  hasFoundationDb: hasRemoteFoundationDb || usesEmbeddedFoundationDb,
  foundationDbMode: hasRemoteFoundationDb
    ? ("remote" as const)
    : usesEmbeddedFoundationDb
      ? ("embedded" as const)
      : ("missing" as const),
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  hasStripe: hasStripeCredentials,
  hasStripeCredentials,
  stripeCheckoutEnabled,
  hasOpenAI,
  llmSnapshotRefinementEnabled,
  hasResend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
  hasTurnstile: Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  ),
  hasPostHog: Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
  ),
  requestedAuthPreviewLinks,
  authPreviewLinksBlocked: requestedAuthPreviewLinks && isProduction,
  allowAuthPreviewLinks:
    (!isProduction && requestedAuthPreviewLinks) ||
    (process.env.AUTH_PREVIEW_LINKS !== "false" &&
      !isProduction)
};
