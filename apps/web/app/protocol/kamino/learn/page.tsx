import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KaminoLogo } from "@/components/protocol-shell/protocol-logos";
import {
  AquaLearnHero,
  CertificateComingSoon,
} from "@/components/learn";

export default function KaminoLearnPage() {
  return (
    <>
      <AquaLearnHero
        tagline="AQUA LEARN"
        programTitle="Kamino — curriculum preview"
        description="Structured education for Kamino Lending on Solana: supply, borrow, LTV risk, and using Aquarius snapshot-based intelligence. Full modules unlock as content ships."
        logo={<KaminoLogo className="h-8 w-8 text-primary" />}
      />

      <section
        id="syllabus"
        className="scroll-mt-28 space-y-4"
        aria-labelledby="kamino-syllabus-heading"
      >
        <h2
          id="kamino-syllabus-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Syllabus
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Lesson sequence will mirror how power users reason about Kamino on
          Solana—reserves, obligation health, and monitoring with Aquarius. Module
          list and enrollments are not live yet; use the risk dashboard for live
          snapshots when configured.
        </p>
      </section>

      <CertificateComingSoon />

      <section className="flex flex-col gap-4 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Return to the Kamino lab for live risk snapshots and copilot context.
        </p>
        <Button
          asChild
          size="lg"
          className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/protocol/kamino">
            Open Kamino risk dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </>
  );
}
