import { KaminoRiskMonitor } from "@/protocols/kamino/kamino-risk-monitor";

/**
 * Kamino Protocol Page — Routing Bridge (mirrors protocol/aave/page.tsx).
 * All Kamino lending UI composition lives in protocols/kamino/kamino-risk-monitor.tsx.
 */
export default function KaminoProtocolPage() {
  return <KaminoRiskMonitor />;
}
