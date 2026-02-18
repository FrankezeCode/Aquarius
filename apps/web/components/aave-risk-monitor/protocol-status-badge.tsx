"use client";

import { cn } from "@/lib/utils";

export type ProtocolStatus = "stable" | "watch" | "high-risk";

interface ProtocolStatusBadgeProps {
  status: ProtocolStatus;
  className?: string;
}

const STATUS_CONFIG = {
  stable: {
    label: "STABLE",
    icon: "🟢",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  watch: {
    label: "WATCH",
    icon: "🟡",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-400",
  },
  "high-risk": {
    label: "HIGH RISK",
    icon: "🔴",
    bgClass: "bg-red-500/10 border-red-500/20",
    textClass: "text-red-400",
  },
} as const;

/**
 * Section 1 — AAVE Protocol Status
 * 
 * Purpose: Immediate clarity (Vision)
 * Large centered status block showing protocol health at a glance.
 * No numbers, no charts, no links — meaning before data.
 */
export function ProtocolStatusBadge({
  status,
  className,
}: ProtocolStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <section
      className={cn("flex flex-col items-center text-center", className)}
      aria-label="Aave Protocol Status"
    >
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Aave Protocol Status
      </h2>

      <div
        className={cn(
          "mt-6 flex items-center gap-3 rounded-2xl border px-8 py-6",
          config.bgClass
        )}
      >
        <span className="text-3xl" aria-hidden="true">
          {config.icon}
        </span>
        <span className={cn("text-3xl font-bold tracking-tight", config.textClass)}>
          {config.label}
        </span>
      </div>

      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        Based on reserve stress, liquidation velocity, oracle integrity, and
        agent risk signals.
      </p>
    </section>
  );
}
