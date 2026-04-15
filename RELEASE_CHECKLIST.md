# RELEASE CHECKLIST

## Infrastructure readiness

Status: Partial

- [x] Next.js app builds cleanly
- [x] Auth/workspace state persists in a real database path
- [x] Local development works without a remote database via embedded PGlite
- [x] Preview/production can use a remote `DATABASE_URL`
- [ ] Preview environment confirmed with remote database configured
- [ ] Production environment confirmed with remote database configured
- [ ] Backup, restore, and DB maintenance plan documented
- [ ] Deployment rollback/runbook documented

## Billing readiness

Status: Not ready

- [x] Plans exist in code
- [x] Account states exist in code
- [x] Usage counters exist in code
- [x] Stripe checkout and webhook skeleton exist
- [ ] Stripe products and prices confirmed
- [ ] Stripe webhook secrets configured in preview/production
- [ ] Billing portal/customer lifecycle implemented
- [ ] Stripe drives entitlement state as source of truth
- [ ] Public UI audited to avoid any false live-billing claim

## Legal readiness

Status: Not ready

- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Cookie Policy page
- [ ] Refund/fulfillment policy
- [ ] Data Processing Addendum
- [ ] Subprocessors page
- [ ] Founder review on claims, billing, and support language

## Security readiness

Status: Partial

- [x] HTTP-only session cookies
- [x] Email verification flow
- [x] Password reset flow with session invalidation
- [x] Route guards for `/app/*`
- [x] Route guards for `/admin/*`
- [x] Workspace account-state lock/read-only handling
- [x] Admin audit logging for workspace state changes
- [x] Optional Turnstile support on lead capture
- [ ] Formal secret rotation/runbook
- [ ] Production review of admin bootstrap-token flow
- [x] `APP_SECRET` and `ENCRYPTION_KEY` removed from the required-env list

## Product readiness

Status: Foundation only

- [x] Public preview surface
- [x] Auth and workspace foundation
- [x] Team and billing preview pages
- [x] Admin foundation
- [x] Business profile module
- [x] Diagnostics module with persisted runs
- [ ] Roadmap module
- [ ] Assets module
- [ ] SOPs module
- [ ] Integrations module

## Support readiness

Status: Not ready

- [ ] Help center surface
- [ ] Support intake path
- [ ] Escalation workflow
- [ ] Internal support runbook
- [ ] Support SLA/pilot expectations defined

## Analytics readiness

Status: Not ready

- [x] PostHog env placeholders exist
- [ ] Product analytics events implemented
- [ ] Funnel events implemented
- [ ] Admin visibility into usage analytics
- [ ] Consent/privacy review for analytics

## Pilot readiness

Status: Partial

- [x] Authenticated users can create a workspace
- [x] Team invitation flow works
- [x] Admin can manually move plan/account state
- [x] Suspended/canceled-style access handling is implemented
- [ ] Founder-facing pilot onboarding checklist
- [ ] Remote preview DB confirmed
- [ ] Resend configured for real invite/verification emails
- [ ] Pilot script for workspace creation and recovery

## Launch readiness

Status: No

- [x] Controlled MVP preview is usable internally
- [ ] Commercial launch billing is ready
- [ ] Legal pages are live
- [ ] Analytics are live
- [ ] Support is live
- [ ] Founder claims/copy audit is complete
- [x] Brand/name consistency is resolved for user-facing copy
- [ ] All production env vars are configured and verified

## Release gate

Do not call this commercially launched until all of the following are true:

- remote production database is configured and verified
- live billing is intentionally enabled and tested
- legal pages are published
- founder-side support and analytics decisions are completed
- public copy is audited to remove preview-only inconsistencies
