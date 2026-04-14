/**
 * CRE Demo Route — POST /api/cre/demo
 *
 * Infrastructure layer: thin HTTP wrapper for the CRE + CCC demo flow.
 *
 * Executes a simulation loop:
 *   1. Read positions from Tenderly fork
 *   2. Run CRE risk assessment
 *   3. If risk > threshold, execute CCC mitigation
 *   4. Return structured ExecutionReport with before/after metrics
 *
 * Requires DATA_PROVIDER_MODE=tenderly and TENDERLY_RPC_URL.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getCreOrchestrationAdapter } from "../../infrastructure/orchestration/index.js";
import { TenderlyMarketDataProvider } from "../../adapters/tenderly/TenderlyMarketDataProvider.js";
import { ForkController } from "../../infrastructure/tenderly/ForkController.js";
import { CccExecutionAdapter } from "../../infrastructure/ccc/CccExecutionAdapter.js";
import { WETH } from "../../infrastructure/aave/constants.js";
import type { MitigationIntent } from "../../domain/events/MitigationIntent.js";

interface DemoRequestBody {
  targetUser?: string;
  scenario?: "mild" | "moderate" | "severe";
}

export async function registerCREDemoRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post<{ Body: DemoRequestBody }>("/demo", async (request, reply) => {
    const rpcUrl = process.env.TENDERLY_RPC_URL;
    if (!rpcUrl) {
      return reply.status(500).send({
        error: "TENDERLY_RPC_URL is required for demo mode.",
      });
    }

    const { targetUser, scenario = "moderate" } = request.body ?? {};
    const forkId = process.env.TENDERLY_FORK_ID ?? "unknown";

    const provider = new TenderlyMarketDataProvider(rpcUrl);
    const forkController = new ForkController(rpcUrl);
    const cccAdapter = new CccExecutionAdapter(rpcUrl, forkId);

    const demoStart = performance.now();
    const orchestration = getCreOrchestrationAdapter();

    // Step 1: Baseline CRE
    const baselineSubmitted = await orchestration.submitIntent({
      type: "cre.workflow",
      options: {
        provider,
        chainId: "ethereum",
        positionLimit: 10,
      },
    });
    if (baselineSubmitted.status !== "completed" || !baselineSubmitted.result) {
      return reply.status(500).send({
        error: "CRE_BASELINE_FAILED",
        message: baselineSubmitted.error ?? "Baseline CRE workflow failed",
      });
    }
    const baseline = baselineSubmitted.result;

    // Step 2: Snapshot
    let snapshotId: string | undefined;
    try {
      snapshotId = await forkController.snapshot();
    } catch {
      // snapshot may not be supported on all Tenderly plans
    }

    // Step 3: Manipulate state based on scenario
    const user = targetUser ?? (
      baseline.riskScore.sampleSize > 0
        ? "0x5aFE3855358E112B5647B952709E6165e1c1eEEe"
        : "0x5aFE3855358E112B5647B952709E6165e1c1eEEe"
    );

    const borrowAmounts: Record<string, string> = {
      mild: "10000",
      moderate: "50000",
      severe: "150000",
    };

    try {
      await forkController.setEthBalance(user, "100");
      await forkController.setTokenBalance(WETH, user, "50", 18);
      await forkController.simulateSupply(user, WETH, "30", 18);

      const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      await forkController.simulateBorrow(user, usdc, borrowAmounts[scenario] ?? "50000", 6);
    } catch (e) {
      console.warn(`[cre-demo] State manipulation warning: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 4: Post-manipulation CRE
    const postSubmitted = await orchestration.submitIntent({
      type: "cre.workflow",
      options: {
        provider,
        chainId: "ethereum",
        positionLimit: 10,
      },
    });
    if (postSubmitted.status !== "completed" || !postSubmitted.result) {
      return reply.status(500).send({
        error: "CRE_POST_MANIP_FAILED",
        message: postSubmitted.error ?? "Post-manipulation CRE workflow failed",
      });
    }
    const postManip = postSubmitted.result;

    // Step 5: CCC mitigation if needed
    let executionReport = null;
    if (postManip.riskScore.composite > 0.5) {
      const intent: MitigationIntent = {
        id: `mit-api-${Date.now()}`,
        user,
        chainId: "ethereum",
        protocol: "aave-v3",
        type: "ADD_COLLATERAL",
        asset: WETH,
        amount: "10",
        preHealthFactor: postManip.riskScore.composite,
        targetHealthFactor: 2.0,
        riskScore: postManip.riskScore.composite,
        riskBand: postManip.riskScore.level,
        agentId: "cre-demo-agent",
        timestamp: Date.now(),
      };

      executionReport = await cccAdapter.executeMitigation(intent);
    }

    // Step 6: Final CRE
    const finalSubmitted = await orchestration.submitIntent({
      type: "cre.workflow",
      options: {
        provider,
        chainId: "ethereum",
        positionLimit: 10,
      },
    });
    if (finalSubmitted.status !== "completed" || !finalSubmitted.result) {
      return reply.status(500).send({
        error: "CRE_FINAL_FAILED",
        message: finalSubmitted.error ?? "Final CRE workflow failed",
      });
    }
    const final = finalSubmitted.result;

    // Step 7: Revert fork
    if (snapshotId) {
      try {
        await forkController.revert(snapshotId);
      } catch {
        // best-effort revert
      }
    }

    const totalDemoLatency = Math.round(performance.now() - demoStart);

    return reply.status(200).send({
      scenario,
      targetUser: user,
      forkId,
      progression: {
        baseline: {
          status: baseline.protocolStatus,
          riskScore: baseline.riskScore.composite,
          level: baseline.riskScore.level,
          decision: baseline.agentDecision.decision,
        },
        postManipulation: {
          status: postManip.protocolStatus,
          riskScore: postManip.riskScore.composite,
          level: postManip.riskScore.level,
          decision: postManip.agentDecision.decision,
        },
        postMitigation: {
          status: final.protocolStatus,
          riskScore: final.riskScore.composite,
          level: final.riskScore.level,
          decision: final.agentDecision.decision,
        },
      },
      executionReport,
      stateChanges: forkController.getStateLog(),
      latency: {
        total: totalDemoLatency,
        baseline: baseline.latencies.total,
        postManip: postManip.latencies.total,
        final: final.latencies.total,
      },
      timestamp: Date.now(),
    });
  });
}
