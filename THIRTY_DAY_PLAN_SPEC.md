# 30-DAY PLAN SPEC

## Purpose

The 30-day plan turns the saved business profile, latest diagnostic result, and
planning context into a short execution cycle. It keeps actions structured,
reviewable, and persisted without pretending live delivery operations are
already active.

## Current status

- Implemented in the authenticated app at `/app/actions`.
- Generation is handled by `/api/app/actions/generate`.
- Job state is stored in `planning_jobs` with `job_type =
  thirty_day_plan_generation`.
- Action cards are stored in `action_plans`.
- 30-day plan artifacts are stored in `thirty_day_plans`.
- Admin visibility is available on `/admin`.
- Billing remains preview-only and does not drive live checkout.

## Source inputs

30-day plan generation requires:

- authenticated workspace context
- workspace plan and account state
- workspace role
- saved business profile
- latest successful diagnostic result
- latest roadmap when available
- workspace output language

The generator also uses:

- diagnostic top bottlenecks
- diagnostic top risks
- diagnostic opportunities
- diagnostic evidence cards
- roadmap items when a roadmap already exists
- plan label and preview entitlement state

## Logic and prioritization rules

Action cards are generated from the latest roadmap when available. If no roadmap
exists yet, actions fall back to the diagnostic recommended next actions.

Priorities are assigned as:

- `high`: now-phase roadmap items or high-impact/high-severity findings
- `medium`: next-phase items and important diagnostic actions
- `low`: later-phase or supporting work

The 30-day plan uses the top high-priority actions to create:

- one month objective
- top 3 priorities
- week 1 baseline/focus work
- week 2 controlled test work
- week 3 adjustment work
- week 4 continuity decision work

The plan favors narrow operating loops over broad transformation claims.

Action quality rules:

- Actions must start with a directive verb or clear operating command.
- Actions must be executable by a workspace owner, operator, or assigned team
  member.
- Actions must not be renamed bottlenecks.
- Actions must include a concrete decision, test, scorecard, handoff, package,
  or review artifact.
- Actions should use diagnostic problems as context, not as the visible action
  title.

Repetition reduction rules:

- Top priorities should use action titles, not diagnostic labels.
- The same phrase should not appear as bottleneck, roadmap item, action, and
  weekly plan task.
- Repeated signals should collapse into one clearer operating action.
- Fallback labels are not acceptable visible output.

## Business-type specificity

30-day plans adapt execution by detected business type:

- SaaS/subscription: ICP, activation event, conversion path, retention signal,
  expansion signal
- services: lead qualification, service package, proposal path, delivery load,
  margin
- academy/education: learner segment, program promise, enrollment path,
  completion, referrals, lead quality by source
- commerce: buyer segment, offer bundle, checkout path, repeat purchase
- marketplace: supply onboarding, demand activation, match quality, liquidity
- general: segment, offer, conversion path, scorecard, operating cadence

Academy plans must be especially explicit about:

- lead quality
- program clarity
- funnel segmentation
- enrollment, completion, and referral flow
- weekly reporting cadence

## Output schema

Each action contains:

- `title`
- `description`
- `priority`: `high`, `medium`, or `low`
- `ownerSuggestion`
- `status`: currently a placeholder starting at `not_started`
- `linkedCategory`
- `linkedReasoning`

Each 30-day plan contains:

- `monthObjective`
- `topPriorities`
- `week1`
- `week2`
- `week3`
- `week4`
- `quickWins`
- `risksToAvoid`
- `successSignals`
- `metricsToWatch`

Each week contains:

- `title`
- `objective`
- `actions`
- `successSignal`

## Generation rules

- Only workspace owners and admins can generate actions and a 30-day plan in
  this MVP.
- Viewers and members can view persisted planning outputs.
- Generation requires a saved business profile and latest diagnostic result.
- Latest roadmap is optional but improves action specificity.
- `past_due`, `canceled`, `suspended`, and `archived` states render graceful
  locked or read-only UI instead of breaking.
- Generation is synchronous in the request, but persisted through queued,
  processing, completed, and failed job states.
- Outputs are structured records, not raw AI text dumps.
- No external AI call is required in this slice.

## Persistence model

- `planning_jobs`: shared planning job lifecycle table.
- `action_plans`: persisted action cards linked to workspace, job, source
  diagnostic result, and optionally source roadmap.
- `thirty_day_plans`: persisted 30-day plan artifacts linked to workspace, job,
  and source diagnostic result.

Foreign keys cascade with workspace and diagnostic deletion. Job-level unique
indexes prevent duplicate artifacts for the same generation job.

## Failure behavior

If generation fails after the job is created:

- the job status becomes `failed`
- the error is stored in `planning_jobs.error`
- no successful 30-day plan artifact is shown as latest
- admin can inspect the failed state in `/admin`

If prerequisites are missing, the API returns a clear 400 response and no job is
created.

## Founder review notes

- Treat the 30-day plan as the first operating draft, not final consulting
  advice.
- Review action ownership before using it with a real customer.
- Do not expose status tracking as a delivery promise until support and success
  operations exist.
- Do not implement live billing or paid fulfillment from this artifact yet.
- Reject visible outputs that contain labels such as `Operational constraint
  captured`, `Restriccion operativa capturada`, `Captured input signals`, or
  `Recommended action basis`.
- Reject actions that are just problem statements, such as `Undefined funnel` or
  `Weak reporting visibility`.
- Review the weekly plan for clear expectations: what gets defined, what gets
  tested, what gets reviewed, and what decision must be made.
- Compare generated outputs across different business types to confirm they are
  not generic copies.

## Non-goals

- No asset generation.
- No SOP generation.
- No automation execution.
- No live billing.
- No customer-facing claims of guaranteed outcomes.
