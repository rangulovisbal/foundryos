# Agentic Execution Notes

Last updated: 2026-06-25

## What Exists

- `src/lib/agentic/schema.ts` defines the Zod contract for agentic diagnosis output.
- `src/lib/agentic/engine.ts` calls Anthropic and repairs one invalid JSON response.
- `src/lib/agentic/fallback.ts` builds a valid FoundryOS strategic diagnosis when
  Anthropic is unavailable or returns unusable output.
- `src/app/api/diagnosis/route.ts` is authenticated, workspace-bound, and limited
  to 5 generations per user per hour.
- `agentic_diagnoses` persists encrypted output ciphertext plus minimal metadata.
- Each `/api/diagnosis` run also creates a compatibility `diagnostic_jobs` /
  `diagnostic_results` record. Downstream modules still read that deterministic
  baseline for roadmap, 30-day plan, assets, and SOP generation.

## Runtime Behavior

1. Read the saved business profile.
2. Build the agentic intake.
3. Try Anthropic with the FoundryOS senior-strategist prompt.
4. If Anthropic fails, return the deterministic FoundryOS fallback output with
   `model: "foundryos-deterministic-fallback"`.
5. Persist a compatible diagnostic result so planning modules are unblocked.
6. Encrypt and persist the structured agentic/fallback output.
7. Increment `diagnostic_runs` usage once.

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

- `ANTHROPIC_API_KEY` enables the preferred Anthropic strategist read.
- If `ANTHROPIC_API_KEY` is missing or Anthropic fails, `/api/diagnosis` uses the
  FoundryOS fallback instead of blocking the product flow.
- `FOUNDRYOS_MODEL` defaults to `claude-sonnet-4-6`.
- `ENCRYPTION_KEY` is required to persist agentic diagnosis output.
- `APP_SECRET` is used by durable rate limiting to hash bucket keys.
- `DATABASE_URL` or local PGlite persistence is still required for authenticated
  workspace/profile/diagnosis storage.
