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

  // 実行間のばらつきを超えた差だけを有意として扱う。
  //
  // bootstrap CI は 1 回の実行の中の標本から作るため、 実行と実行の間のばらつきを
  // 含んでいない。 その状態で相対閾値だけを見ると、 実装を変えずに測るだけで
  // 22-29 package が落ちていた (#1739)。
  //
  // 履歴が足りない間 (baseline を作った直後) は幅を推定できないので、 従来どおり
  // 相対閾値だけで判定する。
  // 幅は baseline 自身の比を基準に測る。 判定量が「今回の比 ÷ baseline の比」 の
  // 率なので、 同じ基準で測らないと抑える量と判定する量が食い違う。
  const anchorRatio = observedRatio(input.baseline);
  const interRunSpread =
    anchorRatio === null ? null : interRunRelativeSpread(input.baseline.ratioHistory, anchorRatio);
  const effectiveThreshold =
    interRunSpread === null
      ? threshold
      : Math.max(threshold, interRunSpread * INTER_RUN_SPREAD_MULTIPLE);

  let verdict: RegressionResult['verdict'] = 'stable';
  if (significant && meaningfulDelta && deltaPct >= effectiveThreshold) {
    verdict = 'regressed';
  } else if (significant && meaningfulDelta && deltaPct <= -effectiveThreshold) {
    verdict = 'improved';
  }

  // 相対閾値は超えたが実行間のばらつきの範囲に収まった場合を区別する。
  // 「変化が無い」 と「その op の揺れと見分けが付かない」 は同じ stable でも意味が違う。
  const suppressedByInterRunSpread =
    significant &&
    meaningfulDelta &&
    Math.abs(deltaPct) >= threshold &&
    Math.abs(deltaPct) < effectiveThreshold;

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
    ...(interRunSpread === null ? {} : { interRunSpread }),
    effectiveThreshold,
    suppressedByInterRunSpread,
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
 * 実行間のばらつきを推定するのに要る履歴の最小数。
 *
 * 2 点では散らばりの推定が 1 つの差にそのまま引きずられる。 3 点あれば中央値と
 * そこからの偏差が定まり、 1 点の外れ値で幅が決まらなくなる。 これを満たすまでは
 * 従来どおり相対閾値だけで判定する (幅を推定できない間に幅で抑えると、
 * baseline を作った直後の実行が常に stable になる)。
 */
export const MIN_RATIO_HISTORY = 3;

/** baseline が保持する履歴の上限。 */
export const MAX_RATIO_HISTORY = 8;

/**
 * 実行間のばらつきに対して何倍まで許すか。
 *
 * 全 493 op の実履歴 (6 回の実行) を使って、 履歴の末尾 1 件を「次の実行」 と見なし
 * 判定を跨ぐ op を数えた実測。
 *
 * | 倍率 | 判定を跨ぐ op | 幅が閾値 20% を上回った op |
 * |---|---|---|
 * | 1.0 | 2 / 454 | 44 |
 * | 1.2 | 2 / 454 | 66 |
 * | 1.5 | 2 / 454 | 91 |
 * | 2.0 | 1 / 454 | 143 |
 * | 3.0 | 1 / 454 | 239 |
 *
 * 2 倍で跨ぐ op が 1 件まで落ちる。 3 倍にしても 1 件のままで、 代わりに幅が効く op が
 * 143 → 239 に増える = 見逃しの範囲が広がるだけなので 2 倍を採る。
 *
 * 感度の代償は残る。 幅が効く op では、 その op 自身の揺れの 2 倍を超えない退行は
 * 検知できない (`docs/quality/perf-thresholds.md` § Each op carries its own
 * run-to-run spread に op ごとの最小検知幅の分布を載せている)。
 */
export const INTER_RUN_SPREAD_MULTIPLE = 2;

/**
 * この実行で観測した「対象 p10 ÷ 基準 p10」。
 *
 * 基準が無い / 分母にならない記録では求まらないので null を返す。 実 API 経路は
 * 交互測定を使わないため常に null になる。
 */
