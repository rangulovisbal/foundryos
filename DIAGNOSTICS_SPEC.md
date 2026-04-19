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

The current hardening pass also requires that:

- category scores show visible evidence references and major score drivers
- key conclusions point back to named input categories
- contradiction or inconsistency is surfaced honestly instead of hidden behind summary prose
- weak signal triggers directional language instead of overconfident certainty

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
data visibility, defined funnel structure, or visible cadence.

Confidence is not a tone choice. It is a deterministic function of:

- completeness
- consistency
- specificity
- evidence quality

Missing structure, weak reporting, low evidence, contradiction, or multiple
severe issues reduce confidence to low.

When the signal is too weak, the system must acknowledge that the result is
directional and not yet strong enough to be treated as roadmap truth.

## Contradiction handling

The diagnostics layer now explicitly checks for conflicts such as:

- low-budget context paired with high-complexity or enterprise-scale ambition
- data or reporting goals with no named supporting tools
- reporting tooling listed while visibility is still described as weak
- mature-stage claims without corresponding funnel, data, or cadence foundations

Detected contradictions must:

- reduce confidence
- appear visibly in the result
- influence risk framing
- avoid authoritative-sounding summaries

## Visible explanation layer

The diagnostics UI should make the result easier to trust by showing:

- what the score is based on
- which input categories drove the score up or down
- what ambiguity lowered confidence when present

This explanation layer should stay concise and non-technical. It is meant to
help a founder understand the basis of the read, not inspect an internal model.

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
- Roadmap generation is handled by the separate planning layer.
- No export, PDF, or report sharing.
- No customer-facing support workflow.

## Scoring calibration notes

Acquisition scoring is intentionally penalized when lead quality concern is present.
A profile with channels and a nominally defined funnel does not earn the full funnel
bonus (+10) if lead quality signals are detected. The funnel bonus is reduced to +4
when `hasLeadQualityConcern` is true, ensuring that "has channels but produces bad
leads" scores meaningfully lower than "has channels and qualified conversion."

For academy businesses, `hasLeadQualityConcern` is also triggered when the profile
signals any of the following:
- Which program or per-program segmentation is absent
- Discount or promotional dependence on enrollment
- Completion rate or dropout concern
- Referral rate has never been measured
- Lead source quality is not separated by program

These signals are treated as equivalent to explicit poor lead quality because an
academy funnel that is not segmented by program produces structurally unreliable
enrollment quality.

The `buildSummary` function now produces specific next-step language per detected
issue type rather than a generic "close positioning, funnel, data, or cadence gaps"
statement.

## Founder audit notes

- Do not treat the score as a sales claim; it is an internal operating heuristic.
- Do not describe the product as autonomous business understanding.
- Review Spanish output manually before using it in founder- or customer-facing material.
- Validate that severe bottlenecks lower scores enough before building roadmap automation.
- Validate that weak or contradictory profiles stay visibly low-confidence.
- Do not create roadmap items directly from diagnostics until the next slice adds a reviewable planning layer.
- Keep live billing disabled until Stripe is intentionally promoted to source of truth.

## Downstream planning layer

Diagnostics now feed the persisted roadmap, action plan, and 30-day plan layer.
The next planning hardening step should add role-aware status updates, review
controls, ownership, due windows, and revision history before assets, SOPs, or
automations are implemented.
