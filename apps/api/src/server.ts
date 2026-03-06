import { buildApp } from "./app.js";
import { loadConfig } from "./config/index.js";

async function main() {
  const config = loadConfig();
  const app = await buildApp();

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
