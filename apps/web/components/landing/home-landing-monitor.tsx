"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { protocolMeta } from "@/lib/protocol-meta";
import { useProtocolChain } from "@/context/protocol-chain-context";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

/** Hero status pill: reflects current monitor target (navbar / dropdown / URL / localStorage). */
export function LandingHeroBadge() {
  const { monitorTargetProtocolId } = useProtocolChain();
  const meta = protocolMeta[monitorTargetProtocolId];
  const protocolName = meta?.name ?? monitorTargetProtocolId;

  return (
    <motion.div variants={fadeInUp} className="mb-6">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
        Live on {protocolName}
      </span>
    </motion.div>
  );
}

/** Body copy + Monitor + Docs — uses global monitor target from context (navbar / dropdown). */
export function LandingHeroProtocolPanel() {
  const { monitorTargetProtocolId } = useProtocolChain();

  const monitorMeta = protocolMeta[monitorTargetProtocolId];
  const monitorHref = `/protocol/${monitorTargetProtocolId}`;
  const monitorLabel = monitorMeta
    ? `Monitor ${monitorMeta.name} Risk`
    : "Monitor protocol risk";

  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <p className="mx-auto mb-0 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Aquarius uses AI agents to analyze positions and on-chain conditions in real
        time—detecting and acting on risk before losses occur.
      </p>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href={monitorHref}>
          <Button
            size="lg"
            className="gap-2 bg-primary px-8 text-base text-primary-foreground shadow-glow-sm hover:bg-primary/90"
          >
            {monitorLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/docs">
          <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
            Documentation
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

/** Bottom landing CTA: Explore {protocol} Now */
export function LandingBottomExploreCta() {
  const { monitorTargetProtocolId } = useProtocolChain();
  const meta = protocolMeta[monitorTargetProtocolId];
  const name = meta?.name ?? "Protocol";
  const href = `/protocol/${monitorTargetProtocolId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-3xl text-center"
    >
      <h2 className="mb-6 text-3xl font-bold md:text-5xl">
        Ready to see what others can&apos;t?
      </h2>
      <p className="mb-10 text-lg text-muted-foreground">
        Start exploring protocol intelligence on Aave and Kamino. No wallet required.
      </p>
      <Link href={href}>
        <Button
          size="lg"
          className="gap-2 bg-primary px-10 py-6 text-lg text-primary-foreground shadow-glow hover:bg-primary/90"
        >
          Explore {name} Now
          <ArrowRight className="h-5 w-5" />
        </Button>
      </Link>
    </motion.div>
  );
}
