CREATE TABLE IF NOT EXISTS "output_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"module_type" varchar(32) NOT NULL,
	"output_id" uuid,
	"label" varchar(16) NOT NULL,
	"note" text,
	"submitted_by_user_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "output_feedback" ADD CONSTRAINT "output_feedback_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "output_feedback" ADD CONSTRAINT "output_feedback_submitted_by_user_id_app_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "output_feedback_workspace_idx" ON "output_feedback" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "output_feedback_module_idx" ON "output_feedback" USING btree ("workspace_id","module_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "output_feedback_submitted_idx" ON "output_feedback" USING btree ("submitted_at");
