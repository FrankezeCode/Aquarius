import { BookOpen, Clock, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}

function OverviewStat({ icon, label, value, hint }: StatProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/40 bg-[#0a0a0c]/80 px-4 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground/70">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

interface CourseOverviewPanelProps {
  className?: string;
}

export function CourseOverviewPanel({ className }: CourseOverviewPanelProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-border/50 bg-card/30 p-5 sm:p-6",
        className,
      )}
      aria-labelledby="course-overview-heading"
    >
      <h2
        id="course-overview-heading"
        className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Course overview
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewStat
          icon={<BookOpen className="h-4 w-4" aria-hidden />}
          label="Level"
          value="Foundational → applied"
          hint="Structured like a university short course."
        />
        <OverviewStat
          icon={<Clock className="h-4 w-4" aria-hidden />}
          label="Pacing"
          value="Self-paced"
          hint="Estimated hours will be published with v1."
        />
        <OverviewStat
          icon={<Signal className="h-4 w-4" aria-hidden />}
          label="Outcome"
          value="Protocol-literate positions"
          hint="Read markets, manage risk, use Aquarius effectively."
        />
      </div>
    </section>
  );
}
