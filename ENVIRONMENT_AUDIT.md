# ENVIRONMENT AUDIT

This audit reflects the current implemented MVP state, not an aspirational future state.

## Summary

- Local development can run the auth/workspace foundation without `DATABASE_URL` because the app now falls back to an embedded PGlite database in `development`.
- Preview and production do not get that fallback. They require a real `DATABASE_URL`.
- Unused `APP_SECRET` and `ENCRYPTION_KEY` requirements have been de-scoped from the current template.
- Ricardo still needs to configure most external services outside the codebase before any serious pilot or launch.

## Environment variable inventory

| Variable | Used for | Environments | Required now? | Current fallback behavior | Ricardo must configure outside the codebase? |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs in auth emails/preview links and app URL metadata | local, preview, production | Yes | Falls back to `http://localhost:3000`, which can be wrong if dev starts on another port | Yes. Set the correct URL per environment in Vercel and local `.env.local`. |
| `DATABASE_URL` | Remote DB for auth, workspaces, leads, subscriptions, admin audit, business profiles, and diagnostics | preview, production; optional local | Required in preview/production | Local development uses embedded PGlite if absent. Preview/production return explicit configuration errors for auth/workspace flows | Yes. Provision a real Postgres database and add the connection string to Vercel. |
| `ADMIN_ACCESS_TOKEN` | Bootstrap internal admin login at `/admin/login` | local, preview, production | Yes for admin access | Admin login fails if missing or incorrect | Yes. Generate and store this securely. |
| `INTERNAL_ADMIN_EMAILS` | Marks matching signup emails as `internal_admin` global role | local, preview, production | Optional | Empty list if unset | Yes, if you want non-bootstrap internal admin users. |
| `AUTH_PREVIEW_LINKS` | Controls whether auth emails fall back to preview links when Resend is unavailable | local, preview, production | Optional | Defaults to allowed outside production; disabled if set to `false` | Yes, if you want stricter auth-email behavior. |
| `STRIPE_SECRET_KEY` | Stripe server SDK, checkout route, security page/footer checkout status | preview, production | Not required yet | Billing stays non-live; checkout CTAs should stay controlled | Yes, later. Create Stripe account/project keys. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe readiness detection | preview, production | Not required yet | Stripe considered unavailable without it | Yes, later. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures | preview, production | Not required yet | Webhook route cannot safely run live billing flows | Yes, later. Configure in Stripe dashboard and Vercel. |
| `STRIPE_PRICE_SNAPSHOT` | Maps Snapshot plan to Stripe price | preview, production | Not required yet | Snapshot checkout remains non-live | Yes, later. Create Stripe prices. |
| `STRIPE_PRICE_GROWTH_OS` | Maps the legacy `growth-os` plan key now labeled FoundryOS Core to a Stripe price | preview, production | Not required yet | FoundryOS Core checkout remains non-live | Yes, later. |
| `STRIPE_PRICE_OPERATOR` | Maps Operator plan to Stripe price | preview, production | Not required yet | Operator checkout remains non-live | Yes, later. |
| `OPENAI_API_KEY` | OpenAI refinement for `/api/snapshot` | local, preview, production | Optional | Snapshot route falls back to heuristic-only report | Yes, if you want AI refinement live. |
| `OPENAI_SNAPSHOT_MODEL` | Snapshot model override | local, preview, production | Optional | Defaults to `gpt-5.4-mini` | Only if you want a different model policy. |
| `RESEND_API_KEY` | Resend client initialization | preview, production; optional local | Optional | Auth and invite flows fall back to preview links when allowed | Yes, if you want real outbound email. |
| `RESEND_FROM_EMAIL` | Sender address for outbound email | preview, production | Optional | Email delivery remains unavailable if unset | Yes. Requires verified sending domain/address in Resend. |
| `RESEND_TO_EMAIL` | Internal recipient for lead notification emails | preview, production | Optional | Lead notifications are skipped if unset | Yes. Decide where lead notifications should go. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile widget key on lead form | local, preview, production | Optional | Lead form runs without Turnstile widget | Yes, if bot protection is desired. |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification | local, preview, production | Optional | Lead API skips Turnstile verification if unset | Yes, if bot protection is desired. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog client readiness | preview, production | Optional | No analytics client setup | Yes, later. Create a PostHog project. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host | preview, production | Optional | Defaults in `.env.example` to `https://eu.i.posthog.com`, but analytics are not actually wired | Yes, if you use a different region or self-hosted host. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase readiness flag only | local, preview, production | Optional | No runtime use today | Only if Supabase is introduced later. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase readiness flag only | local, preview, production | Optional | No runtime use today | Only if Supabase is introduced later. |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder env only | preview, production | Optional | Unused today | Only if Supabase is introduced later. |

## Platform-managed variables

These affect behavior but are normally provided by the platform or runtime:

| Variable | Used for | Notes |
| --- | --- | --- |
| `NODE_ENV` | Session cookie security flag and local JSON safety checks | Provided by Next.js/runtime. |
| `VERCEL_ENV` | Controls environment mode, auth preview-link default, and whether local embedded DB is allowed | Provided by Vercel in hosted environments. |
| `VERCEL` | Used only in local JSON safety logic | Provided by Vercel when deployed. |

## Founder-side setup Ricardo must handle himself

### Infrastructure

- Provision the real preview/production Postgres database and set `DATABASE_URL`. Supabase Postgres pooler URLs are supported through this same variable.
- Decide and set the canonical preview and production `NEXT_PUBLIC_APP_URL` values.
- Generate and store `ADMIN_ACCESS_TOKEN`.
- Decide whether `INTERNAL_ADMIN_EMAILS` should be used.

### Billing

- Create Stripe products and prices for `snapshot`, `growth-os`, and `operator`.
- Add `STRIPE_SECRET_KEY`, publishable key, webhook secret, and price IDs.
- Decide when billing actually becomes source-of-truth instead of preview/manual state.

### Email

- Set up Resend.
- Verify the sender domain/address.
- Choose the internal inbox for `RESEND_TO_EMAIL`.

### Security and auth policy

- Decide whether preview links should remain allowed outside production by keeping or overriding `AUTH_PREVIEW_LINKS`.
- No action is currently required for `APP_SECRET` or `ENCRYPTION_KEY`; they are not part of the active MVP environment contract.

### Bot protection and analytics

- Create Cloudflare Turnstile keys if bot protection is needed on the public form.
- Create a PostHog project if analytics are going live.

### Optional/placeholder services

- Ignore Supabase for now unless a future slice intentionally adopts it.

## Current recommendations

- Treat `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and `ADMIN_ACCESS_TOKEN` as the only truly critical env vars for the current authenticated MVP.
- Treat Stripe, Resend, Turnstile, and OpenAI as optional until their respective slices are intentionally activated.
- Revisit application-level signing/encryption only when a future security slice introduces runtime use for those secrets.
