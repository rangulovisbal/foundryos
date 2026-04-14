# AI Growth OS

AI Growth OS is a web-first SaaS foundation for selling an AI-assisted growth and operations system to small companies and startups with limited internal resources.

## What is included

- marketing website with strong positioning
- pricing page with Stripe Checkout integration
- onboarding intake for AI Snapshot
- heuristic snapshot engine ready to be upgraded with OpenAI
- admin panel for internal lead review
- lead capture API with rate limiting and optional Cloudflare Turnstile
- Neon + Drizzle ready lead storage with local JSON fallback
- Resend email notifications
- Stripe webhook handler for subscriptions
- security headers, robots, sitemap and SEO structure
- internal docs for business, architecture, compliance and operations

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon + Drizzle
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
- `/admin/login` admin access
- `/admin` lead review panel
- `/api/health` healthcheck
- `/api/leads` lead capture
- `/api/checkout` Stripe checkout
- `/api/snapshot` snapshot generation
- `/api/webhooks/stripe` Stripe webhook

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill external service keys when available
3. Run `npm install`
4. Run `npm run dev`
5. Open `http://localhost:3000`

## Required environment variables

- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `ADMIN_ACCESS_TOKEN`
- `APP_SECRET`
- `ENCRYPTION_KEY`

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
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Database

The project is ready for Neon using Drizzle. If `DATABASE_URL` is missing, lead and subscription data falls back to local JSON in `data/` for local-only testing.

## Validation commands

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Internal documentation

- [Executive summary](docs/executive-summary.md)
- [Business plan](docs/business-plan.md)
- [Product requirements](docs/product-requirements.md)
- [Roadmap and gantt](docs/roadmap-and-gantt.md)
- [Compliance checklist](docs/compliance-checklist.md)
- [System architecture](docs/system-architecture.md)
- [Security runbook](docs/security-runbook.md)
- [Internal operations manual](docs/internal-operations-manual.md)
