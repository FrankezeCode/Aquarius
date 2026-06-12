/**
 * Arbitrum — deploy `AquaAgentPolicyGuard` for the Open House risk-agent track.
 *
 * @env ARBITRUM_NETWORK — `one` (default) | `sepolia`
 * @env ARBITRUM_RPC_URL — optional RPC override
 * @env ARBITRUM_DEPLOY_PRIVATE_KEY — 0x + 64 hex; **never commit**
 * @env ARBITRUM_POLICY_GUARD_ADDRESS — set after successful deploy
 * @env ARBITRUM_POLICY_MAX_ACTION_USD — default 1_000_000 (uint256 units)
 * @env ARBITRUM_POLICY_MAX_DAILY_ACTIONS — default 24
 *
 * @see docs/hackathons/arbitrum-open-house.md
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, arbitrumSepolia } from "viem/chains";

import { ContractArtifacts } from "../src/infrastructure/contracts/artifacts.js";

type ArbNetworkMode = "one" | "sepolia";

function parseArbNetwork(): ArbNetworkMode {
  const v = process.env.ARBITRUM_NETWORK?.trim().toLowerCase();
  if (!v || v === "one" || v === "mainnet" || v === "42161") return "one";
  if (v === "sepolia" || v === "testnet" || v === "421614") return "sepolia";
  console.warn(`Unknown ARBITRUM_NETWORK="${process.env.ARBITRUM_NETWORK}" — defaulting to one`);
  return "one";
}

function getArbContext(mode: ArbNetworkMode): {
  mode: ArbNetworkMode;
  chain: Chain;
  defaultRpcUrl: string;
} {
  if (mode === "sepolia") {
    return {
      mode: "sepolia",
      chain: arbitrumSepolia,
      defaultRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    };
  }
  return {
    mode: "one",
    chain: arbitrum,
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
  };
}

const artifact = ContractArtifacts.AquaAgentPolicyGuard;

function requirePk(): Hex {
  const raw = process.env.ARBITRUM_DEPLOY_PRIVATE_KEY?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{64}$/.test(raw)) {
    console.error(
      "Missing or invalid ARBITRUM_DEPLOY_PRIVATE_KEY (32-byte hex, 0x-prefixed). Set in .env — never commit.",
    );
    process.exit(1);
  }
  return raw as Hex;
}

function explorerTx(chain: Chain, hash: Hex): string {
  const base = chain.blockExplorers?.default?.url ?? "";
  return `${base}/tx/${hash}`;
}

function explorerAddress(chain: Chain, addr: Address): string {
  const base = chain.blockExplorers?.default?.url ?? "";
  return `${base}/address/${addr}`;
}

async function cmdDeploy() {
  const networkMode = parseArbNetwork();
  const { chain, defaultRpcUrl } = getArbContext(networkMode);
  const pk = requirePk();
  const account = privateKeyToAccount(pk);
  const rpcUrl = process.env.ARBITRUM_RPC_URL?.trim() || defaultRpcUrl;
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const maxSingleActionUsd = BigInt(
    process.env.ARBITRUM_POLICY_MAX_ACTION_USD?.trim() || "1000000",
  );
  const maxDailyActions = BigInt(
    process.env.ARBITRUM_POLICY_MAX_DAILY_ACTIONS?.trim() || "24",
  );

  console.log(`ARBITRUM_NETWORK=${networkMode}`);
  console.log(`Deployer: ${account.address}`);
  console.log(`Chain: ${chain.name} (id ${chain.id})`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(
    `Policy: maxSingleActionUsd=${maxSingleActionUsd}, maxDailyActions=${maxDailyActions}`,
  );

  const deployHash = await walletClient.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode as Hex,
    args: [maxSingleActionUsd, maxDailyActions],
  });

  console.log(`Deploy tx: ${deployHash}`);
  console.log(`Explorer: ${explorerTx(chain, deployHash)}`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deployHash,
    timeout: 120_000,
  });

  const addr = receipt.contractAddress;
  if (!addr) {
    console.error("No contractAddress in receipt — deployment failed.");
    process.exit(1);
  }

  console.log("\n--- Add to .env ---");
  console.log(`ARBITRUM_NETWORK=${networkMode}`);
  console.log(`ARBITRUM_POLICY_GUARD_ADDRESS=${addr}`);
  console.log(`\nContract explorer: ${explorerAddress(chain, addr)}`);
}

const [, , cmd] = process.argv;

if (cmd === "deploy") {
  void cmdDeploy().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error(`Usage:
  pnpm arbitrum:policy-guard:deploy
  pnpm arbitrum:policy-guard:deploy:sepolia

Env: ARBITRUM_NETWORK=one|sepolia, ARBITRUM_DEPLOY_PRIVATE_KEY, optional ARBITRUM_RPC_URL`);
  process.exit(1);
}
