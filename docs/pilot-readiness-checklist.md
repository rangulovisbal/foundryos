# Pilot Readiness Checklist

## Pilot Position

The first FoundryOS pilot is free, assisted, and manually reviewed. It is a design-partner pilot, not public self-serve SaaS.

The goal is to validate whether the customer feels:

> This reflects my situation, gives me clarity, and I can act on at least one part this week.

## Ricardo-Only Setup Tasks

### A1. Configure Production/Preview Environment

Set these first:

| Variable | Value / source |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://ai-growth-os-virid.vercel.app` for now |
| `DATABASE_URL` | Managed Postgres connection string |
| `RESEND_API_KEY` | Resend dashboard |
| `RESEND_FROM_EMAIL` | Verified sender on `foundryos.online` if available |
| `RESEND_TO_EMAIL` | Ricardo/internal recipient |
| `ADMIN_ACCESS_TOKEN` | Strong random string |
| `INTERNAL_ADMIN_EMAILS` | Ricardo email, comma-separated if more |
| `AUTH_PREVIEW_LINKS` | `false` |
| `ENABLE_STRIPE_CHECKOUT` | `false` |
| `ENABLE_LLM_SNAPSHOT_REFINEMENT` | `false` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` if PostHog is used |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional |
| `TURNSTILE_SECRET_KEY` | Optional |

Do not configure Stripe checkout for the first free assisted pilot unless testing safely outside production.

### A2. Verify Email Delivery

1. Verify sending domain in Resend.
2. Add SPF, DKIM, and DMARC records.
3. Send a test email to a real inbox.
4. Confirm verification/reset/invite emails arrive.

### A3. Apply Database Migrations

Run against the managed Postgres database:

```bash
DATABASE_URL="your-managed-postgres-url" npx drizzle-kit push
```

Provider can be Supabase Postgres, Neon, or another compatible managed Postgres provider.

### A4. End-To-End Auth Test

1. Signup.
2. Verify email.
3. Login.
4. Logout.
5. Forgot password.
6. Reset password.
7. Confirm preview links are not shown in production.

### A5. End-To-End Product Test

1. Create workspace.
2. Complete a realistic business profile.
3. Run diagnostics.
4. Generate 30-day plan.
5. Generate supporting priority list if useful.
6. Generate assets.
7. Generate routines.
8. Submit output feedback.
9. Submit a support request.
10. Review admin visibility.

### A6. Founder Review Script

Before showing a pilot output, review:

- Does it reflect the actual profile?
- Is every strong claim supported by entered evidence?
- Does low/weak evidence produce cautious language?
- Does the 30-day plan contain at least one action the customer can do this week?
- Does anything sound generic, inflated, or like fake autonomous understanding?

## First Pilot Execution

1. Manual invite or guided account creation.
2. Guided intake.
3. Deterministic generation.
4. Founder review.
5. Customer review session.
6. Capture feedback.
7. Record what had to be manually corrected.

## Not Required For First Free Pilot

- Stripe checkout
- Billing portal
- Paid invoice flow
- Legal entity decision
- LLM refinement
- Live integrations
- Copy/export deliverables
- Automated monthly refresh

## Required Before Paid Pilots

- Legal review of Terms, Privacy, Cookie, Subprocessors, deletion wording, refund/payment terms, and DPA basics.
- Stripe products/prices.
- Success/cancel routes.
- Paid onboarding/manual invite flow.
- Webhook-to-account-state behavior.
- Customer portal behavior.
- Production backup/restore runbook.
