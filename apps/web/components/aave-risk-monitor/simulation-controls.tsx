"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Scenario = "SAFE" | "MEDIUM" | "CRITICAL";

interface SimulationControlsProps {
  activeScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
  onRunSimulation: () => void;
  isRunning?: boolean;
  className?: string;
}

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "SAFE", label: "Safe" },
  { id: "MEDIUM", label: "Medium" },
  { id: "CRITICAL", label: "Critical" },
];

export function SimulationControls({
  activeScenario,
  onScenarioChange,
  onRunSimulation,
  isRunning = false,
  className,
}: SimulationControlsProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-dashed border-border/60 bg-card/30 p-6",
        className
      )}
      aria-label="CRE Simulation"
    >
      <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
        CRE Simulation
      </h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Scenario selector */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => onScenarioChange(s.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeScenario === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Button
          onClick={onRunSimulation}
          disabled={isRunning}
          size="sm"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Running…
            </>
          ) : (
            "Run CRE Simulation"
          )}
        </Button>
      </div>
    </section>
  );
}
