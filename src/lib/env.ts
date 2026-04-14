export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  vercelEnv: process.env.VERCEL_ENV ?? "development",
  hasNeon: Boolean(process.env.DATABASE_URL),
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
  hasStripe: Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ),
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
  hasResend: Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL &&
      process.env.RESEND_TO_EMAIL
  ),
  hasTurnstile: Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
  ),
  hasPostHog: Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
  )
};
