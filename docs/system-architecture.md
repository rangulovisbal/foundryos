# System Architecture

## Product Layers

### 1. Acquisition Layer

- Landing page
- Pricing page
- SEO primitives
- Lead/contact capture
- Optional Cloudflare Turnstile

### 2. Auth And Workspace Layer

- Custom email/password auth
- Email verification and password reset
- HTTP-only session cookies
- Workspace, membership, invitation, role, plan, and account-state tables
- `ACCESS_MODE=self_serve` by default; optional invite-token restriction

### 3. Truth And Diagnosis Layer

- Workspace business profile
- User-entered evidence
- Deterministic diagnostic engine
- Authenticated `/api/diagnosis` agentic endpoint
- Persisted diagnostic job/result history plus encrypted agentic records

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

### 6. Billing And Operations Layer

- Internal admin login
- Workspace/customer visibility
- Stripe checkout through `/api/billing/checkout`
- Stripe webhook updates workspace plan/account state when metadata is present
- Support and deletion request queues
- Account-state controls
- Audit logs

## Data Runtime

- Canonical remote persistence: Postgres via `DATABASE_URL`
- Supported providers: Supabase Postgres, Neon, or compatible managed Postgres
- Local development fallback: embedded PGlite
- Durable rate limiting: `rate_limit_hits`
- Agentic persistence: `agentic_diagnoses` with encrypted output ciphertext

## Legacy Internal Keys

- The internal workspace plan key `growth-os` remains for database and entitlement compatibility only.
- Public UI and customer-facing docs must call that package `FoundryOS Core`.
- `STRIPE_PRICE_GROWTH_OS` and `STRIPE_PRICE_OPERATOR` remain compatibility fallbacks for `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ASSISTED`.
- `AI Growth OS`, `AI Snapshot`, and `AI Operator` must not be used as public product or plan names.

## Current Integration Decisions

- Anthropic powers `/api/diagnosis` when `ANTHROPIC_API_KEY` is configured.
- `FOUNDRYOS_MODEL` defaults to `claude-sonnet-4-6`.
- Stripe checkout is active only when `ENABLE_STRIPE_CHECKOUT=true` and credentials/price IDs are configured.
- Supabase Auth is not used.
- PostHog server-side events are optional.
- Resend is used for email only when configured.

## Security Decisions

- `APP_SECRET` signs rate-limit bucket hashes.
- `ENCRYPTION_KEY` encrypts stored agentic diagnosis outputs.
- CSP uses per-request nonce and avoids `unsafe-inline` / `unsafe-eval`.
- Production readiness requires valid env, email, migrations, webhook, and end-to-end verification.
