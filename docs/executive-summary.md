# Executive Summary

Last updated: 2026-06-23

FoundryOS helps early-stage businesses diagnose what is missing in their
marketing and turn saved business context into a clear 30-day plan.

The product is now framed as self-serve starter access with optional paid plans
when Stripe is configured. Assisted support remains a paid/support layer, not
the default public access gate.

## Product Direction

- Start free.
- Complete a structured marketing profile.
- Generate a diagnosis and 30-day plan.
- Review optional assets and routines.
- Upgrade to recurring or assisted plans through authenticated Stripe checkout
  when price IDs and webhooks are configured.

## Architecture Direction

- Keep deterministic generation modules stable.
- Add agentic diagnosis as a controlled layer behind auth, rate limits, schema
  validation, and encrypted persistence.
- Add integrations only when they provide clear marketing evidence.
- Keep customer-facing recommendations practical and non-technical.
