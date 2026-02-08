import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AaveLogo } from "@/components/protocol-shell/protocol-logos";

export default function AaveLearnPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <AaveLogo className="h-10 w-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Learn About Aave
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Aave is a decentralized lending protocol that enables users to supply assets to earn yield and borrow against their collateral.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What is Aave?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Aave is an open-source, non-custodial liquidity protocol. Users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn passive income, while borrowers can borrow in an overcollateralized (perpetual) or undercollateralized (one-block liquidity) manner.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Opportunities on Aave</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50">
            <TrendingUp className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Supply & Earn</h3>
              <p className="text-sm text-muted-foreground">
                Deposit supported assets to earn variable or stable APY. Rates adjust based on market supply and demand.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50">
            <Zap className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Borrow</h3>
              <p className="text-sm text-muted-foreground">
                Use your supplied assets as collateral to borrow other assets. Maintain a healthy health factor to avoid liquidation.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50">
            <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Risk & Rates</h3>
              <p className="text-sm text-muted-foreground">
                Interest rates are algorithmically determined. Utilization, liquidation thresholds, and reserve factors shape the risk-reward profile.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How to Participate</h2>
        <p className="text-muted-foreground leading-relaxed">
          Connect a Web3 wallet (e.g., MetaMask) to an Aave-supported chain. Supply assets to earn yield or use them as collateral to borrow. Monitor your health factor to avoid liquidation. Aave V3 is live on Ethereum, Polygon, Arbitrum, Optimism, Base, and other networks.
        </p>
      </section>

      <section className="pt-8 border-t border-border">
        <Link href="/protocol/aave">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            Go to Aave Risk Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
