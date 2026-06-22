# Secret Rotation Runbook

Last updated: 2026-06-23

## `APP_SECRET`

Current use:

- HMAC-hashes durable rate-limit bucket keys before they are stored in
  `rate_limit_hits`.

Rotation impact:

- Does not break sessions, verification links, reset links, invite links,
  encrypted records, admin access, or workspace data.
- Existing rate-limit buckets become unreachable under the new hash and naturally
  age out.

Safe rotation:

1. Generate a new high-entropy value.
2. Update `APP_SECRET` in Vercel and local secret stores.
3. Redeploy.
4. Confirm signup/login/reset endpoints still rate limit and auth still works.

## `ENCRYPTION_KEY`

Current use:

- Encrypts stored agentic diagnosis outputs in `agentic_diagnoses.output_ciphertext`.

Rotation impact:

- Rotating without migration prevents decrypting previously stored agentic
  diagnosis ciphertext.
- It does not affect sessions, verification links, reset links, invite links,
  admin access, or normal workspace/profile data.

Rotation strategy:

1. Add key versioning before rotating production data.
2. Store new records with the new key version.
3. Re-encrypt old ciphertext in batches from old key to new key.
4. Keep the old key available until all old ciphertext is re-encrypted and
   verified.

Do not rotate `ENCRYPTION_KEY` in production without a tested re-encryption
script or explicit decision to discard old encrypted agentic outputs.
