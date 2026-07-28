import { percentileType7 } from './measure.js';
import type { RegressionInput, RegressionResult } from './types.js';

/**
 * Bootstrap CI on p95 delta で regression を判定する。
 *
 * 旧実装は mean で Welch t-test を回しつつ deltaPct を p95 で計算していたため、 統計軸が矛盾していた。
 * (mean で「有意差なし」 と判定しつつ p95 が 20% 悪化 → stable と誤判定される事故)
 *
 * 本実装は p95 の差そのものに対して bootstrap 分布を作り、
 * (1) 信頼区間が 0 を含まない (= 有意な差) かつ (2) delta が threshold を超えた
 * 場合のみ regressed / improved と判定する。
 */
export function detectRegression(input: RegressionInput): RegressionResult {
  const threshold = input.threshold ?? 0.2;
  const bootstrapIterations = input.bootstrapIterations ?? 2000;
  const confidenceLevel = input.confidenceLevel ?? 0.95;
  const minDeltaMs = input.minDeltaMs ?? 0.5;

  const currentP95 = input.current.p95;
  const baselineP95 = input.baseline.p95;

  const deltaPct = baselineP95 === 0
    ? currentP95 === 0
      ? 0
      : Number.POSITIVE_INFINITY
    : (currentP95 - baselineP95) / baselineP95;

  const ci = bootstrapCiOnP95Delta(
    input.current.samples,
    input.baseline.samples,
    bootstrapIterations,
    confidenceLevel,
  );

  // 有意 = CI が 0 を跨がない (両端が同符号)
  const significant = (ci.lower > 0 && ci.upper > 0) || (ci.lower < 0 && ci.upper < 0);

  // 相対比だけで判定すると値が小さい op ほど厳しくなる。0.03ms → 0.04ms は
  // サンプルが安定していれば「有意な 33% 悪化」になるが実害はない。
  // 差の絶対量が下限に満たないものは揺らぎとして扱う。
  //
  // 下限を baseline 比例に下げる案は #1708 で実測により否定した。実装を変えずに
  // 4 回測ると sub-ms の op は p95 が 50-1100% 動き、絶対量では 0.03-0.22ms に
  // 収まる。比例下限にするとこの揺らぎがそのまま regressed に変わる。
  const meaningfulDelta = Math.abs(currentP95 - baselineP95) >= minDeltaMs;

  let verdict: RegressionResult['verdict'] = 'stable';
  if (significant && meaningfulDelta && deltaPct >= threshold) {
    verdict = 'regressed';
  } else if (significant && meaningfulDelta && deltaPct <= -threshold) {
    verdict = 'improved';
  }

  // 下限が判定を抑えた場合と、そもそも変化が無い場合を呼出側で区別できるようにする。
  // 両方を stable として返すだけだと、検知できていない状態が安定と読める。
  const suppressedByFloor = significant && !meaningfulDelta && Math.abs(deltaPct) >= threshold;

  // baseline が下限より小さい op は、閾値を何倍超えても差が下限に届かない。
  // 例 baseline 0.03ms では +0.5ms = +1667% でようやく判定対象になる。
  const belowDetectionFloor = baselineP95 < minDeltaMs;

  return {
    regressed: verdict === 'regressed',
    deltaPct,
    ci,
    significant,
    verdict,
    floorMs: minDeltaMs,
    suppressedByFloor,
    belowDetectionFloor,
  };
}

/**
 * strict mode — CI 99% + threshold 10%。 false negative を最小化。
 * 見逃し (regressed を stable と判定) が致命的な release gate 経路で使う。
 */
export function detectRegressionStrict(input: RegressionInput): RegressionResult {
  return detectRegression({
    ...input,
    threshold: input.threshold ?? 0.1,
    confidenceLevel: input.confidenceLevel ?? 0.99,
  });
}

/**
 * Bootstrap CI on p95(current) - p95(baseline)。
 *
 * 手順 = 各 iteration で current / baseline の sample を復元抽出、
 * それぞれの p95 を計算し、 差を蓄積。 蓄積した delta 分布から CI を取る。
 * サンプル数不足時は退化 CI ({0, 0}) を返す。
 */
function bootstrapCiOnP95Delta(
  currentSamples: number[],
  baselineSamples: number[],
  iterations: number,
  confidenceLevel: number,
): { lower: number; upper: number } {
  if (currentSamples.length < 2 || baselineSamples.length < 2) {
    return { lower: 0, upper: 0 };
  }

  const deltas: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const curP95 = bootstrapP95(currentSamples);
    const basP95 = bootstrapP95(baselineSamples);
    deltas.push(curP95 - basP95);
  }
  deltas.sort((a, b) => a - b);

  const alpha = (1 - confidenceLevel) / 2;
  const lower = percentileType7(deltas, alpha);
  const upper = percentileType7(deltas, 1 - alpha);
  return { lower, upper };
}

function bootstrapP95(samples: number[]): number {
  const n = samples.length;
  const resample: number[] = new Array(n);
  for (let index = 0; index < n; index += 1) {
    const rand = Math.floor(Math.random() * n);
    resample[index] = samples[rand] ?? 0;
  }
  resample.sort((a, b) => a - b);
  return percentileType7(resample, 0.95);
}
