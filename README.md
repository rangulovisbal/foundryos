# FoundryOS

Founder-assisted marketing diagnosis and 30-day marketing planning for
early-stage small businesses.

The current product is a controlled design-partner pilot. It uses
founder-entered context and deterministic generation first; LLM refinement,
self-serve billing, and live integrations are later layers.

## Local development

```bash
cp .env.example .env.local
# Fill in values for Postgres, Resend, Cloudflare Turnstile, and PostHog as needed
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
