# SOPS SPEC

## Purpose

The SOPs layer turns saved business context, diagnostic findings, and planning
outputs into structured standard operating procedures. It gives workspace owners
and operators a reviewable, persisted set of operating procedures before live
integrations or automated execution exist.

## Current status

- Implemented in the authenticated app at `/app/sops`.
- Generation is handled by `/api/app/sops/generate`.
- Job lifecycle is stored in `sop_jobs`.
- Generated SOP artifacts are stored in `sop_artifacts`.
- Admin visibility is available on `/admin`.
- Export workflows are not live yet.
- Billing remains preview-only and does not drive live checkout.

## MVP SOP types

The MVP generates one saved SOP set with five procedure types:

- `lead_handling`
- `reporting_cadence`
- `campaign_setup`
- `content_workflow`
- `internal_approval`

## Source inputs

SOP generation requires:

- authenticated workspace context
- workspace plan and account state
- workspace role
- saved business profile
- latest successful diagnostic result
- latest roadmap when available
- latest 30-day plan when available
- workspace output language

The source records are stored on the SOP job:

- `source_business_profile_id`
- `source_diagnostic_result_id`
- `source_roadmap_id`
- `source_thirty_day_plan_id`

## Generation logic

Generation is deterministic and does not require an external AI call in this
slice. It uses:

- business profile context for company, audience, offer, model, geography,
  channels, and tools
- diagnostic bottlenecks, risks, opportunities, and confidence
- roadmap now-phase items as operating sequence input
- 30-day plan weekly priorities and success signals as execution rhythm input

The generator detects a broad business type:

- SaaS/subscription
- services
- academy/education
- commerce
- marketplace
- general

Detected business type influences procedure steps, owner labels, tool
suggestions, and checkpoint criteria inside each SOP.

SOPs must stay differentiated:

- lead handling defines qualification criteria, routing, and follow-up cadence
  specific to the business model, not generic CRM steps
- reporting cadence defines the specific metrics to track, review frequency,
  owner, and decision trigger for this business type
- campaign setup defines the channel-specific launch checklist, targeting
  inputs, creative requirements, approval steps, and go/no-go criteria
- content workflow defines the creation cycle, review gate, distribution path,
  and archive process for the channels detected in the profile
- internal approval defines who signs off on what, what artifacts are required,
  and what happens when approval is blocked

## Output schema

Each SOP artifact contains:

- `id`
- `job_id`
- `workspace_id`
- `sop_type`
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

Required section headings per SOP:

- Purpose and trigger
- Owner and responsibilities
- Required tools
- Steps
- QA checkpoint
- Expected output

`source_references` is an ordered list of source cards:

- `sourceType`
- `label`
- `referenceId`
- `detail`

Outputs must remain structured. Raw AI-style paragraphs are not acceptable.

## Persistence model

`sop_jobs` stores generation lifecycle:

- queued
- processing
- completed
- failed

`sop_artifacts` stores the saved procedures created by a job. Each artifact is
linked to the workspace and generation job. Workspace deletion cascades to SOP
jobs and artifacts. SOP deletion is not exposed in the MVP UI.

## Plan and account-state behavior

- Owners and admins on growth-os and operator plans can generate SOPs.
- snapshot plan does not include SOP generation.
- Members and viewers can view persisted SOPs.
- `past_due` workspaces show read-only generation messaging.
- `canceled`, `suspended`, and `archived` workspaces show graceful locked-state UI.
- Missing source inputs return clear prerequisite messaging and no job is created.

## Failure behavior

If generation fails after a job is created:

- the job status becomes `failed`
- the error is stored in `sop_jobs.error`
- no failed SOP set is treated as latest successful output
- admin can inspect the failed job in `/admin`

If prerequisites are missing:

- the API returns a clear 400 response
- no SOP job is created

## SOP quality rules

Every step in a SOP must be executable. Reject any step that:

- Names a category without a concrete action ("improve lead quality")
- Uses intention language ("consider reviewing", "explore options")
- Repeats a diagnostic problem label without converting it to an operating step
- Lacks a responsible owner or a concrete output

Each SOP must specify:

- Who runs it (owner label specific to role, not generic "the team")
- What triggers it (event, cadence, or threshold)
- What tools are needed (named where determinable from profile data)
- What a successful completion looks like (observable output)

## Business-type specificity

SOPs adapt by detected business type:

- SaaS/subscription: lead scoring, trial activation, subscription conversion,
  churn signal reporting, in-product engagement
- services: discovery call qualification, proposal approval, delivery handoff,
  utilization reporting, client feedback capture
- academy/education: enrollment qualification by program, cohort launch,
  completion tracking, referral capture, weekly enrollment report
- commerce: checkout abandonment recovery, order routing, refund approval,
  inventory threshold reporting, repeat purchase campaign
- marketplace: supplier or provider onboarding, demand activation, match
  quality review, liquidity reporting, dispute escalation
- general: lead qualification, channel performance reporting, campaign launch,
  content publication, budget approval

## Founder audit notes

- SOPs are operating drafts, not delivery commitments.
- Review owner assignments before sharing with team members.
- Verify tool names against the workspace's actual tool stack.
- Do not connect SOP generation to live checkout until Stripe and entitlement
  source-of-truth work is intentionally implemented.
- Do not imply that FoundryOS has executed tasks, launched campaigns, or
  activated live integrations.

## Anti-repetition rules

- Each SOP must have a distinct title that names the procedure, not the problem.
- Do not copy the same bottleneck phrase into every SOP.
- Reuse source signals intentionally, but change the procedure role per artifact.
- Steps should be numbered and actionable, not narrative summaries.

## Non-goals

- No automation execution.
- No live integrations.
- No live billing.
- No live export workflow.
- No customer-facing guarantee of commercial outcomes.
