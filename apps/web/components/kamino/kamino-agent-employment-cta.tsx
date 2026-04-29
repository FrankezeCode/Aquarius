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

/** Same asset as Aave `EnableAlertsCTA` — unified Aqua Agents identity across protocols. */
const SCANNER_IMAGE_SRC = "/images/aqua-agents.png";

interface KaminoAgentEmploymentCtaProps {
  className?: string;
}

/**
 * Same layout as `EnableAlertsCTA` — narrative is **Aqua Agents** everywhere (Aave, Kamino, etc.);
 * this page keeps Kamino-specific wording in the headline/bullets only.
 */
export function KaminoAgentEmploymentCta({ className }: KaminoAgentEmploymentCtaProps) {
  const [enrollOpen, setEnrollOpen] = useState(false);

  return (
    <section
      className={cn("py-8 md:py-10", className)}
      aria-label="Aqua Agents"
    >
      <div className="mx-auto w-full max-w-6xl overflow-hidden border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="relative grid min-h-[500px] grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-30" />

          <div className="relative z-[2] flex flex-col justify-between p-6 sm:p-10 lg:p-16">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#222222] pb-3 font-mono text-xs uppercase tracking-[0.05em]">
                <span className="font-bold text-white">Aqua Agents</span>
                <span className="text-[#888888]">Solana V1</span>
              </div>

              <h2 className="max-w-[92%] text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[42px]">
                Get alerted or protected{" "}
                <span className="text-[#888888]">before Kamino vault health declines.</span>
              </h2>

              <ul className="mt-6 space-y-2 text-[13px] text-[#888888]">
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Obligation monitoring</span> across Kamino
                  lending markets
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Aquarius intelligence</span> layered on
                  Solana snapshot data
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-0 inline-block -rotate-45 scale-y-[-1] font-mono text-[10px] text-white">
                    L
                  </span>
                  <span className="font-semibold text-white">Custom triggers</span> for LTV and
                  liquidation distance (roadmap)
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  type="button"
                  onClick={() => setEnrollOpen(true)}
                  className="h-12 w-fit rounded-full bg-white px-8 text-sm font-semibold tracking-[0.02em] text-[#050505] hover:bg-[#e0e0e0]"
                >
                  Employ Aqua Agents
                </Button>
              </div>

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
                  src={SCANNER_IMAGE_SRC}
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
                { label: "SPEED", width: "75%", value: "~12ms" },
                { label: "COVERAGE", width: "100%", value: "ALL" },
              ].map((metric, index) => (
                <div
                  key={metric.label}
                  className="mb-2 flex items-center justify-between text-[10px] text-[#888888]"
                >
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

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md border-slate-700/80 bg-[#0f1115] text-foreground">
          <DialogHeader>
            <DialogTitle>Employ Aqua Agents</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Aqua Agents are the same autonomous alert and protection layer across Aquarius protocol
              surfaces (Aave-class EVM, Kamino on Solana, and more). On this page you are previewing how
              Aqua pairs with Kamino obligation snapshots; Telegram and webhook channels follow the same
              delivery model as elsewhere. No protocol transactions are sent from this view until
              enrollment and execution hooks are enabled for your deployment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setEnrollOpen(false)} className="bg-white text-[#050505] hover:bg-[#e0e0e0]">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
