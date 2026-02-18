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


 


## Run locally

- **Web:** `pnpm --filter @aquarius/web dev` → [http://localhost:3000](http://localhost:3000)
- **API:** `pnpm --filter @aquarius/api dev` → [http://localhost:3001](http://localhost:3001), health at `/health`

## Principles

- APIs are the product; UI is a consumer.
- Protocol logic is isolated. See `docs/architecture.md` and `.cursor/rules/`.
