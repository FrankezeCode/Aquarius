"use client";

import { useState, useCallback } from "react";

import {
  RiskFactorCards,
  RiskProgressionBar,
  IntelligenceLayers,
  LiveRiskEventFeed,
  ConnectWalletCTA,
  PositionRiskStatus,
  EnableAlertsCTA,
  DeveloperFooter,
  MetricInsightsGuide,
  HealthScoreCard,
  AdvancedRiskMetrics,
  StressSimulation,
  type RiskFactor,
  type RiskProgression,
  type LayerData,
  type RiskEvent,
  type PositionMetrics,
  type PositionRiskLevel,
} from "@/components/aave-risk-monitor";
import { useCREWorkflow, type CREWorkflowData } from "@/lib/use-cre-workflow";
import { useProtocolHealth, useUserHealth } from "@/lib/use-health-score";
import { useActionableMetrics } from "@/lib/use-actionable-metrics";
import { useStressTest } from "@/lib/use-stress-test";

// ── Data Mappers (CRE → Component Props) ─────────────────────────────

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
  const { data: protocolHealth } = useProtocolHealth("aave");
  const { data: actionableMetrics } = useActionableMetrics();

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const { data: userHealth } = useUserHealth(
    isWalletConnected ? walletAddress : null
  );
  const { data: stressTestData } = useStressTest(
    isWalletConnected ? walletAddress : null
  );

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
      {/* Section 1 — Protocol Health Score (Hero Metric) */}
      {protocolHealth ? (
        <HealthScoreCard
          title="Aave Protocol Health"
          score={protocolHealth.score}
          category={protocolHealth.category}
          reasoning={protocolHealth.reasoning}
          confidence={protocolHealth.confidence}
          regime={protocolHealth.regime}
          dominantRisk={protocolHealth.dominantRisk}
          breakdown={protocolHealth.breakdown}
          sources={protocolHealth.metadata.sources}
          timestamp={protocolHealth.metadata.timestamp}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Section 2 — SELVA Risk Progression (State Machine) */}
      <RiskProgressionBar progression={mapRiskProgression(data)} />

      {/* Section 3 — Risk Factor Cards (with interpretation + action) */}
      <RiskFactorCards factors={mapRiskFactors(data)} />

      {/* Section 4 — Advanced Protocol Metrics */}
      {actionableMetrics && actionableMetrics.length > 0 && (
        <AdvancedRiskMetrics metrics={actionableMetrics} />
      )}

      {/* Section 5 — Action Layer + Intelligence Layer (side by side) */}
      <div className="grid grid-cols-2 gap-4">
        <LiveRiskEventFeed events={mapEvents(data)} />
        <IntelligenceLayers data={mapIntelligenceLayers(data)} />
      </div>

      {/* Section 6 — Actionable Insights Guide (collapsible) */}
      <MetricInsightsGuide />

      {/* Section 7 — Position Risk (After Wallet Connect) */}
      {!isWalletConnected ? (
        <ConnectWalletCTA
          onConnect={handleConnectWallet}
          isConnecting={isConnecting}
        />
      ) : (
        <>
          <div className="space-y-6">
            {userHealth ? (
              <HealthScoreCard
                title="Your Position Health"
                score={userHealth.score}
                category={userHealth.category}
                reasoning={userHealth.reasoning}
                confidence={userHealth.confidence}
                regime={userHealth.regime}
                dominantRisk={userHealth.dominantRisk}
                sources={userHealth.metadata.sources}
                timestamp={userHealth.metadata.timestamp}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            <PositionRiskStatus
              riskLevel={mapPositionRiskLevel(data)}
              metrics={mapPositionMetrics(data)}
              walletAddress={walletAddress}
              agentRecommendation={mapAgentRecommendation(data)}
            />

            {/* Stress Simulation */}
            {stressTestData && (
              <StressSimulation data={stressTestData} />
            )}
          </div>

          {/* Section 8 — Alerts CTA */}
          <EnableAlertsCTA
            onEnableAlerts={handleEnableAlerts}
            isEnabled={alertsEnabled}
          />
        </>
      )}

      {/* Section 9 — Developer Footer */}
      <DeveloperFooter />
    </div>
  );
}

export { AaveRiskMonitor as AaveOverview };
