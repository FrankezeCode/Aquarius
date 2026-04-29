"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  RiskFactorCards,
  RiskProgressionBar,
  IntelligenceLayers,
  LiveRiskEventFeed,
  DeveloperFooter,
  MetricInsightsTrigger,
  MetricInsightsPanel,
  HealthScoreCard,
  UserPositionCard,
  AdvancedRiskMetrics,
  type RiskFactor,
  type RiskProgression,
  type LayerData,
  type RiskEvent,
  type ActionableMetric,
} from "@/components/aave-risk-monitor";
import { ConnectSolanaWalletCta } from "@/components/kamino/connect-solana-wallet-cta";
import { FloatingKaminoCopilot } from "@/components/kamino/floating-kamino-copilot";
import {
  KaminoWorkflowRail,
  type KaminoWorkflowHighlight,
} from "@/components/kamino/kamino-workflow-rail";
import { KaminoAgentEmploymentCta } from "@/components/kamino/kamino-agent-employment-cta";
import {
  connectPhantomSolanaWallet,
  disconnectPhantomSolanaWallet,
  isPhantomBrowserWalletAvailable,
  PhantomNotInstalledError,
  PhantomRejectedError,
} from "@/adapters/kamino-solana/phantom-wallet";
import { Button } from "@/components/ui/button";
import {
  getKaminoHealthBreakdown,
  isKaminoMockDashboardEnabled,
  kaminoSnapshotResponseSchema,
  MOCK_KAMINO_SNAPSHOT_RESPONSE,
  type KaminoSnapshotResponse,
} from "@/lib/kamino/kamino-snapshot";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type SnapshotSource = "mock" | "live" | null;

type ErrorBody = {
  error: { code: string; message: string; retryAfterMs?: number };
};

function mapSeverityToHealthCategory(
  s: KaminoSnapshotResponse["snapshot"]["severity"],
): "stable" | "watch" | "high_risk" {
  if (s === "low") return "stable";
  if (s === "medium") return "watch";
  return "high_risk";
}

function mapSeverityToRegime(
  s: KaminoSnapshotResponse["snapshot"]["severity"],
): "normal" | "elevated" | "stressed" {
  if (s === "low") return "normal";
  if (s === "medium" || s === "high") return "elevated";
  return "stressed";
}

function mapStressLevel(
  s: KaminoSnapshotResponse["snapshot"]["severity"],
): string {
  const m: Record<typeof s, string> = {
    low: "Low",
    medium: "Moderate",
    high: "High",
    critical: "Critical",
  };
  return m[s];
}

function mapAgentDecision(stage: RiskProgression["stage"]): string {
  if (stage === "invalidate") return "ESCALATE";
  if (stage === "confirm") return "PROTECT_POSITION";
  return "OBSERVE_ONLY";
}

function mapProgression(data: KaminoSnapshotResponse): RiskProgression {
  const { snapshot, intelligence } = data;
  const stage = intelligence.stage;
  const accumulator = Math.max(8, Math.min(100, intelligence.composite01 * 100));

  return {
    stage,
    accumulator,
    convergenceSignals:
      snapshot.reserveLabels.length > 0
        ? snapshot.reserveLabels.slice(0, 5)
        : ["No labelled reserves"],
    enteredAt: snapshot.metadata.timestamp,
    transitionReason:
      "Derived from Kamino lending snapshot risk score (read path only).",
    lastAction: null,
    actionRequired:
      stage === "invalidate"
        ? "escalate"
        : stage === "confirm"
          ? "protect"
          : "none",
    velocity: 0,
    stageStability: "stable",
  };
}

