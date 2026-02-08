export interface AquariusClientConfig {
  baseUrl: string;
}

export function createClient(config: AquariusClientConfig) {
  return {
    baseUrl: config.baseUrl,
    async fetch(path: string, init?: RequestInit): Promise<Response> {
      return fetch(`${config.baseUrl}${path}`, init);
    },
  };
}

export type AquariusClient = ReturnType<typeof createClient>;
