"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MetricInsight {
  metric: string;
  meaning: string;
  forUsers: string;
  forInstitutions: string;
  forBots: string;
  action: string;
  severity: "info" | "caution" | "critical";
}

const METRIC_INSIGHTS: MetricInsight[] = [
  {
    metric: "Protocol Health Score",
    meaning:
      "A composite 0–100 score measuring overall protocol safety based on liquidity, liquidation risk, volatility, and smart contract exposure.",
    forUsers:
      "If below 60 (Watch), consider reducing exposure. Below 50 (High Risk), withdraw non-essential collateral.",
    forInstitutions:
      "Score trending downward signals capital reallocation. Monitor delta over 24h windows for early exit signals.",
    forBots:
      "Trigger PROTECT_POSITION when score drops below 60. Trigger ESCALATE below 50. Use score velocity for pre-emptive action.",
    action: "Monitor trend direction. Act on sustained decline, not single snapshots.",
    severity: "info",
  },
  {
    metric: "SELVA Stage (INFO → CONFIRM → INVALIDATE)",
    meaning:
      "A deterministic escalation state machine. INFO = signals accumulating. CONFIRM = action threshold crossed, mitigation triggered. INVALIDATE = mitigation failed or system breach.",
    forUsers:
      "INFO is normal — the system is watching. CONFIRM means Aquarius is actively protecting. INVALIDATE means manual intervention may be needed.",
    forInstitutions:
      "CONFIRM triggers should map to internal risk committee alerts. INVALIDATE should trigger portfolio-wide review.",
    forBots:
      "INFO → OBSERVE_ONLY. CONFIRM → execute mitigation (repay, add collateral). INVALIDATE → circuit breaker, halt new exposure.",
    action: "No action needed during INFO. Prepare contingency at CONFIRM. Execute emergency plan at INVALIDATE.",
    severity: "caution",
  },
  {
    metric: "Risk Accumulator (0–100)",
    meaning:
      "A weighted sum of all active risk signals with time-based decay. Drives stage transitions at threshold T1=40 (CONFIRM) and T2=70 (INVALIDATE).",
    forUsers:
      "Below 40 — safe zone. Between 40–70 — the system is actively mitigating. Above 70 — elevated danger.",
    forInstitutions:
      "Track accumulator slope rather than absolute value. Rapid rise indicates correlated risk signals converging.",
    forBots:
      "Use accumulator as primary input for position sizing. Scale down exposure proportionally as accumulator rises.",
    action: "Watch the velocity, not just the number. A slow climb to 35 is safer than a spike to 35.",
    severity: "info",
  },
  {
    metric: "Delta Accumulator / Risk Velocity (60s)",
    meaning:
      "The rate of change of the risk accumulator over the last 60 seconds. Positive = risk growing. Negative = risk decaying.",
    forUsers:
      "Positive velocity with increasing magnitude means risk is accelerating — be ready to act. Negative means conditions are stabilizing.",
    forInstitutions:
      "Velocity > +2.0/min signals potential cascade. Cross-reference with liquidation volume for confirmation.",
    forBots:
      "Use velocity as a leading indicator. If velocity is positive and stage is INFO, begin pre-positioning for CONFIRM.",
    action: "React to velocity direction before the accumulator hits thresholds.",
    severity: "info",
  },
  {
    metric: "Stage Stability (Stable / Transitioning / Escalating)",
    meaning:
      "Derived from velocity — indicates whether the current stage is holding steady or about to change.",
    forUsers:
      "Stable = relax. Transitioning = stay alert. Escalating = prepare to act immediately.",
    forInstitutions:
      "Escalating should trigger pre-emptive hedging. Transitioning justifies increased monitoring frequency.",
    forBots:
      "Escalating + CONFIRM stage = high probability of INVALIDATE. Begin emergency protocols.",
    action: "Use stability as a confidence signal for the current stage.",
    severity: "caution",
  },
  {
    metric: "Utilization Rate",
    meaning:
      "Percentage of available liquidity currently borrowed. High utilization means less available liquidity and higher borrow rates.",
    forUsers:
      "Above 80% — new borrowing becomes expensive. Above 90% — withdrawals may face delays. Consider repaying.",
    forInstitutions:
      "High utilization indicates liquidity stress. Monitor for rate spikes that could trigger cascading repayments.",
    forBots:
      "If utilization > 85% AND rising, flag for PROTECT_POSITION. Rate arbitrage opportunities may exist.",
    action: "Avoid new borrowing above 80% utilization. Consider repaying to reduce exposure.",
    severity: "caution",
  },
  {
    metric: "Liquidation Volume (24h)",
    meaning:
      "Total value of positions liquidated in the last 24 hours. Rising volume indicates market stress and forced selling.",
    forUsers:
      "Sudden spikes mean the market is under pressure. Check your Health Factor immediately.",
    forInstitutions:
      "Liquidation volume trending upward is a leading indicator of cascading liquidations. Reduce correlated exposure.",
    forBots:
      "Liquidation volume > historical 95th percentile should trigger defensive positioning across all monitored wallets.",
    action: "If liquidation volume is spiking, prioritize collateral top-ups over new positions.",
    severity: "critical",
  },
  {
    metric: "Oracle Health",
    meaning:
      "Status of Chainlink price feed reliability. Deviations or stale data can cause incorrect liquidations.",
    forUsers:
      "If oracle health is degraded, your position may be liquidated based on incorrect prices. Consider temporary exit.",
    forInstitutions:
      "Oracle degradation is a systemic risk. Halt all automated strategies until feeds stabilize.",
    forBots:
      "Oracle deviation > 1% should trigger OBSERVE_ONLY mode. Halt all execution until confirmed stable.",
    action: "Never trust position safety during oracle instability.",
    severity: "critical",
  },
  {
    metric: "Health Factor",
    meaning:
      "Ratio of collateral value to borrow value. Below 1.0 = liquidation. The higher, the safer.",
    forUsers:
      "Above 2.0 — comfortable. Between 1.5–2.0 — monitor. Below 1.5 — add collateral or repay immediately.",
    forInstitutions:
      "Aggregate HF across all monitored positions. Weighted average HF below 1.8 warrants portfolio review.",
    forBots:
      "HF < 1.3 → PROTECT_POSITION. HF < 1.1 → ESCALATE. Use projected HF (block+2) for pre-emptive action.",
    action: "Maintain HF above 2.0 for safety. Never let it drop below 1.5 without a plan.",
    severity: "info",
  },
  {
    metric: "Liquidation Distance",
    meaning:
      "Percentage the collateral asset price must drop before your position is liquidated.",
    forUsers:
      "Above 30% — safe in normal markets. Below 15% — vulnerable to flash crashes. Below 5% — imminent danger.",
    forInstitutions:
      "Map liquidation distances to historical volatility. If distance < 2x daily volatility, the position is structurally unsafe.",
    forBots:
      "Liquidation distance < 10% AND volatility regime = stressed → execute immediate collateral injection.",
    action: "Ensure liquidation distance exceeds the largest daily price move in the asset's history.",
    severity: "caution",
  },
  {
    metric: "Exposure Concentration",
    meaning:
      "Percentage of your total collateral in a single asset. High concentration amplifies single-asset risk.",
    forUsers:
      "Above 70% in one asset is risky. Diversify collateral across uncorrelated assets.",
    forInstitutions:
      "Concentration > 60% should trigger diversification mandates. Correlated collateral (e.g., ETH + stETH) counts as single exposure.",
    forBots:
      "Flag wallets with > 75% single-asset concentration for priority monitoring.",
    action: "Diversify. A 50/50 split between uncorrelated assets halves your single-point-of-failure risk.",
    severity: "caution",
  },
  {
    metric: "Cascading Liquidation Exposure",
    meaning:
      "Percentage of total protocol collateral within 10% of liquidation threshold. Measures systemic cascade risk.",
    forUsers:
      "If high, even small price moves can trigger a chain reaction of liquidations. Reduce exposure pre-emptively.",
    forInstitutions:
      "This is your primary systemic risk metric. Above 15% = elevated. Above 25% = critical systemic risk.",
    forBots:
      "Cascading exposure > 20% should trigger protocol-wide PROTECT_POSITION for all monitored positions.",
    action: "When cascading exposure is high, act early — don't wait for your position to be affected.",
    severity: "critical",
  },
  {
    metric: "Liquidity Buffer Ratio",
    meaning:
      "Protocol reserves relative to total borrows. Low buffer means withdrawals or large repayments may face friction.",
    forUsers:
      "Below 10% — withdrawal delays possible. Consider reducing borrow positions to free liquidity.",
    forInstitutions:
      "Buffer < 8% indicates liquidity stress. Large withdrawals could trigger utilization spikes.",
    forBots:
      "Buffer < 5% → halt new lending operations. Flag for emergency liquidity assessment.",
    action: "Maintain awareness. Low buffer + high utilization = liquidity crisis conditions.",
    severity: "caution",
  },
  {
    metric: "Volatility Regime (Low / Elevated / Stressed)",
    meaning:
      "Current market volatility state based on recent price action. Determines how aggressively the system should protect positions.",
    forUsers:
      "Low = business as usual. Elevated = tighten stop-losses. Stressed = reduce leverage immediately.",
    forInstitutions:
      "Regime shifts from Low → Elevated are the critical window. Act before Stressed, not during.",
    forBots:
      "Stressed regime → tighten all thresholds by 20%. Lower HF triggers, increase monitoring frequency.",
    action: "Adjust your risk tolerance based on regime. The same HF of 1.5 is safe in Low but dangerous in Stressed.",
    severity: "info",
  },
  {
    metric: "Stress Test Results (ETH -10%, -20%, Depeg)",
    meaning:
      "Simulated impact of adverse scenarios on your position. Shows projected Health Factor and liquidation risk under stress.",
    forUsers:
      "If your position survives ETH -20%, you have a reasonable buffer. If it doesn't survive -10%, act now.",
    forInstitutions:
      "Use stress results for VaR (Value at Risk) calculations. Positions failing -10% stress should be flagged.",
    forBots:
      "If stress test shows HF < 1.0 under -10% scenario, immediately trigger PROTECT_POSITION.",
    action: "Run stress tests before adding leverage. If your position can't survive a -20% move, it's too aggressive.",
    severity: "info",
  },
];

