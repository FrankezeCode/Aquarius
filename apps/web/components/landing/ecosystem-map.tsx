"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShieldCheck, Waves } from "lucide-react";

const ORBIT_DURATION_SECONDS = 7.2;
const ORBIT_SEGMENT_SECONDS = ORBIT_DURATION_SECONDS / 5;

function NodeImpact({
  delay,
  colorClass,
}: {
  delay: number;
  colorClass: string;
}) {
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute -inset-1 rounded-xl sm:-inset-2 ${colorClass}`}
      animate={{
        opacity: [0, 0.95, 0],
        scale: [0.92, 1.08, 1.16],
      }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        repeat: Infinity,
        delay,
        repeatDelay: ORBIT_DURATION_SECONDS - 0.6,
      }}
    />
  );
}

export function EcosystemMap() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-card/30 px-4 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10"
        >
          <div className="mb-8 text-center md:mb-10">
            {/* Always horizontal; compact on xs so the row fits narrow viewports */}
            <div className="mx-auto flex w-full max-w-full flex-row flex-nowrap items-center justify-center gap-2 sm:gap-4 md:gap-5">
              <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5 md:gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 p-1 text-[#2A5ADA] sm:h-11 sm:w-11 sm:p-1.5 md:h-12 md:w-12">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 fill-current sm:h-8 sm:w-8 md:h-9 md:w-9"
                    aria-hidden
                  >
                    <path d="M12 1.75L3.5 6.6v10.8L12 22.25l8.5-4.85V6.6L12 1.75zm0 2.4l6.45 3.68v8.34L12 19.85 5.55 16.17V7.83L12 4.15z" />
                  </svg>
                </span>
                <div className="min-w-0 text-left leading-tight">
                  <p className="text-sm font-semibold tracking-tight text-white sm:text-base md:text-[20px]">
                    Chainlink
                  </p>
                  <p className="text-[10px] text-[#8d95a5] sm:text-[12px]">Executes</p>
                </div>
              </div>

              <span
                className="h-10 w-px shrink-0 bg-white/25 sm:h-14 md:h-16"
                aria-hidden
              />

              <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5 md:gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 p-1 sm:h-11 sm:w-11 sm:p-1.5 md:h-12 md:w-12">
                  <Image
                    src="/brand/aqua-logo-white.png.png"
                    alt=""
                    width={48}
                    height={48}
                    className="h-5 w-5 object-contain sm:h-8 sm:w-8 md:h-9 md:w-9"
                  />
                </span>
                <div className="min-w-0 text-left leading-tight">
                  <p className="text-sm font-semibold tracking-tight text-white sm:text-base md:text-[20px]">
                    Aquarius
                  </p>
                  <p className="text-[10px] text-[#8d95a5] sm:text-[12px]">Protects</p>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
              Oracle and market signals flow through Aquarius intelligence, then trigger
              protection decisions back into DeFi positions.
            </p>
          </div>

          <div className="relative mx-auto h-[360px] w-full max-w-[620px] sm:h-[400px]">
            {/* Orbit frames */}
            <div className="absolute inset-4 rounded-[28px] border border-violet-300/45" />
            <div className="absolute inset-10 rounded-[24px] border border-violet-300/25" />

            {/* Moving flow signal — positioned inside inset-4 so % track matches outer ring on all widths */}
            <div className="pointer-events-none absolute inset-4" aria-hidden>
              <motion.div
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]"
                initial={{ left: "0%", top: "5%" }}
                animate={{
                  left: ["0%", "100%", "100%", "50%", "0%", "0%"],
                  top: ["5%", "5%", "95%", "95%", "95%", "5%"],
                }}
                transition={{ duration: ORBIT_DURATION_SECONDS, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Node: Aquarius Agent */}
            <div className="absolute right-0 top-8 max-w-[calc(50%-0.5rem)] rounded-xl border border-violet-300/55 bg-[#0f1219] px-2 py-1.5 text-[10px] font-medium text-foreground/90 shadow-sm sm:max-w-none sm:px-3 sm:py-2 sm:text-xs">
              <NodeImpact
                delay={ORBIT_SEGMENT_SECONDS}
                colorClass="bg-violet-300/12 ring-1 ring-violet-300/45 shadow-[0_0_20px_rgba(167,139,250,0.35)]"
              />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    repeat: Infinity,
                    delay: ORBIT_SEGMENT_SECONDS,
                    repeatDelay: ORBIT_DURATION_SECONDS - 0.35,
                  }}
                  className="inline-flex shrink-0"
                >
                  <ShieldCheck className="h-3 w-3 text-violet-300 sm:h-3.5 sm:w-3.5" />
                </motion.span>
                <span className="min-w-0 leading-tight">Aquarius Agent</span>
              </div>
            </div>

            {/* Node: Chainlink */}
            <div className="absolute left-0 top-2 max-w-[calc(50%-0.5rem)] rounded-xl border border-cyan-300/55 bg-[#0f1219] px-2 py-1.5 text-[10px] font-medium text-foreground/90 shadow-sm sm:max-w-none sm:px-3 sm:py-2 sm:text-xs">
              <NodeImpact
                delay={0}
                colorClass="bg-cyan-300/12 ring-1 ring-cyan-300/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    repeat: Infinity,
                    delay: 0,
                    repeatDelay: ORBIT_DURATION_SECONDS - 0.35,
                  }}
                  className="inline-flex shrink-0"
                >
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-cyan-300/70 text-[8px] font-bold text-cyan-200 sm:h-4 sm:w-4 sm:text-[9px]">
                    C
                  </span>
                </motion.span>
                <span className="min-w-0 leading-tight">Chainlink Signals</span>
              </div>
            </div>

            {/* Node: DeFi */}
            <div className="absolute bottom-3 left-1/2 max-w-[calc(100%-2.5rem)] -translate-x-1/2 rounded-xl border border-emerald-300/55 bg-[#0f1219] px-2 py-1.5 text-[10px] font-medium text-foreground/90 shadow-sm sm:bottom-4 sm:max-w-none sm:px-3 sm:py-2 sm:text-xs">
              <NodeImpact
                delay={ORBIT_SEGMENT_SECONDS * 3}
                colorClass="bg-emerald-300/12 ring-1 ring-emerald-300/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              />
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    repeat: Infinity,
                    delay: ORBIT_SEGMENT_SECONDS * 3,
                    repeatDelay: ORBIT_DURATION_SECONDS - 0.35,
                  }}
                  className="inline-flex shrink-0"
                >
                  <Waves className="h-3 w-3 text-emerald-300 sm:h-3.5 sm:w-3.5" />
                </motion.span>
                <span className="min-w-0 text-center leading-tight">DeFi Protocol Position</span>
              </div>
            </div>

            {/* Center core — outer padding = visible gutter between frame (#111317) and inner panel (#0c1017) */}
            <div className="absolute left-1/2 top-1/2 w-[min(250px,calc(100%-5rem))] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-[#111317] p-4 shadow-[0_16px_40px_-22px_rgba(0,0,0,0.9)] sm:w-[220px] sm:p-5 md:w-[250px] md:p-5">
              <div className="rounded-xl border border-border/60 bg-[#0c1017] px-3.5 pb-4 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5 md:px-5 md:pb-5 md:pt-4">
                <p className="text-center text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80 sm:text-[10px]">
                  Intelligence Core
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5 sm:mt-3.5 sm:gap-2 md:gap-3">
                  <div className="relative h-9 w-9 overflow-hidden rounded-md border border-blue-300/35 bg-blue-300/20 sm:h-10 sm:w-10 md:h-11 md:w-11">
                    <Image
                      src="/images/aqua-agents.png"
                      alt="Aquarius"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative h-5 w-10 sm:h-6 sm:w-12 md:w-14">
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-cyan-300/20 via-cyan-300/60 to-emerald-300/25" />
                    <motion.span
                      className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.span
                      className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                      animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.45,
                      }}
                    />
                  </div>
                  <div className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-emerald-300/40 bg-emerald-300/15 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-200 sm:h-10 sm:min-w-10 sm:px-2 sm:text-[10px] md:h-11">
                    AAVE
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-1 text-center">
            <p className="text-sm text-muted-foreground/65">
              Built with love ❤️ for users, developers, and automated systems.
            </p>
            <p className="text-sm text-muted-foreground/60">
              In honor of{" "}
              <a
                href="https://en.wikipedia.org/wiki/Miki_Endo"
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Miki Endo
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
