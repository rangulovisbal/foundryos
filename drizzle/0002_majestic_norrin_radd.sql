CREATE TABLE "diagnostic_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"requested_by_user_id" uuid,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"job_type" varchar(64) DEFAULT 'business_profile_diagnostic' NOT NULL,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"overall_maturity_score" integer NOT NULL,
	"category_scores" jsonb NOT NULL,
	"top_bottlenecks" jsonb NOT NULL,
	"top_risks" jsonb NOT NULL,
	"top_opportunities" jsonb NOT NULL,
	"confidence" varchar(32) NOT NULL,
	"recommended_next_actions" jsonb NOT NULL,
	"evidence_cards" jsonb NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_name" varchar(160),
	"website" varchar(255),
	"industry" varchar(120),
	"business_model" varchar(120),
	"team_size" varchar(64),
	"geography" varchar(160),
	"primary_offer" text,
	"target_audience" text,
	"current_channels" jsonb,
	"current_tools" jsonb,
	"primary_goals" jsonb,
	"biggest_bottlenecks" jsonb,
	"budget_band" varchar(64),
	"lifecycle_stage" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnostic_jobs" ADD CONSTRAINT "diagnostic_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_jobs" ADD CONSTRAINT "diagnostic_jobs_requested_by_user_id_app_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_job_id_diagnostic_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."diagnostic_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_business_profiles" ADD CONSTRAINT "workspace_business_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnostic_jobs_workspace_idx" ON "diagnostic_jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "diagnostic_jobs_status_idx" ON "diagnostic_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "diagnostic_jobs_created_idx" ON "diagnostic_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostic_results_job_idx" ON "diagnostic_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "diagnostic_results_workspace_idx" ON "diagnostic_results" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "diagnostic_results_created_idx" ON "diagnostic_results" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_business_profiles_workspace_idx" ON "workspace_business_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_business_profiles_updated_idx" ON "workspace_business_profiles" USING btree ("updated_at");