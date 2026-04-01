import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonModuleRowProps {
  index: number;
  title: string;
  description: string;
  durationLabel: string;
  className?: string;
}

export function ComingSoonModuleRow({
  index,
  title,
  description,
  durationLabel,
  className,
}: ComingSoonModuleRowProps) {
  const n = String(index + 1).padStart(2, "0");

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/50 bg-[#0a0a0c]/60 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
        <span className="font-mono text-xs tabular-nums text-muted-foreground/80">
          Module {n}
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 sm:block">
          {durationLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h3>
          <span className="sm:hidden font-mono text-[10px] text-muted-foreground/60">
            {durationLabel}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
          <Lock className="h-3 w-3 opacity-80" aria-hidden />
          Coming soon
        </span>
      </div>
    </div>
  );
}
