# Aave Protocol API

Protocol-first API module for Aave integration in Aquarius DeFi Lab.

## Purpose

This folder contains all Aave-specific API logic: internal admin/ingestion routes, chain-specific endpoints, and public signals/streams. Adding or modifying Aave behavior requires changes only in this folder.

## Supported Chains

- **Ethereum**
- **Arbitrum**
- **Base**
- **Solana**

Each chain exposes: `events`, `liquidity`, `whales` endpoints.

## Internal Endpoints (admin/operational)

| Path | Description |
|------|-------------|
| `/internal/indexing` | Indexing triggers and status |
| `/internal/ingestion` | Data ingestion pipeline |
| `/internal/monitoring` | Health and metrics |

## Public Endpoints

### Chains

`/chains/{chain}/events`, `/chains/{chain}/liquidity`, `/chains/{chain}/whales`

### Signals

| Path | Description |
|------|-------------|
| `/public/signals/hf-risk` | High-frequency risk signals |
| `/public/signals/oracle-anomaly` | Oracle divergence alerts |

### Streams

| Path | Description |
|------|-------------|
| `/public/streams/liquidations` | Liquidation events |
| `/public/streams/mempool` | Mempool activity |
| `/public/streams/price-shocks` | Price shock events |

## Extensibility

- **analytics/** — Protocol-specific analytics (placeholder)
- **jobs/** — Background jobs (placeholder)
- **adapters/** — Web3/chain adapters (placeholder)

## Adding a New Chain

1. Create `chains/{chain}/index.ts`, `events.ts`, `liquidity.ts`, `whales.ts`
2. Register in `chains/index.ts`
