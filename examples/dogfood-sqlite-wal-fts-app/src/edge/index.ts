/**
 * Edge-deployment flow — simulates Bun edge runtime cold + warm request
 * behaviour. The mock variant uses a deterministic pseudo-random walk so
 * fidelity samples do not depend on wall-clock jitter. A real driver (Bun
 * runtime probe against a live edge deploy) can slot in through the same
 * shape once the v1.32-4 harness is proved.
 */

export interface EdgeRoundtripInput {
  readonly region: string;
  readonly runtime: 'bun' | 'node' | 'workerd';
  readonly requests: number;
}

export interface EdgeRoundtripResult {
  readonly region: string;
  readonly runtime: 'bun' | 'node' | 'workerd';
  readonly coldStartMs: number;
  readonly warmSamplesMs: readonly number[];
  readonly warmMeanMs: number;
  readonly requestsHandled: number;
}

/**
 * Deterministic cold + warm latency profile. Cold start dominated by
 * runtime boot: bun=4ms / node=32ms / workerd=1ms. Warm samples decay
 * toward a steady-state floor of 0.4ms with a small pseudo-random jitter
 * seeded by the region name so tests can assert on stable numbers.
 */
export function driveEdgeRoundtripFlow(input: EdgeRoundtripInput): EdgeRoundtripResult {
  if (input.requests <= 0) {
    throw new Error('driveEdgeRoundtripFlow: requests must be positive');
  }
  const coldStartMs =
    input.runtime === 'bun' ? 4 : input.runtime === 'workerd' ? 1 : 32;
  const seed = fnv1a(`${input.region}:${input.runtime}`);
  const warmSamplesMs: number[] = [];
  for (let i = 0; i < input.requests; i += 1) {
    const jitter = ((seed >>> (i % 30)) & 0xff) / 512; // deterministic 0..0.5ms
    // eslint-disable-next-line security/detect-object-injection
    warmSamplesMs.push(round(0.4 + jitter));
  }
  const warmMeanMs = round(
    warmSamplesMs.reduce((a, b) => a + b, 0) / warmSamplesMs.length,
  );
  return {
    region: input.region,
    runtime: input.runtime,
    coldStartMs,
    warmSamplesMs,
    warmMeanMs,
    requestsHandled: input.requests,
  };
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
