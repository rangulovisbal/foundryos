# Executive Summary

Last updated: 2026-06-25

FoundryOS helps early-stage businesses diagnose what is missing in their
marketing and turn saved business context into a clear 30-day plan.

The product is now framed as an assisted design-partner pilot. Self-serve access
and paid plans should wait until the first real pilot outputs prove usefulness,
clarity, and repeatable workflow quality.

## Product Direction

- Request/join pilot access.
- Complete a structured marketing profile.
- Generate a diagnosis and 30-day plan.
- Review optional assets and routines.
- Move to paid/manual onboarding only after billing, provisioning, and webhooks
  are verified.

## Architecture Direction

- Keep deterministic generation modules stable.
- Use `/api/diagnosis` as the controlled strategic layer behind auth, rate
  limits, schema validation, encrypted persistence, and deterministic fallback.
- Add integrations only when they provide clear marketing evidence.
- Keep customer-facing recommendations practical and non-technical.
