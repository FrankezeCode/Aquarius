import { buildApp } from "./app.js";
import { loadConfig } from "./config/index.js";

async function main() {
  const config = loadConfig();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0214f521-f1e1-4237-8c5f-e3cdc61c7a1b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'551096'},body:JSON.stringify({sessionId:'551096',runId:'pre-fix',hypothesisId:'H4',location:'apps/api/src/server.ts:6',message:'Server main entered',data:{port:config.port,nodeEnv:process.env.NODE_ENV ?? 'unknown'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const app = await buildApp();

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
