"use client";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "opportunities", label: "Opportunities" },
  { id: "activity", label: "Activity" },
  { id: "risk", label: "Risk" },
  { id: "insights", label: "Insights" },
] as const;

export function LidoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav
        className="flex flex-wrap gap-1 border-b border-border pb-3"
        aria-label="Lido sections"
      >
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  );
}
