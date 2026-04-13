#!/usr/bin/env node
/**
 * Enforces DDD import boundaries: Kamino ↔ Aave protocol folders must not reference each other.
 * Run via `pnpm lint` in apps/api (no TypeScript parser required).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcRoot = join(__dirname, "..", "src");

function walkTsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "dist" || name === "node_modules") continue;
      walkTsFiles(p, out);
    } else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
      out.push(p);
    }
  }
  return out;
}

function check(files, forbidden, label) {
  const bad = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const { pattern, hint } of forbidden) {
      if (pattern.test(text)) {
        bad.push({ file: relative(srcRoot, file), hint });
        break;
      }
    }
  }
  if (bad.length) {
    console.error(`\nDomain boundary violation (${label}):\n`);
    for (const b of bad) {
      console.error(`  ${b.file}: ${b.hint}`);
    }
    process.exit(1);
  }
}

const kaminoFiles = walkTsFiles(join(srcRoot, "protocols", "kamino-solana"));
const aaveFiles = walkTsFiles(join(srcRoot, "protocols", "aave"));

check(
  kaminoFiles,
  [
    {
      pattern: /from\s+["'][^"']*protocols\/aave[^"']*["']/,
      hint: "Do not import Aave protocol modules from Kamino; use @aquarius/types or shared kernel types.",
    },
    {
      pattern: /from\s+["']@solana\//,
      hint: "Keep @solana/* imports in infrastructure/kamino (or web adapters), not in protocols/kamino-solana.",
    },
    {
      pattern: /from\s+["']@kamino-finance\//,
      hint: "Keep Klend SDK imports in infrastructure/kamino, not in protocols/kamino-solana.",
    },
  ],
  "Kamino bounded context"
);

check(
  aaveFiles,
  [
    {
      pattern: /from\s+["'][^"']*protocols\/kamino-solana[^"']*["']/,
      hint: "Do not import Kamino protocol modules from Aave.",
    },
  ],
  "Aave → Kamino"
);

console.log("Domain boundary check OK (Kamino ↔ Aave).");
