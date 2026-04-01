import { ComingSoonModuleRow } from "./coming-soon-module-row";
import type { AquaLearnModule } from "./aave-syllabus";
import { cn } from "@/lib/utils";

interface SyllabusListProps {
  modules: AquaLearnModule[];
  className?: string;
}

export function SyllabusList({ modules, className }: SyllabusListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {modules.map((mod, i) => (
        <ComingSoonModuleRow
          key={mod.title}
          index={i}
          title={mod.title}
          description={mod.description}
          durationLabel={mod.durationLabel}
        />
      ))}
    </div>
  );
}
