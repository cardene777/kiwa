import { percentileType7 } from './measure.js';
import type { MeasureResult, RegressionInput, RegressionResult } from './types.js';

/**
 * 回帰判定が読む分位。 分布の下側 10%。
 *
 * 上側 (p95) を読んでいた頃は、 実装を変えずに 4 回測るだけで判定が入れ替わった
 * (#1718 実測 = `cli-test` の `readFile` で p95 が 134-974%、 `writeFile` で 289-313% 動く)。
 * 測定を乱す要因はどれも実行時間を伸ばす方向にしか働かないので、 上側の裾は
 * その日の機械の状態を測っている。 同じ実測で下側は p10 が 6-12% に収まった。
 *
 * min ではなく p10 にしているのは、 min が 1 標本だけで決まるため計時の粒度と
 * 1 回の幸運にそのまま晒されるから。 n = 200 なら p10 は 20 標本ぶんの深さを持つ。
 */
export const REGRESSION_JUDGED_PERCENTILE = 0.1;

/**
 * 絶対下限を測定系の分解能の何倍に置くか。
 *
 * 分解能そのものを下限にすると、 分解能と同じ帯にいる op (`@kiwa-lab/cache` の
 * env accessor は p10 が 0.00013ms で、 何もしない呼出の 0.00017ms より速い) で
 * 判定が入れ替わる。 実装無変更の 4 連続実行で、 p10 が 1 度だけ 0.00013 → 0.00033ms へ
 * 動き、 差 0.0002ms が分解能 0.00017ms を超えて regressed になった (#1718 実測)。
 *
 * 2 倍にすると、 その差は下限 0.00034ms に届かず保留になる。 一方で完了条件が
 * 求める「baseline p95 の 3 倍の遅延」 は 0.0034ms 規模で、 下限の 10 倍あるため
 * 従来どおり検知できる。 検知できる悪化の大きさを削らずに、 揺らぎだけを外せる。
 */
export const RESOLUTION_FLOOR_MULTIPLE = 2;

/**
 * Bootstrap CI on p10 delta で regression を判定する。
 *
 * (1) 信頼区間が 0 を含まない (= 有意な差) かつ (2) delta が threshold を超え、
 * かつ (3) 差が測定系の分解能 (`resolutionMs`) を上回る場合のみ regressed / improved と判定する。
 *
 * p95 の変化率も `tailDeltaPct` として返すが判定には使わない。 実行をまたぐと
 * 実装と無関係に動くため gate に載せられない一方、 一部の呼出だけが遅くなる変化は
 * そこにしか現れないため、 報告には残す。
 */
export function detectRegression(input: RegressionInput): RegressionResult {
  const threshold = input.threshold ?? 0.2;
  const bootstrapIterations = input.bootstrapIterations ?? 2000;
  const confidenceLevel = input.confidenceLevel ?? 0.95;
  // 下限の既定は測定系の分解能の定数倍。 固定値を置かないのは、 妥当な値が機械と
  // 呼出経路で変わるため (`measureHarnessResolution` が実行の中で測る)。
  const minDeltaMs =
    input.minDeltaMs ??
    (input.resolutionMs === undefined ? 0 : input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE);

  const currentStat = judgedStatistic(input.current);
  const baselineStat = judgedStatistic(input.baseline);

  const deltaPct = relativeDelta(currentStat, baselineStat);
  const tailDeltaPct = relativeDelta(input.current.p95, input.baseline.p95);

  const ci = bootstrapCiOnDelta(
    input.current.samples,
    input.baseline.samples,
    bootstrapIterations,
    confidenceLevel,
  );

  // 有意 = CI が 0 を跨がない (両端が同符号)
  const significant = (ci.lower > 0 && ci.upper > 0) || (ci.lower < 0 && ci.upper < 0);

  // 差が測定系の分解能を下回るものは op の変化として読めない。 harness 自身の
  // 往復を見ているだけなので、 相対比がいくら大きくても判定を保留する。
  const meaningfulDelta = Math.abs(currentStat - baselineStat) >= minDeltaMs;

  let verdict: RegressionResult['verdict'] = 'stable';
  if (significant && meaningfulDelta && deltaPct >= threshold) {
    verdict = 'regressed';
  } else if (significant && meaningfulDelta && deltaPct <= -threshold) {
    verdict = 'improved';
  }

  // 下限が判定を抑えた場合と、そもそも変化が無い場合を呼出側で区別できるようにする。
  // 両方を stable として返すだけだと、検知できていない状態が安定と読める。
  const suppressedByFloor = significant && !meaningfulDelta && Math.abs(deltaPct) >= threshold;

  // baseline 自体が下限より小さい op は、閾値を何倍超えても差が下限に届かない。
  // 測定系の往復より速い処理を測ろうとしている状態を指す。
  const belowDetectionFloor = baselineStat < minDeltaMs;

  return {
    regressed: verdict === 'regressed',
    deltaPct,
    judged: { current: currentStat, baseline: baselineStat },
    tailDeltaPct,
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
 * 判定に使う統計量を取り出す。
 *
 * 保存済み baseline の JSON は `p10` field を持たない世代があるので、 sample 配列から
 * 計算し直す。 field を先に読むと、 古い baseline との比較だけが別の軸で行われる。
 */
function judgedStatistic(result: MeasureResult): number {
  if (result.samples.length > 0) {
    const sorted = [...result.samples].sort((left, right) => left - right);
    return percentileType7(sorted, REGRESSION_JUDGED_PERCENTILE);
  }
  return result.p10 ?? 0;
}

/** baseline が 0 の時に 0/0 を 0、 0 からの増加を Infinity として扱う変化率。 */
function relativeDelta(current: number, baseline: number): number {
  if (baseline === 0) return current === 0 ? 0 : Number.POSITIVE_INFINITY;
  return (current - baseline) / baseline;
}

/**
 * Bootstrap CI on stat(current) - stat(baseline)。
 *
 * 手順 = 各 iteration で current / baseline の sample を復元抽出、
 * それぞれの分位を計算し、 差を蓄積。 蓄積した delta 分布から CI を取る。
 * サンプル数不足時は退化 CI ({0, 0}) を返す。
 */
function bootstrapCiOnDelta(
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
    const current = bootstrapPercentile(currentSamples);
    const baseline = bootstrapPercentile(baselineSamples);
    deltas.push(current - baseline);
  }
  deltas.sort((a, b) => a - b);

  const alpha = (1 - confidenceLevel) / 2;
  const lower = percentileType7(deltas, alpha);
  const upper = percentileType7(deltas, 1 - alpha);
  return { lower, upper };
}

function bootstrapPercentile(samples: number[]): number {
  const n = samples.length;
  const resample: number[] = new Array(n);
  for (let index = 0; index < n; index += 1) {
    const rand = Math.floor(Math.random() * n);
    resample[index] = samples[rand] ?? 0;
  }
  resample.sort((a, b) => a - b);
  return percentileType7(resample, REGRESSION_JUDGED_PERCENTILE);
}
