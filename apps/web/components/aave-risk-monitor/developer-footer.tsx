import Link from "next/link";
import { cn } from "@/lib/utils";

interface DeveloperFooterProps {
  className?: string;
}

/**
 * Developer Path — Non-intrusive footer link
 * 
 * Purpose: SDK discovery for judges & builders
 * Not visually competing — reinforces platform extensibility.
 */
export function DeveloperFooter({ className }: DeveloperFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/50 pt-8 text-center",
        className
      )}
    >
      <Link
        href="/sdk"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Building on Aquarius? Integrate via selvä SDK →
      </Link>
    </footer>
  );
}
