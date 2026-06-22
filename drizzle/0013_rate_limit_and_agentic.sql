CREATE TABLE IF NOT EXISTS "rate_limit_hits" (
  "bucket" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "rate_limit_hits_bucket_window_start_pk" PRIMARY KEY("bucket","window_start")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rate_limit_window" ON "rate_limit_hits" USING btree ("window_start");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agentic_diagnoses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "requested_by_user_id" uuid,
  "source_business_profile_id" uuid,
  "intake" jsonb NOT NULL,
  "output_ciphertext" text NOT NULL,
  "output_summary" text NOT NULL,
  "overall_confidence" varchar(16) NOT NULL,
  "model" varchar(120) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agentic_diagnoses" ADD CONSTRAINT "agentic_diagnoses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agentic_diagnoses" ADD CONSTRAINT "agentic_diagnoses_requested_by_user_id_app_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agentic_diagnoses" ADD CONSTRAINT "agentic_diagnoses_source_business_profile_id_workspace_business_profiles_id_fk" FOREIGN KEY ("source_business_profile_id") REFERENCES "public"."workspace_business_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentic_diagnoses_workspace_idx" ON "agentic_diagnoses" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentic_diagnoses_requested_by_idx" ON "agentic_diagnoses" USING btree ("requested_by_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agentic_diagnoses_created_idx" ON "agentic_diagnoses" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "workspace_business_profiles" DROP COLUMN IF EXISTS "budget_band";
