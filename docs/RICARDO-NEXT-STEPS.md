# Ricardo Next Steps

Last updated: 2026-07-07

1. **Restore the production database.** The Supabase project `psqputuljgqfmvmhvizy` no longer resolves (paused or deleted). Unpause it in the Supabase dashboard, or create a new Postgres and update `DATABASE_URL` in Vercel (Production/Preview/Development).
2. **Apply migration `drizzle/0014_plan_task_progress.sql`** to the restored database (it creates the `plan_task_progress` table used by the "hecho" checkboxes and the cycle memory).
3. **Set a real `ANTHROPIC_API_KEY`** in Vercel production and preview — the variable exists but is empty, so diagnosis always uses the deterministic fallback. Load API credits.
4. Re-run the smoke and confirm `/api/diagnosis` returns `source: anthropic` with the two-pass (strategist + reviewer) output, `founder_answers`, and website evidence.
5. Set `ENCRYPTION_KEY` and `APP_SECRET` in Vercel preview.
6. Review one real Spanish pilot output: verdict, 7 scores, bottlenecks, week-1 tasks, founder answers, assets, SOPs.
7. Keep Stripe checkout disabled until billing/provisioning/webhooks are fully verified.
8. After 3-5 comparable pilots, decide the first wedge/ICP and update business docs accordingly.
