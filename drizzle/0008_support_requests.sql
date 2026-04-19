CREATE TABLE "support_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "requested_by_user_id" uuid NOT NULL,
  "issue_type" varchar(64) NOT NULL,
  "message" text NOT NULL,
  "status" varchar(32) DEFAULT 'submitted' NOT NULL,
  "admin_notes" text,
  "reviewed_by_user_id" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletion_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "requested_by_user_id" uuid NOT NULL,
  "request_type" varchar(64) NOT NULL,
  "reason" text,
  "status" varchar(32) DEFAULT 'submitted' NOT NULL,
  "admin_notes" text,
  "reviewed_by_user_id" uuid,
  "reviewed_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_requests"
  ADD CONSTRAINT "support_requests_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_requests"
  ADD CONSTRAINT "support_requests_requested_by_user_id_app_users_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_requests"
  ADD CONSTRAINT "support_requests_reviewed_by_user_id_app_users_id_fk"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deletion_requests"
  ADD CONSTRAINT "deletion_requests_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deletion_requests"
  ADD CONSTRAINT "deletion_requests_requested_by_user_id_app_users_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deletion_requests"
  ADD CONSTRAINT "deletion_requests_reviewed_by_user_id_app_users_id_fk"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "support_requests_workspace_idx" ON "support_requests" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "support_requests_requested_by_idx" ON "support_requests" USING btree ("requested_by_user_id");
--> statement-breakpoint
CREATE INDEX "support_requests_status_idx" ON "support_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "support_requests_created_idx" ON "support_requests" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "deletion_requests_workspace_idx" ON "deletion_requests" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "deletion_requests_requested_by_idx" ON "deletion_requests" USING btree ("requested_by_user_id");
--> statement-breakpoint
CREATE INDEX "deletion_requests_type_idx" ON "deletion_requests" USING btree ("request_type");
--> statement-breakpoint
CREATE INDEX "deletion_requests_status_idx" ON "deletion_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "deletion_requests_created_idx" ON "deletion_requests" USING btree ("created_at");
