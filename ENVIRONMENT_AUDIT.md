# ENVIRONMENT AUDIT

## Canonical Runtime Decisions

- The canonical database concept is Postgres via `DATABASE_URL`.
- The provider can be Supabase Postgres, Neon, or another compatible managed Postgres provider.
- FoundryOS does not currently use Supabase Auth or Supabase Storage.
- Local development can run without `DATABASE_URL` through embedded PGlite.
- Preview and production need a real managed Postgres connection string.
- Stripe checkout is disabled unless `ENABLE_STRIPE_CHECKOUT=true`.
- LLM snapshot refinement is disabled unless `ENABLE_LLM_SNAPSHOT_REFINEMENT=true`.

## Environment Variables

| Variable | Current purpose | Required for first assisted pilot? | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL for links and metadata | Yes | Use `https://ai-growth-os-virid.vercel.app` for now. |
| `DATABASE_URL` | Remote Postgres persistence | Yes in preview/production | Supabase Postgres pooler URLs and Neon URLs are both acceptable. |
| `RESEND_API_KEY` | Transactional email delivery | Yes for real pilot email | Needed for verification/reset/invite emails. |
| `RESEND_FROM_EMAIL` | Verified sender address | Yes for real pilot email | `foundryos.online` can be used for email. |
| `RESEND_TO_EMAIL` | Internal lead notification recipient | Recommended | Used by public lead capture notifications. |
| `ADMIN_ACCESS_TOKEN` | Bootstrap internal admin login | Yes for pilot admin | Acceptable for pilot, but normal internal-admin accounts should become preferred soon. |
| `AUTH_PREVIEW_LINKS` | Local-only preview auth links | Yes | Keep `false` in production. |
| `INTERNAL_ADMIN_EMAILS` | Promotes real accounts to internal admin | Recommended | Normal internal-admin path should become preferred soon. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional public form protection | Optional | Helpful before broad traffic. |
| `TURNSTILE_SECRET_KEY` | Optional Turnstile verification | Optional | Pair with site key. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional product analytics | Optional | Server events are already wired when configured. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional PostHog host | Optional | Defaults to EU host in `.env.example`. |
| `OPENAI_API_KEY` | Future LLM refinement only | No | Does nothing unless `ENABLE_LLM_SNAPSHOT_REFINEMENT=true`. |
| `ENABLE_LLM_SNAPSHOT_REFINEMENT` | Future LLM refinement switch | No | Keep `false` for first pilot. |
| `STRIPE_SECRET_KEY` | Future checkout/webhook path | No | Do not set for first free pilot unless testing in a non-production environment. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Future checkout readiness | No | Does not enable checkout by itself. |
| `STRIPE_WEBHOOK_SECRET` | Future Stripe webhook verification | No | Required before paid pilots. |
| `STRIPE_PRICE_SNAPSHOT` | Future Snapshot price mapping | No | Not used while checkout is disabled. |
| `STRIPE_PRICE_GROWTH_OS` | Future legacy `growth-os` plan-key mapping | No | Internal compatibility key only. |
| `STRIPE_PRICE_OPERATOR` | Future Operator price mapping | No | Not used while checkout is disabled. |
| `ENABLE_STRIPE_CHECKOUT` | Explicit checkout switch | No | Must remain `false` until billing/provisioning is verified. |
| `NEXT_PUBLIC_SUPABASE_URL` | Placeholder/readiness only | No | Do not describe the app as using Supabase Auth. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Placeholder/readiness only | No | Unused by current runtime. |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder only | No | Unused by current runtime. |

## First Pilot Setup

1. Set `NEXT_PUBLIC_APP_URL`.
2. Set a production/preview `DATABASE_URL`.
3. Apply migrations with `npx drizzle-kit push`.
4. Configure Resend sender domain and email variables.
5. Set `ADMIN_ACCESS_TOKEN` and `INTERNAL_ADMIN_EMAILS`.
6. Keep `ENABLE_STRIPE_CHECKOUT=false`.
7. Keep `ENABLE_LLM_SNAPSHOT_REFINEMENT=false`.
8. Manually test signup, verification, login, workspace setup, profile, diagnostics, 30-day plan, assets, routines, support, and admin.

## Deferred

- Stripe products, checkout, webhooks, customer portal, and provisioning.
- Legal review for paid pilots.
- Distributed production rate limiting.
- Live integrations for GA4/Search Console, CRM import, and billing source of truth.
