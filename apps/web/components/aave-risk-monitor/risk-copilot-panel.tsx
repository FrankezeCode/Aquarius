"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRiskCopilot } from "@/lib/use-risk-copilot";
import { cn } from "@/lib/utils";

interface RiskCopilotPanelProps {
  chain: string;
  walletAddress?: string;
  className?: string;
  onClose?: () => void;
  autoFocusSignal?: number;
}

export function RiskCopilotPanel({
  chain,
  walletAddress,
  className,
  onClose,
  autoFocusSignal,
}: RiskCopilotPanelProps) {
  const [question, setQuestion] = useState("");
  const [selectedMode, setSelectedMode] = useState("informational");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { ask, reset, isLoading, error, lastResponse } = useRiskCopilot({
    protocol: "aave",
    chain,
    walletAddress,
  });

  useEffect(() => {
    if (typeof autoFocusSignal !== "number") return;
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 40);
  }, [autoFocusSignal]);

  async function submit() {
    await ask(question);
    setQuestion("");
  }

  return (
    <section
      className={cn("rounded-xl border border-slate-700/70 bg-[#0f1115] p-5 space-y-4", className)}
      aria-label="Risk Copilot"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Risk Co-Pilot
          </h3>
          <p className="text-xs text-muted-foreground">
            Context advisor.
          </p>
        </div>
        <div className="w-[232px] space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Mode
          </p>
          <select
            value={selectedMode}
            onChange={(event) => setSelectedMode(event.target.value)}
            className="h-8 w-full rounded-md border border-slate-700/70 bg-[#131722] px-2.5 text-[11px] text-slate-200 outline-none transition-colors focus:border-slate-500/70 focus:ring-2 focus:ring-primary/40"
            aria-label="Risk co-pilot mode"
          >
            <option value="informational">Informational (Live)</option>
            <option value="advisory-simulation" disabled>
              Advisory + Simulation (Coming Soon)
            </option>
            <option value="conversational-execution" disabled>
              Conversational Execution (Coming Soon)
            </option>
          </select>
        </div>
      </div>

      {onClose && (
        <div className="-mt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse copilot"
            className="rounded-md border border-border/70 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            Close
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60">
        Context: <span className="text-muted-foreground/80">{chain}</span>
        {walletAddress ? (
          <>
            {" · "}Wallet:{" "}
            <span className="font-mono text-muted-foreground/80">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </>
        ) : (
          " · Wallet not connected"
        )}
      </p>

      <div className="space-y-3">
        <Textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask: Why is my health factor dropping? What does CONFIRM stage mean for my position?"
          className="min-h-[96px] border-slate-700/80 bg-[#131722]"
          maxLength={600}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={submit}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? "Analyzing…" : "Ask Co-Pilot"}
          </Button>
          <Button type="button" variant="ghost" onClick={reset} disabled={isLoading}>
            Reset
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-[#2b1114] p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {lastResponse && (
        <div className="space-y-3 rounded-lg border border-slate-700/70 bg-[#131722] p-4">
          <p className="text-sm text-foreground">{lastResponse.answer}</p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What It Means
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{lastResponse.whatItMeans}</p>
          </div>
          {lastResponse.recommendedActions.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recommended Actions
              </p>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {lastResponse.recommendedActions.map((action) => (
                  <li key={action}>- {action}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(lastResponse.confidence * 100)}%
            </span>
            <span className="text-[11px] text-muted-foreground/70">
              {new Date(lastResponse.contextTimestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/80">{lastResponse.disclaimer}</p>
        </div>
      )}
    </section>
  );
}

