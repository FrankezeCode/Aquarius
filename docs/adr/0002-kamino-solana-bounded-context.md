# ADR 0002: Kamino on Solana — bounded context surface

## Status

Accepted (implements follow-up from [ADR 0001](0001-domains-and-boundaries.md) § Risk metadata evolution).

## Context

ADR 0001 reserved **non-EVM** risk modeling for a later change. The **`kamino-solana`** domain now has a concrete read model, intelligence layer, CRE integration, and a narrow write/simulation path.

## Decision

### 1. Canonical snapshot

- **`KaminoRiskSnapshot`** in `@aquarius/types` (`packages/types/risk/kamino.ts`) is the protocol contract for read-path intelligence.
- **Metadata:** `protocol: "kamino"`, `chainId: 0` (sentinel for non-EVM), `solanaCluster` required via `KaminoRiskMetadata`.

### 2. Layering

- **Klend / Solana SDK** usage is confined to **`apps/api/src/infrastructure/kamino/`** (and web **`apps/web/adapters/kamino-solana/`** for future client-side work).
- **`protocols/kamino-solana`** holds scoring, copilot, mappers, policy — **no** direct `@solana/*` or `@kamino-finance/*` imports (enforced by `check-domain-boundaries.mjs`).

### 3. Mitigation vs execution

- **Phase C/D:** API exposes **simulation/dry-run** and **mitigation intents**; **no custodial signing** or broadcast from the API in current scope.
- Escalation stages align with **`CreEscalationStage`** (`@aquarius/types`) shared with Aave surfaces.

### 4. CRE

- Workflows use IDs `kamino-risk`, `kamino-risk-monitor`, `kamino-risk-confidential-http` (see `cre-webhook.ts`).
- Optional CRE workflow package: **`workflows/kamino-risk/`** (stub cron, mirrors `aave-risk` layout).

## Consequences

- New Kamino features extend **`kamino-solana`** modules or **`infrastructure/kamino`** unless a new ADR splits concerns.
- Load and production SLOs remain operator-owned; see [hardening checklist](../security/kamino-solana-hardening.md).
