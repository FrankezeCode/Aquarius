/**
 * Aquarius CRE + CCC Full Simulation Demo
 *
 * End-to-end orchestrator that demonstrates:
 *   1. Tenderly fork state reads (real Aave V3 positions)
 *   2. Fork state manipulation (force low HF)
 *   3. CRE risk detection + escalation
 *   4. CCC mitigation execution (simulated on fork)
 *   5. Post-mitigation verification
 *
 * Usage:
 *   DATA_PROVIDER_MODE=tenderly EXECUTION_MODE=simulated_ccc pnpm run:ccc-demo
 *
 * Requires:
 *   - TENDERLY_RPC_URL pointing to a Tenderly Virtual TestNet fork
 *   - A fork with mainnet state (Aave V3 positions exist)
 */

import "dotenv/config";
import { runCREWorkflow } from "../packages/domain/cre/run-cre-workflow.js";
import { TenderlyMarketDataProvider } from "../apps/api/src/adapters/tenderly/TenderlyMarketDataProvider.js";
import { ForkController } from "../apps/api/src/infrastructure/tenderly/ForkController.js";
import { CccExecutionAdapter } from "../apps/api/src/infrastructure/ccc/CccExecutionAdapter.js";
import { AaveContractReader } from "../apps/api/src/infrastructure/aave/AaveContractReader.js";
import { WETH, DEFAULT_TARGET_ADDRESSES } from "../apps/api/src/infrastructure/aave/constants.js";
import type { MitigationIntent, ExecutionReport } from "../apps/api/src/domain/events/MitigationIntent.js";

function banner(text: string): void {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${text}`);
  console.log(`${"═".repeat(60)}\n`);
}

function printReport(report: ExecutionReport): void {
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│          EXECUTION REPORT                   │");
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│  Intent ID:        ${report.intentId}`);
  console.log(`│  Pre-HF:           ${report.preHF}`);
  console.log(`│  Post-HF:          ${report.postHF}`);
  console.log(`│  HF Improvement:   +${(report.postHF - report.preHF).toFixed(3)}`);
  console.log(`│  Decision Latency: ${report.decisionLatencyMs}ms`);
  console.log(`│  Exec Latency:     ${report.executionLatencyMs}ms`);
  console.log(`│  Total Latency:    ${report.totalLatencyMs}ms`);
  console.log(`│  Tx Hash:          ${report.txHash.slice(0, 20)}...`);
  console.log(`│  Fork ID:          ${report.forkId ?? "N/A"}`);
  console.log(`│  Success:          ${report.success}`);
  if (report.error) {
    console.log(`│  Error:            ${report.error}`);
  }
  console.log("└─────────────────────────────────────────────┘");
}

