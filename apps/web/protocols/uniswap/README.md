# Uniswap Protocol Module

Self-contained protocol module for Uniswap integration in Aquarius DeFi Lab.

## Folder Structure

```
protocols/uniswap/
├── README.md           # This file
├── index.ts            # Main exports
├── metadata.ts         # Protocol metadata
├── overview.tsx        # Main overview component
├── opportunities.tsx   # LP opportunities UI
├── activity.tsx        # Live swap/LP activity
├── risk.tsx            # IL risk dashboard
├── insights.tsx        # Account-gated insights
├── layout.tsx          # Protocol-specific layout
└── web3/
    ├── chains.ts       # Blockchain configuration
    ├── contracts.ts    # Router/factory addresses
    └── adapters.ts     # Protocol adapters
```

## Status

**Preview** — Data integration pending.

## Usage

```tsx
import { UniswapOverview } from "@/protocols/uniswap/overview";
import { UniswapLayout } from "@/protocols/uniswap/layout";
```
