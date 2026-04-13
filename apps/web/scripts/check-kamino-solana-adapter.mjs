#!/usr/bin/env node
/**
 * SoC: @solana/* must only be imported from apps/web/adapters/kamino-solana.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const webRoot = join(__dirname, "..");

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "coverage"]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(name) && !name.endsWith(".d.ts")) {
      out.push(p);
    }
  }
}

const files = [];
walk(webRoot, files);

const bad = [];
for (const file of files) {
  const rel = relative(webRoot, file).replace(/\\/g, "/");
  if (rel.startsWith("adapters/kamino-solana/")) continue;
  const text = readFileSync(file, "utf8");
  if (/from\s+["']@solana\//.test(text)) {
    bad.push(rel);
  }
}

if (bad.length) {
  console.error(
    "\nSolana SoC: @solana/* imports are only allowed under apps/web/adapters/kamino-solana/.\n"
  );
  for (const f of bad) console.error(`  ${f}`);
  process.exit(1);
}

console.log("Kamino/Solana web adapter boundary OK.");
