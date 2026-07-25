-- Deduplicate any existing rows sharing a stripe_subscription_id, keeping the
-- most recently updated one, so the partial unique index below can be created.
DELETE FROM "subscriptions" a
USING "subscriptions" b
WHERE a."stripe_subscription_id" IS NOT NULL
  AND a."stripe_subscription_id" = b."stripe_subscription_id"
  AND (a."updated_at", a."id") < (b."updated_at", b."id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique"
  ON "subscriptions" ("stripe_subscription_id")
  WHERE "stripe_subscription_id" IS NOT NULL;
