CREATE TABLE "action_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_diagnostic_result_id" uuid NOT NULL,
	"source_roadmap_id" uuid,
	"actions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planning_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"requested_by_user_id" uuid,
	"source_diagnostic_result_id" uuid NOT NULL,
	"job_type" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_diagnostic_result_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thirty_day_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_diagnostic_result_id" uuid NOT NULL,
	"month_objective" text NOT NULL,
	"top_priorities" jsonb NOT NULL,
	"week_1" jsonb NOT NULL,
	"week_2" jsonb NOT NULL,
	"week_3" jsonb NOT NULL,
	"week_4" jsonb NOT NULL,
	"quick_wins" jsonb NOT NULL,
	"risks_to_avoid" jsonb NOT NULL,
	"success_signals" jsonb NOT NULL,
	"metrics_to_watch" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_job_id_planning_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."planning_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_source_diagnostic_result_id_diagnostic_results_id_fk" FOREIGN KEY ("source_diagnostic_result_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_source_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("source_roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_jobs" ADD CONSTRAINT "planning_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_jobs" ADD CONSTRAINT "planning_jobs_requested_by_user_id_app_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_jobs" ADD CONSTRAINT "planning_jobs_source_diagnostic_result_id_diagnostic_results_id_fk" FOREIGN KEY ("source_diagnostic_result_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_job_id_planning_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."planning_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_source_diagnostic_result_id_diagnostic_results_id_fk" FOREIGN KEY ("source_diagnostic_result_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thirty_day_plans" ADD CONSTRAINT "thirty_day_plans_job_id_planning_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."planning_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thirty_day_plans" ADD CONSTRAINT "thirty_day_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thirty_day_plans" ADD CONSTRAINT "thirty_day_plans_source_diagnostic_result_id_diagnostic_results_id_fk" FOREIGN KEY ("source_diagnostic_result_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "action_plans_job_idx" ON "action_plans" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "action_plans_workspace_idx" ON "action_plans" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "action_plans_diagnostic_idx" ON "action_plans" USING btree ("source_diagnostic_result_id");--> statement-breakpoint
CREATE INDEX "action_plans_roadmap_idx" ON "action_plans" USING btree ("source_roadmap_id");--> statement-breakpoint
CREATE INDEX "action_plans_created_idx" ON "action_plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "planning_jobs_workspace_idx" ON "planning_jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "planning_jobs_diagnostic_idx" ON "planning_jobs" USING btree ("source_diagnostic_result_id");--> statement-breakpoint
CREATE INDEX "planning_jobs_type_idx" ON "planning_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "planning_jobs_status_idx" ON "planning_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "planning_jobs_created_idx" ON "planning_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "roadmaps_job_idx" ON "roadmaps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "roadmaps_workspace_idx" ON "roadmaps" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "roadmaps_diagnostic_idx" ON "roadmaps" USING btree ("source_diagnostic_result_id");--> statement-breakpoint
CREATE INDEX "roadmaps_created_idx" ON "roadmaps" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "thirty_day_plans_job_idx" ON "thirty_day_plans" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "thirty_day_plans_workspace_idx" ON "thirty_day_plans" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "thirty_day_plans_diagnostic_idx" ON "thirty_day_plans" USING btree ("source_diagnostic_result_id");--> statement-breakpoint
CREATE INDEX "thirty_day_plans_created_idx" ON "thirty_day_plans" USING btree ("created_at");