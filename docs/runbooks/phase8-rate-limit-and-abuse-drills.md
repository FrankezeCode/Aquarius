# Phase 8 — Rate limit and abuse drills

Goal: verify that **public** routes remain bounded under burst traffic and that operators know how to interpret **429** responses. This is a **procedure**, not an automated load test checked into CI (operators run tools locally with their own base URLs).

## Preconditions

- Know your deployment base URL (for example `https://api.example.com`).
- Know which limits apply from [`apps/api/src/config/index.ts`](../../apps/api/src/config/index.ts) and env:

| Variable | Default (see config) | Scope |
|----------|----------------------|--------|
| `RATE_LIMIT_ENABLED` | on in non-`test` | Master switch |
| `RATE_LIMIT_PUBLIC_MAX` | 180/min | `/api/v1` global wrapper |
| `RATE_LIMIT_VAULT_GATEWAY_INTENTS_MAX` | 24/min | `POST /api/v1/vault-gateway/intents` |
| `RATE_LIMIT_COPILOT_MAX` | 24/min | `POST /api/v1/copilot/chat` |
| `RATE_LIMIT_KAMINO_WRITE_MAX` | 24/min | Kamino write/simulate route |
| `RATE_LIMIT_CRE_MAX` | 30/min | `/api/cre/*` |
| `RATE_LIMIT_INTERNAL_WEBHOOK_MAX` | 480/min | `/api/internal/*` |

## Drill A — expect 429 on excessive GET `/api/v1/...`

1. Temporarily lower `RATE_LIMIT_PUBLIC_MAX` in a **staging** env (for example `20`) or use a script that exceeds the production limit.
2. From a single client IP, issue rapid GETs to a safe read-only route (for example `/api/v1/aave-risk/health` if available, or `/health` on the API host).
3. **Pass:** HTTP **429** (or plugin-specific rate-limit response) before the server becomes unstable.
4. **Log check:** No stack traces returned to the client; JSON matches Phase 8 error shape if the failure is routed through the global handler (`error`, `message`, optional `requestId`). Some plugins may return their own 429 body—still acceptable if no secrets leak.

## Drill B — vault intents Bearer route

1. With `VAULT_GATEWAY_EXECUTION_ENABLED=true` and a valid Bearer in **staging only**, call `POST /api/v1/vault-gateway/intents` repeatedly with unique `idempotencyKey` values until limited.
2. **Pass:** 429 or rejection consistent with `@fastify/rate-limit` config for that route; no raw internal errors in the response body.

## Drill C — optional k6 / Artillery (local only)

Operators may use k6 or Artillery with:

- **Base URL** and **paths only** from [`docs/api/public-surface.md`](../api/public-surface.md).
- **No secrets** in committed scripts; pass tokens via env at runtime.

Example pattern (not a committed artifact):

```bash
# hypothetical — set K6_BASE_URL and optional K6_BEARER in the shell only
# k6 run -e K6_BASE_URL=https://staging.example.com script.js
```

## Rollback

Restore original `RATE_LIMIT_*` values and redeploy or reload config.

## Related

- [`docs/api/public-surface.md`](../api/public-surface.md)
- [`docs/runbooks/phase8-key-rotation.md`](./phase8-key-rotation.md)
