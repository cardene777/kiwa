import type { MeasureInput, MeasureResult } from './types.js';

export async function measure(input: MeasureInput): Promise<MeasureResult> {
  const warmup = input.warmup ?? 0;
  if (input.iterations < 1) {
    throw new Error(`measure: iterations must be >= 1, got ${input.iterations}`);
  }
  if (warmup < 0) {
    throw new Error(`measure: warmup must be >= 0, got ${warmup}`);
  }

  for (let index = 0; index < warmup; index += 1) {
    await input.fn();
  }

  const samples: number[] = [];
  for (let index = 0; index < input.iterations; index += 1) {
    const start = process.hrtime.bigint();
    await input.fn();
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1_000_000);
  }

  return buildMeasureResult(input.name, input.iterations, warmup, samples);
}

export function buildMeasureResult(
  name: string,
  iterations: number,
  warmup: number,
  samples: number[],
): MeasureResult {
  const sorted = [...samples].sort((left, right) => left - right);
  const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
  const mean = totalMs / samples.length;
  const variance = samples.length > 1
    ? samples.reduce((sum, sample) => {
        const delta = sample - mean;
        return sum + (delta * delta);
      }, 0) / (samples.length - 1)
    : 0;

  return {
    name,
    iterations,
    warmup,
    samples,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    mean,
    stdev: Math.sqrt(variance),
    minMs: sorted[0] ?? 0,
    maxMs: sorted[sorted.length - 1] ?? 0,
    totalMs,
  };
}

function percentile(sorted: number[], ratio: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[rank] ?? sorted[sorted.length - 1] ?? 0;
}