export function observedRatio(result: MeasureResult): number | null {
  const reference = result.reference;
  if (reference === undefined || !isUsableDenominator(reference.p10)) return null;
  const ratio = judgedStatistic(result) / reference.p10;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/**
 * 履歴から実行間のばらつきを推定する。
 *
 * **基準は履歴自身の中心ではなく、 比較の相手になる `anchor` (baseline 自身の比)**。
 * 判定量 `deltaPct` は今回の比を anchor と比べた率なので、 抑えたい量は
 * 「anchor からどれだけ離れ得るか」 であって「履歴がどれだけ散らばっているか」 では
 * ない。 返すのは履歴の中で anchor から最も離れた点の相対距離。
 *
 * 中央絶対偏差 (履歴の中央値まわりの散らばり) を最初に使ったが、 実測で 5 倍ほど
 * 過小に出た (全 493 op で MAD 版の p50 が 1.6% / p90 が 4.9% に対し、 anchor から
 * の最大偏差は p50 7.9% / p90 22.4%)。 その結果 3 倍しても相対閾値 20% を下回り、
 * 幅がほとんど効かないまま実行ごとに 10-15 op が入れ替わっていた。
 *
 * 最大値を採るのは、 抑えたいのが「その op が実際に見せた最悪の振れ」 だから。
 * 平均や中央値だと、 履歴の半分は必ずその外側に出る。 1 回の外れ値がその op の幅を
 * 広げる代償は負うが、 上限 (`MAX_RATIO_HISTORY`) を置いてあるので古い外れ値は
 * いずれ落ちる。
 *
 * 推定できない場合 (履歴が足りない / anchor が 0) は null を返す。
 */
export function interRunRelativeSpread(
  history: readonly number[] | undefined,
  anchor: number,
): number | null {
  if (history === undefined || history.length < MIN_RATIO_HISTORY) return null;
  if (!Number.isFinite(anchor) || anchor <= 0) return null;
  const usable = history.filter((value) => Number.isFinite(value) && value > 0);
  if (usable.length < MIN_RATIO_HISTORY) return null;

  const spread = Math.max(...usable.map((value) => Math.abs(value - anchor) / anchor));
  return Number.isFinite(spread) && spread >= 0 ? spread : null;
}

/**
 * 2 つの記録が同じ測定条件で採られたかを判定する。
 *
 * `measurementPremise` (baseline.ts) は測り方の版を 1 つの数で表すが、 呼出ごとの
 * 設定は表さない。 反復数や空回しの回数を変えても版は動かないため、 版だけを見て
 * いると条件を変えた実行が旧条件の記録と比較される (#1730)。
 *
 * 条件が違うと値そのものが動く。 反復数を増やせば JIT が進んだ状態の標本が増えて
 * p10 が下がり、 空回しを増やせば冷えた初回が標本から外れる。 実装を変えていなくても
 * 差が出るため、 条件の違う記録とは比較しない。
 *
 * 見るのは記録に残っている `iterations` と `warmup`。 serial は呼出の設定がそのまま
 * 入り、 concurrent は `concurrency × iterationsPerWorker` が `iterations` に、
 * `warmup × concurrency` が `warmup` に入る。 並列度と worker あたりの反復数を
 * 個別には持たないが、 どちらを変えても積が動くため条件の変化は捕まる。
 *
 * 積が同じになる組 (並列度 2 × 反復 50 と 並列度 5 × 反復 20) は区別できない。
 * 区別するには記録に field を足す必要があり、 既存の baseline は全て「不明」 に
 * 落ちて一斉に作り直しになる。 並列度だけを変える改修は稀なので、 現状は積で見る。
 */
export function hasSameMeasurementConfig(
  current: MeasureResult,
  baseline: MeasureResult,
): boolean {
  return (
    current.iterations === baseline.iterations &&
    current.warmup === baseline.warmup &&
    hasSameWorkload(current, baseline)
  );
}

/**
 * op が宣言した作業内容の版が、 版として成立しているかを確かめる (#1739)。
 *
 * 厳しくするのは宣言の側だけにする。 読み取り側 (`hasValidWorkloadVersion`) を同じ
 * 厳しさにすると、 `isResultMap` が `every` で判定するため 1 record の不正で baseline
 * file 全体が破棄され、 無関係な全 op の履歴と anchor が消える。
 *
 * 弾く値と理由。
 *   NaN      = 自分自身と等しくならないので記録が毎回入れ替わり、 その op は永久に
 *              比較されない。 読み取り側が弾いても次の実行で同じ値が書かれるため
 *              seed し直しが延々と続く。
 *   小数     = 1.0 と 1 が同値になるなど、 版として意図した区別が付かない。
 *   0 / 負   = 「宣言していない」 との区別が読み手に付かない。
 *   2^53 超  = 1 上げても同値になり、 版を上げたつもりで記録が入れ替わらない。
 */
export function assertValidWorkloadVersions(
  ops: readonly { name: string; workloadVersion?: number }[],
): void {
  const bad = ops.filter((op) => {
    const v = op.workloadVersion;
    return v !== undefined && !(Number.isSafeInteger(v) && v > 0);
  });
  if (bad.length === 0) return;
  throw new Error(
    `perf op の workloadVersion が版として成立していません: ${bad.map((op) => op.name).join(', ')}。` +
      ' 1 以上の安全な整数を指定してください。',
  );
}

/**
 * 2 つの記録が同じ作業内容を測ったかを判定する (#1739)。
 *
 * 反復数と空回しは記録に残るので上の検査が捕まえるが、 作業内容は `fn` の中にあって
 * 記録に痕跡を残さない。 op が版を宣言した時だけ、 その一致を要求する。
 *
 * **「片方だけが版を持つ組は同じとみなす」 は成立しない**。 既存の baseline は全て
 * 版を持たないので、 そう書くと版を宣言しても記録が入れ替わらず、 入れ替わらないので
 * 版が baseline に載らず、 載らないので次も比較が成立する = 宣言が永久に効かない
 * (実装して実測し、 `vector` の記録が `workloadVersion: undefined` のまま anchor も
 * 動かないことを確認した)。
 *
 * 無い状態も 1 つの値として扱い、 単純に等しいかを見る。 版を宣言していない op は
 * 両方とも「無い」 なので比較が成立し、 影響を受けない。 宣言した op はその実行で
 * 1 度だけ記録が入れ替わり、 以降は版どうしの比較になる。
 *
 * 検知できないのは「版を上げ忘れた作業内容の変更」。 宣言が要る設計なので、 上げ忘れ
 * ればその差は実装の退行として報告され続ける。 それが起きた時に見える形は
 * `docs/quality/perf-thresholds.md` § A changed workload reads as a regression が持つ。
 */
export function hasSameWorkload(current: MeasureResult, baseline: MeasureResult): boolean {
  return current.workloadVersion === baseline.workloadVersion;
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
