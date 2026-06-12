# Public API surface — advisory vs execution (Phase 8)

This document maps **HTTP routes** to a coarse **trust / side-effect class** so integrators know what is read-only intelligence vs what can trigger orchestration, writes, or operational side effects. It complements per-route `disclosureKind` fields (for example on vault-gateway GETs).

**Base URLs**

| Prefix | Purpose |
|--------|---------|
| `/api/v1` | Versioned public product API (global rate limit when enabled; see [`apps/api/src/config/index.ts`](../../apps/api/src/config/index.ts) `RATE_LIMIT_*`). |
| `/api/cre` | CRE workflow HTTP helpers (separate rate limit). |
| `/api/internal` | **Not for public integrators** — ingestion, metrics, operator callbacks. |

## Classification legend

| Class | Meaning |
|-------|---------|
| **Read / advisory** | GET (or equivalent) returning intelligence, routing, or health; no durable workflow side effects intended for the caller. Still not financial advice. |
| **Read + side effects** | May trigger server work (orchestration jobs, RPC load); treat as non-cacheable and potentially costly. |
| **Execution / mutation** | POST (or write) that changes server-side state, starts jobs, or runs simulations that must be authenticated/rate-limited per route. |

## `/api/v1` — product routes

| Method | Path (suffix after `/api/v1`) | Class | Auth / notes |
|--------|------------------------------|-------|----------------|
| GET | `/protocol/...` | Read / advisory | Stubs/streams as implemented under [`routes/protocol`](../../apps/api/src/routes/protocol/). |
| GET | `/aave/...`, `/uniswap/...`, `/lido/...` | Read / advisory | Protocol adapters. |
| GET | `/aave-risk/*` | Read / advisory | Risk intelligence (health, user risk, stress, etc.). |
| POST | `/copilot/chat` | Read + side effects | LLM call; stricter rate limit (`RATE_LIMIT_COPILOT_MAX`). |
| POST | `/zg/pipeline` | Read + side effects | ZG pipeline work. |
| GET | `/vault-gateway/manifest` | Read / advisory | Architecture manifest + `executionBackedDelegation` when applicable. |
| GET | `/vault-gateway/routing` | Read / advisory | Advisory routing + per-sleeve `delegationExecution`. |
| POST | `/vault-gateway/intents` | **Execution / mutation** | Starts orchestration when `VAULT_GATEWAY_EXECUTION_ENABLED`; Bearer token. See [ADR 0003](../adr/0003-phase0-orchestration-and-execution.md), [`post-intents.ts`](../../apps/api/src/routes/v1/vault-gateway/post-intents.ts). |
| GET | `/vault-gateway/jobs/:jobId` | Read + side effects | Polls job store; Bearer token. |
| GET | `/aave-risk/arbitrum/agent-pack/:address` | Read / advisory | Arbitrum buildathon bundle: user risk + CRE workflow + policy guard env hint. |
| GET | `/kamino-risk/health`, `/kamino-risk/snapshot` | Read / advisory | Solana/Kamino reads. |
| POST | `/kamino-risk/repay/simulate` | **Execution / mutation** (simulation) | Dry-run / simulate path; policy + dedicated rate limit (`RATE_LIMIT_KAMINO_WRITE_MAX`). |
| POST | `/agent-enrollment/*` | **Execution / mutation** | Enrollment and demo flows (multiple POSTs under [`agent-enrollment`](../../apps/api/src/routes/v1/agent-enrollment/index.ts)). |

Details for vault intents and workflow ids: [`docs/vault-strategy.md`](../vault-strategy.md) section 2.

## `/api/cre`

| Method | Path | Class | Notes |
|--------|------|-------|--------|
| GET | `/api/cre/run` | Read + side effects | Submits CRE orchestration via [`registerCRERoutes`](../../apps/api/src/routes/cre/index.ts); not a cacheable “pure read”. |
| POST | `/api/cre/demo` | **Execution / mutation** | Full demo / simulation path. |

## `/api/internal` (operator / service only)

| Area | Class | Notes |
|------|-------|--------|
| `/api/internal/ingest/*` | **Execution / mutation** | Webhooks (e.g. CRE webhook, vault job callback) — shared secrets, not public Bearer for integrators. |
| `/api/internal/metrics/*`, `/api/internal/vault/*` | Read + side effects / internal | Operational and buffer health; **internal disclosure** only. |

Do not document internal URLs in public SDKs without an explicit operator contract.

## Error responses (Phase 8)

Unhandled errors and **unknown routes** return a stable JSON shape (no stack traces):

`{ "error": string, "message": string, "requestId"?: string }`

See [`apps/api/src/http/register-public-error-handler.ts`](../../apps/api/src/http/register-public-error-handler.ts) (`setErrorHandler` + `setNotFoundHandler`). Routes that already return their own structured bodies (for example Kamino validation with `issues`) are unchanged.

## Related

- Vault-gateway narrative + POST contract: [`docs/vault-strategy.md`](../vault-strategy.md)
- Ops: rate-limit drills [`../runbooks/phase8-rate-limit-and-abuse-drills.md`](../runbooks/phase8-rate-limit-and-abuse-drills.md), key rotation [`../runbooks/phase8-key-rotation.md`](../runbooks/phase8-key-rotation.md)
