# Lido Protocol Module

Self-contained protocol module for Lido integration in Aquarius DeFi Lab.

## Folder Structure

```
protocols/lido/
├── README.md           # This file
├── index.ts            # Main exports
├── metadata.ts         # Protocol metadata
├── overview.tsx        # Main overview component
├── opportunities.tsx   # Staking opportunities UI
├── activity.tsx        # Live staking activity
├── risk.tsx            # Slashing/risk dashboard
├── insights.tsx        # Account-gated insights
├── layout.tsx          # Protocol-specific layout
└── web3/
    ├── chains.ts       # Blockchain configuration
    ├── contracts.ts    # stETH/wstETH addresses
    └── adapters.ts     # Protocol adapters
```

## Status

**Preview** — Data integration pending.

## Usage

```tsx
import { LidoOverview } from "@/protocols/lido/overview";
import { LidoLayout } from "@/protocols/lido/layout";
```
