import type {
  MeasureInput,
  MeasureResult,
  WarmupConvergence,
} from './types.js';

const DEFAULT_CONVERGENCE: Required<WarmupConvergence> = {
  windowSize: 20,
  toleranceRatio: 0.05,
  maxIterations: 200,
};

export async function measure(input: MeasureInput): Promise<MeasureResult> {
  if (input.iterations < 1) {
    throw new Error(`measure: iterations must be >= 1, got ${input.iterations}`);
  }
  const strategy = input.warmupStrategy ?? 'fixed';

  let warmupCount = 0;
  let warmupConverged = true;
  if (strategy === 'fixed') {
    warmupCount = input.warmup ?? 0;
    if (warmupCount < 0) {
      throw new Error(`measure: warmup must be >= 0, got ${warmupCount}`);
    }
    for (let index = 0; index < warmupCount; index += 1) {
      await input.fn();
    }
  } else {
    const result = await runConvergentWarmup(input);
    warmupCount = result.iterations;
    warmupConverged = result.converged;
  }

  const samples: number[] = [];
  for (let index = 0; index < input.iterations; index += 1) {
    const start = process.hrtime.bigint();
    await input.fn();
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1_000_000);
  }

  return buildMeasureResult(
    input.name,
    input.iterations,
    warmupCount,
    samples,
    input.trimPercent ?? 0,
    warmupConverged,
  );
}

/** Convergent warmup — 直近 window の p95 が toleranceRatio 以内で安定するまで回す。 */
async function runConvergentWarmup(
  input: MeasureInput,
): Promise<{ iterations: number; converged: boolean }> {
  const config = { ...DEFAULT_CONVERGENCE, ...(input.warmupConvergence ?? {}) };
  const window: number[] = [];
  let iterations = 0;

  for (iterations = 0; iterations < config.maxIterations; iterations += 1) {
    const start = process.hrtime.bigint();
    await input.fn();
    const end = process.hrtime.bigint();
    window.push(Number(end - start) / 1_000_000);
    if (window.length > config.windowSize) window.shift();

    if (window.length === config.windowSize) {
      const sorted = [...window].sort((a, b) => a - b);
      const p95 = percentileType7(sorted, 0.95);
      const min = sorted[0] ?? 0;
      const max = sorted[sorted.length - 1] ?? 0;
      const range = max - min;
      if (p95 > 0 && range / p95 <= config.toleranceRatio) {
        return { iterations: iterations + 1, converged: true };
      }
    }
  }
  return { iterations, converged: false };
}

export function buildMeasureResult(
  name: string,
  iterations: number,
  warmup: number,
  samples: number[],
  trimPercent = 0,
  warmupConverged = true,
): MeasureResult {
  const sorted = [...samples].sort((left, right) => left - right);
  const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
  const mean = samples.length > 0 ? totalMs / samples.length : Number.NaN;
  const variance = samples.length > 1
    ? samples.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) /
        (samples.length - 1)
    : 0;

  const median = percentileType7(sorted, 0.5);
  const mad = computeMad(samples, median);
  const outlierCount = countOutliers(samples, median, mad);

  const result: MeasureResult = {
    name,
    iterations,
    warmup,
    warmupConverged,
    samples,
    p50: median,
    p95: percentileType7(sorted, 0.95),
    p99: percentileType7(sorted, 0.99),
    mean,
    stdev: Math.sqrt(variance),
    minMs: sorted[0] ?? 0,
    maxMs: sorted[sorted.length - 1] ?? 0,
    totalMs,
    median,
    mad,
    outlierCount,
  };

  if (trimPercent > 0) {
    result.trimmed = buildTrimmedStats(sorted, trimPercent);
  }

  return result;
}

/**
 * Type 7 linear interpolation percentile — NumPy / R default。
 * nearest-rank より n < 100 で精度が高い。
 */
export function percentileType7(sortedSamples: number[], ratio: number): number {
  const n = sortedSamples.length;
  if (n === 0) return 0;
  if (n === 1) return sortedSamples[0] ?? 0;
  const rank = ratio * (n - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;
  const low = sortedSamples[lower] ?? 0;
  const high = sortedSamples[upper] ?? low;
  return low + (high - low) * weight;
}

/** MAD (Median Absolute Deviation) = median(|x - median(x)|)。 log-normal 分布で robust。 */
function computeMad(samples: number[], median: number): number {
  if (samples.length === 0) return 0;
  const deviations = samples.map((sample) => Math.abs(sample - median)).sort((a, b) => a - b);
  return percentileType7(deviations, 0.5);
}

/** median ± 3 * MAD の外側にある sample 数を数える。 MAD = 0 の場合は 0 を返す (退化ケース)。 */
function countOutliers(samples: number[], median: number, mad: number): number {
  if (mad === 0) return 0;
  const lower = median - 3 * mad;
  const upper = median + 3 * mad;
  return samples.filter((sample) => sample < lower || sample > upper).length;
}

function buildTrimmedStats(
  sorted: number[],
  trimPercent: number,
): NonNullable<MeasureResult['trimmed']> {
  const n = sorted.length;
  const trimCount = Math.floor((n * trimPercent) / 100);
  const trimmed = sorted.slice(trimCount, n - trimCount);
  if (trimmed.length === 0) {
    return {
      percent: trimPercent,
      sampleCount: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      mean: 0,
      stdev: 0,
    };
  }
  const total = trimmed.reduce((sum, sample) => sum + sample, 0);
  const mean = total / trimmed.length;
  const variance = trimmed.length > 1
    ? trimmed.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) /
        (trimmed.length - 1)
    : 0;
  return {
    percent: trimPercent,
    sampleCount: trimmed.length,
    p50: percentileType7(trimmed, 0.5),
    p95: percentileType7(trimmed, 0.95),
    p99: percentileType7(trimmed, 0.99),
    mean,
    stdev: Math.sqrt(variance),
  };
}
