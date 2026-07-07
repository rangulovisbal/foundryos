# HANDOFF

Last updated: 2026-07-07 (second session)

## 0. Latest Session (diagnosis wait indicator)

- `DiagnosticsRunButton` now shows a progress/wait panel while `/api/diagnosis` runs: an elapsed timer (m:ss), staged status copy (leyendo evidencia → redactando → revisando calidad, switching at 25s/110s), a progress bar calibrated to the ~3-minute Fable run (caps at 95% until the response lands), and the note "Esto suele tardar 2-3 minutos. Mantén esta pestaña abierta." Styled for the dark "Ejecutar o repetir" card (white/10 borders, sand progress fill). Bilingual via `copyForLanguage`.
- Verified end-to-end in a headless browser against a dev server with the embedded PGlite DB: signup → verify → workspace → profile → diagnostics page → run. Observed all three stages with correct timer values (0:04 / 0:32 / 1:54) by holding the API response, success message replacing the panel, `router.refresh` rendering the saved diagnosis, timer reset on a second run, and the panel clearing correctly on a simulated 500 error.
- `typecheck` and `lint` green. Work is on branch `claude/continua-y8gnfq` (remote session; not merged to `main` yet).

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
- **Production verified end-to-end (2026-07-07).** After Ricardo restored the Supabase project and set the real `ANTHROPIC_API_KEY`: migration `0014_plan_task_progress.sql` applied to the production DB (table confirmed), and the full smoke (temp user → verify → workspace → profile → `POST /api/diagnosis` on production) returned `source: anthropic`, `model: claude-fable-5` in ~139s with a high-quality Spanish diagnosis (7 scores, 4 weeks, 7 assets, 2 SOPs, 2 founder_answers, website evidence detected). Temp user deleted afterwards.
- Two production fixes were required for Claude Fable 5: the model rejects sampling params, so `temperature` was removed from both engine calls in favor of `output_config: {effort: "low"}` (`d03ab9b`), and the two-pass run exceeds 60s, so `/api/diagnosis` `maxDuration` was raised to 300 (`717001e`).

## 3. Known Issues Or Blockers

- Local `data/foundation-db` (PGlite) is corrupt from an earlier session (`Aborted()` on first query). Delete the folder to let dev recreate it if local embedded runs are needed.
- Preview env still missing `ENCRYPTION_KEY` and `APP_SECRET`. Stripe remains disabled.
- ~~A Fable diagnosis run takes ~2-3 minutes; the diagnostics run button UX should eventually communicate that wait.~~ Done: wait indicator shipped on `claude/continua-y8gnfq`.

## 4. Recommended Next Steps

1. Merge `claude/continua-y8gnfq` (diagnosis wait indicator) into `main` and deploy.
2. Run one real Spanish pilot and review the verdict-first UX with live data.
3. Set `ENCRYPTION_KEY` and `APP_SECRET` in Vercel preview.
