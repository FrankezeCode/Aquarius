"use client";

import { cn } from "@/lib/utils";

type MarketRegime = "normal" | "elevated" | "stressed";

export interface UserPositionCardProps {
  score: number;
  category: "stable" | "watch" | "high_risk";
  reasoning: string;
  regime?: MarketRegime;
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
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card/45 p-6 space-y-3", config.topBorderClass, className)}>
      {/* State beam + top border tint */}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b", config.beamClass)}
      />

      {/* Header + reasoning in split columns for tight vertical alignment */}
      <div className="relative z-10 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide",
                config.badgeClass,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
              {config.label}
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
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
        <div className="shrink-0 text-right">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 block">
            Health Score
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {score}
            <span className="text-base font-normal text-muted-foreground/60">/100</span>
          </span>
        </div>
      </div>

      {/* Subtle section divider + metrics row */}
      <div className="relative z-10 mt-3 border-t border-border/35 pt-6">
        <div className="rounded-lg bg-[#0a0a0c] border border-border/30 grid grid-cols-3 divide-x divide-border/30">
        <div className="p-4 text-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">
            Health Factor
          </span>
          <p className="mt-1.5 flex items-center justify-center gap-1">
            <span className="text-xl font-semibold text-foreground tabular-nums">
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
        <div className="p-4 text-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">
            Liquidation Dist.
          </span>
          <p className="mt-1.5 text-xl font-semibold text-foreground tabular-nums">
            {liquidationDistance}
          </p>
        </div>
        <div className="p-4 text-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">
            Exposed Asset
          </span>
          <p className="mt-1.5 text-xl font-semibold text-foreground">
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
