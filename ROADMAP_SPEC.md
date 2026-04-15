# ROADMAP SPEC

## Purpose

The roadmap layer turns the latest successful diagnostic result into a
structured, staged operating plan. It is intentionally deterministic and
persisted so recommendations can be reviewed before future asset, SOP, or
automation slices use them.

## Current status

- Implemented in the authenticated app at `/app/roadmap`.
- Generation is handled by `/api/app/roadmap/generate`.
- Roadmap job state is stored in `planning_jobs` with `job_type =
  roadmap_generation`.
- Roadmap outputs are stored in `roadmaps`.
- The roadmap generation endpoint also stores an initial `action_plans` record
  derived from the roadmap items.
- Admin visibility is available on `/admin`.
- Billing remains preview-only and does not drive live checkout.

## Source inputs

Roadmap generation requires:

- authenticated workspace context
- workspace plan and account state
- workspace role
- saved business profile
- latest successful diagnostic result
- workspace output language

The latest diagnostic result supplies:

- category scores
- top bottlenecks
- top risks
- top opportunities
- recommended next actions
- evidence cards
- confidence

## Logic and prioritization rules

The roadmap groups work into:

- `now`: the highest-risk bottlenecks and risks that block clarity,
  acquisition, operations, or data visibility.
- `next`: opportunities that should be tested after the immediate constraints
  are addressed.
- `later`: lower-urgency or higher-effort items that should not distract from
  the first operating sequence.

Each item is tagged by detected category:

- positioning
- acquisition
- operations
- data
- commercial
- execution

Expected impact is inherited from diagnostic severity or opportunity impact.
Effort is estimated by position and complexity. Dependencies are explicit so
future slices can avoid treating roadmap items as standalone claims.

The roadmap must distinguish planning layers:

- bottleneck: the source problem signal from diagnostics
- risk: the consequence if the problem remains unresolved
- opportunity: the leverage area to explore
- roadmap item: the strategic move that addresses the signal
- action: the executable step derived from the roadmap item
- 30-day plan: the time-sequenced execution layer

Roadmap item titles must not simply repeat diagnostic problem labels. They must
translate the diagnostic signal into executive operating language.

## Business-type specificity

Roadmap generation adapts strategic moves by detected business type:

- SaaS/subscription: ICP, activation, retention, packaging, pipeline quality,
  revenue visibility
- services: lead qualification, service packaging, intake-to-delivery workflow,
  delivery load, margin visibility
- academy/education: lead quality, program clarity, enrollment segmentation,
  completion/referral flow, reporting cadence
- commerce: channel-to-purchase conversion, offer bundles, merchandising,
  checkout, repeat purchase
- marketplace: supply/demand activation, liquidity, match quality, repeat usage
- general: positioning, funnel, operating cadence, scorecard, conversion path

When the business type is academy/education, roadmap items should explicitly
consider enrollment quality, program promise, funnel segmentation, completion,
referrals, and weekly reporting cadence.

## Output schema

Each roadmap contains:

- `summary`
- `items`

Each item contains:

- `title`
- `description`
- `phase`: `now`, `next`, or `later`
- `categoryTags`
- `effortLevel`: `low`, `medium`, or `high`
- `expectedImpact`: `low`, `medium`, or `high`
- `dependencies`
- `reasoning`

## Generation rules

- Only workspace owners and admins can generate roadmaps in this MVP.
- Viewers and members can view persisted roadmaps.
- Generation requires a saved business profile and latest diagnostic result.
- `past_due`, `canceled`, `suspended`, and `archived` states render graceful
  locked or read-only UI instead of breaking.
- Generation is synchronous in the request, but persisted through queued,
  processing, completed, and failed job states.
- Outputs are structured records, not raw AI text dumps.
- No external AI call is required in this slice.

## Persistence model

- `planning_jobs`: shared planning job lifecycle table.
- `roadmaps`: persisted roadmap artifacts linked to workspace, job, and source
  diagnostic result.
- `action_plans`: initial action cards generated from the roadmap job.

Foreign keys cascade with workspace and diagnostic deletion. Job-level unique
indexes prevent duplicate artifacts for the same generation job.

## Failure behavior

If generation fails after the job is created:

- the job status becomes `failed`
- the error is stored in `planning_jobs.error`
- no successful roadmap artifact is shown as latest
- admin can inspect the failed state in `/admin`

If prerequisites are missing, the API returns a clear 400 response and no job is
created.

## Founder review notes

- Roadmap output is a planning aid, not a promised commercial outcome.
- Review `now` items before using the roadmap as source material for execution.
- Validate reasoning quality with real customer profiles before adding assets,
  SOPs, or automation.
- Keep live billing disabled until Stripe becomes the intentional source of
  truth.
- Do not allow internal labels such as `Operational constraint captured`,
  `Restriccion operativa capturada`, `Captured input signals`, or
  `Recommended action basis` to appear as visible roadmap titles.
- Avoid roadmap titles that start with generic prefixes such as `Resolve:` or
  `Activate opportunity:`. The title should be the strategic move itself.
- If multiple diagnostic signals point at the same issue, collapse them into one
  roadmap move instead of repeating the same phrase across now/next/later.
- Review business-type fit manually before using a roadmap with a real
  customer.

## Downstream dependencies

The roadmap now feeds the actions, 30-day plan, and assets layers. It should be
reviewed before future SOPs or automations use it as source material.
