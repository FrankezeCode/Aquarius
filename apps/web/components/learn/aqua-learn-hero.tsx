import { cn } from "@/lib/utils";

interface AquaLearnHeroProps {
  programTitle: string;
  tagline: string;
  description: string;
  logo: React.ReactNode;
  className?: string;
}

export function AquaLearnHero({
  programTitle,
  tagline,
  description,
  logo,
  className,
}: AquaLearnHeroProps) {
  return (
    <header
      id="overview"
      className={cn(
        "scroll-mt-28 space-y-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            {tagline}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50">
              {logo}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {programTitle}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
