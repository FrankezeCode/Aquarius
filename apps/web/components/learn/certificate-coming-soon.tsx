import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificateComingSoonProps {
  className?: string;
}

export function CertificateComingSoon({ className }: CertificateComingSoonProps) {
  return (
    <section
      id="certification"
      className={cn(
        "scroll-mt-28 space-y-4 rounded-2xl border border-dashed border-border/60 bg-card/25 p-6 sm:p-8",
        className,
      )}
      aria-labelledby="cert-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Award className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <h2
            id="cert-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Verified credentials
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            Completing the full AQUA LEARN track will unlock a shareable certificate
            of completion—aligned with quizzes, labs, and on-chain literacy standards.
            Issuance, identity, and anti-fraud controls are in design.
          </p>
          <p className="inline-flex items-center rounded-md border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Certification pipeline — coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
