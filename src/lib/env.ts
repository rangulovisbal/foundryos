const vercelEnv = process.env.VERCEL_ENV ?? "development";
const hasRemoteFoundationDb = Boolean(process.env.DATABASE_URL);
const usesEmbeddedFoundationDb = !hasRemoteFoundationDb && vercelEnv === "development";

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  vercelEnv,
  hasNeon: hasRemoteFoundationDb,
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
  hasStripe: Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ),
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
  hasResend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
  hasTurnstile: Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  ),
  hasPostHog: Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
  ),
  allowAuthPreviewLinks:
    process.env.AUTH_PREVIEW_LINKS === "true" ||
    (process.env.AUTH_PREVIEW_LINKS !== "false" &&
      vercelEnv !== "production")
};
