# Aquarius API

Protocol-first API backend for Aquarius DeFi Lab. Supports multiple DeFi protocols, chain-specific adapters, internal and public endpoints.

## Structure

```
api/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middleware/
│   └── routes/protocol/
│       ├── aave/
│       │   ├── internal/     # Admin, ingestion, monitoring
│       │   ├── chains/       # Chain-specific (ethereum, arbitrum, base, solana)
│       │   ├── public/       # Signals, streams
│       │   ├── analytics/    # Placeholder
│       │   ├── jobs/         # Placeholder
│       │   └── adapters/     # Placeholder
│       └── uniswap/
│           └── (same structure)
```

## API Routes

### Base URL

`/api/v1/protocol/{protocol}`

### Protocols

- **aave** — Aave lending protocol
- **uniswap** — Uniswap DEX

### Per-Protocol Routes

| Path | Description |
|------|-------------|
| `/internal/indexing` | Indexing triggers |
| `/internal/ingestion` | Data ingestion |
| `/internal/monitoring` | Health and metrics |
| `/chains/{chain}/events` | Chain events |
| `/chains/{chain}/liquidity` | Liquidity data |
| `/chains/{chain}/whales` | Whale activity |
| `/public/signals/hf-risk` | HF risk signals |
| `/public/signals/oracle-anomaly` | Oracle anomaly alerts |
| `/public/streams/liquidations` | Liquidation stream |
| `/public/streams/mempool` | Mempool stream |
| `/public/streams/price-shocks` | Price shock stream |

### Supported Chains

Ethereum, Arbitrum, Base, Solana (per protocol)

## Design Rules

- **Protocol is a namespace** — `/api/v1/protocol/aave/...` not `?protocol=aave`
- **Separation of concerns** — Internal vs public vs chains
- **Extensible** — Add new protocol by copying folder structure and registering

## Adding a New Protocol

1. Copy `routes/protocol/aave/` to `routes/protocol/{name}/`
2. Update exports and route names
3. Register in `routes/protocol/index.ts`
