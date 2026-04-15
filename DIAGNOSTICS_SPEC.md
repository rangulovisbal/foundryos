# DIAGNOSTICS SPEC

## Purpose

Diagnostics turn a saved workspace business profile into a structured,
persisted operating assessment. The MVP intentionally avoids a raw AI text dump:
results are stored as typed scores, findings, opportunities, actions, and
evidence cards.

## Current status

- Implemented in the authenticated app at `/app/diagnostics`.
- Diagnostic execution is handled by `/api/app/diagnostics/run`.
- Job history is stored in `diagnostic_jobs`.
- Structured results are stored in `diagnostic_results`.
- Admin visibility is available on `/admin`.
- Billing remains preview-only and does not drive live checkout.

## Job lifecycle

Supported job states:

- `queued`
- `processing`
- `completed`
- `failed`

The current MVP processes a run synchronously inside the request while still
persisting the state transitions. This gives the app deployable job history
without pretending a full worker system is already live.

## Result structure

Each completed result stores:

- overall business maturity score
- category scores
- top bottlenecks
- top risks
- top opportunities
- confidence indicator
- recommended next actions
- evidence/reason cards
- summary

## Revised scoring logic

The diagnostic score is no longer primarily a profile-completeness score.
Completeness remains an evidence input, but the category scores now start from
operating-quality signals and apply penalties for serious business issues.

High-severity penalties apply when the profile shows:

- unclear positioning
- no niche clarity
- undefined funnel
- weak reporting or data visibility
- poor lead quality
- unclear offer structure

Medium-severity penalties apply when the profile shows:

- missing operating cadence
- manual or founder-dependent operations
- low evidence depth
- contradictory scale signals, such as high complexity with weak budget or tooling

The overall maturity score is the average of category scores with an additional
penalty when multiple high-severity issues are present. This prevents a profile
from scoring well simply because many fields are filled in.

## Revised confidence logic

High confidence is earned only when all of the following are true:

- profile completeness is strong
- positioning is clear
- funnel is defined
- data visibility is present
- operating cadence is present
- no contradiction is detected
- no high-severity issue is present

Medium confidence requires enough evidence, limited contradictions, and either
data visibility or a defined funnel. Missing structure, weak reporting, low
evidence, or multiple severe issues reduce confidence to low.

## Risk-generation rules

Top risks are generated from the detected issue set, not only from missing
fields. When major bottlenecks are present, risks must not be empty. Serious
constraints should produce at least two to three risks, prioritized by severity.

Risk generation explicitly covers:

- positioning and niche ambiguity
- funnel and conversion opacity
- weak reporting
- poor lead quality
- unclear offer structure
- missing operating cadence
- manual operations
- low evidence depth
- scale contradictions

## Output language rules

The workspace has an `output_language` setting. Supported values are:

- `en` for English
- `es` for Spanish

The business profile form controls this setting. Diagnostics tolerate mixed
language inputs, but generated summaries, category rationales, risks,
opportunities, actions, and evidence-card framing are normalized into the
selected output language.

Captured user-provided terms may still appear as quoted evidence because they
are source signals, not generated recommendations.

## Structure clarity

The diagnostics UI distinguishes:

- captured input signals, shown as evidence cards
- inferred conclusions, shown as bottlenecks and risks
- recommended actions, shown as owner/timeframe action cards

This separation is required before diagnostics are used as the basis for a
roadmap or 30-day plan.

## Entitlements and gating

- Diagnostic runs are controlled by the `diagnostic_runs` usage counter.
- Snapshot workspaces currently get 1 run per period.
- FoundryOS Core workspaces currently get 6 runs per period.
- Operator workspaces currently get 20 runs per period.
- Owners and admins can run diagnostics when the account state allows writes.
- Members and viewers can view results but cannot start a new run in the current MVP.
- `past_due`, `canceled`, `suspended`, and `archived` states render graceful locked or read-only messaging.

## Admin visibility

The internal admin view shows recent diagnostic jobs with:

- workspace
- requesting user
- status
- score
- confidence
- created time

Admin can still manually change workspace account state and plan for testing.

## Non-goals in this slice

- No live Stripe billing source of truth.
- No background queue or worker process.
- No OpenAI dependency for diagnostics.
- No roadmap generation yet.
- No export, PDF, or report sharing.
- No customer-facing support workflow.

## Founder audit notes

- Do not treat the score as a sales claim; it is an internal operating heuristic.
- Review Spanish output manually before using it in founder- or customer-facing material.
- Validate that severe bottlenecks lower scores enough before building roadmap automation.
- Do not create roadmap items directly from diagnostics until the next slice adds a reviewable planning layer.
- Keep live billing disabled until Stripe is intentionally promoted to source of truth.

## Next slice

The next recommended product slice is a diagnostic-to-roadmap operating plan:
persist roadmap items generated from the latest successful diagnostic result,
allow role-aware status updates, and expose admin visibility into roadmap
creation.