async function main() {
  const rpcUrl = process.env.TENDERLY_RPC_URL;
  if (!rpcUrl) {
    console.error("TENDERLY_RPC_URL is required. Set it in .env.");
    process.exit(1);
  }

  const forkId = process.env.TENDERLY_FORK_ID ?? "unknown";

  banner("AQUARIUS CRE + CCC SIMULATION");
  console.log(`[config] RPC URL: ${rpcUrl.slice(0, 40)}...`);
  console.log(`[config] Fork ID: ${forkId}`);
  console.log(`[config] Execution Mode: ${process.env.EXECUTION_MODE ?? "simulated_ccc"}`);

  // ── Initialize components ──────────────────────────────────────
  const provider = new TenderlyMarketDataProvider(rpcUrl);
  const forkController = new ForkController(rpcUrl);
  const cccAdapter = new CccExecutionAdapter(rpcUrl, forkId);
  const reader = new AaveContractReader(rpcUrl);

  // ── Step 1: Read initial state ─────────────────────────────────
  banner("STEP 1: Read Initial Aave V3 State");

  const initialPositions = await provider.fetchPositionSnapshots("ethereum", 10);
  console.log(`[step-1] Found ${initialPositions.length} active positions on fork`);

  for (const pos of initialPositions) {
    console.log(
      `  ${pos.owner.slice(0, 10)}... HF=${pos.healthFactor} collateral=$${pos.collateralUsd.toLocaleString()} debt=$${pos.debtUsd.toLocaleString()}`
    );
  }

  if (initialPositions.length === 0) {
    console.error("[step-1] No active positions found on fork. Ensure fork has mainnet state.");
    console.log("[step-1] Falling back to a direct account check...");

    // Try reading a specific known address directly
    for (const addr of DEFAULT_TARGET_ADDRESSES.slice(0, 3)) {
      try {
        const data = reader.parseAccountData(await reader.getUserAccountData(addr));
        console.log(
          `  ${addr.slice(0, 10)}... collateral=$${data.totalCollateralUsd} debt=$${data.totalDebtUsd} HF=${data.healthFactor}`
        );
      } catch (e) {
        console.log(`  ${addr.slice(0, 10)}... error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    console.log("\n[step-1] If all show 0 collateral, the fork may need different target addresses.");
    console.log("[step-1] Proceeding with demo using state manipulation...\n");
  }

  // ── Step 2: Run CRE workflow (baseline) ────────────────────────
  banner("STEP 2: CRE Baseline Assessment");

  const baselineResult = await runCREWorkflow({
    provider,
    chainId: "ethereum",
    positionLimit: 10,
  });

  console.log(`[step-2] Protocol Status: ${baselineResult.protocolStatus.toUpperCase()}`);
  console.log(`[step-2] Risk Score: ${(baselineResult.riskScore.composite * 100).toFixed(1)}% (${baselineResult.riskScore.level})`);
  console.log(`[step-2] Agent Decision: ${baselineResult.agentDecision.decision}`);
  console.log(`[step-2] Latency: risk=${baselineResult.latencies.risk}ms agent=${baselineResult.latencies.agent}ms total=${baselineResult.latencies.total}ms`);

  // ── Step 3: Snapshot fork state ────────────────────────────────
  banner("STEP 3: Snapshot Fork State");

  let snapshotId: string;
  try {
    snapshotId = await forkController.snapshot();
    console.log(`[step-3] Fork snapshot: ${snapshotId}`);
  } catch (e) {
    console.warn(`[step-3] Snapshot failed (may not be supported): ${e instanceof Error ? e.message : String(e)}`);
    snapshotId = "unsupported";
  }

  // ── Step 4: Manipulate fork state ──────────────────────────────
  banner("STEP 4: Fork State Manipulation");

  // Pick the first address with a position, or use a default
  const targetUser = initialPositions.length > 0
    ? initialPositions[0]!.owner
    : DEFAULT_TARGET_ADDRESSES[0]!;

  console.log(`[step-4] Target user for manipulation: ${targetUser}`);

  // Give user some WETH collateral and create a position if needed
  try {
    await forkController.setEthBalance(targetUser, "100");
    console.log("[step-4] Set ETH balance to 100 ETH");

    await forkController.setTokenBalance(WETH, targetUser, "50", 18);
    console.log("[step-4] Set WETH balance to 50 WETH");

    // Try to supply WETH as collateral
    try {
      await forkController.simulateSupply(targetUser, WETH, "30", 18);
      console.log("[step-4] Supplied 30 WETH as collateral");
    } catch (e) {
      console.warn(`[step-4] Supply failed (may already have position): ${e instanceof Error ? e.message : String(e)}`);
    }

    // Borrow to create debt and lower HF
    try {
      const borrowAsset = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
      await forkController.setTokenBalance(borrowAsset, targetUser, "0", 6);
      await forkController.simulateBorrow(targetUser, borrowAsset, "50000", 6);
      console.log("[step-4] Borrowed 50,000 USDC to increase debt");
    } catch (e) {
      console.warn(`[step-4] Borrow manipulation failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (e) {
    console.warn(`[step-4] State manipulation error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Read post-manipulation state
  try {
    const postManipData = reader.parseAccountData(
      await reader.getUserAccountData(targetUser)
    );
    console.log(`[step-4] Post-manipulation: HF=${postManipData.healthFactor} collateral=$${postManipData.totalCollateralUsd} debt=$${postManipData.totalDebtUsd}`);
  } catch (e) {
    console.warn(`[step-4] Could not read post-manipulation state: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Step 5: Run CRE after manipulation ─────────────────────────
  banner("STEP 5: CRE Post-Manipulation Assessment");

  const postManipResult = await runCREWorkflow({
    provider,
    chainId: "ethereum",
    positionLimit: 10,
  });

  console.log(`[step-5] Protocol Status: ${postManipResult.protocolStatus.toUpperCase()}`);
  console.log(`[step-5] Risk Score: ${(postManipResult.riskScore.composite * 100).toFixed(1)}% (${postManipResult.riskScore.level})`);
  console.log(`[step-5] Agent Decision: ${postManipResult.agentDecision.decision}`);
  console.log(`[step-5] Actions: ${postManipResult.agentDecision.actionsRequested.join(", ") || "none"}`);
  console.log(`[step-5] Black Swan: ${postManipResult.agentDecision.blackSwanDetected}`);

  // ── Step 6: CCC Mitigation ─────────────────────────────────────
  banner("STEP 6: CCC Mitigation Execution");

  const shouldMitigate =
    postManipResult.agentDecision.decision === "ESCALATE" ||
    postManipResult.agentDecision.decision === "PROTECT_POSITION" ||
    postManipResult.riskScore.composite > 0.5;

  if (shouldMitigate) {
    console.log("[step-6] Risk threshold exceeded — executing CCC mitigation");

    const intent: MitigationIntent = {
      id: `mit-${Date.now()}`,
      user: targetUser,
      chainId: "ethereum",
      protocol: "aave-v3",
      type: "ADD_COLLATERAL",
      asset: WETH,
      amount: "10",
      preHealthFactor: postManipResult.riskScore.composite,
      targetHealthFactor: 2.0,
      riskScore: postManipResult.riskScore.composite,
      riskBand: postManipResult.riskScore.level,
      agentId: "cre-workflow-agent",
      timestamp: Date.now(),
    };

    console.log(`[step-6] MitigationIntent: ${intent.type} ${intent.amount} ${intent.asset === WETH ? "WETH" : intent.asset.slice(0, 10)} for ${intent.user.slice(0, 10)}...`);

    const report = await cccAdapter.executeMitigation(intent);
    printReport(report);
  } else {
    console.log("[step-6] Risk within acceptable bounds — no mitigation needed");
  }

  // ── Step 7: Post-mitigation CRE ───────────────────────────────
  banner("STEP 7: Post-Mitigation CRE Assessment");

  const finalResult = await runCREWorkflow({
    provider,
    chainId: "ethereum",
    positionLimit: 10,
  });

  console.log(`[step-7] Final Protocol Status: ${finalResult.protocolStatus.toUpperCase()}`);
  console.log(`[step-7] Final Risk Score: ${(finalResult.riskScore.composite * 100).toFixed(1)}% (${finalResult.riskScore.level})`);
  console.log(`[step-7] Final Agent Decision: ${finalResult.agentDecision.decision}`);

  // ── Step 8: Risk Band Progression Summary ──────────────────────
  banner("STEP 8: Risk Band Progression");

  console.log("  Stage           | Risk Score | Level          | Decision");
  console.log("  ────────────────┼────────────┼────────────────┼─────────────────");
  console.log(
    `  Baseline        | ${(baselineResult.riskScore.composite * 100).toFixed(1).padStart(9)}% | ${baselineResult.riskScore.level.padEnd(14)} | ${baselineResult.agentDecision.decision}`
  );
  console.log(
    `  Post-Manip      | ${(postManipResult.riskScore.composite * 100).toFixed(1).padStart(9)}% | ${postManipResult.riskScore.level.padEnd(14)} | ${postManipResult.agentDecision.decision}`
  );
  console.log(
    `  Post-Mitigation | ${(finalResult.riskScore.composite * 100).toFixed(1).padStart(9)}% | ${finalResult.riskScore.level.padEnd(14)} | ${finalResult.agentDecision.decision}`
  );

  // ── Step 9: Fork State Log ─────────────────────────────────────
  banner("STEP 9: Fork State Change Audit Log");

  const stateLog = forkController.getStateLog();
  for (const entry of stateLog) {
    console.log(`  [${new Date(entry.timestamp).toISOString()}] ${entry.type} → ${entry.target.slice(0, 14)}... ${JSON.stringify(entry.details)}`);
  }

  // ── Step 10: Revert fork ───────────────────────────────────────
  if (snapshotId !== "unsupported") {
    banner("STEP 10: Revert Fork to Pre-Manipulation State");
    try {
      await forkController.revert(snapshotId);
      console.log("[step-10] Fork reverted to snapshot successfully");
    } catch (e) {
      console.warn(`[step-10] Revert failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  banner("SIMULATION COMPLETE");
  console.log("  Demonstrated:");
  console.log("    - Real Aave V3 state reads from Tenderly fork");
  console.log("    - Deterministic fork state manipulation");
  console.log("    - CRE risk detection + escalation pipeline");
  console.log("    - Autonomous CCC mitigation execution");
  console.log("    - Risk band progression tracking");
  console.log("    - Audit-ready execution reports\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
