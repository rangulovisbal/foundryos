# Internal Operations Manual

## Current Mode

FoundryOS is running a free, assisted design-partner pilot.

The founder should be involved in onboarding, intake guidance, output review, customer review sessions, and feedback capture for the first pilots.

## Weekly Founder Routine

1. Review new leads and pilot requests.
2. Confirm which candidates match the current ICP.
3. Schedule assisted intake or review sessions.
4. Review generated outputs before customer delivery.
5. Capture feedback on clarity, specificity, usefulness, and genericness.
6. Record what required manual correction.
7. Decide whether the next pilot should use the same segment or a narrower wedge.

## Assisted Pilot Flow

1. Manual invite or guided account creation.
2. Customer completes business profile with non-sensitive marketing context.
3. Founder helps clarify incomplete or vague inputs.
4. Customer or founder runs diagnostics.
5. Generate the 30-day plan.
6. Generate supporting assets/routines only after the plan exists.
7. Founder reviews outputs before relying on them.
8. Customer review session.
9. Feedback captured in-product and in founder notes.

## Quality Review Checklist

- Does the output reflect the actual profile?
- Does it avoid unsupported claims?
- Is weak evidence treated cautiously?
- Does the 30-day plan contain at least one action this customer can take this week?
- Does the output sound specific rather than generic?
- Are Spanish outputs natural enough for a real Spain-based pilot?

## Manual Work Allowed Early

- onboarding
- intake facilitation
- output review
- session facilitation
- feedback capture
- light summary preparation

## Manual Work To Eliminate Later

- producing every deliverable manually
- workspace setup
- core generation
- feedback capture
- basic support/deletion logging
- recurring refresh creation

## Billing Operations

Stripe checkout is disabled during the first free pilot.

Before paid pilots:

1. Design scheduled onboarding/manual invite after payment.
2. Verify success/cancel routing.
3. Map Stripe status to workspace account state.
4. Implement customer portal behavior.
5. Review refund/payment terms legally.

## Data Operations

- Use managed Postgres through `DATABASE_URL`.
- Provider can be Supabase Postgres, Neon, or another compatible provider.
- Do not describe the app as using Supabase Auth.
- Do not ask pilot customers for passwords, customer lists, contracts, sensitive personal data, or private financials.
