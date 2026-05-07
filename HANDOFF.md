# HANDOFF

Last updated: 2026-05-07

## 1. What Was Completed

- Reframed FoundryOS around assisted marketing diagnosis and a founder-reviewed 30-day marketing plan.
- Pushed `86960a0 chore: align pilot access and messaging` to `origin/main`.
- Public header now prioritizes `Request access` and `Log in`; public signup is framed as invited/manual pilot access.
- Public Snapshot flow now returns and displays an initial draft preview, not a final reviewed deliverable.
- Public intake no longer asks for monthly revenue; it uses optional pricing/ticket and typical order/project value fields with a privacy warning.
- Customer-facing Snapshot recommendations no longer expose internal stack choices such as framework, database, billing, analytics, or automation tooling.
- Visible `AG` mark was replaced with `FO`; public output names use `Marketing Snapshot`, `FoundryOS Core`, and `Marketing Operator`.
- Stale roadmap and financial docs were updated around assisted pilots, no public launch, no live checkout, and post-validation pricing hypotheses.

## 2. Current Project Status

- Branch: `main`
- Remote: `origin/main`
- Latest pushed commit: `86960a0 chore: align pilot access and messaging`
- Validation completed before that push: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Public smoke tests passed locally for `/`, `/pricing`, `/signup`, `/login`, `/onboarding`, `/dashboard`, and `/security`.
- Snapshot API smoke test returned `outputStatus: "draft_preview"` and `X-FoundryOS-Output-Status: draft-preview`.
- This handoff documentation update is local unless committed after this note.

## 3. Pending Tasks

- Run authenticated end-to-end pilot testing with a real local or production pilot user.
- Verify production env vars, database migrations, Resend delivery, auth verification/reset, and the full profile -> diagnosis -> 30-day plan flow.
- Decide after the first pilot whether public `/onboarding` should remain a draft preview or move fully behind request/manual access.
- Confirm the first real pilot path: request access -> manual invite/signup -> guided intake -> founder review -> customer review session.
- Review Vercel deployment after the latest push once the deployment is available.

## 4. Important Architectural Decisions

- Auth is custom Postgres-backed auth, not Supabase Auth.
- PostgreSQL via `DATABASE_URL` is the canonical database concept; provider can be Supabase Postgres, Neon, or compatible managed Postgres.
- The deterministic diagnosis/planning/assets/SOP engines remain the trust layer for pilots.
- LLM refinement is future-only and gated by `ENABLE_LLM_SNAPSHOT_REFINEMENT=true`.
- Stripe remains disabled unless `ENABLE_STRIPE_CHECKOUT=true`; do not enable billing until provisioning, account states, success/cancel routing, webhooks, and portal behavior are verified.
- Internal plan key `growth-os` remains compatibility-only; public naming should be `FoundryOS Core`.
- `AI Growth OS`, `AI Snapshot`, and `AI Operator` must not be used as public product or plan names.

## 5. Files Modified

Latest pushed alignment pass modified:

- `.env.example`
- `README.md`
- `docs/financial-model.csv`
- `docs/pilot/02-guion-sesion-intake.md`
- `docs/roadmap-and-gantt.md`
- `docs/system-architecture.md`
- `src/app/api/snapshot/route.ts`
- `src/app/dashboard/page.tsx`
- `src/app/icon.tsx`
- `src/app/invite/[token]/page.tsx`
- `src/app/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/components/lead-capture-form.tsx`
- `src/components/login-form.tsx`
- `src/components/onboarding-form-state.ts`
- `src/components/onboarding-form.tsx`
- `src/components/signup-form.tsx`
- `src/components/site-footer.tsx`
- `src/components/site-header.tsx`
- `src/components/snapshot-report.tsx`
- `src/lib/snapshot.ts`
- `src/lib/types.ts`
- `docs/current-product-conventions.md`
- `HANDOFF.md`

This final handoff update touches:

- `HANDOFF.md`
- `docs/current-product-conventions.md`

## 6. Known Issues Or Blockers

- Authenticated customer smoke testing still needs a real user session.
- Production readiness still depends on verified env vars, DB migrations, email delivery, and an end-to-end production pilot test.
- Vercel deployment status could not previously be inspected through the Vercel API because of a scope/auth `403`.
- Public copy must continue avoiding claims of autonomous AI, live crawling, live social analysis, public self-serve launch, or agentic execution.
- Snapshot draft preview is still publicly accessible at `/onboarding`; this is intentional for now but should be reviewed after pilot feedback.

## 7. Recommended Next Steps

1. Check Vercel deployment status for commit `86960a0`.
2. Verify production environment values: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, Resend sender, `ADMIN_ACCESS_TOKEN`, `INTERNAL_ADMIN_EMAILS`, `AUTH_PREVIEW_LINKS=false`, `ENABLE_STRIPE_CHECKOUT=false`, and `ENABLE_LLM_SNAPSHOT_REFINEMENT=false`.
3. Run a real pilot-user auth test: signup/invite, verify email, login, workspace setup, profile save.
4. Run the authenticated product flow: diagnosis, 30-day plan, priority list, assets, routines, feedback, support request, and admin review.
5. Use pilot feedback to decide whether `/onboarding` remains public draft preview or becomes request-only/manual.
