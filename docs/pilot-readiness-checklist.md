# PILOT READINESS CHECKLIST

---

## SECTION A — Tasks that ONLY Ricardo can do

These require your credentials, accounts, DNS access, or personal judgment.
Complete them in the order listed — later tasks depend on earlier ones.

---

### A1. Configure environment variables in Vercel

**What:** Set all required environment variables in the Vercel project dashboard so the production deployment can connect to Supabase, Neon, OpenAI, Resend, Turnstile, and PostHog.

**How:**
1. Go to [vercel.com](https://vercel.com) > your project > Settings > Environment Variables.
2. Add each variable below for the **Production** environment. Copy values from your local `.env.local` or from each service's dashboard.

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_APP_URL` | Your canonical production URL (e.g. `https://foundryos.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API (keep secret) |
| `DATABASE_URL` | Neon dashboard > Connection Details (use pooled connection string) |
| `OPENAI_API_KEY` | OpenAI dashboard > API Keys |
| `RESEND_API_KEY` | Resend dashboard > API Keys |
| `RESEND_FROM_EMAIL` | The verified sender address (e.g. `ricardo@foundryos.app`) |
| `RESEND_TO_EMAIL` | Internal notification recipient (your personal email) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog dashboard > Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` (or your PostHog host) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare dashboard > Turnstile |
| `TURNSTILE_SECRET_KEY` | Cloudflare dashboard > Turnstile |
| `ADMIN_ACCESS_TOKEN` | Generate a strong random string (e.g. `openssl rand -hex 32`) |
| `AUTH_PREVIEW_LINKS` | Set to `false` (see A4) |
| `INTERNAL_ADMIN_EMAILS` | Your email address (comma-separated if multiple) |

3. Do NOT set Stripe variables (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`) in production yet. Checkout must remain inactive for the pilot.

**How to verify:** After deploying, visit `https://[your-domain]/api/health` and check the response. Also verify that signup sends a real verification email.

**Estimated time:** 30–45 minutes.

---

### A2. Verify sending domain in Resend (DNS: SPF, DKIM, DMARC)

**What:** Configure your domain so that transactional emails (verification, password reset) actually arrive in the recipient's inbox instead of spam.

