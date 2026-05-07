# System Architecture

## Product Layers

### 1. Acquisition Layer

- Landing page
- Pricing / assisted pilot access page
- SEO primitives
- Lead capture
- Optional Cloudflare Turnstile

### 2. Auth And Workspace Layer

- Custom email/password auth
- Email verification and password reset
- HTTP-only session cookies
- Workspace, membership, invitation, role, plan, and account-state tables
- One primary workspace per normal user during pilot

### 3. Truth And Diagnosis Layer

- Workspace business profile
- Founder-entered evidence
- Deterministic diagnostic engine
- Confidence and evidence-quality propagation
- Persisted diagnostic job/result history

### 4. Planning Layer

- 30-day marketing plan
- Supporting priority list
- Action cards
- Weekly plan structure

### 5. Supporting Output Layer

- Marketing asset drafts
- Customer-facing marketing routines
- Source references
- Output feedback capture

### 6. Operations Layer

- Internal admin login
- Workspace/customer visibility
- Job history
- Support and deletion request queues
- Account-state controls
- Audit logs

### 7. Future Commercial And Integration Layer

- Stripe checkout and webhook path
- Customer portal
- Billing-driven provisioning
- GA4/Search Console evidence
- CRM/funnel evidence import
- LLM refinement layer
- Automation/agentic layer after workflow validation

## Data Runtime

- Canonical remote persistence: Postgres via `DATABASE_URL`
- Supported providers: Supabase Postgres, Neon, or compatible managed Postgres
- Local development fallback: embedded PGlite
- Legacy marketing lead/subscription fallback: local JSON only where explicitly used

## Legacy Internal Keys

- The internal workspace plan key `growth-os` remains for database and entitlement compatibility only.
- Public UI and customer-facing docs must call that package `FoundryOS Core`.
- The env var `STRIPE_PRICE_GROWTH_OS` remains compatibility-only while Stripe is disabled.
- `AI Growth OS`, `AI Snapshot`, and `AI Operator` must not be used as public product or plan names.

## Current Integration Decisions

- Stripe exists in code but is disabled unless `ENABLE_STRIPE_CHECKOUT=true`.
- OpenAI helper exists but is disabled unless `ENABLE_LLM_SNAPSHOT_REFINEMENT=true`.
- Supabase Auth is not used.
- PostHog server-side events are optional.
- Resend is used for email only when configured.

## Scaling Decisions Already Reflected

- Generated outputs are persisted as structured records, not raw one-off text.
- Jobs have queued/processing/completed/failed states.
- Account states protect locked/read-only workspaces.
- Admin gets feedback, support/deletion, and failed-job visibility.
- The deterministic truth layer keeps weak evidence from becoming overconfident output.

## Next Evolution Points

1. Align docs and public copy with assisted-pilot reality.
2. Add copy/export controls for reviewed outputs.
3. Replace or formalize bootstrap-token admin.
4. Add production-grade distributed rate limiting.
5. Add Stripe provisioning only after paid pilot workflow is designed.
6. Add first evidence integrations after 3-5 pilots prove which evidence matters.
