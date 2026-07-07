# Ricardo Next Steps

Last updated: 2026-07-07 (wait indicator shipped)

1. Done ✅ — production DB restored, `ANTHROPIC_API_KEY` set, migration `0014_plan_task_progress.sql` applied, and the production smoke returned `source: anthropic` / `model: claude-fable-5` with a reviewed Spanish diagnosis.
2. Done ✅ — progress/wait indicator on the diagnosis run button (elapsed timer, staged copy, progress bar for the ~2-3 minute Fable runs). On branch `claude/continua-y8gnfq`; merge into `main` and deploy.
3. Set `ENCRYPTION_KEY` and `APP_SECRET` in Vercel preview.
4. Run one real Spanish pilot and review the verdict-first UX, founder answers, and assets with live data.
5. Keep Stripe checkout disabled until billing/provisioning/webhooks are fully verified.
6. After 3-5 comparable pilots, decide the first wedge/ICP and update business docs accordingly.
