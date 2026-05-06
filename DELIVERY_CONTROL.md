# DELIVERY CONTROL

## Current Product Truth

FoundryOS is in a controlled, founder-assisted pilot phase.

- The definitive product name is `FoundryOS`.
- `AI Growth OS` is no longer a product or UI name.
- The first pilot is free, assisted, and manually reviewed.
- The primary promise is a marketing diagnosis that turns into a clear 30-day marketing plan.
- Assets and marketing routines support the plan; they are not the main promise.
- The core reasoning path is deterministic for pilot trust.
- LLM refinement, live integrations, self-serve billing, and agentic automation are later layers.

## First ICP

The first ICP is early-stage small businesses and founder-led projects with a real offer but no internal marketing team.

For the first pilots, prioritize creators, service businesses, boutique projects, local/product-led businesses, and early founders who need marketing clarity. Do not lock the company into academies, SaaS, restaurants, or any one vertical until 3-5 comparable pilots reveal the strongest wedge.

## Current Route Map

### Public Routes

- `/` marketing homepage
- `/pricing` assisted pilot and future packaging surface
- `/onboarding` public Snapshot intake
- `/dashboard` public sample output
- `/security`
- `/terms`
- `/privacy`
- `/cookie`
- `/subprocessors`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/invite/[token]`

### Authenticated Product Routes

- `/app`
- `/app/setup`
- `/app/dashboard`
- `/app/profile`
- `/app/diagnostics`
- `/app/actions`
- `/app/roadmap`
- `/app/assets`
- `/app/sops`
- `/app/support`
- `/app/team`
- `/app/billing`

### Internal Admin Routes

- `/admin/login`
- `/admin`

## What Is Shipped

- Public marketing, pricing, sample output, security, and legal surfaces.
- Custom email/password auth backed by Postgres-compatible persistence.
- Email verification, login/logout, forgot/reset password, and HTTP-only sessions.
- Workspace creation, membership, invitations, roles, account states, and plan entitlements.
- Workspace business profile with structured marketing evidence fields.
- Deterministic diagnostics with persisted jobs, scores, risks, opportunities, next actions, and evidence cards.
- 30-day plan generation and persisted action/plan history.
- Supporting priority list, asset set, and customer-facing marketing routine generation.
- Output feedback capture.
- Support request and account/workspace deletion request logging.
- Internal admin overview, job visibility, feedback visibility, account-state controls, cleanup controls, and audit logs.
- Local embedded PGlite development database when `DATABASE_URL` is absent in development.
- Remote Postgres-compatible path through `DATABASE_URL` for preview/production.
- Resend email support.
- Optional Cloudflare Turnstile on public lead capture.
- Optional PostHog server-side event capture when configured.

## What Is Intentionally Not Live

- Public self-serve signup-to-paid provisioning.
- Stripe as entitlement source of truth.
- Billing portal and subscription lifecycle management.
- Automatic workspace provisioning after payment.
- Live CRM, analytics, ad, finance, or support integrations.
- Website or social-channel crawling/verification.
- LLM-driven core reasoning.
- Automatic account/workspace deletion from the customer UI.
- Fully automated support operations or SLA promises.

## Current Integrations Status

| Integration | Status | Current behavior |
| --- | --- | --- |
| Postgres via `DATABASE_URL` | Canonical persistence | Provider can be Supabase Postgres, Neon, or another compatible managed Postgres provider. The product should not be described as using Supabase Auth. |
| Local PGlite | Development only | Used automatically in local development when `DATABASE_URL` is absent. |
| Resend | Optional | Sends verification, reset, invite, and transactional emails when configured. Preview links are blocked in production. |
| Stripe | Disabled for pilot | Checkout requires `ENABLE_STRIPE_CHECKOUT=true` plus Stripe keys and prices. Keep it false until billing/provisioning is fully verified. |
| OpenAI / LLM | Future refinement only | The first pilot remains deterministic. The unused refinement helper requires `ENABLE_LLM_SNAPSHOT_REFINEMENT=true` before it can call OpenAI. |
| Cloudflare Turnstile | Optional | Public lead-capture protection when configured. |
| PostHog | Optional | Server-side pilot events when configured. |

## Pilot Success Standard

An output is good enough when the customer says:

> This reflects my situation, gives me clarity, and I can act on at least one part this week.

Outputs must be specific, evidence-linked, not overconfident, and not feel like generic ChatGPT text.

## Next Execution Order

1. Pilot-safe fixes first.
2. Assisted pilot execution.
3. Commercial launch preparation.
4. Automation, AI-assisted refinement, and agentic layers later.
