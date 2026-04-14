# Mutation routes — security review checklist (Phase 8)

Use this checklist before declaring **production-ready** behavior for routes that **change state**, **start jobs**, or **invoke simulations**. It is a **human** sign-off aid, not an automated gate.

## Scope (examples)

- `POST /api/v1/vault-gateway/intents`
- `POST /api/v1/copilot/chat`
- `POST /api/v1/kamino-risk/repay/simulate`
- `POST /api/v1/agent-enrollment/*`
- `POST /api/v1/zg/pipeline`
- `POST /api/cre/demo`
- `POST /api/internal/*` (operator-only; separate review)

Reference: [`docs/api/public-surface.md`](../api/public-surface.md).

## Checklist

| # | Item | Pass |
|---|------|------|
| 1 | **Input validation:** Request bodies and querystrings validated with **Zod** (or equivalent strict schema); reject unknown fields where product requires it. | |
| 2 | **Authentication:** Mutations that must not be anonymous require **Bearer**, shared secret, or other explicit auth; failure returns **401/403** without leaking why the secret was wrong beyond “unauthorized”. | |
| 3 | **Rate limiting:** Public mutation routes are covered by `@fastify/rate-limit` (global and/or per-route); limits documented in config / runbooks. | |
| 4 | **Idempotency:** Where retries are expected (`vault-gateway` intents), **idempotency keys** are honored per product spec. | |
| 5 | **Error responses:** No **stack traces** or raw internal exceptions in JSON to clients; stable error shape for unhandled errors ([`register-public-error-handler.ts`](../../apps/api/src/http/register-public-error-handler.ts)). | |
| 6 | **Logging:** Logs redact secrets and sensitive payloads per [`.cursor/rules/security.mdc`](../../.cursor/rules/security.mdc). | |
| 7 | **Authorization:** Authentication is not confused with authorization—sensitive operations check the right principal/policy (where applicable). | |
| 8 | **Dependency failures:** Upstream RPC or provider failures return **502/503/504** as appropriate with safe messages (no internal hostnames in client bodies). | |

## Sign-off

| Role | Name | Date | Scope / commit SHA | Notes |
|------|------|------|----------------------|-------|
| Reviewer | | | | |
| Reviewer | | | | |

## Exit criteria (Phase 8)

- At least one reviewer has checked items **1–6** for **`POST /api/v1/vault-gateway/intents`** in the target release.
- Remaining items verified as **N/A** or **follow-up** with ticket IDs recorded in the last column.
