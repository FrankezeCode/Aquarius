import { AaveRiskMonitor } from "@/protocols/aave/aave-risk-monitor";

/**
 * Aave Protocol Page — Routing Bridge
 *
 * This page acts purely as a routing bridge.
 * All business logic, UI, and data composition live in:
 * apps/web/protocols/aave/aave-risk-monitor.tsx
 *
 * Pattern: For other protocols (Compound, Lido, Uniswap), follow the same structure:
 * - Import the protocol's risk monitor from @/protocols/{protocol}/{protocol}-risk-monitor
 * - Render it as the default export
 * - Keep this file logic-free
 */
export default function AavePage() {
  return <AaveRiskMonitor />;
}
