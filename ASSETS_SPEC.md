# ASSETS SPEC

## Purpose

The assets layer turns saved diagnostics and planning outputs into structured
business artifacts. It is a preview product module that helps founders review
positioning, messaging, channel focus, execution priorities, and summary
context before SOPs, automations, or live billing exist.

## Current status

- Implemented in the authenticated app at `/app/assets`.
- Generation is handled by `/api/app/assets/generate`.
- Job lifecycle is stored in `asset_jobs`.
- Generated artifacts are stored in `business_assets`.
- Admin visibility is available on `/admin`.
- Export workflows are not live yet.
- Billing remains preview-only and does not drive live checkout.

## MVP asset types

The MVP generates one saved asset set with six artifact types:

- `positioning_summary`
- `thirty_day_action_plan_summary`
- `messaging_framework`
- `basic_channel_plan`
- `execution_checklist`
- `founder_summary`

## Source inputs

Asset generation requires:

- authenticated workspace context
- workspace plan and account state
- workspace role
- saved business profile
- latest successful diagnostic result
- latest roadmap
- latest action plan
- latest 30-day plan
- workspace output language

The source records are stored on the asset job:

- `source_business_profile_id`
- `source_diagnostic_result_id`
- `source_roadmap_id`
- `source_action_plan_id`
- `source_thirty_day_plan_id`

## Generation logic

Generation is deterministic and does not require an external AI call in this
slice. It uses:

- business profile context for company, audience, offer, model, geography, and
  channels
- diagnostic score, bottlenecks, risks, opportunities, confidence, and summary
- roadmap now/next/later moves as strategic source material
- action cards as executable source material
- 30-day plan priorities, weekly sequence, quick wins, risks, signals, and
  metrics

The generator detects a broad business type:

- SaaS/subscription
- services
- academy/education
- commerce
- marketplace
- general

Detected business type influences default channel recommendations and language
inside positioning, messaging, channel, and execution artifacts.

## Output schema

Each asset contains:

- `id`
- `job_id`
- `workspace_id`
- `asset_type`
- `title`
- `purpose`
- `content`
- `source_references`
- `generation_status`
- `created_at`
- `updated_at`

`content` is an ordered list of sections:

- `heading`
- `items`

`source_references` is an ordered list of source cards:

- `sourceType`
- `label`
- `referenceId`
- `detail`

Outputs must remain structured. Raw AI-style paragraphs are not acceptable for
this layer.

## Persistence model

`asset_jobs` stores generation lifecycle:

- queued
- processing
- completed
- failed

`business_assets` stores the saved artifacts created by a job. Each asset is
linked to the workspace and generation job. Workspace deletion cascades to asset
jobs and assets. Asset deletion is not exposed in the MVP UI.

The `asset_exports` usage counter is used as a preview generation-run counter in
this slice. It does not yet represent a live export billing meter.

## Export behavior

Export is not implemented yet.

Current behavior:

- assets render in `/app/assets`
- each asset shows structured sections and source references
- persisted history shows job state, asset count, asset types, and errors

Future export behavior should support founder-safe formats such as Markdown,
PDF, and copyable text, but those are out of scope for this slice.

## Plan and account-state behavior

- Owners and admins can generate assets when the plan allows assets and usage
  remains.
- Members and viewers can view persisted assets.
- `past_due` workspaces show read-only generation messaging.
- `canceled`, `suspended`, and `archived` workspaces show graceful locked-state
  UI.
- Missing source inputs return clear prerequisite messaging and no job is
  created.

## Failure behavior

If generation fails after a job is created:

- the job status becomes `failed`
- the error is stored in `asset_jobs.error`
- no failed asset set is treated as latest successful output
- admin can inspect the failed job in `/admin`

If prerequisites are missing:

- the API returns a clear 400 response
- no asset job is created

## Founder audit notes

- Assets are business artifacts, not delivery claims.
- Do not imply that FoundryOS has executed tasks, launched campaigns, generated
  revenue, or connected live integrations.
- Keep source references visible so a founder can audit why an asset exists.
- Reject repetitive restatements of the same diagnostic phrase across all
  assets.
- Ensure asset titles are clean executive labels, not internal fallback labels.
- Treat the founder summary as a review brief, not final consulting advice.
- Do not connect asset generation to live checkout until Stripe and entitlement
  source-of-truth work is intentionally implemented.

## Non-goals

- No SOP generation.
- No automation execution.
- No live billing.
- No live export workflow.
- No customer-facing guarantee of commercial outcomes.
