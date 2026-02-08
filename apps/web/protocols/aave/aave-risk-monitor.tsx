"use client";

import { useState } from "react";

import {
  ProtocolStatusBadge,
  RiskFactorCards,
  RiskProgressionBar,
  LiveRiskEventFeed,
  ConnectWalletCTA,
  PositionRiskStatus,
  EnableAlertsCTA,
  DeveloperFooter,
  type RiskFactor,
  type RiskProgression,
  type RiskEvent,
  type PositionMetrics,
} from "@/components/aave-risk-monitor";

/**
 * Aave Risk Monitor Page
 * 
 * Aquarius is not a dashboard — it's a real-time DeFi risk & decision sentinel.
 * This page represents selvä Core in action: DATA → selvä → CLARITY
 * 
 * User Journey (enforced):
 * 1. Is Aave safe right now?
 * 2. Why is it safe or unsafe?
 * 3. Is my position safe?
 * 4. Alert me if this changes
 * 
 * Target Users:
 * - Users with funds already in Aave
 * - Developers integrating via selvä SDK
 */

// Mock data — will be replaced with real-time data from selvä
const MOCK_RISK_FACTORS: RiskFactor[] = [
  { id: "liquidation", label: "Liquidation Pressure", value: "$18.4M / 24h", direction: "up" },
  { id: "tvl", label: "TVL Flow", value: "–$92M (6h)", direction: "down" },
  { id: "oracle", label: "Oracle Deviation", value: "0.7%", direction: "neutral" },
  { id: "uptime", label: "Protocol Uptime", value: "99.98%", direction: "neutral" },
];

const MOCK_PROGRESSION: RiskProgression = {
  infoCount: 2,
  confirmCount: 5,
  invalidateCount: 0,
  activeStage: "confirm",
};

const MOCK_EVENTS: RiskEvent[] = [
  { id: "1", timestamp: "12:41:08", message: "$6.2M USDC withdrawn from Aave", severity: "info" },
  { id: "2", timestamp: "12:40:51", message: "WETH liquidation velocity +21%", severity: "warning" },
  { id: "3", timestamp: "12:39:44", message: "Oracle deviation reached 1.3%", severity: "warning" },
  { id: "4", timestamp: "12:38:22", message: "Large position opened: $4.1M ETH collateral", severity: "info" },
  { id: "5", timestamp: "12:37:15", message: "Governance proposal #127 passed", severity: "info" },
];

const MOCK_POSITION_METRICS: PositionMetrics = {
  healthFactor: "1.21",
  healthFactorDirection: "down",
  liquidationDistance: "9.4%",
  mostExposedAsset: "WETH",
  exposurePercentage: "63%",
};

export function AaveRiskMonitor() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    // Simulate wallet connection — will be replaced with actual wallet connection logic
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f3aB2d");
    setIsWalletConnected(true);
    setIsConnecting(false);
  };

  const handleEnableAlerts = () => {
    // Will trigger alert configuration modal
    setAlertsEnabled(true);
  };

  return (
    <div className="space-y-12">
      {/* Section 1 — AAVE Protocol Status (Meaning First) */}
      <ProtocolStatusBadge status="watch" />

      {/* Section 2 — Why This Status Exists (Estimation Numbers Only) */}
      <RiskFactorCards factors={MOCK_RISK_FACTORS} />

      {/* Section 3 — selvä Risk Progression Bar */}
      <RiskProgressionBar progression={MOCK_PROGRESSION} />

      {/* Section 4 — Live Risk Event Feed (Reality Surface) */}
      <LiveRiskEventFeed events={MOCK_EVENTS} />

      {/* Section 5/6/7 — Conditional based on wallet connection */}
      {!isWalletConnected ? (
        /* Section 5 — Primary CTA (Single Decision) */
        <ConnectWalletCTA
          onConnect={handleConnectWallet}
          isConnecting={isConnecting}
        />
      ) : (
        <>
          {/* Section 6 — Your Aave Position Risk (Personal Early Warning) */}
          <PositionRiskStatus
            riskLevel="early-warning"
            metrics={MOCK_POSITION_METRICS}
            walletAddress={walletAddress}
          />

          {/* Section 7 — Final Action (Peak-End Rule) */}
          <EnableAlertsCTA
            onEnableAlerts={handleEnableAlerts}
            isEnabled={alertsEnabled}
          />
        </>
      )}

      {/* Developer Footer (Non-intrusive) */}
      <DeveloperFooter />
    </div>
  );
}

// Re-export for backwards compatibility and routing
export { AaveRiskMonitor as AaveOverview };
