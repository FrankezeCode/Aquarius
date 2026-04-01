import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AaveLogo } from "@/components/protocol-shell/protocol-logos";
import {
  AAVE_AQUA_LEARN_MODULES,
  AquaLearnHero,
  CertificateComingSoon,
  CourseOverviewPanel,
  SyllabusList,
} from "@/components/learn";

export default function AaveLearnPage() {
  return (
    <>
      <AquaLearnHero
        tagline="AQUA LEARN"
        programTitle="Aave — full curriculum"
        description="A structured education track for supply, borrow, risk, and using Aquarius alongside Aave. Modules unlock progressively; content and assessments are in active production."
        logo={<AaveLogo className="h-8 w-8 text-primary" />}
      />

      <CourseOverviewPanel />

      <section
        id="syllabus"
        className="scroll-mt-28 space-y-5"
        aria-labelledby="syllabus-heading"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="syllabus-heading"
              className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              Syllabus
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              Five modules mirror how institutions and power users reason about
              Aave—from mechanics to monitoring. None are enrollable yet; each row
              is a preview of the final lesson sequence.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
            All modules · coming soon
          </p>
        </div>
        <SyllabusList modules={AAVE_AQUA_LEARN_MODULES} />
      </section>

      <CertificateComingSoon />

      <section className="flex flex-col gap-4 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          When you finish the track, you&apos;ll return here for your certificate
          and optional on-chain attestation.
        </p>
        <Button
          asChild
          size="lg"
          className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/protocol/aave">
            Open Aave risk dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </>
  );
}
