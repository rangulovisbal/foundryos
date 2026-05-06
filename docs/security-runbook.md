# Security Runbook

## Principles

- Do not store payment card data.
- Do not request sensitive customer data during the first pilot.
- Protect admin access.
- Keep the first pilot assisted and manually reviewed.
- Keep billing disabled until provisioning is verified.
- Keep deterministic outputs from becoming overconfident.

## Current Controls

### Headers

- Content-Security-Policy
- Strict-Transport-Security on HTTPS
- Referrer-Policy
- X-Content-Type-Options
- X-Frame-Options
- Cross-Origin-Opener-Policy
- Permissions-Policy

### Auth

- Custom email/password auth
- Email verification
- Password reset with session invalidation
- HTTP-only session cookies
- Preview auth links blocked in production

### Public Forms

- In-memory rate limiting
- Optional Cloudflare Turnstile
- Explicit consent on lead capture

### Data

- Canonical persistence through managed Postgres via `DATABASE_URL`
- Local PGlite only for local development
- No Supabase Auth dependency
- No passwords, customer lists, private financials, contracts, or sensitive personal data requested for first pilot

### Billing

- Stripe checkout is hard-disabled unless `ENABLE_STRIPE_CHECKOUT=true`
- First pilot is free and assisted
- Paid pilots require billing/provisioning review before activation

### Admin

- Bootstrap-token admin is acceptable for pilot
- Internal-admin accounts should become the preferred path soon
- Admin actions are logged

## Required Before First Assisted Pilot

- Production/preview managed Postgres configured
- Resend domain verified
- `AUTH_PREVIEW_LINKS=false`
- `ENABLE_STRIPE_CHECKOUT=false`
- `ENABLE_LLM_SNAPSHOT_REFINEMENT=false`
- Admin token stored securely
- Manual test of auth, workspace, diagnostics, 30-day plan, support, and admin

## Required Before Paid Pilots

- Legal review
- Stripe webhook signing test
- Success/cancel route review
- Billing portal behavior
- Provisioning/account-state behavior
- Secret rotation runbook
- Backup and restore runbook
- Distributed production rate limiting
