"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChainIcon } from "./chain-icon";
import { NetworkPopover } from "./network-popover";
import type { ChainDefinition } from "@/registry/chains";

interface NetworkSwitcherProps {
  chains: ChainDefinition[];
  activeChain: ChainDefinition;
  onChainSelect: (chainId: string) => void;
  className?: string;
}

/**
 * Network Switcher — compact button displaying the current chain.
 *
 * Closed state: shows chain icon + name + chevron.
 * Open state: triggers NetworkPopover with the full chain list.
 */
export function NetworkSwitcher({
  chains,
  activeChain,
  onChainSelect,
  className,
}: NetworkSwitcherProps) {
  return (
    <NetworkPopover
      chains={chains}
      activeChainId={activeChain.id}
      onSelect={onChainSelect}
    >
      <button
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm transition-colors hover:bg-accent",
          className
        )}
      >
        <ChainIcon chainId={activeChain.id} />
        <span className="text-foreground font-medium">{activeChain.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </NetworkPopover>
  );
}
