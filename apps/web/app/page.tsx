"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Eye, Zap, Waves, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/protocol-shell/navbar";
import Footer from "@/components/protocol-shell/footer";
import { EcosystemMap } from "@/components/landing/ecosystem-map";
import {
  LandingBottomExploreCta,
  LandingHeroBadge,
  LandingHeroProtocolPanel,
} from "@/components/landing/home-landing-monitor";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface PricingPoint {
  text: string;
  supporting?: string;
  planned?: boolean;
  muted?: boolean;
}

interface PricingTier {
  name: string;
  tone: string;
  badge: string;
  modeLabel: string;
  cta: string;
  ctaHref: string;
  highlight: boolean;
  description: string;
  points: PricingPoint[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Manual",
    tone: "Stressful",
    badge: "Starter",
    modeLabel: "Mode: Manual",
    cta: "Stay Manual",
    ctaHref: "/protocol/aave",
    highlight: false,
    description:
      "You monitor and act manually. Good for learning, but speed depends on you.",
    points: [
      { text: "Self-monitor health factor and liquidation pressure manually" },
      { text: "Single-screen monitoring posture", supporting: "" },
      { text: "1,000 CU Aquarius Intelligence API usage/month" },
      { text: "No autonomous mitigation agent execution", muted: true },
      { text: "While others play football, you are still checking dashboards" },
    ],
  },
  {
    name: "Pro",
    tone: "Peace of Mind",
    badge: "Most Popular",
    modeLabel: "Mode: Autonomous",
    cta: "Start Pro Protection",
    ctaHref: "/protocol/aave",
    highlight: true,
    description:
      "You relax while Aqua autonomous agents monitor and protect positions with real-time risk intelligence.",
    points: [
      {
        text: "Monitor all Aquarius-supported protocol ",
        supporting: "",
      },
      { text: "Unlimited Aquarius Intelligence API usage " },
      { text: "Seamless Aquarius SELVA SDK integration for bots and automation" },
      { text: "Actionable metrics and stress tests" },
      { text: "You live. Aquarius watches." },
    ],
  },
  {
    name: "Institution",
    tone: "Autonomy",
    badge: "Enterprise",
    modeLabel: "Mode: Institutional",
    cta: "Contact Institutional Team",
    ctaHref: "/docs",
    highlight: false,
    description:
      "For DAOs and institutions with high liquidity that require policy-bound autonomous protection and productive insurance capital.",
    points: [
      { text: "Insure positions with Aqua Buffer Vault while keeping capital yield-bearing" },
      { text: "Treasury-grade policy controls for bounded autonomous mitigation" },
      { text: "Institutional portfolio view", supporting: "", planned: true },
      { text: "Agent security verification and formal assurance layer", planned: true },
      { text: "Custom enterprise throughput and operational controls", planned: true },
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 aquarius-grid-bg opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-4xl mx-auto text-center"
          >
            <LandingHeroBadge />

            {/* Headline — negative margins only md+ so mobile keeps container px-4 breathing room */}
            <motion.h1
              variants={fadeInUp}
              className="hero-laser-container mb-6 text-5xl font-black uppercase tracking-tighter sm:text-6xl md:-mx-16 md:text-8xl lg:-mx-24 lg:text-9xl"
            >
              <span className="block">Protection at</span>
              <span className="block hero-chrome-gradient">Hyper-Speed.</span>
            </motion.h1>

            {/* Sub-hero heading */}
            <motion.h2
              variants={fadeInUp}
              className="mx-auto mb-4 max-w-2xl text-xl font-semibold md:text-2xl"
            >
              Real-time, protocol-aware risk intelligence for DeFi.
            </motion.h2>

            <LandingHeroProtocolPanel />
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>On-chain & verifiable</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Protect positions before failure</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Live protocol signals</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three steps to protocol clarity. No complexity, no guesswork.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Choose a Protocol",
                description:
                  "Pick Aave or Kamino today. More protocols are on the roadmap—each one is a focused intelligence lab.",
                icon: Waves,
              },
              {
                step: "02",
                title: "See Live Activity",
                description: "Watch real on-chain risk events as they happen.",
                icon: Activity,
              },
              {
                step: "03",
                title: "Act with Clarity",
                description: (
                  <>
                    Understand how, when, where, and why risk is building—then decide manually
                    or let{" "}
                    <span className="font-bold text-white">Aqua agents</span> act on your
                    behalf 24/7, so you&apos;re not glued to a dashboard.
                  </>
                ),
                icon: BarChart3,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="aquarius-card-hover p-8 text-center relative group"
              >
                <div className="absolute top-4 right-4 text-6xl font-bold text-border/50 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-6">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <EcosystemMap />

      {/* Aquarius Pricing Section */}
      <section className="relative overflow-hidden bg-secondary/30 py-8 md:py-10">
        <div className="absolute inset-0 aquarius-grid-bg opacity-45" />
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center md:mb-10"
          >
            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">Aquarius Pricing</h2>
            <p className="mx-auto max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Choose your risk posture
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
            {PRICING_TIERS.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: tier.highlight ? -24 : 0 }}
                whileHover={{ y: tier.highlight ? -26 : -2 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className={[
                  "group relative flex min-h-0 flex-col rounded-[4px] border p-4 pt-10 transition-all duration-200 md:min-h-[520px] hover:border-[#2d3748] hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.35)]",
                  tier.highlight
                  ? "border-[#4cffcf] bg-background/80 shadow-[0_0_32px_-14px_rgba(76,255,207,0.65)] hover:border-[#6dffd9] hover:shadow-[0_0_34px_-10px_rgba(76,255,207,0.9)]"
                  : "border-[#262626] bg-background/80",
                ].join(" ")}
                aria-label={`${tier.name} pricing tier`}
              >
                <div className="absolute -left-px -top-px z-10 leading-none">
                  <span
                    className={[
                      "inline-block rounded-none border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] leading-none",
                      tier.highlight
                        ? "border-[#4cffcf]/60 bg-[#58eec0] text-black"
                        : "border-[#2a2a2a] bg-[#0b0b0b] text-muted-foreground",
                    ].join(" ")}
                  >
                    {tier.badge}
                  </span>
                </div>

                <h3 className="text-[29px] font-bold uppercase leading-none tracking-wide">
                  {tier.name}
                </h3>
                <p
                  className={[
                    "mb-2.5 mt-1 text-[15px] leading-none",
                    tier.highlight ? "text-[#57ffd0]" : "text-muted-foreground",
                  ].join(" ")}
                >
                  ({tier.tone})
                </p>
                <div className="mb-3.5 h-px w-full bg-[#1a2535]" />
                <p className="mb-4 text-[12px] leading-5 text-muted-foreground md:text-[13px]">
                  {tier.description}
                </p>

                <ul className="mb-5 space-y-2 text-[12px] leading-5 text-white md:text-[13px]">
                  {tier.points.map((point) => (
                    <li key={point.text} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className={[
                          "relative mt-[3px] inline-block shrink-0 border",
                          point.muted
                            ? "h-4 w-4 rounded-none border border-[#2b2b2b] bg-[#0d0d0d]"
                            : tier.highlight
                              ? "h-4 w-4 rounded-none border border-[#47ffd0] bg-[#0f2f27]"
                              : "h-4 w-4 rounded-none border border-[#2b2b2b] bg-[#0d0d0d]",
                        ].join(" ")}
                      >
                        {!point.muted ? (
                          <span className="absolute inset-0 grid place-items-center text-[9px] font-black leading-none text-white">
                            ✓
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={point.muted ? "text-muted-foreground" : "text-white"}
                      >
                        {point.text}
                        {point.supporting ? (
                          <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                            {point.supporting}
                          </span>
                        ) : null}
                        {point.planned ? (
                          <span
                            aria-label="Comming soon"
                            title="Comming soon"
                            className="ml-2 text-[10px] text-muted-foreground"
                          >
                            (Comming soon)
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-[#1a2535] pt-4">
                  <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {tier.modeLabel}
                  </p>
                  <Link href={tier.ctaHref}>
                    <Button
                      variant={tier.highlight ? "default" : "outline"}
                      className={[
                        "h-10 w-full rounded-sm border text-[11px] font-bold uppercase tracking-[0.08em]",
                        tier.highlight
                          ? "border-[#64ffd4] bg-[#58eec0] text-[#04111d] hover:bg-[#6afbd0]"
                          : "border-[#3a465c] bg-transparent text-white hover:bg-[#111111]",
                      ].join(" ")}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <LandingBottomExploreCta />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
