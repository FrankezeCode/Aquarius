"use client";

import { cn } from "@/lib/utils";
import type { StressTestData } from "@/lib/use-stress-test";

interface StressSimulationProps {
  data: StressTestData;
  className?: string;
}

export function StressSimulation({ data, className }: StressSimulationProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label="Stress Simulation">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Stress Simulation
      </h3>

      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {data.scenarios.map((scenario) => {
            const severity = scenario.wouldLiquidate
              ? "critical"
              : scenario.projectedHF < 1.2
                ? "warning"
                : "safe";

            const severityStyles = {
              safe: "border-emerald-500/20 text-emerald-400",
              warning: "border-amber-500/20 text-amber-400",
              critical: "border-red-500/20 text-red-400",
            };

            return (
              <div
                key={scenario.name}
                className={cn(
                  "rounded-lg border bg-black/20 p-4 text-center space-y-2",
                  severityStyles[severity],
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {scenario.name}
                </span>
                <p className={cn("text-xl font-semibold", severityStyles[severity])}>
                  HF {scenario.projectedHF.toFixed(2)}
                </p>
                {scenario.wouldLiquidate && (
                  <span className="inline-block text-xs font-semibold uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                    Liquidated
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            {data.interpretation}
          </p>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Action
            </span>
            <p className="mt-1 text-sm text-foreground">
              {data.action}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