const SEVERITY_STYLES = {
  info: "border-l-blue-500/50",
  caution: "border-l-amber-500/50",
  critical: "border-l-red-500/50",
} as const;

const ROLE_ICONS = {
  forUsers: "👤",
  forInstitutions: "🏛",
  forBots: "🤖",
} as const;

function InsightCard({ insight }: { insight: MetricInsight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-[#111214] border-l-[3px] transition-colors",
        SEVERITY_STYLES[insight.severity],
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-foreground">
          {insight.metric}
        </span>
        <span className="text-[10px] text-muted-foreground/50">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {insight.meaning}
          </p>

          <div className="space-y-2">
            <div className="flex gap-2 text-xs">
              <span className="shrink-0 w-5 text-center">{ROLE_ICONS.forUsers}</span>
              <div>
                <span className="font-medium text-foreground/80">Users: </span>
                <span className="text-muted-foreground">{insight.forUsers}</span>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="shrink-0 w-5 text-center">{ROLE_ICONS.forInstitutions}</span>
              <div>
                <span className="font-medium text-foreground/80">Institutions: </span>
                <span className="text-muted-foreground">{insight.forInstitutions}</span>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="shrink-0 w-5 text-center">{ROLE_ICONS.forBots}</span>
              <div>
                <span className="font-medium text-foreground/80">Bots & Agents: </span>
                <span className="text-muted-foreground">{insight.forBots}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-[#0a0a0c] border border-border/30 px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
              Action
            </span>
            <p className="text-xs text-foreground/90 mt-0.5 font-medium">
              {insight.action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricInsightsTrigger({
  isOpen,
  onToggle,
  className,
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className,
      )}
    >
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Actionable Insights
      </h3>
      <span className="text-xs text-muted-foreground/60 sm:shrink-0">
        ▶ What Do These Metrics Mean?
      </span>
    </button>
  );
}

export function MetricInsightsPanel({
  isOpen,
  onToggle,
  className,
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label="Metric Insights Guide">
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Actionable Insights
          </h3>
          <button
            type="button"
            onClick={onToggle}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            ▼ Collapse
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Every metric on this page drives a decision — for users, institutions, or automated agents. Expand any metric below to understand what it means and what to do.
        </p>
        {METRIC_INSIGHTS.map((insight) => (
          <InsightCard key={insight.metric} insight={insight} />
        ))}
      </div>
    </section>
  );
}

export function MetricInsightsGuide({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <>
      <MetricInsightsTrigger isOpen={isOpen} onToggle={toggle} className={className} />
      <MetricInsightsPanel isOpen={isOpen} onToggle={toggle} className={className} />
    </>
  );
}
