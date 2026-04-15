# BUSINESS PROFILE SPEC

## Purpose

The business profile is the first workspace-scoped product module in FoundryOS.
It stores the durable business context needed by diagnostics and future roadmap,
asset, SOP, and automation modules.

## Current status

- Implemented in the authenticated app at `/app/profile`.
- Backed by the `workspace_business_profiles` table.
- Saved through `/api/app/business-profile`.
- Mobile-usable as a single progressive form.
- Supports partial saves so users can resume later.
- Read-only when the workspace role or account state does not allow edits.

## Persisted fields

The profile is scoped one-to-one with a workspace and supports these fields:

- `company_name`
- `website`
- `industry`
- `business_model`
- `team_size`
- `geography`
- `primary_offer`
- `target_audience`
- `current_channels`
- `current_tools`
- `primary_goals`
- `biggest_bottlenecks`
- `budget_band`
- `lifecycle_stage`

The workspace also stores `output_language`, currently `en` or `es`, so future
diagnostics and planning outputs can normalize generated language at the
workspace level.

List fields are stored as JSON arrays so future modules can reuse individual
signals instead of parsing raw text.

## Access rules

- `/app/profile` requires an authenticated workspace context.
- Owners and admins can save the profile when the workspace is not read-only.
- Members and viewers can view the profile but cannot save it in the current MVP.
- `past_due`, `canceled`, `suspended`, and `archived` states render gracefully and block writes.
- `lead` workspaces cannot access the app surface.

## UX states

- Empty state: profile not started and diagnostics prompts the user to save it first.
- Loading state: client form disables fields while saving.
- Success state: save confirmation and server refresh.
- Error state: validation or authorization error displayed inline.
- Read-only state: form remains visible but disabled with an explanatory label.

## Validation

- Website must be empty or a full `http://` or `https://` URL.
- Output language must be English or Spanish.
- Text fields are length-limited.
- List fields are normalized from comma or newline input.
- Empty strings are persisted as `null`.

## Non-goals in this slice

- No AI enrichment of the profile.
- No workspace switching.
- No multi-step wizard persistence table.
- No live billing dependency.
- No public marketing changes beyond FoundryOS naming consistency.
