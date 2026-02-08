"use client";

import { cn } from "@/lib/utils";

export interface RiskFactor {
  id: string;
  label: string;
  value: string;
  direction?: "up" | "down" | "neutral";
}

interface RiskFactorCardsProps {
  factors: RiskFactor[];
  className?: string;
}

const DIRECTION_ICONS = {
  up: "↑",
  down: "↓",
  neutral: "→",
} as const;

const DIRECTION_COLORS = {
  up: "text-red-400",
  down: "text-emerald-400",
  neutral: "text-muted-foreground",
} as const;

/**
 * Section 2 — Why This Status Exists
 * 
 * Purpose: Trust without cognitive load
 * Exactly 4 horizontal cards, each with:
 * - One label
 * - One estimative number
 * - One direction or state
 * 
 * Numbers must feel diagnostic, not analytical.
 */
export function RiskFactorCards({ factors, className }: RiskFactorCardsProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label="Risk Factors">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Why This Status
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className="rounded-xl border border-border bg-card/50 p-4"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {factor.label}
            </span>
            <p className="mt-2 flex items-baseline gap-1.5">
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
          </div>
        ))}
      </div>
    </section>
  );
}
