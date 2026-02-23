import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAdjacentPages } from "./docs-nav-config";

interface DocsPagerProps {
  currentHref: string;
}

export function DocsPager({ currentHref }: DocsPagerProps) {
  const { prev, next } = getAdjacentPages(currentHref);

  if (!prev && !next) return null;

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-border pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <div>
            <p className="text-xs text-muted-foreground/70">Previous</p>
            <p className="font-medium">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-right text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <div>
            <p className="text-xs text-muted-foreground/70">Next</p>
            <p className="font-medium">{next.title}</p>
          </div>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
