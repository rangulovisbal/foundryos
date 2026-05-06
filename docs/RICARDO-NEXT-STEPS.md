# Ricardo Next Steps

## Current Strategic Direction

FoundryOS is the definitive product name.

The next operating pass should follow this order:

1. Pilot-safe fixes first.
2. Assisted pilot execution.
3. Commercial launch preparation.
4. Automation, AI-assisted refinement, and agentic layers later.

## Before First Assisted Pilot

1. Confirm production/preview `DATABASE_URL` using managed Postgres.
2. Configure `NEXT_PUBLIC_APP_URL=https://ai-growth-os-virid.vercel.app`.
3. Configure Resend sender domain for `foundryos.online`.
4. Set `AUTH_PREVIEW_LINKS=false`.
5. Set `ENABLE_STRIPE_CHECKOUT=false`.
6. Set `ENABLE_LLM_SNAPSHOT_REFINEMENT=false`.
7. Set `ADMIN_ACCESS_TOKEN` and `INTERNAL_ADMIN_EMAILS`.
8. Run the full product test:
   - signup
   - verification
   - login
   - workspace setup
   - business profile
   - diagnostics
   - 30-day plan
   - assets
   - routines
   - feedback
   - support request
   - admin review

## Pilot Session Preparation

- Pick a founder-led project with a real offer and no internal marketing team.
- Use guided intake.
- Review all generated outputs before relying on them.
- Focus the review session on the 30-day plan.
- Capture whether the customer says the output reflects their situation and gives them one action they can take this week.

## Do Not Do Yet

- Do not enable public checkout.
- Do not sell self-serve SaaS.
- Do not position FoundryOS as autonomous AI or agentic automation.
- Do not ask for sensitive customer data.
- Do not choose a narrow vertical wedge until 3-5 comparable pilots are complete.
