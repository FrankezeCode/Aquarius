"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChainIcon } from "./chain-icon";
import type { ChainDefinition } from "@/registry/chains";

interface NetworkPopoverProps {
  chains: ChainDefinition[];
  activeChainId: string;
  onSelect: (chainId: string) => void;
  children: React.ReactNode;
}

/**
 * Network Popover — scrollable chain selector overlay.
 *
 * Opens from the NetworkSwitcher trigger button.
 * Fixed height with internal scrolling to handle 20+ chains.
 * Keyboard accessible via Radix Popover primitives.
 */
export function NetworkPopover({
  chains,
  activeChainId,
  onSelect,
  children,
}: NetworkPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-52 p-0"
      >
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-sm font-medium text-foreground">Switch Network</p>
        </div>

        <ScrollArea className="h-64">
          <div className="py-1">
            {chains.map((chain) => {
              const isActive = chain.id === activeChainId;
              return (
                <button
                  key={chain.id}
                  onClick={() => onSelect(chain.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <ChainIcon chainId={chain.id} />
                  <span className="flex-1 text-left">{chain.name}</span>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
