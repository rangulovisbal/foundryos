ALTER TABLE "admin_audit_logs" DROP CONSTRAINT IF EXISTS "admin_audit_logs_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ALTER COLUMN "workspace_id" DROP NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
