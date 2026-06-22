# HANDOFF

Last updated: 2026-06-23

## 1. What Was Completed

- Applied the FoundryOS agentic/self-serve alignment package through code and docs.
- Added Anthropic dependency and production audit override cleanup.
- Added durable Postgres rate limiting with `rate_limit_hits`.
- Added `ACCESS_MODE=self_serve` default and optional invite-token signup mode.
- Removed `budgetBand` / monthly revenue-style intake from the app model.
- Added authenticated `/api/diagnosis` with Anthropic, Zod validation, 5/hour user limit, encrypted persistence, and workspace/user linkage.
- Added authenticated `/api/billing/checkout` and Stripe webhook workspace activation updates.
- Updated public CTAs/copy to Start free + Log in.
- Updated CSP to nonce-based policy without `unsafe-inline` / `unsafe-eval`.
- Added backup/restore, secret-rotation, and agentic execution docs.

## 2. Current Project Status

- Branch: `main`
- Working tree has local changes for this package.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed.
- `npm audit --omit=dev`: passed with `found 0 vulnerabilities`.
- Public smoke passed for `/`, `/signup`, `/onboarding`, `/pricing`, and `/api/snapshot`.
- SQL migration file exists: `drizzle/0013_rate_limit_and_agentic.sql`.
- Migration could not be applied yet because the Vercel `DATABASE_URL` currently fails provider authentication with `tenant/user ... not found`.

## 3. Pending Tasks

- Fix `DATABASE_URL` in Vercel/local env.
- Re-run the SQL migration and confirm `rate_limit_hits` exists.
- Smoke test signup -> verify -> workspace -> profile -> `/api/diagnosis` -> plan -> checkout after DB config is fixed.
- Verify Stripe webhook events update workspace plan/account state in production.

## 4. Important Architectural Decisions

- Auth remains custom Postgres-backed auth, not Supabase Auth.
- Postgres via `DATABASE_URL` is canonical.
- Internal plan key `growth-os` remains compatibility-only for FoundryOS Core.
- `APP_SECRET` is used to HMAC-hash rate-limit buckets.
- `ENCRYPTION_KEY` encrypts persisted agentic diagnosis output.
- Deterministic diagnosis/planning/assets/SOP logic remains intact.
- Agentic output is a controlled layer behind auth, rate limits, Zod schema, and encrypted persistence.

## 5. Files Modified

Major areas:

- package/dependency files
- `.env.example`
- `drizzle/0013_rate_limit_and_agentic.sql`
- `src/db/schema.ts`
- `src/db/foundation.ts`
- `src/lib/rate-limit.ts`
- `src/lib/access.ts`
- `src/lib/crypto.ts`
- `src/lib/agentic/*`
- auth API routes
- `/api/diagnosis`
- billing checkout/webhook code
- profile/onboarding/public/pricing/header/footer copy
- CSP middleware
- docs and runbooks

## 6. Known Issues Or Blockers

- The pulled Vercel production and preview env both expose a `DATABASE_URL`, but connecting fails with the provider error `tenant/user ... not found`.
- Local `.env.local` has an empty `DATABASE_URL`; the embedded PGlite data directory currently aborts when opened, so local signup POST could not be fully smoked without resetting local dev data.
- Because of that external DB config issue, `rate_limit_hits` has not been confirmed in the target database yet.
- `/api/diagnosis` requires `ANTHROPIC_API_KEY` and `ENCRYPTION_KEY` at runtime.
- Paid checkout requires Stripe env, price IDs, and webhook secret before `ENABLE_STRIPE_CHECKOUT=true`.

## 7. Recommended Next Steps

1. Correct `DATABASE_URL`.
2. Apply `drizzle/0013_rate_limit_and_agentic.sql`.
3. Confirm `rate_limit_hits` exists.
4. Re-run full validation after DB fix if code changes.
5. Run authenticated browser/API smoke tests.
6. Commit and push once the DB blocker is accepted or resolved.
