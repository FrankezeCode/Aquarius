"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Eye, Zap, ChevronRight, Waves, BarChart3, Activity, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/protocol-shell/navbar";
import Footer from "@/components/protocol-shell/footer";

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
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Live on Aave V3
              </span>
            </motion.div>

            {/* Headline — wider than max-w-4xl so text-9xl fits on one line */}
            <motion.h1
              variants={fadeInUp}
              className="hero-laser-container text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter mb-6 -mx-8 md:-mx-16 lg:-mx-24"
            >
              <span className="block">Protection at</span>
              <span className="block hero-chrome-gradient">Hyper-Speed.</span>
            </motion.h1>

            {/* Sub-hero heading */}
            <motion.h2
              variants={fadeInUp}
              className="text-xl md:text-2xl font-semibold mb-4 max-w-2xl mx-auto"
            >
              Real-time, protocol-aware risk intelligence for DeFi.
            </motion.h2>

            {/* Sub-hero body */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Continuously monitors health factors, account exposure, and on-chain stress signals — starting with Aave — and escalates before liquidation risk becomes inevitable.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/protocol/aave">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm gap-2 text-base px-8">
                  Monitor Aave Risk
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  Documentation
                </Button>
              </Link>
            </motion.div>
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
                description: "Start with Aave. More protocols coming soon. Each one is a focused intelligence lab.",
                icon: Waves,
              },
              {
                step: "02",
                title: "See Live Activity",
                description: "Watch real on-chain earning, liquidations, and risk events as they happen.",
                icon: Activity,
              },
              {
                step: "03",
                title: "Act with Clarity",
                description: "Understand exactly where value flows and why — then make informed decisions.",
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

      {/* Preview Cards Section */}
      <section className="py-20 md:py-32 relative bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You&apos;ll See</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Real protocol intelligence. Not marketing metrics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Public Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="aquarius-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Public View</h3>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Protocol risk overview and health factor distributions</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Aggregated liquidation patterns and timelines</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Live on-chain activity feed</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Educational explanations of protocol mechanics</span>
                </li>
              </ul>
            </motion.div>

            {/* Private Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="aquarius-card p-8 border-primary/30"
            >
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">With Account</h3>
                <span className="px-2 py-0.5 text-xs rounded bg-primary/20 text-primary">Premium</span>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Wallet-level activity tracking (addresses only)</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Historical value capture patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Advanced risk clustering and degradation signals</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Protocol-specific earning opportunity insights</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to see what others can&apos;t?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Start exploring protocol intelligence with Aave. No wallet required.
            </p>
            <Link href="/protocol/aave">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow gap-2 text-lg px-10 py-6">
                Explore Aave Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
