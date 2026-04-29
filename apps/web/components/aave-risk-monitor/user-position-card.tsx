"use client";

import { cn } from "@/lib/utils";

type MarketRegime = "normal" | "elevated" | "stressed";

export interface UserPositionCardProps {
  score: number;
  category: "stable" | "watch" | "high_risk";
  reasoning: string;
  regime?: MarketRegime;
  /** Shown as primary row label (default: Health Factor). Kamino uses Loan-to-value (UI). */
  primaryMetricLabel?: string;
  healthFactor: string;
  healthFactorDirection: "up" | "down" | "neutral";
  liquidationDistance: string;
  mostExposedAsset: string;
  agentRecommendation?: string;
  className?: string;
}

const CATEGORY_CONFIG = {
  stable: {
    label: "STABLE",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-400",
    beamClass: "from-emerald-500/30 via-emerald-500/12 to-transparent",
    topBorderClass: "border-t-emerald-400/55",
  },
  watch: {
    label: "WATCH",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-400",
    beamClass: "from-amber-400/40 via-amber-400/16 to-transparent",
    topBorderClass: "border-t-amber-300/70",
  },
  high_risk: {
    label: "HIGH RISK",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/15 text-red-400",
    beamClass: "from-red-500/44 via-red-500/18 to-transparent",
    topBorderClass: "border-t-red-400/75",
  },
} as const;

const REGIME_CONFIG: Record<MarketRegime, { label: string; color: string; dotColor: string }> = {
  normal: { label: "Normal", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  elevated: { label: "Elevated", color: "text-amber-400", dotColor: "bg-amber-400" },
  stressed: { label: "Stressed", color: "text-red-400", dotColor: "bg-red-400" },
};

const DIRECTION_ICONS = { up: "↑", down: "↓", neutral: "→" } as const;
const DIRECTION_COLORS = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-muted-foreground",
} as const;

export function UserPositionCard({
  score,
  category,
  reasoning,
  regime,
  primaryMetricLabel = "Health Factor",
  healthFactor,
  healthFactorDirection,
  liquidationDistance,
  mostExposedAsset,
  agentRecommendation,
  className,
}: UserPositionCardProps) {
  const config = CATEGORY_CONFIG[category];

  const reasoningLine = reasoning.replace(/\s*Market regime:\s*\w+\.?/gi, "").trim();

  return (
    <div
      className={cn(
        "relative space-y-3 overflow-hidden rounded-xl border border-border bg-card/45 p-4 sm:p-6",
        config.topBorderClass,
        className,
      )}
    >
      {/* State beam + top border tint */}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b", config.beamClass)}
      />

      {/* Header + reasoning */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                config.badgeClass,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
              {config.label}
            </span>
            <h3 className="min-w-0 text-sm font-semibold uppercase tracking-wider text-foreground">
              Your Position Health
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            {reasoningLine}
          </p>
          {regime && (() => {
            const rc = REGIME_CONFIG[regime];
            return (
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", rc.dotColor)} />
                <span className={cn("text-xs font-medium", rc.color)}>
                  {rc.label} Regime
                </span>
              </div>
            );
          })()}
        </div>
        <div className="flex shrink-0 items-baseline justify-between gap-4 sm:block sm:text-right">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 sm:block">
            Health Score
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground sm:block">
            {score}
            <span className="text-base font-normal text-muted-foreground/60">/100</span>
          </span>
        </div>
      </div>

      {/* Metrics — horizontal rows on mobile; 3-up from sm */}
      <div className="relative z-10 mt-3 border-t border-border/35 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 divide-y divide-border/30 rounded-lg border border-border/30 bg-[#0a0a0c] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:flex-col sm:justify-center sm:py-4 sm:text-center">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/50">
              {primaryMetricLabel}
            </span>
            <p className="flex min-w-0 items-center justify-end gap-1 sm:mt-1.5 sm:justify-center">
              <span className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                {healthFactor}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  DIRECTION_COLORS[healthFactorDirection],
                )}
              >
                {DIRECTION_ICONS[healthFactorDirection]}
              </span>
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:flex-col sm:justify-center sm:py-4 sm:text-center">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/50">
              Liquidation dist.
            </span>
            <p className="text-lg font-semibold tabular-nums text-foreground sm:mt-1.5 sm:text-xl">
              {liquidationDistance}
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:flex-col sm:justify-center sm:py-4 sm:text-center">
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/50">
              Exposed asset
            </span>
            <p className="min-w-0 flex-1 break-words text-right text-lg font-semibold text-foreground sm:mt-1.5 sm:flex-none sm:text-center sm:text-xl">
              {mostExposedAsset}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Recommendation */}
      {agentRecommendation && (
        <div className="relative z-10 text-center space-y-1 pt-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">
            Agent Recommendation
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            &ldquo;{agentRecommendation}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
