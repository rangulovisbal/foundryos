ALTER TABLE "sop_jobs" ADD COLUMN "source_asset_job_id" uuid;
--> statement-breakpoint
ALTER TABLE "sop_jobs" ADD COLUMN "input_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "sop_jobs"
  ADD CONSTRAINT "sop_jobs_source_asset_job_id_asset_jobs_id_fk"
  FOREIGN KEY ("source_asset_job_id") REFERENCES "public"."asset_jobs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sop_jobs_input_hash_idx" ON "sop_jobs" USING btree ("workspace_id", "input_hash");
