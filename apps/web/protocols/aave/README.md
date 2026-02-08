# Aave Protocol Module

Self-contained protocol module for Aave integration in Aquarius DeFi Lab.

## Folder Structure

```
protocols/aave/
├── README.md           # This file
├── index.ts            # Main exports
├── metadata.ts         # Protocol metadata
├── overview.tsx        # Main overview component (Screen 2)
├── opportunities.tsx   # Opportunities UI (Screen 3)
├── activity.tsx        # Live on-chain activity (Screen 4)
├── risk.tsx            # Risk dashboard (Screen 5)
├── insights.tsx        # Account-gated insights (Screen 6)
├── layout.tsx          # Protocol-specific layout with sub-nav
└── web3/
    ├── chains.ts       # Blockchain configuration
    ├── contracts.ts    # Smart contract addresses
    └── adapters.ts     # Protocol adapters / web3 helpers
```

## Usage

Import from `@/protocols/aave`:

```tsx
import { AaveOverview } from "@/protocols/aave/overview";
import { AaveOpportunities } from "@/protocols/aave/opportunities";
import { AaveLayout } from "@/protocols/aave/layout";
```

## Sections (assembled in overview.tsx)

1. **Overview** — Protocol metrics (TVL, Utilization, Liquidations, Risk Level)
2. **Opportunities** — Yield opportunities table (Asset, Action, APY, Risk, etc.)
3. **Activity** — Real-time on-chain activity feed
4. **Risk** — Protocol-level risk metrics and health factors
5. **Insights** — Account-gated premium insights (requires auth)

Section navigation uses anchor links (#overview, #opportunities, etc.) on a single page.

## Adding Features

1. Add web3 logic to `web3/adapters.ts`
2. Wire real data in the component files
3. Update exports in `index.ts` if adding new components
