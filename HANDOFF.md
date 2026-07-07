# HANDOFF

Last updated: 2026-07-07

## 1. What Was Completed (Cerebro v3 + UX pass)

- Added a second self-review pass (`REVIEWER` prompt) to `src/lib/agentic/engine.ts`. The reviewer receives intake + draft, enforces quality bars, and the pipeline falls back to the first draft if the review pass fails — never worse than before.
- Added `src/lib/agentic/evidence.ts`: `/api/diagnosis` now fetches up to 2 founder URLs (profile website + first channel URL) and appends the page text to the intake evidence. Intake copy updated ("FoundryOS leerá esta página para fundamentar tu diagnóstico.").
- Added cycle memory: `/api/diagnosis` builds a `PREVIOUS CYCLE` block (prior summary, prior 7 scores from the decrypted last record, latest per-module founder feedback, tasks marked done) and appends it to the engine user prompt on re-runs. First run per workspace is unchanged.
- Added `founder_answers` to `DiagnosisOutput` (with `.default([])` so old encrypted records still parse), the engine prompt, and the deterministic fallback (one concrete answer per stated challenge).
- Rebuilt `/app/diagnostics` UX to be verdict-first: Veredicto → 3 cuellos de botella → Esta semana (week-1 tasks with `done_when` + CTA to `/app/actions`) → Respuestas a tus dudas → 7 dimensiones → Punto de partida (discreet average). The hero never shows the deterministic score when an agentic record exists; the deterministic detail stays collapsed at the end.
- Assets page: each agentic asset card now has a Copiar/Copy button (clipboard, "Copiado ✓" ~2s).
- Actions page: each agentic plan task shows `done_when` plus a persisted "hecho" checkbox backed by the new `plan_task_progress` table (`drizzle/0014_plan_task_progress.sql`), `POST /api/app/plan/task-done`, and `listPlanTaskProgress`/`setPlanTaskDone` helpers. Done tasks feed the next cycle's PREVIOUS CYCLE block.
- Intake step 4 (Oferta y audiencia) got the subtitle "Esto es lo que más mejora tu diagnóstico".
- `FOUNDRYOS_MODEL=claude-fable-5` set in Vercel Production and Preview via CLI (the variable existed but was empty).

## 2. Current Project Status

- Branch `main`, pushed; Vercel production deploy is Ready.
- Full local smoke passed on a fresh embedded DB: signup → preview verify → workspace → profile (with challenges + website) → `/api/diagnosis` → `source: deterministic_fallback` with 7 scores, 4 weeks, assets, SOPs, and 2 `founder_answers` → task-done checkbox persisted → diagnostics/actions/assets pages render the new UX. Second run exercised the PREVIOUS CYCLE path without errors. Temp user removed with the throwaway DB.
- `typecheck`, `lint`, `build`, and `npm audit --omit=dev` all green.

## 3. Known Issues Or Blockers

- **Production database is unreachable.** The Supabase project `psqputuljgqfmvmhvizy` does not resolve (NXDOMAIN) and the pooler answers `(ENOTFOUND) tenant/user postgres.psqputuljgqfmvmhvizy not found` — the project appears paused or deleted. Production signup/diagnosis will fail until Ricardo restores it in the Supabase dashboard (or points `DATABASE_URL` at a live database).
- **Migration `0014_plan_task_progress.sql` is NOT applied to the remote database** for the same reason. Apply it once the DB is back (script pattern: execute the SQL statements from the migration file against `DATABASE_URL`).
- `ANTHROPIC_API_KEY` exists in Vercel but its value is an **empty string**, so `/api/diagnosis` always falls back deterministically. Set the real key (plus credits) to activate the LLM strategist + reviewer passes.
- Local `data/foundation-db` (PGlite) is corrupt from an earlier session (`Aborted()` on first query). Delete the folder to let dev recreate it if local embedded runs are needed.
- Preview env still missing `ENCRYPTION_KEY` and `APP_SECRET`. Stripe remains disabled.

## 4. Recommended Next Steps

1. Restore/unpause the Supabase project (or provision a new Postgres and update `DATABASE_URL` in Vercel).
2. Apply `drizzle/0014_plan_task_progress.sql` to the restored database.
3. Set a real `ANTHROPIC_API_KEY` value in production and preview.
4. Re-run the production smoke and confirm `source: anthropic` plus a reviewed, specific Spanish output.
