# Phase 8 — Key rotation (Bearer and shared secrets)

Aquarius uses **environment variables** for credentials—never commit real values. This runbook describes **dual-secret overlap** rotation for shared Bearer tokens and HMAC-style secrets used by the API.

## Principles

1. **Overlap:** Add the new secret while the old one remains valid; migrate clients; remove the old secret after traffic drops to zero on the old value.
2. **Never** log secret values or echo them in API responses (see [`.cursor/rules/security.mdc`](../../.cursor/rules/security.mdc)).
3. Prefer **comma-separated lists** where the product supports multiple concurrent values.

## Vault gateway intent Bearer (`VAULT_GATEWAY_INTENT_TOKENS` / `VAULT_GATEWAY_INTENT_TOKEN`)

Used by:

- `POST /api/v1/vault-gateway/intents`
- `GET /api/v1/vault-gateway/jobs/:jobId`

**Rotation:**

1. Generate a new high-entropy token (for example `openssl rand -hex 32`).
2. Set `VAULT_GATEWAY_INTENT_TOKENS=oldToken,newToken` (comma-separated per [`apps/api/src/config/index.ts`](../../apps/api/src/config/index.ts)).
3. Deploy; verify staging clients can authenticate with **either** token.
4. Update all clients to the new token only.
5. Remove the old token from the env string; redeploy.

**Rollback:** Re-add the previous token to the list and redeploy.

## CRE vault workflow trigger (`CRE_VAULT_WORKFLOW_TRIGGER_TOKEN`)

If remote CRE triggers are enabled, rotate similarly: deploy with two accepted tokens at the orchestration/trigger boundary if the upstream supports it; otherwise schedule a short maintenance window and swap in one step (document blast radius).

## Internal vault job callback (`INTERNAL_VAULT_JOB_CALLBACK_SECRET`)

Used to authenticate `POST` callbacks into Aquarius (vault job completion path). Coordinate rotation with whatever system **sends** the callback:

1. Set the new secret in Aquarius and in the sender (same overlap pattern if the sender can send both headers during migration).
2. Verify one successful end-to-end job completion in staging.
3. Remove the old secret from both sides.

## Confidential / other HTTP tokens

- `CRE_CONFIDENTIAL_HTTP_TOKEN`, `CRE_CONFIDENTIAL_CALLBACK_URL` — rotate per operator security policy; always test Tenderly/confidential paths in staging first.

## Verification checklist

- [ ] Staging `POST` vault intent succeeds with new Bearer after overlap deploy.
- [ ] Old Bearer rejected only after removal step (expected).
- [ ] Logs contain **no** token material (grep CI/staging logs for accidental prints during tests).
- [ ] Runbook updated date in your ticket / change record.

## Related

- [`docs/api/public-surface.md`](../api/public-surface.md)
- [`docs/runbooks/phase8-rate-limit-and-abuse-drills.md`](./phase8-rate-limit-and-abuse-drills.md)
