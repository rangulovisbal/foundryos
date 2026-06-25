# Product Truth

Last updated: 2026-06-25

FoundryOS is a founder-assisted marketing diagnosis and 30-day planning product
for early-stage small businesses and founder-led projects during pilot
validation.

The useful promise is clarity: reflect the business situation, identify the
main marketing gaps, and turn that into a plan the customer can act on this
week.

## Current Capabilities

- Account creation routes exist, but pilot access should be assisted/manual
  until self-serve launch is intentionally re-enabled.
- Custom Postgres-backed auth and workspaces.
- Structured marketing profile intake.
- Deterministic diagnosis/planning/assets/SOP workflows remain intact as the
  evidence and compatibility layer.
- Authenticated `/api/diagnosis` endpoint uses Anthropic when configured, falls
  back to FoundryOS deterministic strategist output when not, validates with
  Zod, persists encrypted output, and creates a compatible diagnostic result for
  downstream planning.
- Durable Postgres rate limiting.
- Stripe checkout code exists but should remain disabled until billing,
  provisioning, and webhook behavior are fully verified.

## Non-Promises

- No live website crawling unless a crawler is explicitly implemented.
- No live social analysis unless an integration is explicitly implemented.
- No guaranteed commercial result.
- No autonomous execution of marketing work.
- No private financials, customer lists, passwords, contracts, or confidential
  data should be requested for normal intake.

## Quality Bar

An output is good enough when the customer says: this reflects my situation,
gives me clarity, and I can act on at least one part this week.
