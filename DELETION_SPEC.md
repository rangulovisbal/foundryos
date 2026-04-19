# DELETION SPEC

## Scope

This slice adds controlled deletion request flows before pilot launch.

- Account deletion request from `/app/support`
- Workspace deletion request from `/app/support`
- Admin visibility and manual request status handling

This slice does not add automatic destructive execution from the user-facing UI.

## Request lifecycle

Deletion requests move through these statuses:

- `submitted`
- `under_review`
- `approved`
- `rejected`
- `completed`

Lifecycle:

1. User opens `/app/support`
2. User chooses account deletion or workspace deletion
3. User passes the confirmation phrase check
4. Request is stored for manual review
5. Internal admin updates status in `/admin`
6. If deletion is ever executed manually outside this slice, admin can mark the
   request `completed`

## Actor permissions

- Any authenticated workspace user can request deletion of their own account
- Only workspace `owner` or `admin` can request workspace deletion
- Only `internal_admin` can review or update deletion request status

## Admin handling

Admin can:

- see the requester
- see the workspace
- see request type
- read the optional reason
- update status
- add internal notes

Admin handling is manual by design for MVP safety.

## Safety notes

- Requests are tracked, not auto-executed
- Confirmation phrase is required before request submission
- Duplicate open requests of the same type from the same requester are blocked
- Workspace deletion is intentionally not exposed to members or viewers
- This slice does not claim full legal-compliance workflow coverage

## Founder audit notes

- Never imply deletion is immediate from the app UI
- Keep the UI explicit that requests are reviewed manually
- Use strong confirmation phrases for dangerous actions
- Preserve a clean distinction between:
  - request submitted
  - request approved
  - deletion actually executed
- Do not expose hard-delete behavior until the architecture and legal process are
  intentionally designed for it

## What is request-only vs actually executed

Actually executed:

- request submission
- request persistence
- duplicate-open-request prevention
- admin visibility
- admin status updates

Not executed by this slice:

- user-initiated hard deletion
- automatic workspace removal
- account anonymization
- legal retention processing
- downstream third-party data deletion
- automated export or confirmation packages
