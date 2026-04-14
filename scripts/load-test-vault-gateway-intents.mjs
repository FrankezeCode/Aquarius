#!/usr/bin/env node
/**
 * Burst POST requests to /api/v1/vault-gateway/intents to observe rate limiting (429).
 *
 * Prerequisites:
 *   - API running with RATE_LIMIT_ENABLED=true
 *   - VAULT_GATEWAY_EXECUTION_ENABLED=true
 *   - VAULT_GATEWAY_INTENT_TOKEN set (pass same value as --token)
 *   - ORCHESTRATION_EXECUTION_MODE=mock recommended
 *
 * Usage:
 *   node scripts/load-test-vault-gateway-intents.mjs --base http://localhost:3001 --token YOUR_TOKEN --count 50
 */

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return def;
}

const base = arg("--base", "http://localhost:3001").replace(/\/$/, "");
const token = arg("--token", "");
const count = Math.max(1, parseInt(arg("--count", "40"), 10) || 40);

if (!token) {
  console.error("Missing --token (VAULT_GATEWAY_INTENT_TOKEN value)");
  process.exit(1);
}

const url = `${base}/api/v1/vault-gateway/intents`;
const body = (n) =>
  JSON.stringify({
    intentType: "cre.workflow",
    chain: "ethereum",
    asset: "USDC",
    amount: "1",
    idempotencyKey: `load-${Date.now()}-${n}`,
    correlationId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  });

async function one(i) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: body(i),
  });
  return { status: res.status, i };
}

const results = await Promise.all(
  Array.from({ length: count }, (_, i) => one(i + 1))
);

const byStatus = new Map();
for (const r of results) {
  byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
}

console.log(`POST ${count} requests to ${url}`);
console.log("Status counts:", Object.fromEntries(byStatus));

const n429 = byStatus.get(429) ?? 0;
if (n429 > 0) {
  console.log(`Observed ${n429} rate-limited responses (429).`);
  process.exit(0);
}

console.warn(
  "No 429 responses. Ensure RATE_LIMIT_ENABLED=true and a low RATE_LIMIT_VAULT_GATEWAY_INTENTS_MAX, or increase --count."
);
process.exit(0);
