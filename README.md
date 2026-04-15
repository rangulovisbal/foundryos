# FoundryOS

FoundryOS is a web-first SaaS foundation for selling an AI-assisted growth and operations system to small companies and startups with limited internal resources.

## What is included

- marketing website with strong positioning
- pricing page with Stripe Checkout integration
- onboarding intake for AI Snapshot
- heuristic snapshot engine ready to be upgraded with OpenAI
- database-backed auth, workspaces, memberships, invitations, and sessions
- workspace business profile setup
- persisted structured diagnostics with job history
- admin panel for internal workspace and diagnostic visibility
- lead capture API with rate limiting and optional Cloudflare Turnstile
- Postgres + Drizzle ready persistence with embedded local development fallback
- Resend email notifications
- Stripe webhook handler for subscriptions
- security headers, robots, sitemap and SEO structure
- internal docs for business, architecture, compliance and operations

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Postgres + Drizzle
- Stripe Checkout / Billing
- Resend
- Cloudflare Turnstile
- OpenAI-ready analysis layer
- PostHog-ready analytics layer

## Routes

- `/` marketing site
- `/pricing` pricing and checkout
- `/onboarding` AI Snapshot intake
- `/dashboard` sample operating dashboard
- `/security` trust and compliance page
- `/login` customer login
- `/signup` customer signup
- `/forgot-password` password reset request
- `/app` authenticated app entry
- `/app/setup` workspace setup
- `/app/dashboard` authenticated workspace dashboard
- `/app/profile` business profile setup
- `/app/diagnostics` structured diagnostics and history
- `/app/team` team and invitations
- `/app/billing` billing/account-state preview
- `/admin/login` admin access
- `/admin` internal workspace control panel
- `/api/health` healthcheck
- `/api/leads` lead capture
- `/api/checkout` Stripe checkout
- `/api/snapshot` snapshot generation
- `/api/app/business-profile` business profile read/save
- `/api/app/diagnostics/run` diagnostic job creation
- `/api/webhooks/stripe` Stripe webhook

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill external service keys when available
3. Run `npm install`
4. Run `npm run dev`
5. Open `http://localhost:3000`

## Required environment variables

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL` in preview/production
- `ADMIN_ACCESS_TOKEN`

Optional but prepared:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SNAPSHOT`
- `STRIPE_PRICE_GROWTH_OS`
- `STRIPE_PRICE_OPERATOR`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`
- `OPENAI_API_KEY`
- `OPENAI_SNAPSHOT_MODEL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Database

The project uses Drizzle with Postgres. Local development can run the
auth/workspace/profile/diagnostics foundation with an embedded
Postgres-compatible database. Preview and production require a real Postgres
`DATABASE_URL`. Legacy local JSON fallback only remains for public
marketing-preview lead/subscription flows.

## Snapshot engine behavior

`/api/snapshot` always returns a valid report. By default it uses the local heuristic engine. If `OPENAI_API_KEY` is present, the API route refines that heuristic report with OpenAI and silently falls back to the heuristic result if the external call fails or times out.

## Validation commands

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Internal documentation

- [Delivery control](DELIVERY_CONTROL.md)
- [Release checklist](RELEASE_CHECKLIST.md)
- [Environment audit](ENVIRONMENT_AUDIT.md)
- [Business profile spec](BUSINESS_PROFILE_SPEC.md)
- [Diagnostics spec](DIAGNOSTICS_SPEC.md)
- [Executive summary](docs/executive-summary.md)
- [Business plan](docs/business-plan.md)
- [Product requirements](docs/product-requirements.md)
- [Roadmap and gantt](docs/roadmap-and-gantt.md)
- [Compliance checklist](docs/compliance-checklist.md)
- [System architecture](docs/system-architecture.md)
- [Security runbook](docs/security-runbook.md)
- [Internal operations manual](docs/internal-operations-manual.md)
