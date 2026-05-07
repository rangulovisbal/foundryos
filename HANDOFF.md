# HANDOFF

Last updated: 2026-05-07

## 1. What Was Completed

- Reframed FoundryOS v1 around marketing diagnosis and a practical 30-day marketing plan for early-stage businesses.
- Hardened the generation engine to prefer marketing-specific guidance over generic operations advice.
- Hardened profile intake for early-stage businesses with optional website/URL handling, URL placeholder sanitation, structured dropdowns/multi-selects, and field help.
- Cleaned up auth UX for already-signed-in users and public header CTAs.
- Restructured internal admin IA, added output feedback visibility, and expanded account closure/recovery/test cleanup controls.
- Simplified customer pilot UX: primary path is now profile -> diagnosis -> 30-day plan -> supporting materials.
- Latest committed state is `47d1641 chore: align FoundryOS pilot guardrails`.
- Pilot Access & Messaging Alignment pass reframed public CTAs, signup language, Snapshot draft-preview handling, intake privacy, visible branding, and stale docs around assisted pilot mode.

## 2. Current Project Status

- Branch: `main`
- Remote tracking: `main...origin/main`
- Current pending commit includes public copy, snapshot flow, docs, onboarding, auth page copy, and related types.
- This handoff adds documentation: `HANDOFF.md` and `docs/current-product-conventions.md`.
- Current pass validation completed: `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- Public smoke tests confirmed home, pricing, signup, login, onboarding, dashboard, and security routes return `200`.
- Snapshot API returns `outputStatus: "draft_preview"` and `X-FoundryOS-Output-Status: draft-preview`.

## 3. Pending Tasks

- Perform authenticated smoke testing with a real local or production pilot user session.
- Verify production env vars, email delivery, migrations, and end-to-end auth/profile/diagnosis/plan flow before an unassisted pilot.
- Decide whether draft-preview Snapshot should remain public or be moved fully behind request/manual access after the first pilot.

## 4. Important Architectural Decisions

- Auth is custom database-backed auth with PostgreSQL persistence, not Supabase Auth.
- `DATABASE_URL` points at the production PostgreSQL/Supabase database; Supabase Auth keys should not be documented as the auth system.
- FoundryOS v1 should be described as a marketing diagnosis and 30-day planning tool, not an autonomous business OS or agent.
- Core app routes and persisted module types stay stable; UI labels can be reframed without renaming routes.
- Internal `growth-os` plan key is compatibility-only. Public naming should use `FoundryOS Core`.
- Stripe billing remains disabled for the pilot unless explicitly enabled with guardrails.
- Resend/live email is required for real email verification/reset delivery; assisted pilot can use controlled/manual flows only if explicitly accepted.
- Output feedback is intentionally simple: customer widget plus admin visibility, not analytics dashboards.

## 5. Files Modified

Files included in the Pilot Access & Messaging Alignment pass:

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

Files added for handoff/conventions:

- `HANDOFF.md`
- `docs/current-product-conventions.md`

## 6. Known Issues Or Blockers

- Authenticated end-to-end pilot testing still needs a real local or production pilot user session.
- Production readiness still depends on verified env vars, DB migrations, email delivery, and a real end-to-end pilot smoke test.
- Public copy must avoid overclaiming autonomous AI, live crawling, live social analysis, or agentic execution.

## 7. Recommended Next Steps

1. Smoke test authenticated customer flow: profile -> diagnosis -> 30-day plan -> assets/routines -> support.
2. Before the next pilot session, verify production env vars and live auth/email behavior on the Vercel domain.
3. Confirm the first pilot customer path: request access -> manual invite/signup -> guided intake -> founder review -> customer review session.
