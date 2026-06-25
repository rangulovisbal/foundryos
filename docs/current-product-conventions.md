# Current Product Conventions

Last updated: 2026-06-25

## Product Framing

- FoundryOS is a founder-assisted marketing diagnosis and 30-day marketing planning product for early-stage businesses during pilot validation.
- Safe public promise: diagnose what is missing in marketing and turn that into a clear 30-day action plan.
- Public CTA should prioritize request access / join pilot and `Log in`.
- Signup should be framed for invited/manual pilot users until self-serve launch is intentionally re-enabled.
- Restricted signup remains available through `ACCESS_MODE=invite` plus `SIGNUP_ACCESS_TOKEN`.
- Do not claim autonomous business intelligence, live website crawling, live social analysis, or guaranteed commercial outcomes.
- Evidence is user-entered and profile-based unless a specific integration is explicitly implemented.

## Naming

- Public product name: `FoundryOS`.
- Public core package name: `FoundryOS Core`.
- Internal workspace plan key `growth-os` remains compatibility-only.
- Avoid public names: `AI Growth OS`, `AI Snapshot`, `AI Operator`.
- Public plan names should be `FoundryOS Starter`, `FoundryOS Core`, and `FoundryOS Assisted`.

## Customer App IA

Primary path:

1. Create account and workspace.
2. Complete marketing profile.
3. Run marketing diagnosis.
4. Generate 30-day plan.
5. Review supporting assets and routines.
6. Upgrade from Billing when Stripe checkout is configured.

Navigation groups:

- Primary path: Dashboard, Marketing profile, Marketing diagnosis, 30-day plan.
- Supporting materials: Priority list, Marketing assets, Marketing routines.
- Account: Team, Billing, Support.

## Intake And Output Conventions

- Profile intake should favor structured options with `Other` support, plus free text where nuance matters.
- Website and channel URLs are optional; placeholders like `NA`, `N/A`, `none`, and `-` should not be stored as URLs.
- Public intake must not require monthly revenue or private financials.
- Safe commercial context is optional pricing/ticket model and high-level business stage.
- `/api/snapshot` remains an initial draft preview and should keep `outputStatus: "draft_preview"` plus `X-FoundryOS-Output-Status: draft-preview`.
- Customer-facing output should recommend marketing and measurement practices, not implementation stack choices.
- Do not recommend Next.js, Vercel, Postgres, Stripe, PostHog, n8n, Supabase, or Neon as small-business marketing actions.

## Agentic Layer

- `/api/diagnosis` is authenticated and workspace-bound.
- It reads the saved business profile, applies a 5/hour per-user generation limit, tries Anthropic, validates output with Zod, encrypts the stored result with `ENCRYPTION_KEY`, and persists metadata in Postgres.
- If Anthropic is unavailable or returns unusable output, `/api/diagnosis` must fall back to the FoundryOS deterministic strategist output instead of blocking the customer flow.
- Every `/api/diagnosis` run must also create a compatible `diagnostic_results` record so roadmap, 30-day plan, assets, and SOP generation keep working from the latest diagnosis.
- The deterministic diagnosis/planning modules remain in place as the compatibility and evidence layer. Do not refactor them casually.

## Operational Guardrails

- Auth is custom DB-backed auth, not Supabase Auth.
- Postgres via `DATABASE_URL` is canonical.
- Durable rate limiting uses `rate_limit_hits`; buckets are HMAC-hashed with `APP_SECRET` when present.
- Stripe checkout is enabled only when `ENABLE_STRIPE_CHECKOUT=true`, Stripe credentials exist, plan price IDs are configured, and the webhook is deployed.
- Support and deletion requests are tracked in-product but remain manual-review flows.
