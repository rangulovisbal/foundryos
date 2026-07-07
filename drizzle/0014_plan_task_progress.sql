CREATE TABLE IF NOT EXISTS "plan_task_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "agentic_diagnosis_id" uuid NOT NULL,
  "week" integer NOT NULL,
  "task_title" text NOT NULL,
  "done" boolean DEFAULT false NOT NULL,
  "updated_by_user_id" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_task_progress" ADD CONSTRAINT "plan_task_progress_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_task_progress" ADD CONSTRAINT "plan_task_progress_agentic_diagnosis_id_agentic_diagnoses_id_fk" FOREIGN KEY ("agentic_diagnosis_id") REFERENCES "public"."agentic_diagnoses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_task_progress" ADD CONSTRAINT "plan_task_progress_updated_by_user_id_app_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plan_task_progress_task_idx" ON "plan_task_progress" USING btree ("agentic_diagnosis_id","week","task_title");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_task_progress_workspace_idx" ON "plan_task_progress" USING btree ("workspace_id");
