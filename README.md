# FoundryOS

Founder-assisted marketing diagnosis and 30-day marketing planning for
early-stage small businesses.

The current product is a controlled design-partner pilot. It uses
founder-entered context and deterministic generation first; LLM refinement,
self-serve billing, and live integrations are later layers.

Public access is request-led. Signup routes remain available for invited pilot
users and manual onboarding, but FoundryOS should not be presented as an open
self-serve launch.

Production deployment exists, but pilot readiness still requires the target
environment variables, email delivery, database migration, and end-to-end flow
verification.

## Local development

```bash
cp .env.example .env.local
# Fill in values for Postgres, Resend, Cloudflare Turnstile, and PostHog as needed.
# Keep ENABLE_STRIPE_CHECKOUT=false and ENABLE_LLM_SNAPSHOT_REFINEMENT=false for pilot.
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Database

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:push       # Push schema to database
```
