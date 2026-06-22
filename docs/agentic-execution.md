# Agentic Execution Notes

Last updated: 2026-06-23

## What Exists

- `src/lib/agentic/schema.ts` defines the Zod contract for agentic diagnosis output.
- `src/lib/agentic/engine.ts` calls Anthropic and repairs one invalid JSON response.
- `src/app/api/diagnosis/route.ts` is authenticated, workspace-bound, and limited
  to 5 generations per user per hour.
- `agentic_diagnoses` persists encrypted output ciphertext plus minimal metadata.

## Inputs

The endpoint reads the saved workspace business profile. It builds an intake from:

- business name
- offer
- audience
- channels and URLs
- goals
- website, CTA, pricing/ticket model, acquisition, sales process, tools,
  bottlenecks, evidence notes, and business stage

It intentionally does not ask for private financials, customer lists, passwords,
contracts, or confidential data.

## Output Rules

Customer-facing suggestions should be practical marketing and measurement actions:

- simple landing page
- Instagram, LinkedIn, or WhatsApp follow-up
- email list or waitlist
- basic analytics and UTM tracking
- feedback collection
- simple CRM or shared sheet when relevant

Do not recommend implementation stack choices such as Next.js, Vercel, Postgres,
Stripe, PostHog, n8n, Supabase, or Neon as marketing actions for the customer.

## Environment

- `ANTHROPIC_API_KEY` is required to run `/api/diagnosis`.
- `FOUNDRYOS_MODEL` defaults to `claude-sonnet-4-6`.
- `ENCRYPTION_KEY` is required to persist agentic diagnosis output.
- `APP_SECRET` is used by durable rate limiting to hash bucket keys.
