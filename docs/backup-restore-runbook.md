# Backup And Restore Runbook

Last updated: 2026-06-23

## Scope

FoundryOS stores canonical app data in Postgres via `DATABASE_URL`. The provider
can be Supabase Postgres, Neon, or another compatible managed Postgres service.

## Backup Expectations

- Enable provider-managed daily backups before paid production use.
- Confirm point-in-time recovery if the provider supports it.
- Export a manual SQL backup before destructive migrations.
- Keep backups encrypted at rest through the managed provider.

## Manual Backup

Use the provider UI when possible. If `pg_dump` is available locally:

```bash
pg_dump "$DATABASE_URL" --format=custom --file foundryos-backup.dump
```

Do not commit dump files or share them in tickets.

## Restore Drill

1. Create a temporary restore database.
2. Restore the latest backup into the temporary database.
3. Point a preview deployment or local shell at the temporary `DATABASE_URL`.
4. Run `npm run typecheck`, `npm run build`, and a login/profile/diagnosis smoke test.
5. Delete the temporary restore database after the drill.

## Before Destructive Migrations

1. Confirm `DATABASE_URL` points to the intended environment.
2. Take a provider snapshot or `pg_dump`.
3. Apply the migration.
4. Verify the target tables and app smoke flow.
5. Record the migration result in the session handoff.
