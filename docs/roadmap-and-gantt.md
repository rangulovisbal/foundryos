# Roadmap

Last updated: 2026-06-23

## Phase 1: Self-Serve Foundation

- Public CTA: start free.
- Account creation and email verification.
- Workspace setup.
- Structured marketing profile.
- Deterministic diagnosis and planning flows.
- Durable rate limiting.

## Phase 2: Agentic Diagnosis

- Anthropic-backed `/api/diagnosis`.
- Zod output schema.
- Encrypted persistence in `agentic_diagnoses`.
- Per-user generation limit.
- Customer-facing marketing recommendations only.

## Phase 3: Billing

- Authenticated `/api/billing/checkout`.
- Stripe monthly and assisted price IDs.
- Webhook updates workspace plan/account state.
- Billing page exposes configured checkout options.

## Phase 4: Evidence Integrations

- GA4 or Search Console.
- CRM/funnel import.
- Billing/provisioning hardening.

## Guardrails

- No private financials required.
- No hidden live crawling/social analysis.
- No autonomous execution claims.
- No stack recommendations in customer marketing output.
