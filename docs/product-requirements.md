# Product Requirements

Last updated: 2026-06-25

## Objective

Build FoundryOS as a founder-assisted marketing diagnosis and 30-day planning
product for early-stage small businesses with a real offer and no internal
marketing team. Self-serve SaaS can come after pilot validation.

## Core User

Founder, operator, creator, service business, boutique project, local/product-led
business, or early founder who needs marketing clarity.

## Primary Workflow

1. Request/invite account access.
2. Verify email.
3. Create workspace.
4. Complete marketing profile.
5. Run diagnosis.
6. Generate 30-day plan.
7. Review supporting assets/routines.
8. Move into paid/manual onboarding only when billing and provisioning are
   verified.

## Requirements

- FoundryOS naming only in public UI.
- Access should be framed as assisted pilot/design-partner access until launch.
- No required revenue/private-financial fields.
- Durable Postgres rate limiting on auth, snapshot, diagnosis, and billing paths.
- `/api/diagnosis` must be authenticated, workspace-bound, rate limited, Zod
  validated, persisted encrypted, and must create a compatible diagnostic result
  for downstream planning.
- Stripe checkout must attach user/workspace metadata so webhooks can update
  plan/account state. Keep checkout disabled until verified.
- Customer-facing output must avoid recommending internal implementation stack
  choices as marketing advice.
