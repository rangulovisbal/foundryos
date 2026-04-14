# Security Runbook

## Principles

- Do not store payment card data
- Minimize sensitive data intake
- Protect admin access
- Rate-limit public endpoints
- Verify inbound webhooks
- Keep legal and security docs visible

## Current controls

### Headers

- Content-Security-Policy
- Strict-Transport-Security on HTTPS
- Referrer-Policy
- X-Content-Type-Options
- X-Frame-Options
- Cross-Origin-Opener-Policy
- Permissions-Policy

### Public form protection

- rate limiting on `/api/leads`
- optional Cloudflare Turnstile verification
- explicit consent checkbox

### Payments

- Stripe Checkout only
- webhook signature verification
- no local card processing

### Admin

- access token in environment
- httpOnly cookie session
- protected `/admin` page flow

### Data

- Neon-ready Postgres schema
- local JSON fallback for development only
- no credential persistence in repo

## External setup required before production launch

- Stripe products and price IDs
- Neon production database
- Resend sender domain verification
- Cloudflare Turnstile keys
- production domain and DNS
- privacy/legal pages reviewed by counsel

## Manual review before launch

- verify cookie and privacy pages
- verify refund policy wording
- test webhook signing in Stripe dashboard
- test Turnstile in real browser
- verify admin token rotation procedure
- verify Resend sender domain and inbox placement
- verify CSP against final third-party scripts
