# FoundryOS

MVP B2B SaaS for operational diagnostics, prioritization, and 30-day action plans for small businesses.

## Local development

```bash
cp .env.example .env.local
# Fill in values from Supabase, Neon, OpenAI, Resend, Cloudflare, PostHog
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
