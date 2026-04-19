# SUPPORT SPEC

## Scope

This slice adds the minimum support surface required for pilot operation.

- Authenticated workspace route at `/app/support`
- Lightweight FAQ for common trust and preview questions
- Persisted support request intake
- Internal admin visibility and manual status handling

This is not a full ticketing system, shared inbox, SLA engine, or customer
success platform.

## Request lifecycle

Support requests move through these statuses:

- `submitted`
- `triaged`
- `in_progress`
- `resolved`
- `closed`

The MVP lifecycle is manual:

1. User submits a request from `/app/support`
2. Request is stored against the current workspace and user
3. Internal admin reviews the request in `/admin`
4. Internal admin updates status and optional internal notes
5. Follow-up happens outside the app if needed

## Actor permissions

- Any authenticated workspace user can submit a support request
- Owners and admins can view the workspace-wide support queue inside the
  workspace support page
- Members and viewers only see their own support requests
- Only `internal_admin` can update support request status from `/admin`

## Admin handling

Admin can:

- see workspace
- see requester
- see issue type
- see message body
- update status
- add internal notes

The admin surface is intentionally lightweight and optimized for pilot support
rather than scaled operations.

## Data captured

Each support request stores:

- workspace
- requesting user
- issue type
- message
- status
- admin notes
- reviewer
- reviewed timestamp
- created timestamp
- updated timestamp

## FAQ coverage

The support route FAQ covers:

- what FoundryOS does
- what is preview-only
- how outputs are generated
- what output language means
- what billing status means
- how support works
- how account or workspace deletion requests work

## Safety notes

- Support remains request-driven and manual
- No SLA or response-time promise is exposed
- Internal notes stay internal
- The UI makes it explicit that support handling is preview-mode and founder or
  internal-admin managed

## Founder audit notes

- Do not imply 24/7 support, ticket routing, or staffed support operations
- Do not imply that support submission guarantees immediate action
- Keep FAQ answers factual about preview limitations
- Keep request categories operational and understandable
- Support should remain available even if the workspace is in a restricted
  preview state

## What is request-only vs actually executed

Actually executed:

- request submission
- request persistence
- admin visibility
- manual status updates

Not executed by this slice:

- automated email acknowledgements
- threaded reply workflow
- escalation policy
- SLA tracking
- legal/compliance handling beyond manual founder review
