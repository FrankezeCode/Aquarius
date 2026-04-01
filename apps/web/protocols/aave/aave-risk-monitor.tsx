"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  RiskFactorCards,
  RiskProgressionBar,
  IntelligenceLayers,
  LiveRiskEventFeed,
  ConnectWalletCTA,
  EnableAlertsCTA,
  AgentEnrollmentModal,
  DeveloperFooter,
  MetricInsightsTrigger,
  MetricInsightsPanel,
  HealthScoreCard,
  UserPositionCard,
  AdvancedRiskMetrics,
  StressSimulation,
  FloatingRiskCopilot,
  type RiskFactor,
  type RiskProgression,
  type LayerData,
  type RiskEvent,
} from "@/components/aave-risk-monitor";
import { ChainIcon } from "@/components/navigation/chain-icon";
import { useProtocolChain } from "@/context/protocol-chain-context";
import { useCREWorkflow, type CREWorkflowData } from "@/lib/use-cre-workflow";
import { useProtocolHealth, useUserRisk } from "@/lib/use-health-score";
import { useActionableMetrics } from "@/lib/use-actionable-metrics";
import { useStressTest } from "@/lib/use-stress-test";
import { useAgentEnrollment, type AgentEnrollmentMode } from "@/lib/use-agent-enrollment";
import { deactivatePolicyIntent } from "@/lib/policy-intent";
import {
  WalletConnectorError,
  connectWallet,
  getActiveAccount,
  getChainIdHex,
  getWalletProvider,
  subscribeWalletEvents,
  switchOrAddChain,
  hexToNumberChainId,
} from "@/lib/wallet-connector";

function resolveTenderlyRpcUrl(chainId: string): string | undefined {
  if (chainId === "ethereum") {
    return (
      process.env.NEXT_PUBLIC_TENDERLY_RPC_URL_ETHEREUM ??
      process.env.NEXT_PUBLIC_TENDERLY_RPC_URL
    );
  }
  if (chainId === "polygon") {
    return (
      process.env.NEXT_PUBLIC_TENDERLY_RPC_URL_POLYGON ??
      process.env.NEXT_PUBLIC_TENDERLY_RPC_URL
    );
  }
  return process.env.NEXT_PUBLIC_TENDERLY_RPC_URL;
}

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

// ── Component ────────────────────────────────────────────────────────