function mapRiskFactors(data: KaminoSnapshotResponse): RiskFactor[] {
  const { snapshot, intelligence } = data;
  const reserves =
    snapshot.reserveLabels.length > 0
      ? snapshot.reserveLabels.join(", ")
      : "—";
  return [
    {
      id: "ltv",
      label: "Loan-to-value (UI)",
      value: `${snapshot.loanToValuePct.toFixed(2)}%`,
      direction: "neutral",
      interpretation: intelligence.headline,
      action: "Monitor collateralization against Kamino market parameters.",
    },
    {
      id: "severity",
      label: "Severity bucket",
      value: snapshot.severity.toUpperCase(),
      direction: "neutral",
      interpretation: intelligence.summary,
      action: "Escalate if severity trends toward high or critical.",
    },
    {
      id: "reserves",
      label: "Reserve exposure",
      value: `${snapshot.reserveLabels.length} reserve(s)`,
      direction: "neutral",
      interpretation: `Tags: ${reserves}`,
      action: "Review concentration in the most volatile reserves first.",
    },
  ];
}

function mapEvents(data: KaminoSnapshotResponse): RiskEvent[] {
  return data.intelligence.events.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    message: e.message,
    severity: e.severity,
  }));
}

function mapIntelligenceLayers(data: KaminoSnapshotResponse): LayerData {
  const { snapshot, intelligence, latencyMs } = data;
  const decision = mapAgentDecision(intelligence.stage);
  const stress = mapStressLevel(snapshot.severity);
  return {
    riskScore: Math.round(intelligence.composite01 * 100),
    stressLevel: stress,
    riskLatencyMs: latencyMs,
    agentDecision: decision,
    agentConfidence: Math.round(intelligence.composite01 * 100),
    agentLatencyMs: -1,
    llmAction: null,
    llmReason: null,
    llmConfidence: null,
    llmLatencyMs: -1,
    dispatchedActions: ["Kamino snapshot read (Solana)"],
    actionLatencyMs: -1,
  };
}

function mapAdvancedMetrics(data: KaminoSnapshotResponse): ActionableMetric[] {
  const { snapshot } = data;
  const sevToSeverity = (s: typeof snapshot.severity): ActionableMetric["severity"] => {
    if (s === "low") return "safe";
    if (s === "medium") return "warning";
    return "critical";
  };
  return [
    {
      id: "km-ltv",
      label: "Loan-to-value (UI)",
      value: `${snapshot.loanToValuePct.toFixed(2)}%`,
      numericValue: snapshot.loanToValuePct,
      interpretation:
        "Displayed LTV from the obligation view; compare to your risk tolerance and Kamino market params.",
      action: "Reduce borrow or add collateral if approaching high utilization.",
      severity: sevToSeverity(snapshot.severity),
    },
    {
      id: "km-riskscore",
      label: "Composite risk score",
      value: String(Math.round(snapshot.riskScore)),
      numericValue: snapshot.riskScore,
      interpretation: "0–100 composite aligned with Aquarius evaluatable risk.",
      action: "Treat sustained increases as a signal to de-risk or rebalance.",
      severity: sevToSeverity(snapshot.severity),
    },
    {
      id: "km-severity",
      label: "Severity",
      value: snapshot.severity,
      numericValue:
        snapshot.severity === "critical"
          ? 4
          : snapshot.severity === "high"
            ? 3
            : snapshot.severity === "medium"
              ? 2
              : 1,
      interpretation: "Rule-based bucket from the Kamino read adapter.",
      action: "At high/critical, verify positions and liquidity before size changes.",
      severity: sevToSeverity(snapshot.severity),
    },
  ];
}

function computeWorkflowHighlight(
  obligationSnapshotLoaded: boolean,
  walletLinked: boolean,
): KaminoWorkflowHighlight {
  if (!obligationSnapshotLoaded) return "snapshot";
  if (!walletLinked) return "wallet";
  return "review";
}

