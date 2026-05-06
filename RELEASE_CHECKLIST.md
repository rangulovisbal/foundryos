# RELEASE CHECKLIST

## Pilot-Safe Fixes

Status: In progress

- [x] Product name is `FoundryOS`.
- [x] Public copy avoids `AI Growth OS` as product name.
- [x] Stripe checkout requires explicit `ENABLE_STRIPE_CHECKOUT=true`.
- [x] LLM refinement requires explicit `ENABLE_LLM_SNAPSHOT_REFINEMENT=true`.
- [x] Core diagnostics and planning remain deterministic.
- [x] Postgres via `DATABASE_URL` is the canonical persistence concept.
- [ ] Production dependency audit has no unresolved direct or avoidable transitive advisories.
- [ ] Public copy reviewed once more for pilot-safe claims.
- [ ] Spanish primary path reviewed manually with a real pilot profile.

## Assisted Pilot Readiness

Status: Partial

- [x] Free assisted pilot positioning is documented.
- [x] Authenticated users can create a workspace.
- [x] Business profile, diagnostics, 30-day plan, assets, and routines exist.
- [x] Output feedback is captured.
- [x] Support and deletion requests are logged for manual review.
- [x] Admin can review workspaces, jobs, requests, feedback, and account states.
- [ ] Production `DATABASE_URL` confirmed.
- [ ] Resend sender domain and inbox delivery confirmed.
- [ ] Canonical URL confirmed as `https://ai-growth-os-virid.vercel.app` for now.
- [ ] First assisted pilot script rehearsed end to end.
- [ ] Founder review checklist for generated outputs completed.

## Billing Readiness

Status: Not ready

- [x] Plan definitions exist in code.
- [x] Stripe checkout and webhook skeleton exist.
- [x] Checkout is hard-disabled unless explicitly enabled.
- [ ] Stripe products and prices confirmed.
- [ ] Success/cancel routing designed for scheduled onboarding/manual invite.
- [ ] Webhook maps paid status to workspace provisioning and account states.
- [ ] Customer portal behavior implemented.
- [ ] Stripe drives entitlements as source of truth.
- [ ] Refund/payment terms reviewed legally.

## Legal Readiness

Status: Pilot-only

- [x] Terms page exists.
- [x] Privacy page exists.
- [x] Cookie page exists.
- [x] Subprocessors page exists.
- [x] Deletion requests are framed as manual review.
- [ ] Lawyer review before paid pilots.
- [ ] Refund/payment terms before paid pilots.
- [ ] DPA basics before paid pilots.
- [ ] NDA/light consent decided for free assisted pilots.

## Security Readiness

Status: Partial

- [x] HTTP-only session cookies.
- [x] Email verification flow.
- [x] Password reset with session invalidation.
- [x] Route guards for `/app/*`.
- [x] Route guards for `/admin/*`.
- [x] Account-state lock/read-only handling.
- [x] Admin audit logging.
- [x] Optional Turnstile on lead capture.
- [ ] Distributed production rate limiting.
- [ ] Admin bootstrap-token flow replaced or formally accepted for pilot.
- [ ] Secret rotation runbook.
- [ ] Backup and restore runbook.

## Product Readiness

Status: Pilot usable, not self-serve SaaS

- [x] Public preview surface.
- [x] Auth and workspace foundation.
- [x] Business profile module.
- [x] Deterministic diagnostics module.
- [x] 30-day plan module.
- [x] Supporting priority list.
- [x] Supporting assets.
- [x] Customer-facing marketing routines.
- [x] Team page.
- [x] Billing preview page.
- [x] Support page.
- [ ] Copy/export deliverables.
- [ ] Monthly refresh product workflow.
- [ ] Workspace switcher for multi-workspace users.
- [ ] Live integrations.

## Launch Gate

Do not call FoundryOS commercially launched until all of these are true:

- 3-5 assisted pilots show repeated value.
- The winning wedge is clearer than the current broad ICP.
- Paid onboarding is scheduled/manual-invite or fully provisioned by Stripe.
- Legal/payment terms are reviewed.
- Production database, email, backup, and admin access are verified.
- Public copy no longer implies self-serve SaaS, live billing, autonomous analysis, or live integrations ahead of reality.
