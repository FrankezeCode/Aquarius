"use client";

import { cn } from "@/lib/utils";

export interface ActionableMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  interpretation: string;
  action: string;
  severity: "safe" | "warning" | "critical";
}

interface ActionableMetricCardProps {
  metric: ActionableMetric;
  className?: string;
}

const SEVERITY_STYLES = {
  safe: {
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400",
    value: "text-emerald-400",
  },
  warning: {
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400",
    value: "text-amber-400",
  },
  critical: {
    border: "border-red-500/20",
    badge: "bg-red-500/10 text-red-400",
    value: "text-red-400",
  },
} as const;

export function ActionableMetricCard({ metric, className }: ActionableMetricCardProps) {
  const styles = SEVERITY_STYLES[metric.severity];

  return (
    <div className={cn("rounded-xl border bg-card/50 p-5 space-y-3", styles.border, className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {metric.label}
        </span>
        <span className={cn("text-xs font-medium uppercase px-2 py-0.5 rounded-full", styles.badge)}>
          {metric.severity}
        </span>
      </div>

      <p className={cn("text-2xl font-semibold", styles.value)}>
        {metric.value}
      </p>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {metric.interpretation}
      </p>

      <div className="border-t border-border pt-3">
        <span className="text-xs font-medium uppercase tracking-wider text-primary">
          Action
        </span>
        <p className="mt-1 text-sm text-foreground">
          {metric.action}
        </p>
      </div>
    </div>
  );
}
