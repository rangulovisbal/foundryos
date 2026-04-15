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

## Next slice

The next recommended product slice is a diagnostic-to-roadmap operating plan:
persist roadmap items generated from the latest successful diagnostic result,
allow role-aware status updates, and expose admin visibility into roadmap
creation.
