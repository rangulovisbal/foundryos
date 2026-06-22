# Product Truth

Last updated: 2026-06-23

FoundryOS is a self-serve marketing diagnosis and 30-day planning product for
early-stage small businesses and founder-led projects.

The useful promise is clarity: reflect the business situation, identify the
main marketing gaps, and turn that into a plan the customer can act on this
week.

## Current Capabilities

- Public account creation by default with `ACCESS_MODE=self_serve`.
- Custom Postgres-backed auth and workspaces.
- Structured marketing profile intake.
- Deterministic diagnosis/planning/assets/SOP workflows remain intact.
- Authenticated agentic diagnosis endpoint using Anthropic and Zod validation.
- Durable Postgres rate limiting.
- Stripe checkout path for configured paid plans.

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
