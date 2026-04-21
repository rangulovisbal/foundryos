ALTER TABLE "workspace_business_profiles"
  ADD COLUMN "positioning_statement" text,
  ADD COLUMN "channel_urls" jsonb,
  ADD COLUMN "conversion_action" text,
  ADD COLUMN "pricing_model" text,
  ADD COLUMN "acquisition_method" text,
  ADD COLUMN "sales_process" text,
  ADD COLUMN "evidence_notes" text;
