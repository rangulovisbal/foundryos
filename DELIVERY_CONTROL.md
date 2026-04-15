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

- Roadmap module
- Assets module
- SOPs module
- Automations module
- Integrations module
- Insights/reporting module
- Notifications center
- Support center

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

Implement the next real workspace-scoped product module:

`Diagnostic-to-roadmap operating plan`

That slice should include:

- a workspace roadmap generated from the latest diagnostic result
- persisted roadmap items with owner, priority, status, and due window
- role-aware roadmap updates
- plan-gated roadmap access
- admin visibility into roadmap creation status
- preview-safe labels that avoid claiming full automation is live
