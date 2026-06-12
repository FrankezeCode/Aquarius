/**
 * Aave × Arbitrum adapter — protocol health via Aquarius API.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchAaveArbitrumMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/aave-risk/protocol-health/arbitrum`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return { tvl: null, utilization: null, healthScore: null };
    }
    const data = (await res.json()) as {
      score?: number;
      category?: string;
      reasoning?: string;
    };
    return {
      tvl: null,
      utilization: null,
      healthScore: data.score ?? null,
      category: data.category ?? null,
      reasoning: data.reasoning ?? null,
    };
  } catch {
    return { tvl: null, utilization: null, healthScore: null };
  }
}
