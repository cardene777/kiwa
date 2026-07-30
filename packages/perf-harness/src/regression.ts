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
 * かつ (3) 差が絶対下限 (既定 = `resolutionMs` の `RESOLUTION_FLOOR_MULTIPLE` 倍) 以上の場合のみ
 * regressed / improved と判定する。
 *
 * p95 の変化率も `tailDeltaPct` として返すが判定には使わない。 実行をまたぐと
 * 実装と無関係に動くため gate に載せられない一方、 一部の呼出だけが遅くなる変化は
 * そこにしか現れないため、 報告には残す。
 */
export function detectRegression(input: RegressionInput): RegressionResult {
  const threshold = input.threshold ?? 0.2;
  const bootstrapIterations = input.bootstrapIterations ?? 2000;
  const confidenceLevel = input.confidenceLevel ?? 0.95;

  const { scale, normalized } = resolveNormalization(input.current, input.baseline);

  // 下限の既定は測定系の分解能の定数倍。 固定値を置かないのは、 妥当な値が機械と
  // 呼出経路で変わるため (`measureHarnessResolution` が実行の中で測る)。
  //
  // 差は baseline を測った時の機械の速さへ換算してあるので、 分解能にも同じ倍率を
  // 掛ける。 掛けないと、 機械が遅い実行では分解能だけが伸びて下限が実際より
  // 厳しくなる。 一方 `minDeltaMs` は呼出が置いた定数で、 どの実行の測定値でも
  // ないため換算しない (掛けると gate の感度がその日の機械で変わる)。
  const minDeltaMs =
    input.minDeltaMs ??
    (input.resolutionMs === undefined
      ? 0
      : input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE * scale);

  const currentStat = judgedStatistic(input.current) * scale;
  const baselineStat = judgedStatistic(input.baseline);

  const deltaPct = relativeDelta(currentStat, baselineStat);
  const tailDeltaPct = relativeDelta(input.current.p95 * scale, input.baseline.p95);

  const ci = bootstrapCiOnDelta(
    scale === 1 ? input.current.samples : input.current.samples.map((sample) => sample * scale),
    input.baseline.samples,
    bootstrapIterations,
    confidenceLevel,
  );

  // 有意 = CI が 0 を跨がない (両端が同符号)
  const significant = (ci.lower > 0 && ci.upper > 0) || (ci.lower < 0 && ci.upper < 0);

  // 差が絶対下限を下回るものは op の変化として読めない。 分解能と同じ帯の差は
  // harness 自身の往復と区別できないので、 相対比がいくら大きくても判定を保留する。
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
    normalized,
    normalizationScale: scale,
  };
}

/**
 * 実行内正規化の倍率を決める。
 *
 * 判定したいのは比 (対象 ÷ 基準) の変化だが、 比のまま比べると判定に使う量が
 * 無次元になり、 絶対下限 (ms) も report の表記も意味を失う。 代わりに今回の
 * 測定へ `baseline の基準 p10 ÷ 今回の基準 p10` を掛けて、 baseline を測った時の
 * 機械の速さに換算する。 比同士を比べるのと数学的には同じで、 単位は ms のまま残る。
 *
 * 双方に同じ種類の基準が記録されている時だけ成立する。 種類が違えば分母の意味が
 * 違うので、 掛けても相殺は起きない。 片方にしか無い場合も同じ。
 */
export function resolveNormalization(
  current: MeasureResult,
  baseline: MeasureResult,
): { scale: number; normalized: boolean } {
  const currentReference = current.reference;
  const baselineReference = baseline.reference;
  if (currentReference === undefined || baselineReference === undefined) {
    return { scale: 1, normalized: false };
  }
  if (currentReference.kind !== baselineReference.kind) return { scale: 1, normalized: false };
  // 種類が同じでも実装が違えば分母の大きさが違う。 版の記録が無い世代も版不明として
  // 扱う。 掛けても相殺は起きず、 分母の差を実装の差として報告してしまう。
  if (
    currentReference.implVersion === undefined ||
    baselineReference.implVersion === undefined ||
    currentReference.implVersion !== baselineReference.implVersion
  ) {
    return { scale: 1, normalized: false };
  }
  // 有限で正の値だけを分母にする。 `> 0` だけでは Infinity が通り、 倍率が 0 になって
  // 全 sample が 0 に潰れる (下限も 0 になるので必ず有意判定を通り improved が出る)。
  // 逆に極小値を分母にすると倍率が Infinity になり、 判定量が NaN になって 3 倍の
  // 悪化でも stable で通る。 どちらも正規化「成立」 と報告されるため baseline も
  // 書き直されず、 その op は永久に gate に掛からない。
  if (!isUsableDenominator(currentReference.p10) || !isUsableDenominator(baselineReference.p10)) {
    return { scale: 1, normalized: false };
  }
  const scale = baselineReference.p10 / currentReference.p10;
  // 両端が有限でも、 桁が離れていれば商が非有限や 0 に落ちる。 判定に使えない倍率で
  // 「正規化した」 と報告しない。
  if (!Number.isFinite(scale) || scale <= 0) return { scale: 1, normalized: false };
  return { scale, normalized: true };
}

/** 分母に使える値か。 `hasValidReference` (baseline.ts) と同じ強さに揃える。 */
function isUsableDenominator(value: number): boolean {
  return Number.isFinite(value) && value > 0;
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
 * 保存済み baseline の JSON は `p10` field を持たない世代があるので、 無ければ sample から
 * 計算する。 ある時はそれを使う = report が表示する値と判定が読む値を必ず一致させる
 * (`loadBaseline` が読込時に全 field を sample から作り直すので、 両者は同じ計算に由来する)。
 */
function judgedStatistic(result: MeasureResult): number {
  if (typeof result.p10 === 'number') return result.p10;
  if (result.samples.length === 0) return 0;
  const sorted = [...result.samples].sort((left, right) => left - right);
  return percentileType7(sorted, REGRESSION_JUDGED_PERCENTILE);
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
