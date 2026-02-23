"use client";

import { cn } from "@/lib/utils";

export type HealthCategory = "stable" | "watch" | "high_risk";

export type MarketRegime = "normal" | "elevated" | "stressed";

export interface HealthScoreCardProps {
  title: string;
  score: number;
  category: HealthCategory;
  reasoning: string;
  confidence?: number;
  regime?: MarketRegime;
  dominantRisk?: string;
  breakdown?: {
    liquidity: number;
    riskConcentration: number;
    liquidationRisk: number;
    smartContractRisk: number;
  };
  sources?: string[];
  timestamp?: string;
  className?: string;
}

const CATEGORY_CONFIG: Record<
  HealthCategory,
  { label: string; color: string; ringColor: string; bgColor: string; trackColor: string }
> = {
  stable: {
    label: "STABLE",
    color: "text-emerald-400",
    ringColor: "stroke-emerald-400",
    bgColor: "bg-emerald-400/10",
    trackColor: "stroke-emerald-400/15",
  },
  watch: {
    label: "WATCH",
    color: "text-amber-400",
    ringColor: "stroke-amber-400",
    bgColor: "bg-amber-400/10",
    trackColor: "stroke-amber-400/15",
  },
  high_risk: {
    label: "HIGH RISK",
    color: "text-red-400",
    ringColor: "stroke-red-400",
    bgColor: "bg-red-400/10",
    trackColor: "stroke-red-400/15",
  },
};

const BREAKDOWN_LABELS: Record<string, { label: string; weight: string }> = {
  liquidity: { label: "Liquidity", weight: "25%" },
  riskConcentration: { label: "Risk Concentration", weight: "25%" },
  liquidationRisk: { label: "Liquidation Risk", weight: "30%" },
  smartContractRisk: { label: "Smart Contract", weight: "20%" },
};

function CircularGauge({
  score,
  category,
}: {
  score: number;
  category: HealthCategory;
}) {
  const config = CATEGORY_CONFIG[category];
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg
        viewBox="0 0 140 140"
        className="w-full h-full -rotate-90"
      >
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={config.trackColor}
        />
        {/* Progress arc */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={config.ringColor}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums text-foreground">
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  weight,
  value,
  category,
}: {
  label: string;
  weight: string;
  value: number;
  category: HealthCategory;
}) {
  const config = CATEGORY_CONFIG[category];
  const barCategory: HealthCategory =
    value >= 75 ? "stable" : value >= 50 ? "watch" : "high_risk";
  const barConfig = CATEGORY_CONFIG[barCategory];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {label}{" "}
          <span className="text-muted-foreground/50">({weight})</span>
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            barCategory === "stable"
              ? "bg-emerald-400/70"
              : barCategory === "watch"
                ? "bg-amber-400/70"
                : "bg-red-400/70"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const REGIME_CONFIG: Record<
  MarketRegime,
  { label: string; color: string; dotColor: string }
> = {
  normal: { label: "Normal", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  elevated: { label: "Elevated", color: "text-amber-400", dotColor: "bg-amber-400" },
  stressed: { label: "Stressed", color: "text-red-400", dotColor: "bg-red-400" },
};

export function HealthScoreCard({
  title,
  score,
  category,
  reasoning,
  confidence,
  regime,
  dominantRisk,
  breakdown,
  sources,
  timestamp,
  className,
}: HealthScoreCardProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/50 p-6 space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        <span
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide",
            config.bgColor,
            config.color
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Gauge */}
      <CircularGauge score={score} category={category} />

      {/* Reasoning */}
      <p className="text-sm text-muted-foreground leading-relaxed text-center px-2">
        &ldquo;{reasoning}&rdquo;
      </p>

      {/* AI Context: Regime */}
      {regime && (() => {
        const rc = REGIME_CONFIG[regime];
        return (
          <div className="flex items-center justify-center gap-1.5 px-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", rc.dotColor)} />
            <span className={cn("text-xs font-medium", rc.color)}>
              {rc.label} Regime
            </span>
          </div>
        );
      })()}

      {/* Breakdown */}
      {breakdown && (
        <div className="pt-2 border-t border-border/50">
          <div className="max-w-md mx-auto space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Score Breakdown
            </h4>
            {Object.entries(breakdown).map(([key, value]) => {
              const meta = BREAKDOWN_LABELS[key];
              if (!meta) return null;
              return (
                <BreakdownBar
                  key={key}
                  label={meta.label}
                  weight={meta.weight}
                  value={value}
                  category={category}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: confidence, dominant risk */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {confidence !== undefined && (
          <span className="text-xs text-muted-foreground/60">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        )}
        {dominantRisk && (
          <span className="text-xs text-muted-foreground/60">
            Risk: {dominantRisk}
          </span>
        )}
      </div>

      {/* Sources + timestamp on same row */}
      {(sources?.length || timestamp) && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {sources?.map((source) => (
              <span
                key={source}
                className="px-2 py-0.5 text-[10px] rounded bg-muted/30 text-muted-foreground/60"
              >
                {source}
              </span>
            ))}
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground/60 font-mono tabular-nums shrink-0">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
