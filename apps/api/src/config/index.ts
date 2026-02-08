export function loadConfig() {
  return {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}

export type Config = ReturnType<typeof loadConfig>;
