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

function LayerCard({
  number,
  title,
  latencyMs,
  children,
}: {
  number: number;
  title: string;
  latencyMs: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {number}
          </span>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h4>
        </div>
        <span className="text-xs text-muted-foreground/60 font-mono tabular-nums">
          {latencyMs}ms
        </span>
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  );
}

export function IntelligenceLayers({ data, className }: IntelligenceLayersProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label="Intelligence Layers">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Intelligence Layers
      </h3>

      <div className="grid gap-3">
        {/* Layer 1: Risk Intelligence */}
        <LayerCard number={1} title="Risk Intelligence" latencyMs={data.riskLatencyMs}>
          <MetricRow label="Composite Score" value={String(data.riskScore)} />
          <MetricRow
            label="Stress Level"
            value={data.stressLevel}
            valueClass={STRESS_COLORS[data.stressLevel]}
          />
        </LayerCard>

        {/* Layer 2: Agent Decision */}
        <LayerCard number={2} title="Agent Decision" latencyMs={data.agentLatencyMs}>
          <MetricRow
            label="Decision"
            value={data.agentDecision.replace(/_/g, " ")}
            valueClass={DECISION_COLORS[data.agentDecision]}
          />
          <MetricRow label="Confidence" value={`${data.agentConfidence}%`} />
        </LayerCard>

        {/* Layer 3: LLM Reasoning */}
        <LayerCard number={3} title="LLM Reasoning" latencyMs={data.llmLatencyMs ?? 0}>
          {data.llmAction ? (
            <>
              <MetricRow label="Action" value={data.llmAction} />
              <MetricRow label="Confidence" value={String(data.llmConfidence)} />
              {data.llmReason && (
                <p className="mt-2 text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;{data.llmReason}&rdquo;
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/70 italic">
              LLM reasoning unavailable — operating on deterministic rules.
            </p>
          )}
        </LayerCard>

        {/* Layer 4: Action Layer */}
        <LayerCard number={4} title="Action Layer" latencyMs={data.actionLatencyMs}>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Dispatched:</span>
            <ul className="space-y-1">
              {data.dispatchedActions.map((action) => (
                <li key={action} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </LayerCard>
      </div>
    </section>
  );
}
