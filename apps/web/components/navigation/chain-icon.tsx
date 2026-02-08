"use client";

import { cn } from "@/lib/utils";
import { CHAINS } from "@/registry/chains";

interface ChainIconProps {
  chainId: string;
  className?: string;
}

/**
 * Chain Icon — renders a colored circle with chain's first letter.
 *
 * Uses the chain's brand color from the registry.
 * Can be upgraded to custom SVG logos per chain in the future.
 */
export function ChainIcon({ chainId, className }: ChainIconProps) {
  const chain = CHAINS[chainId];
  if (!chain) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white",
        className
      )}
      style={{ backgroundColor: chain.color }}
      aria-hidden="true"
    >
      {chain.name[0]}
    </span>
  );
}
