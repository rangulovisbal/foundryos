# DELIVERY CONTROL

## Current project phase

FoundryOS is currently in a controlled MVP preview phase.

- The public marketing surface is live as a preview.
- The internal authenticated product foundation is implemented.
- Billing is modeled but not live.
- Legal, support, analytics, and product modules beyond the foundation are still incomplete.
- The product name is now `FoundryOS`.
- Some compatibility identifiers still use `growth-os` internally for the existing plan key and Stripe env var mapping.

## What is already shipped

### Public preview

- Marketing homepage at `/`
- Pricing page at `/pricing`
- Snapshot onboarding intake at `/onboarding`
- Sample output page at `/dashboard`
- Security and trust page at `/security`
- SEO surfaces: `robots.txt`, `sitemap.xml`, favicon, metadata

### Auth and workspace foundation

- Email/password signup
- Email verification flow
- Login and logout
- Forgot password and reset password
- Session persistence with HTTP-only cookies
- Protected `/app/*` routes
- Protected `/admin/*` routes
- One workspace creation on first entry
- Workspace membership model
- Invitation flow by email
- Role-aware team management UI and guards
- Account-state-aware UI and locked/read-only handling
- Workspace plan entitlements and usage counters
- Workspace business profile persistence
- Structured diagnostics with persisted job history
- Structured roadmap generation from the latest successful diagnostic result
- Structured action plan and 30-day plan generation from profile, diagnostics,
  roadmap, and workspace context
- Structured asset generation from the latest profile, diagnostics, roadmap,
  actions, 30-day plan, and workspace context
- SOP generation from the latest business profile, diagnostics, roadmap,
  30-day plan, and asset context
- Authenticated support FAQ, support request intake, and tracked account/workspace
  deletion requests

### Internal admin foundation

- Bootstrap-token internal admin login at `/admin/login`
- Admin overview at `/admin`
- Workspace plan and account-state editing for testing
- Admin audit logging for workspace state changes

### Data and integrations already wired in code

- Database-backed auth/workspace persistence through Drizzle
- Embedded Postgres-compatible dev database when `DATABASE_URL` is absent in local development
- Remote database path for preview/production when `DATABASE_URL` is present
- Lead capture API and lead storage
- Stripe checkout route and webhook skeleton
- OpenAI-enhanced snapshot refinement path
- Resend email delivery support
- Cloudflare Turnstile support on lead capture

## What is still missing

### Product modules

- SOPs module
- Automations module
- Integrations module
- Insights/reporting module
- Notifications center
### Commercial readiness

- Live Stripe billing and entitlements as source of truth
- Billing portal and subscription lifecycle management
- Legal pages: Terms, Privacy, Cookie, Refund, DPA, Subprocessors
- Support operations and SLA surface
- Analytics instrumentation beyond env readiness

### Operational hardening still needed

- Workspace switcher for multi-workspace users
- Formal admin auth replacement for bootstrap-token flow
- Production email deliverability setup
- Remote preview/production database confirmation
- Founder-facing runbooks for release gating and rollout

## Current route map

### Public routes

- `/` marketing homepage
- `/pricing` public pricing and CTA surface
- `/onboarding` public intake form
- `/dashboard` public sample dashboard
- `/security` trust/security page
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/invite/[token]`

### Authenticated product routes

- `/app`
  Redirects authenticated users into setup or workspace context.
- `/app/setup`
  Workspace creation flow for first-time authenticated users.
- `/app/dashboard`
  Authenticated MVP foundation dashboard.
- `/app/profile`
  Workspace business profile setup and saved operating context.
- `/app/diagnostics`
  Structured diagnostic runs, latest result, and persisted history.
- `/app/roadmap`
  Structured roadmap generation and persisted now/next/later roadmap history.
- `/app/actions`
  Structured action cards and persisted 30-day plan history.
- `/app/assets`
  Structured business assets, latest asset set, generation history, and source references.
- `/app/sops`
  Structured SOP generation, saved SOP artifacts, and persisted job history.
- `/app/support`
  Authenticated FAQ, support request intake, request history, and controlled deletion requests.
- `/app/team`
  Team members, invitations, and role-aware invite controls.
- `/app/billing`
  Preview billing and plan/account-state surface.

### Internal admin routes

- `/admin/login`
- `/admin`

### API routes

- `/api/health`
- `/api/leads`
- `/api/snapshot`
- `/api/checkout`
- `/api/webhooks/stripe`
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/verify-email`
- `/api/auth/workspaces`
- `/api/auth/invitations`
- `/api/auth/invitations/accept`
- `/api/app/business-profile`
- `/api/app/diagnostics/run`
- `/api/app/roadmap/generate`
- `/api/app/actions/generate`
- `/api/app/assets/generate`
- `/api/admin/login`
- `/api/admin/logout`
- `/api/admin/workspaces/[workspaceId]`

## Current integrations status

