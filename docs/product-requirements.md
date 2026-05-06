# Product Requirements

## Objective

Build a web app that supports a free, founder-assisted design-partner pilot for FoundryOS.

The app should capture business context, generate a deterministic marketing diagnosis, turn that diagnosis into a clear 30-day marketing plan, and support founder review before customers rely on the outputs.

## Primary User

Founder or operator of an early-stage small business or founder-led project with a real offer and no internal marketing team.

## Jobs To Be Done

1. Understand what is missing in the current marketing setup.
2. See the most important bottlenecks without overconfident claims.
3. Get a clear 30-day marketing plan.
4. Act on at least one useful step this week.
5. Give feedback on whether the output reflects the real situation.

## MVP Modules

### 1. Public Site

- Home
- Pricing / assisted pilot request-access surface
- Security
- Legal pages
- Lead/request form

### 2. Auth And Workspace

- Signup, verification, login, logout, password reset
- Workspace creation
- Role-aware team invitations
- One primary workspace for normal pilot users

### 3. Business Profile

- Company and offer context
- Audience
- Website/social links if available
- CTA
- Pricing model
- Acquisition method
- Sales process
- Goals
- Bottlenecks
- Customer feedback and non-sensitive evidence notes
- Primary output language

### 4. Deterministic Diagnosis

- Marketing maturity score
- Category scores
- Risks, opportunities, bottlenecks, and next actions
- Evidence quality and confidence
- Explicit missing/weak/contradictory evidence handling

### 5. 30-Day Plan

- Monthly objective
- Weekly actions
- Quick wins
- Metrics to watch
- Risks to avoid
- Success signals

### 6. Supporting Materials

- Priority list
- Assets
- Customer-facing marketing routines
- Feedback widget

### 7. Admin / Ops

- Workspace visibility
- Job history
- Output feedback
- Support/deletion queues
- Manual account-state controls
- Audit logs

## Requirements

- The first pilot must be assisted, free, and manually reviewed.
- Stripe checkout must remain disabled until billing and provisioning are verified.
- The core generation path must remain deterministic during the first pilot.
- LLM refinement must require explicit opt-in and must not replace the deterministic truth layer.
- PostgreSQL via `DATABASE_URL` is the canonical persistence model.
- Supabase Auth should not be described as active.
- The app must support English and Spanish as primary workspace languages.
- The system must avoid asking for sensitive data during the first pilot.

## Out Of Scope For First Pilot

- Public self-serve paid provisioning
- Billing portal
- Stripe as entitlement source of truth
- Live CRM/analytics/ad integrations
- Website crawling or external verification
- Agentic background automation
- Automatic data deletion from the customer UI
- Mobile app