**How:**
1. Go to [resend.com/domains](https://resend.com/domains) and click "Add Domain".
2. Enter your domain (e.g. `foundryos.app`).
3. Resend will show you DNS records to add. You need to add these in your domain registrar (e.g. Namecheap, Cloudflare, Google Domains):

   **SPF** — TXT record:
   - Host: `@` (or root)
   - Value: `v=spf1 include:send.resend.com ~all`
   - If you already have an SPF record, add `include:send.resend.com` to the existing record.

   **DKIM** — CNAME records:
   - Resend will give you 3 CNAME records. Add all three exactly as shown.

   **DMARC** — TXT record:
   - Host: `_dmarc`
   - Value: `v=DMARC1; p=none; rua=mailto:ricardo@[your-domain]`
   - Start with `p=none` (monitoring only). You can tighten to `p=quarantine` later.

4. Wait for DNS propagation (usually 5–30 minutes, can take up to 48 hours).
5. Go back to Resend and click "Verify". All three checks (SPF, DKIM, DMARC) must show green.

**How to verify:** Send a test email from the Resend dashboard to your personal Gmail. Check that it arrives in the inbox (not spam) and that the "from" address shows your domain.

**Estimated time:** 20–30 minutes (plus DNS propagation wait).

---

### A3. Apply migrations 0006–0010 in production database

**What:** Run the SQL migration files against your Neon production database so that the SOPs, support requests, user language, and evidence intake tables exist.

**How:**
1. Get your production `DATABASE_URL` from the Neon dashboard.
2. From the repo root, run:
   ```bash
   DATABASE_URL="your-production-connection-string" npx drizzle-kit push
   ```
   This will compare the current schema with the production database and apply any pending changes.

3. Alternatively, if you prefer to run the SQL files manually:
   - Go to the Neon dashboard > SQL Editor.
   - Open and run each file in order:
     - `drizzle/0006_sops.sql`
     - `drizzle/0007_sop_idempotency.sql`
     - `drizzle/0008_support_requests.sql`
     - `drizzle/0009_user_language.sql`
     - `drizzle/0010_evidence_intake.sql`

**How to verify:** In the Neon SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
You should see the SOP-related tables, support_requests, and any evidence-related tables.

**Estimated time:** 10–15 minutes.

---

### A4. Verify AUTH_PREVIEW_LINKS=false in production

**What:** Ensure that authentication preview links (which show magic links in the browser instead of sending emails) are disabled in production. This is a security requirement.

**How:**
1. In Vercel > your project > Settings > Environment Variables, check that:
   - `AUTH_PREVIEW_LINKS` is set to `false`, OR
   - `AUTH_PREVIEW_LINKS` is not set at all (the code defaults to blocking preview links in production).
2. The code in `src/lib/env.ts` already blocks preview links when `VERCEL_ENV=production`, but setting the variable explicitly is a safety net.

**How to verify:** In production, try to sign up with a test email. You should NOT see a preview link in the browser. You should receive an actual email.

**Estimated time:** 5 minutes.

---

### A5. Verify NEXT_PUBLIC_APP_URL points to canonical HTTPS domain

**What:** Make sure the app URL variable points to your real production domain with HTTPS, not to a Vercel preview URL or localhost.

**How:**
1. In Vercel > Environment Variables, confirm `NEXT_PUBLIC_APP_URL` is set to `https://[your-domain]` (e.g. `https://foundryos.app`).
2. Check that `src/lib/site.ts` fallback URL is acceptable (currently falls back to `https://ai-growth-os-virid.vercel.app`). If you have a custom domain, the env var will override this.

**How to verify:** After deploying, check that email verification links and password reset links contain your canonical domain, not `localhost` or a random Vercel URL.

**Estimated time:** 5 minutes.

---

### A6. End-to-end manual test: auth flow

**What:** Walk through every auth flow on the production deployment to confirm they work with real emails.

**How:**
1. **Signup:** Go to `/signup`, create an account with a real email. Verify you receive the verification email.
2. **Verify email:** Click the verification link. Confirm it redirects correctly and your account is verified.
3. **Login:** Go to `/login`, log in with your credentials. Confirm you land on the app.
4. **Logout:** Click logout. Confirm you're redirected to the landing page.
5. **Forgot password:** Go to `/forgot-password`, enter your email. Verify you receive the reset email.
6. **Reset password:** Click the reset link, set a new password. Confirm you can log in with it.

**How to verify:** All 6 steps complete without errors. Emails arrive within 60 seconds.

**Estimated time:** 15–20 minutes.

---

### A7. End-to-end manual test: full product flow

**What:** Walk through the entire product flow to confirm every module renders and generates output correctly.

**How:**
1. Log in to production.
2. **Create workspace:** Go through the workspace setup flow.
3. **Complete business profile:** Fill in all profile fields with realistic test data for a small business you know well.
4. **Run diagnostics:** Click the diagnostics button. Confirm the scorecard, risks, opportunities, and next actions render.
5. **Generate roadmap:** Navigate to the roadmap module and generate. Confirm it renders.
6. **Generate plan (30 days):** Navigate to actions/plan and generate. Confirm it renders.
7. **Generate assets:** Navigate to assets and generate. Confirm it renders.
8. **Generate SOPs:** Navigate to SOPs and generate. Confirm it renders.

**How to verify:** All modules produce output without errors. The output reflects the profile data you entered (not generic filler).

**Estimated time:** 30–45 minutes.

---

### A8. Update .env.example with missing variables

**What:** The `.env.example` file is missing two variables that the code uses. Add them so future setup is clear.

**How:**
1. Open `.env.example` in the repo root.
2. Add these two lines:
   ```
   AUTH_PREVIEW_LINKS=false
   INTERNAL_ADMIN_EMAILS=
   ```
3. Save the file.

**How to verify:** Open the file and confirm both variables are listed.

**Estimated time:** 2 minutes.

---

### A9. Create a minimal README.md at the repo root

**What:** The repo currently has no README. A minimal one helps if anyone else needs to understand the project at a glance.

**How:**
1. Create `README.md` in the repo root with at minimum:
   - Project name: FoundryOS
   - One-line description: "MVP B2B SaaS for operational diagnostics, prioritization, and 30-day action plans for small businesses."
   - How to run locally: `cp .env.example .env.local`, fill in values, `npm install`, `npm run dev`
   - How to check quality: `npm run typecheck && npm run lint && npm run build`
2. Keep it short. 20 lines is enough.

**How to verify:** The file exists and `cat README.md` shows the content.

**Estimated time:** 5 minutes.

---

### A10. Legal structure — DEFERRED

**Decision (2026-04-28):** The first pilot is free. No legal entity, no invoicing, no alta de autonomo needed. Legal structure (autonomo vs SL) and gestoria selection will be revisited for the second or third pilot, when paid engagements begin.

**No action required for the first pilot.**

---

## SECTION B — Tasks already done or that Claude Code will handle

These are things you do NOT need to worry about. They're either complete or will be done in the technical phase.

| Task | Status |
|------|--------|
| Core diagnostics engine | Done — `src/lib/diagnostics.ts` |
| Roadmap generation | Done — `src/lib/planning.ts` |
| 30-day action plan generation | Done — `src/lib/planning.ts` |
| Asset generation | Done — `src/lib/assets.ts` |
| SOP generation | Done — `src/lib/sops.ts` |
| Downstream trust/confidence propagation | Done — `src/lib/downstream-trust.ts` |
| Evidence-backed intake flow | Done — `src/components/business-profile-form.tsx` |
| Auth flows (signup, verify, login, logout, reset) | Done — full flow in place |
| Security hardening (preview links, rate limiting, CSRF) | Done — commit `deae7e6` |
| Database migrations 0000–0010 | Done — SQL files ready to apply |
| Workspace setup flow | Done |
| Admin panel | Done |
| Legal pages (terms, privacy, cookies, subprocessors) | Done |
| PostHog analytics (no PII) | Done |
| Pilot feedback backend (output_feedback table + API + UI) | Planned — Phase 4 |
| TypeScript, lint, build checks | All passing as of audit |