| Integration | Status | Current behavior |
| --- | --- | --- |
| Foundation database | Active in code | Local development uses embedded PGlite automatically. Preview and production require a real `DATABASE_URL`. |
| Lead storage | Active | Uses DB when available; still has legacy local JSON fallback for marketing-preview lead/subscription flows only. |
| Auth email delivery | Optional | Uses Resend when configured. Falls back to preview links outside production unless `AUTH_PREVIEW_LINKS=false`. |
| OpenAI snapshot refinement | Optional | `/api/snapshot` refines heuristic output when `OPENAI_API_KEY` is present and falls back safely if the external call fails. |
| Stripe checkout | Not launch-ready | Checkout route and webhook plumbing exist, but billing is intentionally not live. |
| Stripe webhook | Partial | Handler exists for subscription mapping, but commercial lifecycle is not fully wired. |
| Cloudflare Turnstile | Optional | Lead capture supports Turnstile if keys are configured. |
| PostHog | Not wired | Env detection exists; product analytics events are not implemented. |
| Supabase Postgres | Supported as Postgres | The production database can use a Supabase pooler connection through the standard `DATABASE_URL` path. Supabase auth/storage are not used. |

## Current data model summary

### Marketing and commercial preview tables

- `leads`
  Lead capture records from the public site.
- `subscriptions`
  Stripe-oriented subscription records for preview billing plumbing.

### Auth and workspace foundation tables

- `app_users`
  Authenticated users and global role.
- `app_sessions`
  Session tokens and expiry.
- `email_verification_tokens`
  Email verification lifecycle.
- `password_reset_tokens`
  Password reset lifecycle.
- `workspaces`
  Workspace identity, owner, plan, account state, and output language.
- `workspace_memberships`
  User-to-workspace membership and role.
- `workspace_invitations`
  Pending and accepted invite records.
- `workspace_usage_counters`
  Plan-scoped usage placeholders such as seats and refreshes.
- `workspace_business_profiles`
  Workspace-scoped business context for setup and diagnostics.
- `diagnostic_jobs`
  Persisted diagnostic run lifecycle with queued, processing, completed, and failed states.
- `diagnostic_results`
  Structured diagnostic outputs with scores, risks, bottlenecks, opportunities, actions, and evidence cards.
- `planning_jobs`
  Persisted roadmap and 30-day plan generation lifecycle with queued, processing, completed, and failed states.
- `roadmaps`
  Structured now/next/later roadmap artifacts linked to source diagnostic results.
- `action_plans`
  Structured action cards with priority, owner suggestion, status placeholder, category, and reasoning.
- `thirty_day_plans`
  Structured 30-day plan artifacts with weekly plans, priorities, risks, success signals, and metrics.
- `asset_jobs`
  Persisted business asset generation lifecycle with queued, processing, completed, and failed states.
- `business_assets`
  Structured asset artifacts linked to source profile, diagnostic, roadmap, action plan, 30-day plan, and workspace.
- `sop_jobs`
  Persisted SOP generation lifecycle with queued, processing, completed, and failed states.
- `sop_artifacts`
  Structured SOP artifacts linked to the latest planning and asset context.
- `support_requests`
  Workspace-scoped support intake records with requester, issue type, status, and review metadata.
- `deletion_requests`
  Tracked account and workspace deletion requests with review status and safety metadata.
- `admin_audit_logs`
  Admin changes to workspace plan/account state.

## Current account, billing, and auth state

### Auth

- Auth method is email/password.
- Sessions are stored server-side and persisted in `app_sessions`.
- Session cookie is HTTP-only, `SameSite=Lax`, and `__Secure-foundry_session` in production.
- Email verification is required before normal app access.
- Password reset invalidates all existing sessions for that user.

### Workspace and roles

- Workspace roles are `owner`, `admin`, `member`, `viewer`.
- Global user roles are `user` and `internal_admin`.
- Current MVP only supports one workspace per normal user.
- `/app/*` requires authentication.
- `/admin/*` requires an internal admin session.

### Account states

- Implemented states: `lead`, `trial`, `active`, `past_due`, `canceled`, `suspended`, `archived`
- `lead` cannot access the workspace app surface.
- `past_due` is treated as limited/read-only.
- `canceled`, `suspended`, and `archived` show locked-state UI instead of breaking.

### Plans and billing

- Implemented workspace plans: `snapshot`, `growth-os`, `operator`
- Plan definitions currently control feature flags and usage limits in code.
- Asset generation is feature-gated and uses the `asset_exports` counter as a
  preview generation-run limit, not a live billing meter.
- Billing state is still manual and preview-only.
- Internal admin can change plan and account state for testing.
- Stripe is not the runtime source of truth yet.

## Current known blockers

- Preview/production still need a real `DATABASE_URL`.
- Billing is not live and should not be exposed as live commerce yet.
- Legal documents are not implemented.
- Legacy compatibility names still exist for `growth-os` plan identifiers and `STRIPE_PRICE_GROWTH_OS`.
- PostHog, support, and launch operations are not yet wired.
- Admin auth still relies on a bootstrap token for MVP use.
- `APP_SECRET` and `ENCRYPTION_KEY` have been de-scoped from the active MVP environment contract.

## Next recommended slice

Harden the asset layer before moving into SOPs or automations:

`Assets Review + Export Controls`

That slice should include:

- founder/admin review controls for generated assets
- copy/export-safe Markdown or PDF output
- asset revision history and regeneration notes
- clearer source-reference review before assets become SOP input
- role-aware asset visibility and export permission checks
- preview-safe labels that avoid claiming delivery automation is live
