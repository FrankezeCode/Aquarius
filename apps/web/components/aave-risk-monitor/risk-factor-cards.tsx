"use client";

import { cn } from "@/lib/utils";

export interface RiskFactor {
  id: string;
  label: string;
  value: string;
  direction?: "up" | "down" | "neutral";
  interpretation?: string;
  action?: string;
}

interface RiskFactorCardsProps {
  factors: RiskFactor[];
  className?: string;
}

const DIRECTION_ICONS = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
} as const;

const DIRECTION_COLORS = {
  up: "text-red-400",
  down: "text-emerald-400",
  neutral: "text-muted-foreground",
} as const;

export function RiskFactorCards({ factors, className }: RiskFactorCardsProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label="Risk Factors">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Why This Status
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className="rounded-xl border border-border bg-card/50 p-4 space-y-2"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {factor.label}
            </span>
            <p className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-foreground">
                {factor.value}
              </span>
              {factor.direction && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    DIRECTION_COLORS[factor.direction]
                  )}
                  aria-label={`trending ${factor.direction}`}
                >
                  {DIRECTION_ICONS[factor.direction]}
                </span>
              )}
            </p>

            {factor.interpretation && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {factor.interpretation}
              </p>
            )}

            {factor.action && (
              <p className="text-xs text-primary">
                {factor.action}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
