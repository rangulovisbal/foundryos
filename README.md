# FoundryOS

Self-serve marketing diagnosis and 30-day marketing planning for early-stage
small businesses and founder-led projects.

FoundryOS uses structured business intake, deterministic product workflows, and
an optional agentic diagnosis endpoint to turn saved marketing context into a
clear diagnosis, first plan, supporting assets, and customer-facing routines.

Public access is self-serve by default through `ACCESS_MODE=self_serve`. Signup
can still be restricted with `ACCESS_MODE=invite` and `SIGNUP_ACCESS_TOKEN` when
a deployment needs controlled access.

Production deployment exists, but production readiness still depends on a valid
`DATABASE_URL`, email delivery, database migrations, Stripe price/webhook
configuration when checkout is enabled, and end-to-end flow verification.

## Local Development

```bash
cp .env.example .env.local
# Fill in Postgres, Resend, Stripe, Anthropic, Turnstile, and PostHog as needed.
npm install
npm run dev
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

## Database

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:push       # Push schema to database
```
