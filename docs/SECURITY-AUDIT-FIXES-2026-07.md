# Security & Correctness Audit — Fixes (2026-07)

End-to-end review of the FoundryOS codebase (148 source files, 33 API routes,
core libs and client components) plus the remediation of every finding.

**Status of automated gates after the fixes:** `typecheck` ✅ · `lint` ✅ ·
`build` ✅ · `npm audit --omit=dev` → 2 high remaining (see finding #5, cannot
be fixed without downgrading Next 15 → 14).

> This is a point-in-time audit report, not agent instructions. It is **not** a
> `CLAUDE.md` (that file is reserved for repo orientation / AI-agent guidance).
> Repo orientation still lives in `AGENTS.md` + `CLAUDE.md`; ongoing status
> lives in `HANDOFF.md`.

Findings are ordered least → most critical, matching how they were reported.
Each one lists the fix and the exact file(s) touched.

---

## 🔴 High

### 18. SSRF in `fetchEvidenceFromUrl` — FIXED
`src/lib/agentic/evidence.ts`

The diagnosis engine fetches the founder's website + first channel URL server-side.
The old version fetched any user-supplied URL with no host validation, followed
redirects blindly, and fed the response into both the stored evidence and the LLM
prompt — a server-side read oracle into internal network / cloud-metadata
(`169.254.169.254`, `10/8`, `127/8`, `192.168/16`, `::1`, unique-local, etc.),
plus a prompt-injection vector.

**Fix:** rewrote the module with an SSRF guard:
- `isPrivateIp()` rejects loopback, private, CGNAT, link-local (incl. cloud
  metadata), IETF-reserved, multicast, and IPv4-mapped-IPv6 ranges.
- DNS is resolved (`node:dns/promises`) and **every resolved address** must be
  public before the fetch runs.
- Redirects are followed **manually** (`redirect: "manual"`, max 3 hops) and
  **each hop is re-validated**, so a benign public page can't bounce into a
  private host.
- Only `http:`/`https:` schemes; content-type must be text/html/xml; body capped
  at 256 KB via a streaming reader; 5s timeout preserved.
- Known residual: a narrow DNS-rebinding window remains (TOCTOU between resolve
  and connect). Accepted because the fetch runs on stateless serverless infra
  with nothing internal listening; documented inline.

**Companion hardening (prompt injection):** `src/lib/agentic/engine.ts` SYSTEM
prompt now instructs the model to treat `Observed website content` evidence as
untrusted data and never follow instructions embedded in it.

### 17. `/api/auth/resend-verification` — unauthenticated with no rate limit — FIXED
`src/app/api/auth/resend-verification/route.ts`

The only email-sending route with zero throttling: a one-line loop could bomb any
unverified user's inbox, flood `email_verification_tokens`, and burn the Resend
quota.

**Fix:** added a per-IP limit (5 / 10 min) and a per-email limit (3 / hour),
mirroring the sibling auth routes, with a localized 429 + `Retry-After`.

---

## 🟠 Medium

### 16. `forgot-password` had no per-IP limit — FIXED
`src/app/api/auth/forgot-password/route.ts`

Only limited per target email (3/h). Rotating emails let an attacker spray reset
mails across the user base. **Fix:** added a per-IP limit (10 / hour) evaluated
before the per-email limit.

### 15. `getClientIp` trusted a spoofable header — FIXED
`src/lib/http.ts`

Prioritized `cf-connecting-ip`, which is **not** set by Vercel and can be forged
by any client to rotate identity and bypass every per-IP rate limit.

**Fix:** trust only platform-set headers — `x-real-ip` first, then the first hop
of `x-forwarded-for`. Dropped `cf-connecting-ip`.

### 14. In-memory rate limiting on the admin-login / leads paths — FIXED
`src/app/api/admin/login/route.ts`, `src/app/api/leads/route.ts`

These used the in-process `Map` limiter, which resets on every cold serverless
instance — near-useless against admin-token brute force.

**Fix:** switched both to the durable DB-backed `rateLimit()` (admin-login: 5 /
5 min per IP; leads: 6 / min per IP), consistent with the rest of the API.

### 13. Legacy duplicate routes, weaker protection — FIXED
- `src/app/api/checkout/route.ts` — **deleted.** Created Stripe sessions with **no
  auth** (inert only because `stripeCheckoutEnabled=false`; a landmine if Stripe
  were ever switched on). The authenticated `/api/billing/checkout` is the real one;
  it's what `checkout-button.tsx` already calls.
- `src/app/api/app/diagnostics/run/route.ts` — added IP (20/h) + user (5/h) rate
  limits. It consumes the same `diagnostic_runs` counter as `/api/diagnosis` and
  must not be the unmetered bypass. (Still referenced by
  `business-profile-form.tsx` "run from review", so kept, not deleted.)

### 12. Zero automated tests — NOT FIXED (documented)
No `*.test.*` in the repo; the whole quality gate is typecheck + lint + manual
smokes. With hand-rolled auth, crypto, and billing this is the biggest risk
multiplier, but adding a test suite is out of scope for a hardening pass.
**Recommendation:** add unit tests for `crypto`, `security`, the rate-limit paths,
the SSRF guard (`isPrivateIp`), and the Stripe webhook state machine.

---

## 🟡 Low

