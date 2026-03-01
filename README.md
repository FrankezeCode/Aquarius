# Aquarius DeFi Lab

API-first, real-time DeFi intelligence system. The API is the product; the web UI is one consumer.

Each DeFi protocol is treated as a **self-contained world** with its own
activity, opportunities, and risk — not as a filter on a dashboard.


## Core Ideas
- Protocols are namespaces, not parameters
- APIs are the product
- UI is a lens, not the source of truth
- Real-time signals > static charts
  

## Repository Structure

- **`apps/web`** — Next.js frontend (App Router)
- **`apps/api`** — Public + internal APIs → `/api/v1/public/*`, internal under `/api/v1/internal/*`.
- **`services/`** — Indexers (ethereum, arbitrum, solana, base), event-engine, prediction-engine, scheduler.
- **`packages/`** — `sdk-js`, `types`, `utils`. Shared contracts, types, utilities and SDK 
- **`infra/`** — Deployment & observability  → Docker, Terraform, Kubernetes, monitoring (placeholder).
- **`docs/`** — Product + system documentation → Architecture, API, protocols, roadmap.

## Philosophy
Clarity beats cleverness.
Isolation beats entanglement.
Signals beat opinions.


## Prerequisites

- Node.js ≥ 20
- pnpm 9+

## Setup

```bash
pnpm install
cp .env.example .env
```

## Aave Tenderly Validation Mode

Use this profile during simulation validation to force Aave routes and CRE monitoring
to consume Tenderly-backed data only.

```bash
DATA_PROVIDER_MODE=tenderly
AAVE_VALIDATION_REQUIRE_TENDERLY=1
```

Behavior:
- Aave validation endpoints return `503` if mode is not `tenderly`
- Mock mode remains available only when explicitly selected (`DATA_PROVIDER_MODE=mock`)
- Prevents accidental drift between Tenderly validation and mock/onchain paths
- Unified user card contract endpoint: `GET /api/v1/aave-risk/user-risk/:address`

Chain-aware validation (current active scope: Ethereum + Polygon):
- Optional Tenderly per-chain overrides:
  - `TENDERLY_RPC_URL_ETHEREUM`
  - `TENDERLY_RPC_URL_POLYGON`
- Optional onchain per-chain overrides:
  - `RPC_URL_ETHEREUM`
  - `RPC_URL_POLYGON`
- If per-chain vars are unset, Aquarius falls back to `TENDERLY_RPC_URL` / `RPC_URL`.

## Phase B Policy Binding (Hard-fail + Full Disable)

Phase B adds strict on-chain-authoritative policy activation/deactivation for agent enrollment.

Required flags for Phase B validation:

```bash
PHASE_B_POLICY_BINDING=1
NEXT_PUBLIC_PHASE_B_POLICY_BINDING=1
DATA_PROVIDER_MODE=tenderly
AAVE_VALIDATION_REQUIRE_TENDERLY=1
```

Required contract envs:

- `POLICY_BINDING_CONTRACT_ETHEREUM`
- `POLICY_BINDING_CONTRACT_POLYGON`

Behavior:

- Save in enrollment flow follows `bind-intent -> MetaMask tx -> confirm-bind`
- Deactivation follows `deactivate-intent -> MetaMask tx -> confirm-deactivate`
- On success, enrollment status becomes `active` (bind) or `inactive` (deactivate)
- On signing/tx failure, operation hard-fails and no activation/deactivation transition is finalized
- Binding/deactivation endpoints fail closed outside Tenderly validation mode

## Commands

| Command    | Description                |
| ---------- | -------------------------- |
| `pnpm build` | Build all workspaces       |
| `pnpm dev`   | Run dev (web, api, etc.)   |
| `pnpm lint`  | Lint all workspaces        |
| `pnpm test`  | Run tests                  |
| `pnpm dev --filter web` | Run dev (web, api, etc.)     |
| `pnpm dev --filter api` | Run dev (api, api, etc.)     |
| `pnpm run:agent` | Run agent  |
| `pnpm run:cre` | Run CRE SIMULATION  |
| `pnpm run:cre` | Run CRE SIMULATION  |

 
pnpm run run:full-validation

## Run locally

- **Web:** `pnpm --filter @aquarius/web dev` → [http://localhost:3000](http://localhost:3000)
- **API:** `pnpm --filter @aquarius/api dev` → [http://localhost:3001](http://localhost:3001), health at `/health`

## Principles

- APIs are the product; UI is a consumer.
- Protocol logic is isolated. See `docs/architecture.md` and `.cursor/rules/`.
