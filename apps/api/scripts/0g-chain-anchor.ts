/**
 * 0G Chain (EVM) — deploy `RiskCommitmentAnchor` and/or anchor a commitment hash.
 *
 * Supports **mainnet** (HackQuest final proof) and **testnet** (Galileo — free faucet gas).
 *
 * @env OGF_NETWORK — `mainnet` (default) | `testnet` (aliases: `galileo`, `dev`)
 * @env OGF_RPC_URL — optional RPC override (QuickNode, Ankr, etc.)
 * @env OGF_ANCHOR_PRIVATE_KEY — 0x + 64 hex; **never commit**
 * @env OGF_ANCHOR_CONTRACT_ADDRESS — set after first successful `deploy` for that network
 *
 * @example Testnet deploy (faucet: https://faucet.0g.ai):
 *   OGF_NETWORK=testnet pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts deploy
 *
 * @example Mainnet deploy (real 0G for gas):
 *   OGF_NETWORK=mainnet pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts deploy
 *
 * @see docs/integrations/0g-chain-hackquest-proof.md
 */
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Address,
  type Chain,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { ContractArtifacts } from "../src/infrastructure/contracts/artifacts.js";

/** https://docs.0g.ai/developer-hub/mainnet/mainnet-overview */
const zgMainnet = defineChain({
  id: 16_661,
  name: "0G Mainnet",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G ChainScan", url: "https://chainscan.0g.ai" },
  },
});

/** https://docs.0g.ai/developer-hub/testnet/testnet-overview (Galileo) */
const zgGalileoTestnet = defineChain({
  id: 16_602,
  name: "0G Galileo Testnet",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "0G" },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "0G Galileo ChainScan",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
});

type OgNetworkMode = "mainnet" | "testnet";

function parseOgNetwork(): OgNetworkMode {
  const v = process.env.OGF_NETWORK?.trim().toLowerCase();
  if (!v) return "mainnet";
  if (v === "mainnet" || v === "prod" || v === "production") return "mainnet";
  if (v === "testnet" || v === "galileo" || v === "dev") return "testnet";
  console.warn(`Unknown OGF_NETWORK="${process.env.OGF_NETWORK}" — defaulting to mainnet`);
  return "mainnet";
}

function getOgContext(mode: OgNetworkMode): {
  mode: OgNetworkMode;
  chain: Chain;
  defaultRpcUrl: string;
} {
  if (mode === "testnet") {
    return {
      mode: "testnet",
      chain: zgGalileoTestnet,
      defaultRpcUrl: "https://evmrpc-testnet.0g.ai",
    };
  }
  return {
    mode: "mainnet",
    chain: zgMainnet,
    defaultRpcUrl: "https://evmrpc.0g.ai",
  };
}

const artifact = ContractArtifacts.RiskCommitmentAnchor;

function requirePk(): Hex {
  const raw = process.env.OGF_ANCHOR_PRIVATE_KEY?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{64}$/.test(raw)) {
    console.error(
      "Missing or invalid OGF_ANCHOR_PRIVATE_KEY (32-byte hex, 0x-prefixed). Set in .env — never commit.",
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
  const networkMode = parseOgNetwork();
  const { chain, defaultRpcUrl } = getOgContext(networkMode);
  const pk = requirePk();
  const account = privateKeyToAccount(pk);
  const rpcUrl = process.env.OGF_RPC_URL?.trim() || defaultRpcUrl;
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  console.log(`OGF_NETWORK=${networkMode}  (set OGF_NETWORK=testnet for Galileo faucet)`);
  console.log(`Deployer: ${account.address}`);
  console.log(`Chain: ${chain.name} (id ${chain.id})`);
  console.log(`RPC: ${rpcUrl}`);

  const deployHash = await walletClient.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode as Hex,
    args: [],
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

  console.log("\n--- Add to .env (same OGF_NETWORK you used for deploy) ---");
  console.log(`OGF_NETWORK=${networkMode}`);
  console.log(`OGF_ANCHOR_CONTRACT_ADDRESS=${addr}`);
  console.log(`\nContract explorer: ${explorerAddress(chain, addr)}`);
  if (networkMode === "testnet") {
    console.log(
      "\nNote: HackQuest Track 5 final proof requires **mainnet** — redeploy with OGF_NETWORK=mainnet and funded mainnet gas when ready.",
    );
  }
}

async function cmdAnchor(commitmentHex: string, contextRef: string) {
  const networkMode = parseOgNetwork();
  const { chain, defaultRpcUrl } = getOgContext(networkMode);
  const contractAddr = process.env.OGF_ANCHOR_CONTRACT_ADDRESS?.trim() as
    | Address
    | undefined;
  if (!contractAddr?.startsWith("0x")) {
    console.error(
      "Set OGF_ANCHOR_CONTRACT_ADDRESS in .env (output from `deploy` for this OGF_NETWORK).",
    );
    process.exit(1);
  }

  const c = commitmentHex.trim() as Hex;
  if (!c.startsWith("0x") || c.length !== 66) {
    console.error(
      "Commitment must be 32-byte hex (0x + 64 hex chars), e.g. SHA-256 output.",
    );
    process.exit(1);
  }

  const pk = requirePk();
  const account = privateKeyToAccount(pk);
  const rpcUrl = process.env.OGF_RPC_URL?.trim() || defaultRpcUrl;
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  console.log(`OGF_NETWORK=${networkMode}  chain id ${chain.id}`);

  const ref = contextRef?.trim() || "aquarius";

  const hash = await walletClient.writeContract({
    address: contractAddr,
    abi: artifact.abi as never,
    functionName: "anchor",
    args: [c as `0x${string}`, ref],
  });

  console.log(`Anchor tx: ${hash}`);
  console.log(`Explorer: ${explorerTx(chain, hash)}`);

  await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  console.log("Confirmed.");
}

const [, , cmd, a1, a2] = process.argv;

if (cmd === "deploy") {
  void cmdDeploy().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (cmd === "anchor") {
  if (!a1) {
    console.error('Usage: … anchor <0x-commitment-32bytes> ["contextRef"]');
    process.exit(1);
  }
  void cmdAnchor(a1, a2 ?? "aquarius").catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error(`Usage:
  OGF_NETWORK=testnet pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts deploy
  OGF_NETWORK=mainnet pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts deploy
  pnpm --filter api exec tsx --env-file=../../.env scripts/0g-chain-anchor.ts anchor <0x-commitment> [contextRef]

Env: OGF_NETWORK=mainnet|testnet (default mainnet). OGF_RPC_URL optional.`);
  process.exit(1);
}
