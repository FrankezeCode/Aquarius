import { cn } from "@/lib/utils";

export const LEARN_PAGE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "syllabus", label: "Syllabus" },
  { id: "certification", label: "Certification" },
] as const;

export function LearnMobileJumpNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden",
        className,
      )}
      aria-label="Section shortcuts"
    >
      {LEARN_PAGE_SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="shrink-0 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

interface LearnSidebarProps {
  className?: string;
}

export function LearnSidebar({ className }: LearnSidebarProps) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-border/40 bg-card/20 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto",
        className,
      )}
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        On this page
      </p>
      <nav aria-label="AQUA LEARN sections">
        <ul className="space-y-1">
          {LEARN_PAGE_SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-4 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground/80">
        Lesson pages and progress tracking will appear here as modules go live.
      </p>
    </aside>
  );
}
