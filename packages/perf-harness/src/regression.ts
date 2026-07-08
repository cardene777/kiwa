import { buildMeasureResult } from './measure.js';
import type {
  MeasureResult,
  RegressionInput,
  RegressionResult,
} from './types.js';

export function detectRegression(input: RegressionInput): RegressionResult {
  const threshold = input.threshold ?? 0.2;
  const tCritical = input.tCritical ?? 2;
  const current = normalize(input.current);
  const baseline = normalize(input.baseline);

  const deltaPct = baseline.p95 === 0
    ? current.p95 === 0
      ? 0
      : Number.POSITIVE_INFINITY
    : (current.p95 - baseline.p95) / baseline.p95;
  const welchT = welchTScore(current.samples, baseline.samples);
  const significant = Math.abs(welchT) > tCritical;

  let verdict: RegressionResult['verdict'] = 'stable';
  if (significant && deltaPct >= threshold) {
    verdict = 'regressed';
  } else if (significant && deltaPct <= -threshold) {
    verdict = 'improved';
  }

  return {
    regressed: verdict === 'regressed',
    deltaPct,
    welchT,
    significant,
    verdict,
  };
}

/**
 * v0.3 strict mode — |t|>3 + 10% delta。 test 漏れゼロを狙う厳化版。
 *
 * v0.2 default (|t|>2 + 20% delta) より false negative を減らす方針。
 * strict mode で regression 検知失敗なら、 実 code 変更 or baseline 再生成が必要。
 */
export function detectRegressionStrict(input: RegressionInput): RegressionResult {
  return detectRegression({
    ...input,
    threshold: input.threshold ?? 0.1,
    tCritical: input.tCritical ?? 3,
  });
}

function normalize(result: MeasureResult): MeasureResult {
  if (result.samples.length === 0) {
    return result;
  }
  return buildMeasureResult(result.name, result.iterations, result.warmup, result.samples);
}

function welchTScore(current: number[], baseline: number[]): number {
  if (current.length < 2 || baseline.length < 2) {
    return 0;
  }

  const currentStats = sampleStats(current);
  const baselineStats = sampleStats(baseline);
  const numerator = currentStats.mean - baselineStats.mean;
  const denominator = Math.sqrt(
    (currentStats.variance / current.length) +
      (baselineStats.variance / baseline.length),
  );

  if (!Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

function sampleStats(samples: number[]): { mean: number; variance: number } {
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const variance = samples.reduce((sum, sample) => {
    const delta = sample - mean;
    return sum + (delta * delta);
  }, 0) / (samples.length - 1);
  return { mean, variance };
}
