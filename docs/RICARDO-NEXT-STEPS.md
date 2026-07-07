# Ricardo Next Steps

Last updated: 2026-07-07 (post-verification)

1. Done ✅ — production DB restored, `ANTHROPIC_API_KEY` set, migration `0014_plan_task_progress.sql` applied, and the production smoke returned `source: anthropic` / `model: claude-fable-5` with a reviewed Spanish diagnosis.
2. Set `ENCRYPTION_KEY` and `APP_SECRET` in Vercel preview.
3. Run one real Spanish pilot and review the verdict-first UX, founder answers, and assets with live data.
4. Consider a progress/wait indicator on the diagnosis run button (Fable runs take ~2-3 minutes).
5. Keep Stripe checkout disabled until billing/provisioning/webhooks are fully verified.
6. After 3-5 comparable pilots, decide the first wedge/ICP and update business docs accordingly.
