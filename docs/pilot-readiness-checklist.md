# Production Readiness Checklist

Last updated: 2026-06-25

## Environment

- [ ] Valid `DATABASE_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `APP_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `ENABLE_STRIPE_CHECKOUT=true` only when Stripe keys, price IDs, and webhook are verified
- [ ] `STRIPE_PRICE_MONTHLY` and/or `STRIPE_PRICE_ASSISTED`
- [ ] `STRIPE_WEBHOOK_SECRET`

## Smoke Flow

- [ ] Home loads.
- [ ] Header prioritizes request/join pilot access and Log in.
- [ ] Signup works for invited/manual pilot users.
- [ ] Email verification works.
- [ ] Workspace setup works.
- [ ] Profile saves without revenue/private financial fields.
- [ ] `/api/diagnosis` returns a valid `DiagnosisOutput`.
- [ ] `/api/diagnosis` creates a compatible diagnostic result for downstream modules.
- [ ] 30-day plan generation works.
- [ ] Billing checkout remains disabled until configured and verified.
- [ ] Webhook marks workspace active for paid subscriptions.

## Safety

- [ ] `rate_limit_hits` exists in Postgres.
- [ ] CSP has no `unsafe-inline` or `unsafe-eval`.
- [ ] Backup/restore runbook reviewed.
- [ ] Secret-rotation runbook reviewed.
