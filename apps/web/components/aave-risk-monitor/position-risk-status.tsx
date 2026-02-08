"use client";

import { cn } from "@/lib/utils";

export type PositionRiskLevel = "safe" | "early-warning" | "at-risk" | "critical";

export interface PositionMetrics {
  healthFactor: string;
  healthFactorDirection: "up" | "down" | "neutral";
  liquidationDistance: string;
  mostExposedAsset: string;
  exposurePercentage: string;
}

interface PositionRiskStatusProps {
  riskLevel: PositionRiskLevel;
  metrics: PositionMetrics;
  walletAddress: string;
  className?: string;
}

const RISK_LEVEL_CONFIG = {
  safe: {
    label: "SAFE",
    icon: "🟢",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  "early-warning": {
    label: "EARLY WARNING",
    icon: "🟡",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-400",
  },
  "at-risk": {
    label: "AT RISK",
    icon: "🟠",
    bgClass: "bg-orange-500/10 border-orange-500/20",
    textClass: "text-orange-400",
  },
  critical: {
    label: "CRITICAL",
    icon: "🔴",
    bgClass: "bg-red-500/10 border-red-500/20",
    textClass: "text-red-400",
  },
} as const;

const DIRECTION_ICONS = {
  up: "↑",
  down: "↓",
  neutral: "→",
} as const;

const DIRECTION_COLORS = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-muted-foreground",
} as const;

/**
 * Section 6 — Your Aave Position Risk
 * 
 * Purpose: Personal early warning (Memory + Emotion)
 * Shows after wallet connection.
 * 
 * Only estimative proximity metrics:
 * - Health Factor with direction
 * - Liquidation Distance
 * - Most Exposed Asset
 * 
 * No charts, no jargon — calm, serious tone.
 * Numbers must feel close, not abstract.
 */
export function PositionRiskStatus({
  riskLevel,
  metrics,
  walletAddress,
  className,
}: PositionRiskStatusProps) {
  const config = RISK_LEVEL_CONFIG[riskLevel];

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <section
      className={cn("space-y-6", className)}
      aria-label="Your Position Risk"
    >
      <div className="flex flex-col items-center text-center">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Your Aave Risk Status
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{truncatedAddress}</p>

        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl border px-6 py-4",
            config.bgClass
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            {config.icon}
          </span>
          <span className={cn("text-2xl font-bold tracking-tight", config.textClass)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Proximity Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Health Factor */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Health Factor
          </span>
          <p className="mt-2 flex items-center justify-center gap-1.5">
            <span className="text-2xl font-semibold text-foreground">
              {metrics.healthFactor}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                DIRECTION_COLORS[metrics.healthFactorDirection]
              )}
              aria-label={`trending ${metrics.healthFactorDirection}`}
            >
              {DIRECTION_ICONS[metrics.healthFactorDirection]}
            </span>
          </p>
        </div>

        {/* Liquidation Distance */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Liquidation Distance
          </span>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {metrics.liquidationDistance}
          </p>
        </div>

        {/* Most Exposed Asset */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Most Exposed Asset
          </span>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {metrics.mostExposedAsset}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ({metrics.exposurePercentage})
          </p>
        </div>
      </div>
    </section>
  );
}