export function AaveRiskMonitor() {
  const { activeChain } = useProtocolChain();
  const chain = activeChain?.id ?? "ethereum";
  const { data, error, isLoading } = useCREWorkflow(chain);
  const { data: protocolHealth } = useProtocolHealth("aave", chain);
  const { data: actionableMetrics } = useActionableMetrics(chain);

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [providerAvailable, setProviderAvailable] = useState(true);
  const [walletChainIdHex, setWalletChainIdHex] = useState<string | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const { data: userRisk, notFound: userRiskNotFound } = useUserRisk(
    isWalletConnected ? walletAddress : null,
    chain
  );
  const { data: stressTestData } = useStressTest(
    isWalletConnected ? walletAddress : null,
    chain
  );
  const {
    data: enrollment,
    upsertEnrollment,
    refresh: refreshEnrollment,
    depositBufferVaultDemo,
  } = useAgentEnrollment(isWalletConnected ? walletAddress : null, chain);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivationError, setDeactivationError] = useState<string | null>(null);
  const [hasBufferVaultDemoDeposit, setHasBufferVaultDemoDeposit] = useState(false);

  const targetChainIdHex = useMemo(
    () => (activeChain ? `0x${activeChain.chainId.toString(16)}` : null),
    [activeChain]
  );
  const isWalletOnWrongChain = Boolean(
    isWalletConnected &&
      walletChainIdHex &&
      targetChainIdHex &&
      walletChainIdHex.toLowerCase() !== targetChainIdHex.toLowerCase()
  );

  const handleConnectWallet = useCallback(async () => {
    setWalletError(null);
    setIsConnecting(true);
    try {
      const { account, chainIdHex } = await connectWallet();
      setWalletAddress(account);
      setIsWalletConnected(true);
      setWalletChainIdHex(chainIdHex);
    } catch (err) {
      if (err instanceof WalletConnectorError) {
        setWalletError(err.message);
      } else {
        setWalletError(err instanceof Error ? err.message : "Wallet connection failed.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleEmployAgent = useCallback(() => {
    setIsEnrollmentModalOpen(true);
  }, []);

  const modeLabel: Record<AgentEnrollmentMode, string> = {
    alert_only: "Alert Policy Active",
    mitigate_agent: "Mitigation Policy Active",
    buffer_vault: "Buffer Vault Policy Active",
  };

  useEffect(() => {
    try {
      getWalletProvider();
      setProviderAvailable(true);
    } catch (err) {
      setProviderAvailable(false);
      if (err instanceof WalletConnectorError) setWalletError(err.message);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        const account = await getActiveAccount();
        const chainHex = await getChainIdHex();
        if (!mounted) return;
        setWalletChainIdHex(chainHex);
        if (account) {
          setWalletAddress(account);
          setIsWalletConnected(true);
        }
      } catch {
        // silent init fallback
      }
    })();

    unsubscribe = subscribeWalletEvents({
      onAccountsChanged: (accounts) => {
        const account = accounts[0];
        if (!account) {
          setWalletAddress("");
          setIsWalletConnected(false);
          return;
        }
        setWalletAddress(account);
        setIsWalletConnected(true);
      },
      onChainChanged: (chainIdHex) => {
        setWalletChainIdHex(chainIdHex);
      },
      onDisconnect: () => {
        setWalletAddress("");
        setIsWalletConnected(false);
      },
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!isWalletConnected || !activeChain) return;
    const currentChainId =
      walletChainIdHex && walletChainIdHex.startsWith("0x")
        ? hexToNumberChainId(walletChainIdHex)
        : null;
    if (currentChainId === activeChain.chainId) return;

    switchOrAddChain(activeChain, {
      rpcUrl: resolveTenderlyRpcUrl(activeChain.id),
    })
      .then(async () => {
        const syncedChainHex = await getChainIdHex();
        setWalletChainIdHex(syncedChainHex);
      })
      .catch((err) => {
        const message =
          err instanceof WalletConnectorError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unable to switch wallet network.";
        setWalletError(message);
      });
  }, [activeChain, isWalletConnected, walletChainIdHex]);

  useEffect(() => {
    if (
      !isWalletConnected ||
      !walletAddress ||
      enrollment?.status !== "active" ||
      enrollment?.mode !== "buffer_vault"
    ) {
      setHasBufferVaultDemoDeposit(false);
      return;
    }

    let cancelled = false;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(
      `${API_BASE}/api/v1/agent-enrollment/buffer-vault/${walletAddress}?chain=${encodeURIComponent(chain)}`
    )
      .then(() => {
        if (cancelled) return;
        setHasBufferVaultDemoDeposit(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHasBufferVaultDemoDeposit(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    chain,
    enrollment?.mode,
    enrollment?.status,
    isWalletConnected,
    walletAddress,
  ]);

  const isBufferVaultEnrollment = enrollment?.mode === "buffer_vault";
  const isEnrollmentEnabled = Boolean(
    enrollment &&
      enrollment.status === "active" &&
      (!isBufferVaultEnrollment || hasBufferVaultDemoDeposit)
  );

  const creLoading = isLoading || !data;
  const creError = Boolean(error);

  return (
    <>
      {creLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Connecting to CRE workflow…
            </p>
          </div>
        </div>
      ) : creError ? (
        <div className="flex items-center justify-center py-32">
          <div className="space-y-4 text-center">
            <p className="text-sm text-destructive">CRE pipeline unavailable</p>
            <p className="text-xs text-muted-foreground">
              Ensure the API server is running on port 3001.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
      <div className="space-y-2">
        {activeChain && (
          <div className="flex justify-center mt-0 mb-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
              <ChainIcon
                chainId={activeChain.id}
                className="h-4 w-4 text-[8px] motion-safe:animate-pulse"
              />
              <span className="text-xs font-medium text-foreground">
                Active On {activeChain.name}
              </span>
            </div>
          </div>
        )}

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
      </div>

      {/* Section 2 — SELVA Risk Progression (State Machine) */}
      <RiskProgressionBar progression={mapRiskProgression(data)} />

      {/* Section 3 — Risk Factor Cards (with interpretation + action) */}
      <RiskFactorCards factors={mapRiskFactors(data)} />

      {/* Section 4 — Advanced Protocol Metrics */}
      {actionableMetrics && actionableMetrics.length > 0 && (
        <AdvancedRiskMetrics metrics={actionableMetrics} />
      )}

      {/* Section 5 — Action Layer + Intelligence Layer (stack on mobile) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <LiveRiskEventFeed events={mapEvents(data)} />
          <MetricInsightsTrigger
            isOpen={insightsOpen}
            onToggle={() => setInsightsOpen(!insightsOpen)}
          />
        </div>
        <IntelligenceLayers
          className="min-w-0"
          data={mapIntelligenceLayers(data)}
        />
      </div>

      {/* Section 6 — Actionable Insights (expanded full-width) */}
      <MetricInsightsPanel
        isOpen={insightsOpen}
        onToggle={() => setInsightsOpen(!insightsOpen)}
      />

      {/* Section 7 — Position Risk (After Wallet Connect) */}
      {!isWalletConnected ? (
        <div className="space-y-3">
          <ConnectWalletCTA
            onConnect={handleConnectWallet}
            isConnecting={isConnecting}
          />
          {walletError && (
            <p className="text-center text-xs text-destructive">
              {walletError}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {userRisk ? (
                <UserPositionCard
                  score={userRisk.score}
                  category={userRisk.category}
                  reasoning={userRisk.reasoning}
                  regime={userRisk.regime}
                  healthFactor={userRisk.healthFactor.toFixed(2)}
                  healthFactorDirection={userRisk.healthFactorDirection}
                  liquidationDistance={`${userRisk.liquidationDistancePct.toFixed(1)}%`}
                  mostExposedAsset={userRisk.mostExposedAsset}
                  agentRecommendation={userRisk.agentRecommendation}
                />
            ) : userRiskNotFound ? (
              <div className="rounded-xl border border-border bg-card/50 p-6 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  No active Aave position found for this wallet on the current Tenderly fork.
                </p>
                <p className="text-xs text-muted-foreground">
                  Switch to a wallet with debt exposure or seed a position in your simulation fork.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {/* Stress Simulation */}
            {stressTestData && (
              <StressSimulation data={stressTestData} />
            )}
          </div>

          {/* Section 8 — Alerts CTA */}
          <EnableAlertsCTA
            onEmployAgent={handleEmployAgent}
            onDeactivateAgent={async () => {
              if (!walletAddress) throw new Error("Wallet is not connected.");
              if (!activeChain) throw new Error("Active chain is not available.");
              setDeactivationError(null);
              setIsDeactivating(true);
              try {
                await deactivatePolicyIntent({
                  walletAddress,
                  chain,
                  chainId: activeChain.chainId,
                });
                await refreshEnrollment();
              } catch (err) {
                setDeactivationError(
                  err instanceof Error ? err.message : "Failed to deactivate policy."
                );
                throw err;
              } finally {
                setIsDeactivating(false);
              }
            }}
            isEnabled={isEnrollmentEnabled}
            isInactive={Boolean(enrollment && enrollment.status === "inactive")}
            isDeactivating={isDeactivating}
            deactivationError={deactivationError}
            statusLabel={enrollment ? modeLabel[enrollment.mode] : undefined}
          />
        </>
      )}

      {/* Section 9 — Developer Footer */}
      <DeveloperFooter />
        </div>
      )}

      <FloatingRiskCopilot
        chain={chain}
        walletAddress={isWalletConnected ? walletAddress : undefined}
        suppressWhenModalOpen={isEnrollmentModalOpen}
      />

      <AgentEnrollmentModal
        open={isEnrollmentModalOpen}
        onOpenChange={setIsEnrollmentModalOpen}
        walletAddress={isWalletConnected ? walletAddress : undefined}
        chain={chain}
        chainId={activeChain?.chainId ?? 1}
        providerAvailable={providerAvailable}
        isWalletOnWrongChain={isWalletOnWrongChain}
        walletError={walletError}
        onSubmit={async (payload) => {
          await upsertEnrollment(payload);
        }}
        onBound={async () => {
          await refreshEnrollment();
        }}
        onBufferVaultDeposit={async ({ asset, amount }) => {
          if (!walletAddress) {
            throw new Error("Wallet is not connected.");
          }
          await depositBufferVaultDemo({
            walletAddress,
            chain,
            asset,
            amount,
          });
          setHasBufferVaultDemoDeposit(true);
        }}
      />
    </>
  );
}

export { AaveRiskMonitor as AaveOverview };
