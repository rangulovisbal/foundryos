# FoundryOS

Founder-assisted marketing diagnosis and 30-day marketing planning for
early-stage small businesses and founder-led projects.

FoundryOS uses structured business intake, a strategic diagnosis endpoint,
deterministic evidence/planning workflows, and optional Anthropic refinement to
turn saved marketing context into a clear diagnosis, first plan, supporting
assets, and customer-facing routines.

Pilot access should remain assisted/design-partner oriented until real customer
outputs prove the workflow. Signup routes can still support invited users.

Production deployment exists. The core diagnosis-to-plan smoke path has passed
against the pulled production database. Full production readiness still depends
on final environment configuration, email delivery, Anthropic configuration,
Stripe price/webhook verification when checkout is enabled, and repeated
end-to-end flow verification.

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
