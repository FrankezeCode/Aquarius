import { CompoundLayout } from "./layout";
import { CompoundOpportunities } from "./opportunities";
import { CompoundActivity } from "./activity";
import { CompoundRisk } from "./risk";
import { CompoundInsights } from "./insights";

export function CompoundOverview() {
  return (
    <CompoundLayout>
      <div className="space-y-12">
        <section id="overview" className="scroll-mt-4">
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <h2 className="text-lg font-semibold text-amber-100">
              Compound — Preview
            </h2>
            <p className="mt-2 text-amber-200/90">
              Data coming soon. Overview, opportunities, activity, and risk
              views will be available here.
            </p>
          </div>
        </section>

        <section id="opportunities" className="scroll-mt-4">
          <CompoundOpportunities />
        </section>

        <section id="activity" className="scroll-mt-4">
          <CompoundActivity />
        </section>

        <section id="risk" className="scroll-mt-4">
          <CompoundRisk />
        </section>

        <section id="insights" className="scroll-mt-4">
          <CompoundInsights />
        </section>
      </div>
    </CompoundLayout>
  );
}
