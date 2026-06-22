# Ricardo Next Steps

Last updated: 2026-06-23

1. Fix the production/preview `DATABASE_URL` so Postgres accepts the tenant/user.
2. Apply `drizzle/0013_rate_limit_and_agentic.sql` and verify `rate_limit_hits`.
3. Configure `ANTHROPIC_API_KEY`, `APP_SECRET`, and `ENCRYPTION_KEY` in every deployment environment.
4. Configure Stripe price IDs and webhook before enabling `ENABLE_STRIPE_CHECKOUT=true`.
5. Run the smoke path: signup -> verify -> workspace -> profile -> diagnosis -> 30-day plan -> checkout.
6. Review first real customer outputs for specificity and usefulness.
