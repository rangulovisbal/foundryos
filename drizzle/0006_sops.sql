CREATE TABLE "sop_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "requested_by_user_id" uuid,
  "source_business_profile_id" uuid,
  "source_diagnostic_result_id" uuid,
  "source_roadmap_id" uuid,
  "source_thirty_day_plan_id" uuid,
  "status" varchar(32) DEFAULT 'queued' NOT NULL,
  "error" text,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sop_artifacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "workspace_id" uuid NOT NULL,
  "sop_type" varchar(64) NOT NULL,
  "title" varchar(180) NOT NULL,
  "purpose" text NOT NULL,
  "content" jsonb NOT NULL,
  "source_references" jsonb NOT NULL,
  "generation_status" varchar(32) DEFAULT 'completed' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_requested_by_user_id_app_users_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_source_business_profile_id_workspace_business_profiles_id_fk"
  FOREIGN KEY ("source_business_profile_id") REFERENCES "public"."workspace_business_profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_source_diagnostic_result_id_diagnostic_results_id_fk"
  FOREIGN KEY ("source_diagnostic_result_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_source_roadmap_id_roadmaps_id_fk"
  FOREIGN KEY ("source_roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_source_thirty_day_plan_id_thirty_day_plans_id_fk"
  FOREIGN KEY ("source_thirty_day_plan_id") REFERENCES "public"."thirty_day_plans"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_artifacts"
  ADD CONSTRAINT "sop_artifacts_job_id_sop_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."sop_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sop_artifacts"
  ADD CONSTRAINT "sop_artifacts_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sop_jobs_workspace_idx" ON "sop_jobs" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "sop_jobs_status_idx" ON "sop_jobs" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "sop_jobs_created_idx" ON "sop_jobs" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "sop_jobs_diagnostic_idx" ON "sop_jobs" USING btree ("source_diagnostic_result_id");
--> statement-breakpoint
CREATE INDEX "sop_artifacts_job_idx" ON "sop_artifacts" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX "sop_artifacts_workspace_idx" ON "sop_artifacts" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "sop_artifacts_type_idx" ON "sop_artifacts" USING btree ("sop_type");
--> statement-breakpoint
CREATE INDEX "sop_artifacts_created_idx" ON "sop_artifacts" USING btree ("created_at");
