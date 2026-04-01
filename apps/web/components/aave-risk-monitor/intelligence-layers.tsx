"use client";

import { cn } from "@/lib/utils";

export interface LayerData {
  riskScore: number;
  stressLevel: string;
  riskLatencyMs: number;
  agentDecision: string;
  agentConfidence: number;
  agentLatencyMs: number;
  llmAction: string | null;
  llmReason: string | null;
  llmConfidence: number | null;
  llmLatencyMs: number | null;
  dispatchedActions: string[];
  actionLatencyMs: number;
}

interface IntelligenceLayersProps {
  data: LayerData;
  className?: string;
}

const STRESS_COLORS: Record<string, string> = {
  Low: "text-emerald-400",
  Moderate: "text-amber-400",
  High: "text-orange-400",
  Critical: "text-red-400",
};

const DECISION_COLORS: Record<string, string> = {
  OBSERVE_ONLY: "text-emerald-400",
  PROTECT_POSITION: "text-amber-400",
  ESCALATE: "text-red-400",
};

function IntelCard({
  label,
  value,
  valueClass,
  sublabel,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sublabel?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-[#111214] px-3 py-3 sm:px-4 space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
      <p
        className={cn(
          "min-w-0 break-words text-sm font-semibold",
          valueClass ?? "text-foreground",
        )}
      >
        {value}
      </p>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground/40">{sublabel}</span>
      )}
    </div>
  );
}

function LatencyCard({ label, ms }: { label: string; ms: number }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-[#111214] px-3 py-3 sm:px-4 flex flex-col items-start gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
      <span className="text-sm font-mono tabular-nums text-muted-foreground font-medium">
        {ms}ms
      </span>
    </div>
  );
}

export function IntelligenceLayers({ data, className }: IntelligenceLayersProps) {
  return (
    <section className={cn("space-y-0", className)} aria-label="Intelligence Layer">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Intelligence Layer
      </h3>

      <div className="rounded-xl border border-border bg-[#0a0a0c] overflow-hidden flex flex-col">
        {/* Intelligence metrics */}
        <div className="min-w-0 p-3 space-y-3 sm:p-4">
          {/* Row 1: Risk Score + Stress Level */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <IntelCard
              label="Risk Score"
              value={String(data.riskScore)}
              sublabel="Composite"
            />
            <IntelCard
              label="Stress Level"
              value={data.stressLevel}
              valueClass={STRESS_COLORS[data.stressLevel]}
            />
          </div>

          {/* Row 2: Agent Decision + Confidence */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <IntelCard
              label="Agent Decision"
              value={data.agentDecision.replace(/_/g, " ")}
              valueClass={DECISION_COLORS[data.agentDecision]}
            />
            <IntelCard
              label="Confidence"
              value={`${data.agentConfidence}%`}
            />
          </div>

          {/* LLM Reasoning (if available) */}
          {data.llmAction && (
            <div className="min-w-0 rounded-lg border border-border/50 bg-[#111214] px-3 py-3 sm:px-4 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                LLM Reasoning
              </span>
              <p className="min-w-0 break-words text-sm font-medium text-foreground">
                {data.llmAction}
              </p>
              {data.llmReason && (
                <p className="min-w-0 break-words text-[11px] text-muted-foreground/60 italic leading-relaxed">
                  &ldquo;{data.llmReason}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Latency section */}
        <div className="min-w-0 border-t border-border/50 p-3 space-y-2 sm:p-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">
            Latency
          </span>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LatencyCard label="Risk" ms={data.riskLatencyMs} />
            <LatencyCard label="Agent" ms={data.agentLatencyMs} />
            <LatencyCard label="LLM" ms={data.llmLatencyMs ?? 0} />
            <LatencyCard label="Action" ms={data.actionLatencyMs} />
          </div>
        </div>
      </div>
    </section>
  );
}
