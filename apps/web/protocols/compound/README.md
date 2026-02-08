# Compound Protocol Module

Self-contained protocol module for Compound integration in Aquarius DeFi Lab.

## Folder Structure

```
protocols/compound/
├── README.md           # This file
├── index.ts            # Main exports
├── metadata.ts         # Protocol metadata
├── overview.tsx        # Main overview component
├── opportunities.tsx   # Lending opportunities UI
├── activity.tsx        # Live lending activity
├── risk.tsx            # Risk dashboard
├── insights.tsx        # Account-gated insights
├── layout.tsx          # Protocol-specific layout
└── web3/
    ├── chains.ts       # Blockchain configuration
    ├── contracts.ts    # cToken/Comptroller addresses
    └── adapters.ts     # Protocol adapters
```

## Status

**Preview** — Data integration pending.

## Usage

```tsx
import { CompoundOverview } from "@/protocols/compound/overview";
import { CompoundLayout } from "@/protocols/compound/layout";
```
