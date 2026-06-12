/**
 * CLI demo — Arbitrum risk agent pack (for judges / local reproduction).
 *
 * @example
 *   pnpm arbitrum:agent-demo -- 0xYourWalletWithAavePosition
 */
const API_BASE = process.env.AQUARIUS_API_URL?.trim() || "http://localhost:3001";

async function main() {
  const wallet = process.argv[2]?.trim();
  if (!wallet?.startsWith("0x") || wallet.length !== 42) {
    console.error(
      "Usage: pnpm arbitrum:agent-demo -- 0x<wallet-with-aave-position-on-arbitrum>",
    );
    process.exit(1);
  }

  const url = `${API_BASE}/api/v1/aave-risk/arbitrum/agent-pack/${wallet}`;
  console.log(`GET ${url}\n`);

  const res = await fetch(url);
  const body = await res.json();

  if (!res.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(body, null, 2));
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
