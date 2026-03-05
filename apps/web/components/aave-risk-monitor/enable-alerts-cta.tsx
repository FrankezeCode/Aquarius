"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EnableAlertsCTAProps {
  onEmployAgent: () => void;
  onDeactivateAgent?: () => Promise<void> | void;
  isEnabled?: boolean;
  isInactive?: boolean;
  isDeactivating?: boolean;
  deactivationError?: string | null;
  statusLabel?: string;
  className?: string;
}

/**
 * Section 7 — Final Action (Peak-End Rule)
 * 
 * Purpose: Emotional closure & safety
 * The user should leave feeling protected.
 * 
 * Alert channels:
 * - Telegram
 * - Web push
 * - Webhook (for dev wallets)
 */
export function EnableAlertsCTA({
  onEmployAgent,
  onDeactivateAgent,
  isEnabled = false,
  isInactive = false,
  isDeactivating = false,
  deactivationError = null,
  statusLabel,
  className,
}: EnableAlertsCTAProps) {
  const scannerImageSrc = "/images/aqua-agents.png";
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <section
      className={cn("py-6", className)}
      aria-label="Enable Alerts"
    >
      <div className="mx-auto w-full max-w-6xl overflow-hidden border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="relative grid min-h-[500px] grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-30" />

          <div className="relative z-[2] flex flex-col justify-between p-6 sm:p-10 lg:p-16">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#222222] pb-3 font-mono text-xs uppercase tracking-[0.05em]">
                <span className="font-bold text-white">Aqua Agents</span>
                <span className="text-[#888888]">Infra V2.1</span>
              </div>

              <h2 className="max-w-[90%] text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[42px]">
                Get alerted or protected{" "}
                <span className="text-[#888888]">before Liquidation risk increases.</span>
              </h2>

              <ul className="mt-6 space-y-2 text-[13px] text-[#888888]">
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Real-time Monitoring</span>{" "}
                  across all major protocols
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Instant Execution</span> via CRE orchestration
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Custom Triggers</span> for collateral ratio thresholds
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-6">
      {isEnabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-6 py-3">
                    <span className="text-base">✓</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {statusLabel ?? "Aqua Agents Enrolled"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isDeactivating}
                    className="h-8 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-red-300"
                  >
                    {isDeactivating ? "Deactivating..." : "Deactivate"}
                  </Button>
        </div>
      ) : (
                <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
                    onClick={onEmployAgent}
                    className="h-12 w-fit rounded-full bg-white px-8 text-sm font-semibold tracking-[0.02em] text-[#050505] hover:bg-[#e0e0e0]"
        >
                    {isInactive ? "Re-activate Aqua Agents" : "Employ Aqua Agents"}
        </Button>
                  {isInactive && (
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300">
                      Agent fully disabled
                    </span>
                  )}
                </div>
              )}
              {deactivationError && (
                <p className="text-xs text-red-300">{deactivationError}</p>
              )}

              <div className="flex gap-4 border-t border-[#222222] pt-5">
                {["TELEGRAM", "WEBHOOK"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-white/5 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.05em] text-[#888888]"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#00ff00] shadow-[0_0_4px_#00ff00]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center overflow-hidden border-t border-[#222222] bg-[radial-gradient(circle_at_center,#111_0%,#0a0a0a_70%)] lg:border-l lg:border-t-0">
            <div className="relative flex h-[280px] w-[280px] items-center justify-center">
              <div className="absolute h-full w-full rounded-full border border-white/10" />
              <div className="absolute h-[85%] w-[85%] rounded-full border border-white/30" />

              {[0, 45, 90, 135].map((deg) => (
                <div
                  key={deg}
                  className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.2)_20%,rgba(255,255,255,0.2)_80%,transparent)]"
                  style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}
                />
              ))}

              <div className="absolute h-full w-full animate-[scan_4s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.05)_60deg,transparent_60deg)]" />

              <div className="absolute h-[34%] w-[34%] overflow-hidden rounded-full bg-white/95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <Image
                  src={scannerImageSrc}
                  alt="Aqua Agent"
                  fill
                  sizes="(max-width: 1024px) 120px, 95px"
                  className="object-contain object-center scale-[1.05]"
                  priority
                />
              </div>
            </div>

            <div className="mt-12 w-[240px]">
              <div className="mb-3 flex justify-between text-[10px] uppercase tracking-[0.1em] text-[#888888]">
                <span>Agent Metrics</span>
                <span>Active</span>
              </div>

              {[
                { label: "UPTIME", width: "99.9%", value: "99.9%" },
                { label: "SPEED", width: "85%", value: "~12ms" },
                { label: "COVERAGE", width: "92%", value: "ALL" },
              ].map((metric, index) => (
                <div key={metric.label} className="mb-2 flex items-center justify-between text-[10px] text-[#888888]">
                  <span className="w-20">{metric.label}</span>
                  <span className="mx-2 h-1 grow overflow-hidden rounded-sm bg-[#222]">
                    <span
                      className="block h-full animate-[fillBar_1.5s_ease-out_forwards] rounded-sm bg-white"
                      style={{
                        width: metric.width,
                        animationDelay: `${0.2 + index * 0.2}s`,
                      }}
                    />
                  </span>
                  <span className="w-8 text-right font-mono text-white">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md border-slate-700/80 bg-[#0f1115] text-foreground">
          <DialogHeader>
            <DialogTitle>Deactivate Aqua Agents?</DialogTitle>
            <DialogDescription>
              This fully disables autonomous execution and alert channels for this wallet. A
              MetaMask transaction signature is required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isDeactivating}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await onDeactivateAgent?.();
                  setConfirmOpen(false);
                } catch {
                  // parent handles surfaced error state
                }
              }}
              disabled={isDeactivating}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isDeactivating ? "Deactivating..." : "Yes, Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
