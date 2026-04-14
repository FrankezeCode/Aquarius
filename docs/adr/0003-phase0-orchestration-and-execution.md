# ADR 0003: Phase 0 — Orchestration rail, custody, environments, and comms

## Status

Accepted

## Date

2026-03-28

## Context

Vault-gateway and downstream execution work ([`docs/vault-strategy.md`](../vault-strategy.md)) require **locked decisions** before implementing `OrchestrationPort`, vault-gateway `POST` intents, or wiring mutations. ADR 0001 already states that **orchestration (CRE)** stays **workflow-oriented and domain-neutral** at the spine; this ADR **narrows** how mutations enter that spine and how we communicate externally.

Constraints:

- [`docs/vault-strategy.md`](../vault-strategy.md) sketches **advisory GETs today** and **proposed POST** execution intents.
- Workspace security rules: no secrets in logs; validate payloads (e.g. Zod); rate-limit public mutation routes when added.
- Fastify route handlers must **not** hold private keys.

## Decision

### 1. Execution rail (single orchestration entry)

**Chosen pattern:** A thin **`OrchestrationPort`** (application port) is the **only** application-level entry for automated mitigation / vault execution intents that require orchestration. The **default implementation** delegates to **Chainlink CRE workflows** (existing orchestration path described in the root [`README.md`](../../README.md)).

- **Rationale:** One stable interface for domain services and HTTP facades; unit tests mock the port; CRE remains the concrete workflow engine without protocol logic leaking into routes.
- **Not chosen as the public API shape:** Exposing “call CRE directly” from protocol modules or vault-gateway handlers without going through the port.

**Rule:** No protocol bounded context (`protocols/aave`, etc.) imports CRE internals directly—only the port implementation in infrastructure.

### 2. Custody model (who signs)

| Layer | Role |
|-------|------|
| **Fastify / public API** | Never stores or uses private keys for chain execution. |
| **Orchestration (CRE) + configured signer path** | Holds or reaches **deployment-scoped** signing for automated workflows via **KMS / HSM / CRE-attached signer / external signer service** as chosen per environment—**not** in application source. |
| **User wallet (edge)** | User-signed transactions for non-custodial paths remain **wallet-side**; API returns intents or payloads for signing where applicable. |

**Rule:** If a key exists for automated execution, it is **outside** route handlers and **not** committed to the repo.

### 3. Environments (when POST execution is allowed)

| Environment | POST execution intents |
|-------------|-------------------------|
| **Local / dev** | Allowed when **`ORCHESTRATION_EXECUTION_MODE=mock`** (or equivalent): port returns deterministic fake `jobId` / no chain I/O. Safe default for developers. |
| **Staging** | Allowed with **real CRE** (or staging CRE) and **testnet** endpoints; feature flag **`VAULT_GATEWAY_EXECUTION_ENABLED=true`** required for route registration or handler branching. |
| **Production** | **`VAULT_GATEWAY_EXECUTION_ENABLED`** defaults to **`false`**. Must be explicitly set to `true` after security review. Advisory **GET** routes remain available regardless. |

**Rule:** Production never enables POST execution by default without an explicit env opt-in and operational checklist.

*Exact env var names may be adjusted in implementation; semantics above are binding.*

### 4. Comms (yield, buffer, validation language)

- **North-star vs shipped:** All user-facing and marketing copy must **separately** label **target architecture** (validators, buffer insurance narrative, full agent automation) vs **currently deployed** features. Primary reference: [`docs/vault-strategy.md`](../vault-strategy.md) (Live vs Roadmap sections).
- **Yield / insurance-like / validation claims:** Require **legal and product review** before broad public use; engineering docs may describe intent using the same Live/Roadmap discipline.
- **API responses:** Distinguish **advisory** (`GET`) from **submitted workflow** (`POST` accepted) in response DTOs when execution ships.

## Consequences

- **Allowed next:** Define `OrchestrationPort` in shared/application; implement `CreOrchestrationAdapter`; add vault-gateway `POST` behind authz, rate limits, Zod, and the env gates above.
- **Disallowed until waived in writing:** Raw CRE calls from protocol routes; keys in Fastify; production POST without explicit enablement.
- **Follow-up:** Phase 2+ implementation tasks should reference this ADR; amend via new ADR if execution rail or custody model changes materially.

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | _pending_ | |
| Product | _pending_ | |
| Legal (comms) | _pending_ | |

_Replace sign-off table when owners confirm; Status remains Accepted for implementation gating once engineering lead approves._
