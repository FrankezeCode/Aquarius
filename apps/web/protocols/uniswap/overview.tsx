import { UniswapLayout } from "./layout";
import { UniswapOpportunities } from "./opportunities";
import { UniswapActivity } from "./activity";
import { UniswapRisk } from "./risk";
import { UniswapInsights } from "./insights";

export function UniswapOverview() {
  return (
    <UniswapLayout>
      <div className="space-y-12">
        <section id="overview" className="scroll-mt-4">
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <h2 className="text-lg font-semibold text-amber-100">
              Uniswap — Preview
            </h2>
            <p className="mt-2 text-amber-200/90">
              Data coming soon. Overview, opportunities, activity, and risk
              views will be available here.
            </p>
          </div>
        </section>

        <section id="opportunities" className="scroll-mt-4">
          <UniswapOpportunities />
        </section>

        <section id="activity" className="scroll-mt-4">
          <UniswapActivity />
        </section>

        <section id="risk" className="scroll-mt-4">
          <UniswapRisk />
        </section>

        <section id="insights" className="scroll-mt-4">
          <UniswapInsights />
        </section>
      </div>
    </UniswapLayout>
  );
}
