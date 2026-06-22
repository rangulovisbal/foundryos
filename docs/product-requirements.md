# Product Requirements

Last updated: 2026-06-23

## Objective

Build FoundryOS as a self-serve marketing diagnosis and 30-day planning product
for early-stage small businesses with a real offer and no internal marketing
team.

## Core User

Founder, operator, creator, service business, boutique project, local/product-led
business, or early founder who needs marketing clarity.

## Primary Workflow

1. Create account.
2. Verify email.
3. Create workspace.
4. Complete marketing profile.
5. Run diagnosis.
6. Generate 30-day plan.
7. Review supporting assets/routines.
8. Upgrade through billing when checkout is configured.

## Requirements

- FoundryOS naming only in public UI.
- `ACCESS_MODE=self_serve` default, with optional invite-token mode.
- No required revenue/private-financial fields.
- Durable Postgres rate limiting on auth, snapshot, diagnosis, and billing paths.
- `/api/diagnosis` must be authenticated, workspace-bound, rate limited, Zod
  validated, and persisted encrypted.
- Stripe checkout must attach user/workspace metadata so webhooks can update
  plan/account state.
- Customer-facing output must avoid recommending internal implementation stack
  choices as marketing advice.
