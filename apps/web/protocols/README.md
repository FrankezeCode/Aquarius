# Protocols

Self-contained, fat protocol modules for Aquarius DeFi Lab.

## Structure

Each protocol has its own folder. **overview.tsx** assembles all sections on a single page; section navigation uses anchor links (#overview, #opportunities, etc.):

```
protocols/{protocol}/
├── README.md           # Protocol-specific documentation
├── index.ts            # Main exports
├── metadata.ts         # Protocol metadata (id, name, category, status)
├── overview.tsx        # Assembles all sections (Overview + Opportunities + Activity + Risk + Insights)
├── opportunities.tsx   # Opportunities UI
├── activity.tsx        # Live activity feed
├── risk.tsx            # Risk dashboard
├── insights.tsx        # Account-gated insights
├── layout.tsx          # Protocol-specific layout with anchor-based sub-nav
└── web3/
    ├── chains.ts       # Blockchain configuration
    ├── contracts.ts    # Contract addresses
    └── adapters.ts     # Protocol adapters / web3 helpers
```

## Available Protocols

| Protocol | Status  | Category |
|----------|---------|----------|
| Aave     | active  | lending  |
| Uniswap  | preview | dex      |
| Compound | preview | lending  |
| Lido     | preview | staking  |

## Adding a New Protocol

1. Copy an existing protocol folder (e.g. `aave/`)
2. Rename to the new protocol (e.g. `gmx/`)
3. Update `metadata.ts` with the new protocol info
4. Implement the UI components and web3 adapters
5. Add to `protocols/index.ts`
6. Create a thin route page: `app/protocol/{protocol}/page.tsx` that imports and renders the overview

## Usage

```tsx
import { AaveOverview, AaveLayout } from "@/protocols/aave";
import { protocols, protocolIds } from "@/protocols";
```
