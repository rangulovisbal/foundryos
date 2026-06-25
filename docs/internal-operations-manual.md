# Internal Operations Manual

Last updated: 2026-06-25

## Normal Access

FoundryOS should run as assisted/manual pilot access until self-serve launch is
intentionally re-enabled. Keep signup framed for invited or manually onboarded
pilot users.

## Support

Support and deletion requests are stored in-product and reviewed manually.

## Billing

Stripe checkout is available only when `ENABLE_STRIPE_CHECKOUT=true`, Stripe
credentials exist, price IDs are configured, and the webhook has been verified.

## Diagnosis Review

The product can generate Anthropic-backed or deterministic-fallback strategic
diagnosis output. Review customer outputs for specificity, evidence linkage,
useful 30-day sequencing, and overconfidence while the workflow is still being
validated.
