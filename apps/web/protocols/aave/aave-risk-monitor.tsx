"use client";

import { useState, useCallback } from "react";

import {
  ProtocolStatusBadge,
  RiskFactorCards,
  RiskProgressionBar,
  IntelligenceLayers,
  LiveRiskEventFeed,
  ConnectWalletCTA,
  PositionRiskStatus,
  EnableAlertsCTA,
  DeveloperFooter,
  type ProtocolStatus,
  type RiskFactor,
  type RiskProgression,
  type LayerData,
  type RiskEvent,
  type PositionMetrics,
  type PositionRiskLevel,
} from "@/components/aave-risk-monitor";
import { useCREWorkflow, type CREWorkflowData } from "@/lib/use-cre-workflow";

// ── Data Mappers (CRE → Component Props) ─────────────────────────────

function mapProtocolStatus(data: CREWorkflowData): ProtocolStatus {
  return data.protocolStatus;
}

function mapRiskFactors(data: CREWorkflowData): RiskFactor[] {
  return data.riskFactors;
}

function mapRiskProgression(data: CREWorkflowData): RiskProgression {
  return data.riskProgression;
}

function mapIntelligenceLayers(data: CREWorkflowData): LayerData {
  const stressMap: Record<string, string> = {
    safe: "Low",
    watch: "Moderate",
    "early-warning": "High",
    critical: "Critical",
  };

  const decisionMap: Record<string, string> = {
    OBSERVE_ONLY: "OBSERVE_ONLY",
    PROTECT_POSITION: "PROTECT_POSITION",
    ESCALATE: "ESCALATE",
  };

  return {
    riskScore: Math.round(data.riskScore.composite * 100),
    stressLevel: stressMap[data.riskScore.level] ?? "Low",
    riskLatencyMs: data.latencies.risk,
    agentDecision: decisionMap[data.agentDecision.decision] ?? "OBSERVE_ONLY",
    agentConfidence: data.agentDecision.confidence,
    agentLatencyMs: data.latencies.agent,
    llmAction: data.llmReasoning?.action ?? null,
    llmReason: data.llmReasoning?.reason ?? null,
    llmConfidence: data.llmReasoning?.confidence ?? null,
    llmLatencyMs: data.latencies.llm ?? null,
    dispatchedActions:
      data.actionDispatch.dispatched.length > 0
        ? data.actionDispatch.dispatched
        : ["Observation Logged"],
    actionLatencyMs: data.latencies.action,
  };
}

function mapEvents(data: CREWorkflowData): RiskEvent[] {
  return data.events;
}

function mapPositionRiskLevel(data: CREWorkflowData): PositionRiskLevel {
  const level = data.riskScore.level;
  if (level === "safe") return "safe";
  if (level === "watch") return "early-warning";
  if (level === "early-warning") return "at-risk";
  return "critical";
}

function mapPositionMetrics(data: CREWorkflowData): PositionMetrics {
  const composite = data.riskScore.composite;
  const hf = (1 + (1 - composite) * 2.5).toFixed(2);
  const liqDist = ((1 - composite) * 40).toFixed(1);

  return {
    healthFactor: hf,
    healthFactorDirection: composite > 0.5 ? "down" : "up",
    liquidationDistance: `${liqDist}%`,
    mostExposedAsset: "WETH",
    exposurePercentage: `${Math.round(40 + composite * 45)}%`,
  };
}

function mapAgentRecommendation(data: CREWorkflowData): string {
  if (data.agentDecision.decision === "ESCALATE") {
    return "Immediate action required: reduce WETH exposure or add collateral now.";
  }
  if (data.agentDecision.decision === "PROTECT_POSITION") {
    return "Add collateral to restore safety buffer.";
  }
  return "Position is healthy. No action required.";
}

// ── Component ────────────────────────────────────────────────────────

export function AaveRiskMonitor() {
  const { data, error, isLoading } = useCREWorkflow();

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f3aB2d");
    setIsWalletConnected(true);
    setIsConnecting(false);
  }, []);

  const handleEnableAlerts = useCallback(() => {
    setAlertsEnabled(true);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">
            Connecting to CRE workflow…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">
            CRE pipeline unavailable
          </p>
          <p className="text-xs text-muted-foreground">
            Ensure the API server is running on port 3001.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Section 1 — Protocol Status */}
      <ProtocolStatusBadge status={mapProtocolStatus(data)} />

      {/* Section 2 — Risk Progression Bar */}
      <RiskProgressionBar progression={mapRiskProgression(data)} />

      {/* Section 3 — Why This Status */}
      <RiskFactorCards factors={mapRiskFactors(data)} />

      {/* Section 4 — Intelligence Layers */}
      <IntelligenceLayers data={mapIntelligenceLayers(data)} />

      {/* Section 5 — Live Agent Action Feed */}
      <LiveRiskEventFeed events={mapEvents(data)} />

      {/* Section 6 — Position Risk */}
      {!isWalletConnected ? (
        <ConnectWalletCTA
          onConnect={handleConnectWallet}
          isConnecting={isConnecting}
        />
      ) : (
        <>
          <PositionRiskStatus
            riskLevel={mapPositionRiskLevel(data)}
            metrics={mapPositionMetrics(data)}
            walletAddress={walletAddress}
            agentRecommendation={mapAgentRecommendation(data)}
          />

          {/* Section 7 — Final Relief */}
          <EnableAlertsCTA
            onEnableAlerts={handleEnableAlerts}
            isEnabled={alertsEnabled}
          />
        </>
      )}

      {/* Developer Footer */}
      <DeveloperFooter />
    </div>
  );
}

export { AaveRiskMonitor as AaveOverview };
