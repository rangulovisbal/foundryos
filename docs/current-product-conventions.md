# Current Product Conventions

Last updated: 2026-05-07

## Product Framing

- FoundryOS v1 is a marketing diagnosis and 30-day marketing planning tool for early-stage businesses.
- Safe public promise: diagnose what is missing in marketing and turn that into a clear 30-day action plan.
- Public access is assisted-pilot first, not open self-serve SaaS.
- The primary public CTA should be request access / join pilot. Login stays visible for existing or invited pilot users.
- Signup routes may remain available for invited users or manual onboarding, but should not be presented as the main public CTA.
- Do not claim autonomous business intelligence, live website crawling, live social analysis, or agentic execution.
- Evidence is founder-entered and profile-based unless a specific integration is explicitly implemented.

## Naming

- Public product name: `FoundryOS`.
- Public core package name: `FoundryOS Core`.
- Internal workspace plan key `growth-os` remains compatibility-only.
- Avoid public names: `AI Growth OS`, `AI Snapshot`, `AI Operator`.
- If snapshot/package tiers are shown publicly, use marketing-safe names such as `Marketing Snapshot`, `FoundryOS Core`, and `Marketing Operator`.

## Customer App IA

Primary pilot path:

1. Complete marketing profile.
2. Run marketing diagnosis.
3. Generate 30-day plan.
4. Review supporting materials.

Navigation groups:

- Primary path: Dashboard, Marketing profile, Marketing diagnosis, 30-day plan.
- Supporting materials: Priority list, Marketing assets, Marketing routines.
- Account: Team, Billing, Support.

Route names remain unchanged for compatibility:

- `/app/profile`
- `/app/diagnostics`
- `/app/roadmap`
- `/app/actions`
- `/app/assets`
- `/app/sops`
- `/app/support`

## Intake And Output Conventions

- Profile intake should favor structured options with `Other` support, plus free text where nuance matters.
- Website and channel URLs are optional; placeholders like `NA`, `N/A`, `none`, and `-` should not be stored as URLs.
- Missing website is missing evidence, not a blocking error.
- Public/pilot intake should not require monthly revenue or private financials.
- Safe public commercial fields are optional pricing/ticket model and optional broad typical order/project value.
- Public Snapshot output should be labeled as an initial draft preview until founder review is complete.
- `/api/snapshot` draft-preview responses should keep `outputStatus: "draft_preview"` and `X-FoundryOS-Output-Status: draft-preview`.
- Diagnosis should surface "what to fix first" before deep evidence detail.
- Customer-facing output should recommend marketing and measurement practices, not FoundryOS implementation stack choices.
- Deep evidence, reasoning, histories, legal/deletion flows, and technical details should be available but visually secondary.

## Operational Guardrails

- Auth is custom DB-backed auth, not Supabase Auth.
- Stripe checkout remains disabled for pilot unless explicitly enabled.
- `ENABLE_STRIPE_CHECKOUT=false` is the safe pilot default.
- `ENABLE_LLM_SNAPSHOT_REFINEMENT=false` is the safe pilot default unless reviewed output refinement is intentionally enabled.
- Support and deletion requests are tracked in-product but remain manual-review flows.
- Admin/founder controls should preserve founder recovery access and avoid blocking the internal admin from managing test/demo/client state.