export function KaminoRiskMonitor() {
  const mockEnv = isKaminoMockDashboardEnabled();

  const [wallet, setWallet] = useState("");
  const [market, setMarket] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KaminoSnapshotResponse | null>(null);
  const [snapshotSource, setSnapshotSource] = useState<SnapshotSource>(null);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  /** When live mode (`!mockEnv`), panel starts open until a snapshot loads successfully. */
  const [liveApiOpen, setLiveApiOpen] = useState(() => true);

  const [phantomAvailable, setPhantomAvailable] = useState(false);
  const [phantomLinked, setPhantomLinked] = useState(false);
  const [demoWallet, setDemoWallet] = useState(false);
  const [solConnecting, setSolConnecting] = useState(false);
  const [walletConnectErr, setWalletConnectErr] = useState<string | null>(null);

  const walletLinked = phantomLinked || demoWallet;

  useEffect(() => {
    setPhantomAvailable(isPhantomBrowserWalletAvailable());
  }, []);

  useEffect(() => {
    if (!mockEnv) return;
    setResult(MOCK_KAMINO_SNAPSHOT_RESPONSE);
    setSnapshotSource("mock");
    setWallet(MOCK_KAMINO_SNAPSHOT_RESPONSE.snapshot.wallet);
    setMarket(MOCK_KAMINO_SNAPSHOT_RESPONSE.snapshot.marketPubkey);
  }, [mockEnv]);

  const fetchSnapshot = useCallback(
    async (e?: FormEvent, walletOverride?: string) => {
      e?.preventDefault();
      setFetchErr(null);
      setLoading(true);
      try {
        const w = (walletOverride ?? wallet).trim();
        const q = new URLSearchParams({ wallet: w });
        if (market.trim()) q.set("market", market.trim());
        if (policy.trim()) q.set("policy", policy.trim());
        const res = await fetch(`${API_BASE}/api/v1/kamino-risk/snapshot?${q}`);
        const json: unknown = await res.json();
        if (!res.ok) {
          const body = json as ErrorBody;
          setFetchErr(
            `${body.error?.code ?? "ERROR"}: ${body.error?.message ?? res.statusText}`,
          );
          return;
        }
        const parsed = kaminoSnapshotResponseSchema.safeParse(json);
        if (!parsed.success) {
          setFetchErr("Unexpected response shape from Kamino snapshot API.");
          return;
        }
        setResult(parsed.data);
        setSnapshotSource("live");
        setLiveApiOpen(false);
      } catch (caught) {
        setFetchErr(caught instanceof Error ? caught.message : "Request failed.");
      } finally {
        setLoading(false);
      }
    },
    [market, policy, wallet],
  );

  const handleConnectPhantom = useCallback(async () => {
    setWalletConnectErr(null);
    setSolConnecting(true);
    try {
      const addr = await connectPhantomSolanaWallet();
      setPhantomLinked(true);
      setDemoWallet(false);
      setWallet(addr);
      if (!mockEnv) {
        await fetchSnapshot(undefined, addr);
      }
    } catch (e) {
      if (e instanceof PhantomRejectedError) {
        setWalletConnectErr("Connection was cancelled.");
      } else if (e instanceof PhantomNotInstalledError) {
        setWalletConnectErr("Phantom is not available.");
      } else {
        setWalletConnectErr(e instanceof Error ? e.message : "Connection failed.");
      }
    } finally {
      setSolConnecting(false);
    }
  }, [fetchSnapshot, mockEnv]);

  const handleUseDemoWallet = useCallback(() => {
    setWalletConnectErr(null);
    setDemoWallet(true);
    setPhantomLinked(false);
    const { wallet: mw, marketPubkey: mm } = MOCK_KAMINO_SNAPSHOT_RESPONSE.snapshot;
    setWallet(mw);
    setMarket(mm);
  }, []);

  const handleDisconnectWallet = useCallback(async () => {
    setWalletConnectErr(null);
    if (phantomLinked && !demoWallet) {
      try {
        await disconnectPhantomSolanaWallet();
      } catch {
        // ignore disconnect noise
      }
    }
    setPhantomLinked(false);
    setDemoWallet(false);
    if (mockEnv) {
      setWallet(MOCK_KAMINO_SNAPSHOT_RESPONSE.snapshot.wallet);
      setMarket(MOCK_KAMINO_SNAPSHOT_RESPONSE.snapshot.marketPubkey);
    } else {
      setWallet("");
      setMarket("");
    }
  }, [demoWallet, mockEnv, phantomLinked]);

  const clusterLabel = useMemo(() => {
    const c = result?.snapshot.metadata.solanaCluster;
    return c ? c.replace("-beta", "") : null;
  }, [result]);

  const healthBreakdown = useMemo(() => {
    if (!result) return undefined;
    return getKaminoHealthBreakdown(result, {
      useMockBreakdownStyling: snapshotSource === "mock",
    });
  }, [result, snapshotSource]);

  const hasSnapshot = Boolean(result);

  return (
    <>
      <div className="flex flex-col gap-14 md:gap-16 lg:gap-[4.5rem]">
        {/* Section 1 — Active chain + protocol health hero (aligned with Aave layout) */}
        <div className="space-y-3">
          <div className="flex justify-center mt-0 mb-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-violet-300"
                aria-hidden
              >
                SOL
              </span>
              <span className="text-xs font-medium text-foreground">
                {clusterLabel ? `Active on Solana (${clusterLabel})` : "Active on Solana · Kamino"}
              </span>
            </div>
          </div>

          {loading && !result ? (
            <div className="rounded-xl border border-border bg-card/50 py-24 flex flex-col items-center justify-center gap-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading Kamino obligation snapshot…
              </p>
            </div>
          ) : null}

          {hasSnapshot && result ? (
            <div
              className={
                loading
                  ? "opacity-60 pointer-events-none transition-opacity"
                  : undefined
              }
              aria-busy={loading || undefined}
            >
              <HealthScoreCard
                title="Kamino Protocol Health"
                score={Math.round(result.snapshot.riskScore)}
                category={mapSeverityToHealthCategory(result.snapshot.severity)}
                reasoning={result.intelligence.headline}
                confidence={result.intelligence.composite01}
                regime={mapSeverityToRegime(result.snapshot.severity)}
                dominantRisk={
                  result.snapshot.reserveLabels[0] ?? "Borrow utilization"
                }
                breakdown={healthBreakdown}
                timestamp={new Date(
                  result.snapshot.metadata.timestamp,
                ).toISOString()}
                sources={[
                  snapshotSource === "mock"
                    ? "Mock dashboard"
                    : "Kamino read adapter",
                  result.snapshot.metadata.solanaCluster
                    ? `cluster: ${result.snapshot.metadata.solanaCluster}`
                    : "Solana",
                ]}
              />
            </div>
          ) : !loading && !mockEnv ? (
            <p className="max-w-xl mx-auto text-center text-sm text-muted-foreground px-4">
              Use{" "}
              <span className="font-medium text-foreground">
                Solana snapshot (API)
              </span>{" "}
              below to fetch a live obligation (requires{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">SOLANA_RPC_URL</code>{" "}
              on the API).
            </p>
          ) : null}
        </div>

        {hasSnapshot && result ? (
          <div
            className={
              loading ? "opacity-60 pointer-events-none transition-opacity space-y-14 md:space-y-16 lg:space-y-[4.5rem]" : "space-y-14 md:space-y-16 lg:space-y-[4.5rem]"
            }
            aria-busy={loading || undefined}
          >
            <RiskProgressionBar progression={mapProgression(result)} />

            <RiskFactorCards factors={mapRiskFactors(result)} />

            <AdvancedRiskMetrics metrics={mapAdvancedMetrics(result)} />

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:gap-10">
              <div className="min-w-0 space-y-6">
                <LiveRiskEventFeed events={mapEvents(result)} />
                <MetricInsightsTrigger
                  isOpen={insightsOpen}
                  onToggle={() => setInsightsOpen(!insightsOpen)}
                />
              </div>
              <IntelligenceLayers
                className="min-w-0"
                data={mapIntelligenceLayers(result)}
              />
            </div>

            <MetricInsightsPanel
              isOpen={insightsOpen}
              onToggle={() => setInsightsOpen(!insightsOpen)}
            />

            <KaminoWorkflowRail
              obligationSnapshotLoaded={hasSnapshot}
              walletLinked={walletLinked}
              highlight={computeWorkflowHighlight(hasSnapshot, walletLinked)}
            />

            {walletLinked ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  {demoWallet ? (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Demo wallet
                    </p>
                  ) : (
                    <p className="break-all px-4 font-mono text-xs text-muted-foreground max-w-xl">
                      {wallet || result.snapshot.wallet}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => void handleDisconnectWallet()}
                  >
                    Disconnect wallet
                  </Button>
                </div>
                <UserPositionCard
                  score={Math.round(result.snapshot.riskScore)}
                  category={mapSeverityToHealthCategory(result.snapshot.severity)}
                  reasoning={result.intelligence.summary}
                  regime={mapSeverityToRegime(result.snapshot.severity)}
                  primaryMetricLabel="Loan-to-value (UI)"
                  healthFactor={`${result.snapshot.loanToValuePct.toFixed(2)}%`}
                  healthFactorDirection="neutral"
                  liquidationDistance={`${Math.max(0, 95 - result.snapshot.loanToValuePct).toFixed(1)}% est. cushion`}
                  mostExposedAsset={
                    result.snapshot.reserveLabels[0] ?? "—"
                  }
                  agentRecommendation={result.intelligence.headline}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {walletConnectErr ? (
                  <p className="text-center text-sm text-destructive" role="alert">
                    {walletConnectErr}
                  </p>
                ) : null}
                <ConnectSolanaWalletCta
                  phantomAvailable={phantomAvailable}
                  isConnecting={solConnecting}
                  onConnect={handleConnectPhantom}
                  onSimulateDemoWallet={handleUseDemoWallet}
                />
              </div>
            )}

            <section
              className="rounded-xl border border-border/60 bg-[#0a0a0a]/80 px-6 py-8 text-center"
              aria-label="Aquarius agent policies"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aquarius agent enrollment, buffer vault, and EVM wallet flows primarily
                target{" "}
                <span className="text-foreground">Ethereum-class lending monitors</span>{" "}
                today. This Kamino view shows Solana obligation analytics from snapshot
                data—no protocol transactions are sent from this page.
              </p>
            </section>

            <DeveloperFooter />
          </div>
        ) : null}

        <KaminoAgentEmploymentCta />

        {/* Live obligation fetch — collapsible footer (not hero form) */}
        {!mockEnv ? (
          <details
            className="rounded-xl border border-border/60 bg-card/25"
            open={liveApiOpen}
            onToggle={(e) => setLiveApiOpen(e.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground [&::-webkit-details-marker]:hidden [&::marker]:hidden flex items-center justify-between gap-2">
              Solana snapshot (API)
              <span className="text-muted-foreground/50" aria-hidden>
                ›
              </span>
            </summary>
            <div className="border-t border-border/45 px-4 pb-5 pt-2 sm:px-6">
              <p className="mb-4 text-xs text-muted-foreground">
                Snapshot endpoint:{" "}
                <code className="rounded bg-muted/50 px-1 py-0.5">GET /api/v1/kamino-risk/snapshot</code>.
              </p>
              <form
                onSubmit={(ev) => void fetchSnapshot(ev)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-sm font-medium" htmlFor="km-wallet">
                      Wallet (owner)
                    </label>
                    <input
                      id="km-wallet"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      placeholder="Base58 owner pubkey"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="km-market">
                      Market (lending) pubkey
                    </label>
                    <input
                      id="km-market"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      placeholder="Optional if API has KAMINO_MARKET_PUBKEY"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="km-policy">
                      Policy note (optional)
                    </label>
                    <input
                      id="km-policy"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      placeholder="Short note for copilot context"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {loading ? "Loading snapshot…" : "Fetch snapshot"}
                  </button>
                  {snapshotSource === "live" && result ? (
                    <span className="text-xs text-muted-foreground">
                      Live · {result.latencyMs} ms
                    </span>
                  ) : null}
                </div>
                {fetchErr ? (
                  <p className="text-sm text-destructive" role="alert">
                    {fetchErr}
                  </p>
                ) : null}
              </form>
            </div>
          </details>
        ) : null}
      </div>

      <FloatingKaminoCopilot
        walletPubkey={result?.snapshot.wallet}
        promptBlock={result?.copilot.promptBlock}
      />
    </>
  );
}
