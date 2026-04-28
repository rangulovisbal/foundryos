# RICARDO — NEXT STEPS

## Current repo state

- **Branch:** `main`
- **HEAD:** `deae7e6` (fix(security): harden pilot baseline protections)
- **Working tree:** Clean
- **Unpushed commits:** None
- **New files (uncommitted):** The doc files created in this session (see below)
- **Quality checks:** typecheck, lint, build — all passing

### Files created in this session (not yet committed)

```
docs/pilot-readiness-checklist.md
docs/pilot/01-email-design-partner.md
docs/pilot/02-guion-sesion-intake.md
docs/pilot/03-guion-sesion-revision.md
docs/pilot/04-plantilla-feedback-piloto.md
docs/pilot/05-followup-48h.md
docs/pilot/06-followup-30d.md
docs/RICARDO-NEXT-STEPS.md
README.md                              (new)
.env.example                           (updated: added AUTH_PREVIEW_LINKS, INTERNAL_ADMIN_EMAILS)
```

---

## Tasks for Ricardo — ordered by priority

### BLOCKER TIER (must complete before contacting [Susana])

| # | Task | Time | Why it blocks |
|---|------|------|---------------|
| 1 | Configure env vars in Vercel (A1) | 30-45 min | Nothing works in prod without these |
| 2 | Verify domain in Resend + DNS records (A2) | 20-30 min + propagation wait | Auth emails won't arrive without this |
| 3 | Apply migrations 0006-0010 in prod DB (A3) | 10-15 min | SOPs and evidence intake won't work |
| 4 | Verify AUTH_PREVIEW_LINKS=false (A4) | 5 min | Security requirement |
| 5 | Verify NEXT_PUBLIC_APP_URL is correct (A5) | 5 min | Email links will be broken otherwise |
| 6 | Manual test: auth flow in prod (A6) | 15-20 min | Can't invite a client if signup is broken |
| 7 | Manual test: full product flow in prod (A7) | 30-45 min | Can't run a pilot if modules don't generate |

**Blocker tier total: ~2-3 hours** (plus DNS propagation wait, which you can't control but is usually <30 min)

---

### IMPORTANT BUT NOT BLOCKING (do before or during pilot week)

| # | Task | Time | Notes |
|---|------|------|-------|
| 8 | Review and personalize pilot email (01-email-design-partner.md) | 10 min | Replace [Susana] and adapt tone |
| 9 | Read intake and review scripts (02, 03) | 15 min | So you're prepared, not reading live |

**Note:** A8 (.env.example) and A9 (README.md) are already done in this session.

---

### DEFERRED (not needed for first pilot)

| # | Task | Time | Notes |
|---|------|------|-------|
| 10 | Decide legal structure / find gestoria (A10) | 2-4 hours | First pilot is free — revisit for second/third pilot |

---

## Total time estimate

- **Blockers:** 2-3 hours (one focused afternoon)
- **Important non-blocking:** 30 minutes
- **Total before contacting [Susana]:** ~3 hours maximum

This fits in a single afternoon or two short morning sessions.

---

## When you're ready to contact [Susana]

You're ready when ALL of these are true:

1. You can sign up, verify email, log in, and log out on the production URL.
2. You can create a workspace, fill a complete profile, and generate all 5 modules without errors.
3. Emails arrive in inbox (not spam) from your verified domain.
4. You've read the intake and review scripts at least once.

---

## If something fails

### "Emails go to spam or don't arrive"
- Check Resend dashboard > Logs to see if the email was sent.
- Verify all 3 DNS records (SPF, DKIM, DMARC) show green in Resend.
- If using Gmail: check Promotions/Spam tabs.
- If DNS records are set but not verified: wait 24 hours, then re-verify.

### "Signup or login gives a 500 error"
- Check Vercel deployment logs (Vercel dashboard > Deployments > latest > Functions tab).
- Most likely cause: missing or incorrect `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Fix the env var and redeploy.

### "Diagnostics/modules don't generate"
- Check that `DATABASE_URL` is set and correct in Vercel.
- Check that migrations were applied (A3).
- Check that `OPENAI_API_KEY` is set (needed for some generation flows).
- Check Vercel function logs for the specific error.

### "Build fails on Vercel"
- Run `npm run build` locally with the same env vars. If it passes locally, the issue is likely a missing env var in Vercel (Next.js needs `NEXT_PUBLIC_*` vars at build time).
- Ensure all `NEXT_PUBLIC_*` variables are set in the Vercel project for the Production environment.