### 11. Stripe webhook robustness — FIXED
`src/app/api/webhooks/stripe/route.ts`, `src/db/queries.ts`, `src/db/schema.ts`,
`drizzle/0015_subscriptions_unique_sub_id.sql`

- (a) `checkout.session.completed` activated the workspace unconditionally; async
  payment methods can complete a session `unpaid`. **Fix:** only activate when
  `payment_status === "paid"`; subscription events reconcile otherwise.
- (b) No `livemode` check. **Fix:** in production, test-mode events are ignored.
- (c) `upsertSubscriptionRecord` did select-then-insert (duplicate rows under
  concurrent webhooks) and overwrote `email`/`company` with null on later events.
  **Fix:** a **partial unique index** on `stripe_subscription_id` (migration 0015)
  + an atomic `onConflictDoUpdate` upsert using `coalesce(excluded.*, existing)`
  so follow-up events never wipe checkout-provided fields.

### 10. `createUniqueWorkspaceSlug` loaded every workspace — FIXED
`src/lib/auth.ts`, `src/db/foundation.ts`

Replaced the full `listWorkspaces()` scan with an indexed `findWorkspaceBySlug()`
lookup per candidate slug (new helper).

### 9. Non-atomic usage-counter increment — FIXED
`src/db/foundation.ts`

`incrementWorkspaceUsageCounter` was read-modify-write; concurrent runs could slip
past plan limits and lose increments. **Fix:** single atomic SQL
`used_count = used_count + 1` with `RETURNING`.

### 8. Non-atomic auth-token consumption — FIXED
`src/db/foundation.ts`

`consumeEmailVerification` / `consumePasswordReset` did SELECT then DELETE, so two
concurrent requests could both consume one token. **Fix:** atomic
`DELETE ... RETURNING`.

### 7. Login rate limit allowed victim lockout — FIXED
`src/app/api/auth/login/route.ts`

The per-email bucket (5/15 min) let anyone lock a victim out by burning it from
elsewhere. **Fix:** scoped the bucket to `email + IP`, so one attacker's attempts
don't deny the real user; the per-IP limit still throttles broad attempts.

### 6. Account enumeration on signup — NOT CHANGED (deliberate)
`src/lib/errors.ts` intentionally exposes "An account already exists for this
email." This is a UX-vs-privacy trade-off, left as-is by design. Noted so it's a
conscious decision, not an oversight.

---

## 🟢 Cosmetic / trivial

### 5. Dependency vulnerabilities — PARTIALLY FIXED
- Removed unused deps `@supabase/ssr`, `@supabase/supabase-js`, `@stripe/stripe-js`
  (not imported anywhere in `src/`).
- `npm audit fix` (non-breaking) applied; cleaned up several transitive advisories.
- **Remaining (accepted):** 2 high `sharp < 0.35.0` (libvips CVE-2026-33327/8,
  35590/1), pinned transitively by `next@15`. The only "fix" is
  `npm audit fix --force`, which **downgrades Next 15 → 14.2** (major breaking) —
  rejected. Real-world risk is low: these require processing a malicious image
  through libvips, and the app doesn't run untrusted remote images through
  `next/image` (CSP img-src is `'self' data: blob: https:`, no remote loader
  configured). **Action:** revisit when Next bumps its `sharp` floor.
- Dev-only `esbuild`/`drizzle-kit` moderate advisories left as-is (never shipped
  to the production runtime); `--force` would swap drizzle-kit for a beta.

### 4. Unused dependencies — FIXED (folded into #5 above).

### 3. `next lint` deprecated — NOT CHANGED (documented)
Works today; deprecated for removal in Next 16. Migrating to the ESLint CLI
(`npx @next/codemod@canary next-lint-to-eslint-cli .`) is a tooling change better
done deliberately alongside the Next 16 upgrade, not in a hardening pass.

### 2. Per-second array churn in the run button — FIXED
`src/components/diagnostics-run-button.tsx`

`phaseForElapsed` rebuilt+reversed the PHASES array every second for 2–3 min.
**Fix:** precompute `PHASES_DESC` once at module scope.

### 1. Stale comment in the engine — FIXED
`src/lib/agentic/engine.ts`

Comment said "60s maxDuration"; the route is 300s. Corrected.

---

## New migration

`drizzle/0015_subscriptions_unique_sub_id.sql` — dedupes any existing
`subscriptions` rows sharing a `stripe_subscription_id` (keeps most-recent), then
creates the partial unique index. Journal updated (`drizzle/meta/_journal.json`,
idx 15). Follows the repo's hand-written-SQL migration pattern (drizzle-kit
`generate` is unusable here: the `meta/` snapshots only go to 0008 while the
journal is at 0014, so it prompts interactively).

**Apply to production** before enabling Stripe:
`psql "$DATABASE_URL" -f drizzle/0015_subscriptions_unique_sub_id.sql`
(or the project's normal migrate step). The embedded dev DB runs it automatically
on next boot via the journal.

## Files changed
- Routes: `admin/login`, `app/diagnostics/run`, `auth/forgot-password`,
  `auth/login`, `auth/resend-verification`, `leads`, `webhooks/stripe`;
  **deleted** `api/checkout`.
- Libs: `agentic/engine`, `agentic/evidence`, `auth`, `http`.
- DB: `db/foundation`, `db/queries`, `db/schema` + migration 0015.
- UI: `components/diagnostics-run-button`.
- Deps: `package.json` / `package-lock.json`.
