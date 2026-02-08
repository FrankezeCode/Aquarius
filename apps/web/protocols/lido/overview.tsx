import { LidoLayout } from "./layout";
import { LidoOpportunities } from "./opportunities";
import { LidoActivity } from "./activity";
import { LidoRisk } from "./risk";
import { LidoInsights } from "./insights";

export function LidoOverview() {
  return (
    <LidoLayout>
      <div className="space-y-12">
        <section id="overview" className="scroll-mt-4">
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <h2 className="text-lg font-semibold text-amber-100">
              Lido — Preview
            </h2>
            <p className="mt-2 text-amber-200/90">
              Data coming soon. Overview, opportunities, activity, and risk
              views will be available here.
            </p>
          </div>
        </section>

        <section id="opportunities" className="scroll-mt-4">
          <LidoOpportunities />
        </section>

        <section id="activity" className="scroll-mt-4">
          <LidoActivity />
        </section>

        <section id="risk" className="scroll-mt-4">
          <LidoRisk />
        </section>

        <section id="insights" className="scroll-mt-4">
          <LidoInsights />
        </section>
      </div>
    </LidoLayout>
  );
}
