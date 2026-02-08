"use client";

import { cn } from "@/lib/utils";

export interface RiskProgression {
  infoCount: number;
  confirmCount: number;
  invalidateCount: number;
  activeStage: "info" | "confirm" | "invalidate";
}

interface RiskProgressionBarProps {
  progression: RiskProgression;
  className?: string;
}

/**
 * Section 3 — selvä Risk Progression Bar
 * 
 * Purpose: Make Progressive Failure visible
 * Shows the progression: INFO → CONFIRM → INVALIDATE
 * Represents Loss #1 → Loss #3 in the selvä framework.
 * 
 * Visual bar with counts only (not raw metrics).
 * Color intensifies with stage.
 */
export function RiskProgressionBar({
  progression,
  className,
}: RiskProgressionBarProps) {
  const { infoCount, confirmCount, invalidateCount, activeStage } = progression;

  const stages = [
    { id: "info", label: "INFO", count: infoCount },
    { id: "confirm", label: "CONFIRM", count: confirmCount },
    { id: "invalidate", label: "INVALIDATE", count: invalidateCount },
  ] as const;

  const getStageStyles = (stageId: string) => {
    const isActive = activeStage === stageId;
    const stageIndex = stages.findIndex((s) => s.id === stageId);
    const activeIndex = stages.findIndex((s) => s.id === activeStage);
    const isPast = stageIndex < activeIndex;

    if (stageId === "invalidate" && (isActive || isPast)) {
      return {
        dot: "bg-red-500 shadow-red-500/50 shadow-lg",
        label: "text-red-400 font-semibold",
        line: "bg-red-500",
      };
    }
    if (stageId === "confirm" && (isActive || isPast)) {
      return {
        dot: "bg-amber-500 shadow-amber-500/50 shadow-lg",
        label: "text-amber-400 font-semibold",
        line: "bg-amber-500",
      };
    }
    if (stageId === "info" && (isActive || isPast)) {
      return {
        dot: "bg-blue-500 shadow-blue-500/50 shadow-lg",
        label: "text-blue-400 font-semibold",
        line: "bg-blue-500",
      };
    }
    return {
      dot: "bg-muted-foreground/30",
      label: "text-muted-foreground",
      line: "bg-muted-foreground/20",
    };
  };

  const totalSignals = infoCount + confirmCount + invalidateCount;

  return (
    <section
      className={cn("space-y-4", className)}
      aria-label="Risk Progression"
    >
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        selvä Risk Progression
      </h3>

      <div className="rounded-xl border border-border bg-card/50 p-6">
        {/* Progression Bar */}
        <div className="relative flex items-center justify-between">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-muted-foreground/20" />

          {stages.map((stage, index) => {
            const styles = getStageStyles(stage.id);
            return (
              <div
                key={stage.id}
                className="relative z-10 flex flex-col items-center"
              >
                {/* Active segment line */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute right-full top-1/2 h-0.5 w-[calc(50vw/3)] -translate-y-1/2",
                      styles.line
                    )}
                  />
                )}

                {/* Stage dot */}
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300",
                    styles.dot
                  )}
                />

                {/* Stage label */}
                <span
                  className={cn(
                    "mt-3 text-xs uppercase tracking-wider transition-colors",
                    styles.label
                  )}
                >
                  {stage.label}
                </span>

                {/* Count */}
                <span className="mt-1 text-sm font-medium text-foreground">
                  L{index + 1} ({stage.count === 0 ? "—" : stage.count})
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {totalSignals === 0
            ? "No risk signals detected."
            : `${totalSignals} correlated risk signal${totalSignals === 1 ? "" : "s"} currently stacking.`}
        </p>
      </div>
    </section>
  );
}
