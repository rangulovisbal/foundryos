# Internal Operations Manual

Last updated: 2026-06-23

## Normal Access

FoundryOS uses self-serve account creation by default. Use `ACCESS_MODE=invite`
only when a deployment needs restricted access.

## Support

Support and deletion requests are stored in-product and reviewed manually.

## Billing

Stripe checkout is available only when `ENABLE_STRIPE_CHECKOUT=true`, Stripe
credentials exist, price IDs are configured, and the webhook has been verified.

## Diagnosis Review

The product can generate deterministic and agentic outputs. Review customer
outputs for specificity, evidence linkage, and overconfidence, especially while
the workflow is still being validated.
