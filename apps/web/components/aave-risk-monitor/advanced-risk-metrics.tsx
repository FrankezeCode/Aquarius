"use client";

import { cn } from "@/lib/utils";
import { ActionableMetricCard, type ActionableMetric } from "./actionable-metric-card";

interface AdvancedRiskMetricsProps {
  metrics: ActionableMetric[];
  className?: string;
}

export function AdvancedRiskMetrics({ metrics, className }: AdvancedRiskMetricsProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label="Advanced Protocol Metrics">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Protocol Risk Metrics
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <ActionableMetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}
