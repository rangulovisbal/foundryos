# HANDOFF

Last updated: 2026-06-25

## 1. What Was Completed

- Sharpened the FoundryOS agentic system prompt for senior marketing diagnosis.
- Added a customer-facing agentic diagnosis view in the workspace diagnostics page.
- Changed the diagnostics run button to call `/api/diagnosis`.
- Added `getLatestAgenticDiagnosis()` and decrypt/display logic for saved agentic output.
- Added `src/lib/agentic/fallback.ts`: a structured FoundryOS fallback that returns the same 7-dimension diagnosis schema when Anthropic is unavailable.
- Updated `/api/diagnosis` so every run also creates a compatible deterministic `diagnostic_results` record. This unblocks roadmap, 30-day plan, assets, and SOP generation after the new agentic diagnosis path.
- Added server logging when the Anthropic provider fails and the fallback is used.
- Updated core docs for the agentic/fallback/compatibility behavior.

## 2. Current Project Status

- Branch: `main`.
- Core smoke passed locally against the pulled production `DATABASE_URL` with a temporary test user that was deleted after the run.
- Smoke path passed: home -> signup -> preview verify -> workspace -> profile -> `/api/diagnosis` -> `/api/app/actions/generate` -> `/app/diagnostics`.
- `/api/diagnosis` returned `source: deterministic_fallback` because `ANTHROPIC_API_KEY` is empty in the pulled production env and local shell.
- The fallback still produced a valid saved diagnosis, a compatible `diagnosticResultId`, and a 4-week 30-day plan.
- Confirmed DB tables exist: `rate_limit_hits`, `agentic_diagnoses`, `diagnostic_jobs`, `diagnostic_results`, `planning_jobs`, `action_plans`, `thirty_day_plans`.

## 3. Pending Tasks

- Set a real `ANTHROPIC_API_KEY` in Vercel production and preview if the LLM strategist layer should run instead of fallback.
- Set `ENCRYPTION_KEY` and `APP_SECRET` in Vercel preview; production has them, preview does not.
- Decide whether the default model `claude-sonnet-4-6` should stay or be replaced after Anthropic is actually configured and tested.
- Re-run smoke after Anthropic is configured and confirm `/api/diagnosis` returns `source: anthropic`.
- Public-site access copy still needs a separate review if assisted-pilot framing should replace remaining `Start free` / self-serve language.

## 4. Important Architectural Decisions

- Auth remains custom Postgres-backed auth, not Supabase Auth.
- Postgres via `DATABASE_URL` is canonical.
- `agentic_diagnoses` stores encrypted strategic diagnosis output with `ENCRYPTION_KEY`.
- `/api/diagnosis` is now the primary run path, but it also writes a deterministic compatibility diagnostic result.
- The deterministic diagnosis/planning modules remain the evidence and compatibility layer for downstream modules.
- Anthropic is preferred when configured; FoundryOS deterministic fallback keeps the product usable when the provider is unavailable.
- Internal plan key `growth-os` remains compatibility-only.

## 5. Files Modified

- `src/app/api/diagnosis/route.ts`
- `src/lib/agentic/fallback.ts`
- `src/components/agentic-diagnosis-view.tsx`
- `src/components/diagnostics-run-button.tsx`
- `src/db/foundation.ts`
- `src/app/app/(workspace)/diagnostics/page.tsx`
- `src/app/app/(workspace)/dashboard/page.tsx`
- `src/components/business-profile-form.tsx`
- `docs/agentic-execution.md`
- `docs/current-product-conventions.md`
- `HANDOFF.md`
- `docs/RICARDO-NEXT-STEPS.md`
- `AGENTS.md`
- `CLAUDE.md`

## 6. Known Issues Or Blockers

- Anthropic is not active in the tested env because `ANTHROPIC_API_KEY` is empty.
- Preview env is missing `ENCRYPTION_KEY` and `APP_SECRET`, so `/api/diagnosis` cannot persist encrypted output there until those are set.
- Local `.env.local` still has empty `DATABASE_URL` and `ANTHROPIC_API_KEY`, so local unaided app usage falls back or blocks depending on route.
- Stripe remains disabled/not verified for live billing. Do not enable checkout until billing/provisioning/webhooks are fully tested.

## 7. Recommended Next Steps

1. Add `ANTHROPIC_API_KEY` to production and preview.
2. Add `ENCRYPTION_KEY` and `APP_SECRET` to preview.
3. Re-run `/api/diagnosis` smoke and verify `source: anthropic`.
4. Review one real Spanish pilot output for specificity, evidence honesty, and useful 30-day sequencing.
5. Run a focused public-access copy pass if the current deployment must read as assisted pilot rather than self-serve.
