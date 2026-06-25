# START HERE - FoundryOS

**This is the canonical FoundryOS repository. If you are an AI agent (Claude Code,
Codex, Cursor, etc.) or a human picking this up, read this file first.**

## Identity

| Field | Value |
| --- | --- |
| Canonical path | `~/ai-growth-os` (`/Users/ricardoangulo/ai-growth-os`) |
| GitHub remote | `https://github.com/rangulovisbal/foundryos.git` |
| Default branch | `main` |
| package.json name | `foundryos` |

Do **not** use `~/Downloads/foundryos-main`. That is a stale unzipped copy with
no git history. Always work in `~/ai-growth-os`.

Quick check:

```bash
git -C ~/ai-growth-os remote -v
git -C ~/ai-growth-os log -1 --oneline
```

## What This Project Is

FoundryOS is a founder-assisted marketing diagnosis and 30-day marketing
planning product for early-stage small businesses and founder-led projects.

The product path is:

1. Authenticated user/workspace.
2. Guided business profile.
3. Marketing diagnosis.
4. 30-day marketing plan.
5. Supporting assets and customer-facing marketing routines.

Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind, Drizzle ORM,
Postgres via `DATABASE_URL`, custom Postgres-backed auth, Resend, Stripe,
PostHog, Turnstile, and optional Anthropic.

## Current Core Status

- DB connectivity has been used successfully from pulled production env.
- `rate_limit_hits`, `agentic_diagnoses`, `diagnostic_jobs`,
  `diagnostic_results`, `planning_jobs`, `action_plans`, and
  `thirty_day_plans` exist in the target DB tested on 2026-06-25.
- Core smoke passed: signup -> verify -> workspace -> profile ->
  `/api/diagnosis` -> 30-day plan -> diagnostics page.
- `/api/diagnosis` currently falls back to `foundryos-deterministic-fallback`
  because pulled production and preview envs have empty `ANTHROPIC_API_KEY`.
- Preview env also needs `ENCRYPTION_KEY` and `APP_SECRET`.

## Key Decisions

- Product name is `FoundryOS`; do not use `AI Growth OS` as public product name.
- Auth stays custom Postgres-backed, not Supabase Auth.
- Postgres via `DATABASE_URL` is canonical.
- Internal plan key `growth-os` remains compatibility-only.
- Stripe stays disabled until billing/provisioning/webhooks are fully verified.
- `/api/diagnosis` is the primary diagnosis run path. It tries Anthropic when
  configured, falls back to a deterministic FoundryOS strategist output when not,
  and always creates a compatible deterministic diagnostic result for downstream
  plan/assets/SOP modules.

## How To Run Locally

```bash
cp .env.example .env.local
# Fill Postgres, Resend, Stripe, Anthropic, Turnstile, PostHog as needed.
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

## Where Things Live

- `HANDOFF.md` - latest session status, blockers, and next steps.
- `docs/RICARDO-NEXT-STEPS.md` - running next-action list.
- `docs/system-architecture.md` - architecture.
- `docs/product-requirements.md` / `docs/product-truth.md` - product intent.
- `docs/agentic-execution.md` - agentic/fallback diagnosis behavior.
- `docs/current-product-conventions.md` - conventions to follow.
- `src/app/api/diagnosis` and `src/lib/agentic/*` - strategic diagnosis layer.
- `src/lib/diagnostics.ts` and `src/lib/planning.ts` - deterministic evidence,
  compatibility, and downstream planning logic.
- `drizzle/` - SQL migrations.

## Working Agreement

- Confirm repo identity before editing.
- Keep `HANDOFF.md` and `docs/RICARDO-NEXT-STEPS.md` current at session end.
- Do not work in stale downloaded copies.
- Do not commit/push unless Ricardo asks.
