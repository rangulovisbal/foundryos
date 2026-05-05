# FoundryOS

MVP B2B SaaS for marketing diagnosis, evidence-backed prioritization, and
30-day marketing action plans for early-stage businesses.

## Local development

```bash
cp .env.example .env.local
# Fill in values from Supabase/Postgres, OpenAI, Resend, Cloudflare, PostHog
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Database

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:push       # Push schema to database
```
