CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"previous_plan" varchar(32),
	"next_plan" varchar(32),
	"previous_account_state" varchar(32),
	"next_account_state" varchar(32),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_app_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_workspace_idx" ON "admin_audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_admin_idx" ON "admin_audit_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_idx" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "app_sessions_expires_idx" ON "app_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_usage_counters_workspace_idx" ON "workspace_usage_counters" USING btree ("workspace_id");