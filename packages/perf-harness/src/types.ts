/**
 * `@kiwa-lab/perf-harness` — spec SSOT (types.ts + README.md の 2 file を SSOT 化)。
 *
 * # 精度契約
 *
 * 本 package が保証する精度は以下 5 軸。
 *
 * 1. **percentile 補間** = Type 7 linear interpolation (NumPy / R default)。 nearest-rank 方式より n < 100 で 5-10pt 精度が高い。
 * 2. **regression 判定** = bootstrap CI on p10 delta。 分布の下側で判定し、 CI が 0 を含まないかつ delta が threshold を超えた場合のみ regressed 判定。 上限 (cap) の判定は従来どおり p95。
 * 3. **warmup 収束** = strategy 選択。 `fixed` は旧来通り n 回捨てる、 `convergent` は「直近 window の p95 が 2σ 以内で安定」 判定で warmup を自動終了する。
 * 4. **outlier 処理** = trim option。 `trimPercent` で top X% / bottom X% を除外、 GC pause 等の外れ値を p99 から排除する経路を提供する。
 * 5. **baseline 環境不変性** = `BaselineEnvelope` に machine specs / Node version / git sha を必須記録、 別 env で保存された baseline を load 時に mismatch warn する。
 */
import type {
  QualityReport,
  ReleaseGateBlocker,
  ReleaseGateVerdict,
} from '@kiwa-lab/quality-metrics';

/** Warmup 経路。 `fixed` = 固定 n 回、 `convergent` = 収束判定で自動終了。 */
export type WarmupStrategy = 'fixed' | 'convergent';

/** Convergent warmup の収束判定基準。 */
export interface WarmupConvergence {
  /** 直近何 sample の window を評価するか (default 20)。 */
  windowSize?: number;
  /** window 内 p95 の変動幅を mean の何倍以内なら収束扱いとするか (default 0.05 = 5%)。 */
  toleranceRatio?: number;
  /** 収束できなかった場合の最大 iteration 数 (default 200)。 */
  maxIterations?: number;
}

/**
 * 実行内正規化の基準 op の種類。
 *
 * 基準は対象と同じ邪魔を受けるものでないと相殺が起きない。 種類の選び方と
 * 却下した案は `reference.ts` の冒頭と `docs/quality/perf-thresholds.md`
 * § In-run normalization が実測値つきで持つ。
 */
export type PerfReferenceKind = 'cpu' | 'fs-read' | 'fs-write';

/**
 * 同じ実行の中で交互に測った基準 op の記録。 回帰判定はこの値との比で行う。
 *
 * 基準の sample そのものは持たない。 判定に要るのは分母となる 1 つの値だけで、
 * 全 op ぶんの sample を baseline に足すと file が 3 倍になる。
 */
export interface MeasureReference {
  kind: PerfReferenceKind;
  /** 基準 op の名前 (`harness.reference.cpu` 等)。 */
  name: string;
  /** 基準 op の p10 (ms)。 対象と同じ実行 ・ 同じ交互測定で得た値。 */
  p10: number;
  /**
   * 基準 op の実装の版 (`REFERENCE_IMPL_VERSION`)。
   *
   * 種類が同じままでも実装を変えれば分母の大きさが変わる。 版が違う記録との比較は
   * 実装の差ではなく分母の差を報告するため、 比較せず記録を入れ替える。
   *
   * この field を持たない世代の記録があり得るので optional。 無い記録は版が不明なので
   * 比較せず入れ替える扱いにする。
   */
  implVersion?: number;
}

export interface MeasureInput {
  name: string;
  fn: () => void | Promise<void>;
  iterations: number;
  /** Fixed strategy 時の warmup 回数 (default 0)。 convergent strategy 時は無視される。 */
  warmup?: number;
  /** default = `fixed`。 */
  warmupStrategy?: WarmupStrategy;
  /** `warmupStrategy = 'convergent'` 時のみ効く。 */
  warmupConvergence?: WarmupConvergence;
  /**
   * outlier trim 比率 (%)。 default = 0 (無効)。 例 `2` なら top 2% + bottom 2% を除外して統計を再計算する。
   * samples 配列は元のまま保持し、 trimmed 系フィールド (trimmedMean / trimmedP95 等) を別途返す。
   */
  trimPercent?: number;
}

export interface MeasureResult {
  name: string;
  iterations: number;
  warmup: number;
  /** 収束判定を通ったかどうか。 fixed strategy では常に true、 convergent で maxIterations 到達時は false。 */
  warmupConverged: boolean;
  /** 実測 sample 配列 (単位 = ms、 trim 前)。 */
  samples: number[];

  // === 分布サマリ (Type 7 linear interpolation percentile) ===
  /**
   * 下側 10 パーセンタイル。 回帰判定が読む軸。
   *
   * 測定を乱す要因 (scheduler 横取り / GC / page cache miss / 他 process) は
   * どれも実行時間を伸ばす方向にしか働かない。 上側の裾はその日の機械の状態を、
   * 下側は邪魔が入らなかった時の実費を表す。 実装の変化を実行をまたいで
   * 比べられるのは後者だけ。
   */
  p10: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stdev: number;
  minMs: number;
  maxMs: number;
  totalMs: number;

  // === robust 統計 (long-tail / GC pause 耐性) ===
  /** 中央値 = p50 (別名、 API 明示化のため冗長保持)。 */
  median: number;
  /** Median Absolute Deviation。 stdev の非パラメトリック版、 log-normal 分布で robust。 */
  mad: number;
  /** 外れ値検出 = median ± 3 * MAD の外側にある sample 数。 */
  outlierCount: number;

  /**
   * 同じ実行の中で交互に測った基準 op。 `measureAlternating` の結果にだけ付く。
   *
   * 回帰判定はこの値を分母にした比で行う。 付いていない結果同士の比較は
   * 従来どおり実測値そのものを比べる (live mode / 単独の `measure`)。
   */
  reference?: MeasureReference;

  /**
   * 同じ実装を測った過去の実行の「対象 p10 ÷ 基準 p10」。 新しい順ではなく古い順。
   *
   * 実行内正規化 (#1737) は実行全体に乗るずれを消したが、 op 個別の実行間ばらつきは
   * 基準 op と邪魔を共有しないため相殺されずに残る。 判定に使う bootstrap CI は
   * 1 回の実行の中の標本から作るので、 このばらつきを含んでいない。 結果として
   * 実装を変えずに測るだけで 22-29 package が `regressed` になっていた (#1739)。
   *
   * この履歴から「その op が実行をまたいでどれだけ動くか」 を推定し、 その幅を
   * 超えた差だけを有意として扱う。 履歴が足りない間は従来どおり相対閾値だけで
   * 判定する (幅を推定できないため)。
   *
   * 積むのは verdict が stable の実行と、 比較しなかった実行だけ。 退行した実行の比を
   * 積むと、 その値が幅を押し広げて次回の実効閾値が退行そのものを覆う大きさになり、
   * 同じ退行が stable として通る。
   */
  ratioHistory?: number[];

  // === trim 後統計 (trimPercent > 0 時のみ非 undefined) ===
  trimmed?: {
    percent: number;
    /** trim 後の sample 数。 */
    sampleCount: number;
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    stdev: number;
  };
}

/** Regression 判定 input。 bootstrap CI 経路。 */
export interface RegressionInput {
  current: MeasureResult;
  baseline: MeasureResult;
  /** p10 delta の判定 threshold (default 0.2 = 20%)。 */
  threshold?: number;
  /** bootstrap 反復回数 (default 2000)。 少ないと CI が広くなり検出感度が下がる。 */
  bootstrapIterations?: number;
  /** 信頼区間 (default 0.95)。 */
  confidenceLevel?: number;
  /**
   * この測定系が op に帰属できる最小の差 (ms)。 これに `RESOLUTION_FLOOR_MULTIPLE` を
   * 掛けた値が既定の絶対下限になる。
   *
   * 何もしない関数を同じ経路で呼んだ時の費用を測って渡す
   * (`measureHarnessResolution`)。 それより小さい差は op ではなく harness 自身の
   * 往復を見ているので、 実装の変化として扱えない。
   *
   * 渡さない場合は下限なし = 相対 threshold と bootstrap CI だけで判定する。
   * 固定値を既定に置かないのは、 妥当な値が機械と呼出経路で変わるため。
   */
  resolutionMs?: number;
  /**
   * 絶対下限の明示指定 (ms)。 指定すると `resolutionMs` 由来の既定を上書きする。
   *
   * op 固有の事情で下限を動かす経路。 実測の振れ幅まで引き上げる使い方はしない
   * (gate が有効に見えて一度も発火しない状態になり、 report からそれが読めなくなる)。
   */
  minDeltaMs?: number;
}

export interface RegressionResult {
  regressed: boolean;
  /**
   * 判定量の変化率。 例 0.15 = 15% 悪化。 verdict はこの値で決まる。
   *
   * 正規化が成立した場合は「今回の p10 に `normalizationScale` を掛けた値」 と
   * baseline の p10 を比べた率。 成立しなかった場合は実測 p10 どうしの率。
   */
  deltaPct: number;
  /**
   * 判定に使った統計量そのもの (ms)。 `current` は換算後の値。
   *
   * 保存済み baseline の世代によっては `p10` field が無く sample から計算し直すため、
   * 呼出側が同じ値を再現しようとすると計算が二重になる。 報告に出す値はここから取る。
   * 実測値そのものは `MeasureResult.p10` で、 両者は `normalizationScale` 倍だけ違う。
   */
  judged: { current: number; baseline: number };
  /**
   * p95 の変化率 (今回側は換算後)。 判定には使わない。
   *
   * 一部の呼出だけが遅くなる変化 (条件分岐が増えた / 稀に遅い経路に入る) は
   * 下側に出ない。 p10 が動かないまま裾だけ伸びた事実を報告に残すために持つ。
   * この軸は実行をまたぐと実装と無関係に数百 % 動くため gate には載せられない。
   */
  tailDeltaPct: number;
  /**
   * bootstrap で推定した判定量 delta の 95% CI (lower / upper、 単位 = ms)。
   *
   * 換算後の今回の sample と baseline の sample から取る。 倍率は定数として扱うため、
   * 分母 (基準 op の p10) の推定誤差はこの区間に入っていない。
   */
  ci: { lower: number; upper: number };
  /** CI が 0 を含まないかつ delta > threshold なら true。 */
  significant: boolean;
  verdict: 'improved' | 'stable' | 'regressed';
  /**
   * 判定に使った絶対下限 (ms)。
   *
   * `resolutionMs` 由来の既定には `normalizationScale` が掛かっており (分解能も今回の
   * 実行で測った値なので、 差と同じ単位へ揃える)、 呼出が置いた `minDeltaMs` には
   * 掛からない (どの実行の測定値でもない定数のため)。
   */
  floorMs: number;
  /**
   * 相対閾値を超えた有意な差だったが、 絶対下限に満たないため stable に落とした場合 true。
   *
   * 「変化が無い」 と「差が下限未満で判定できない」 は同じ stable でも意味が違う。
   * 区別しないと、 検知できていない状態が安定していると読めてしまう。
   */
  suppressedByFloor: boolean;
  /**
   * baseline の p10 自体が絶対下限を下回る場合 true。
   *
   * 相対閾値を何倍超えても、 差が絶対下限に届くまでは stable のままになる。
   * 下限は測定系の分解能を定数倍したものなので、 これが立つ op は「harness の往復と
   * 同じか、 それより速い処理を測ろうとしている」 状態を指す。 検知が不可能という意味ではなく、 検知に要する
   * 悪化が相対では極端に大きくなるという意味。
   */
  belowDetectionFloor: boolean;
  /**
   * 実行内正規化が成立したか。
   *
   * 双方の結果に同じ種類の基準 op が記録されている時だけ true。 false の場合は
   * 実測値そのものを比べており、 実行と実行の間の機械の状態の差がそのまま
   * 判定に乗る。
   */
  normalized: boolean;
  /**
   * 今回の測定を baseline を測った時の機械の速さへ換算する倍率
   * (= baseline の基準 p10 ÷ 今回の基準 p10)。 正規化していない場合は 1。
   *
   * 比同士を比べるのと数学的には同じだが、 判定に使う量が ms のまま残るので
   * 絶対下限も report の表記も従来の意味を保てる。
   */
  normalizationScale: number;
  /**
   * baseline の履歴から推定した、 その op の実行間のばらつき (中央値に対する率)。
   *
   * 履歴が足りず推定できない場合は付かない。 `deltaPct` と同じ単位なので、
   * 「今回の差がばらつきの何倍か」 を `deltaPct / interRunSpread` で読める。
   */
  interRunSpread?: number;
  /**
   * 実際に判定へ使った相対閾値。
   *
   * 履歴からばらつきを推定できた op では `max(threshold, ばらつき × 3)`、
   * 推定できない op では `threshold` そのもの。 report はこの値を出す
   * (`threshold` だけを出すと、 なぜ落ちなかったのかが読めない)。
   */
  effectiveThreshold: number;
  /**
   * 相対閾値は超えたが、 その op の実行間のばらつきの範囲に収まったため
   * stable に落とした場合 true。
   *
   * 「変化が無い」 と「その op の揺れと見分けが付かない」 は同じ stable でも
   * 意味が違う。 区別しないと、 検知できていない状態が安定していると読める。
   */
  suppressedByInterRunSpread: boolean;
}

/** Baseline に記録する環境メタデータ。 machine mismatch 検出用。 */
export interface BaselineEnv {
  nodeVersion: string;
  /** os.platform() + os.arch()。 例 `darwin-arm64`。 */
  platform: string;
  /**
   * 記録しない。 比較には使わず、 baseline を追跡対象にした今は
   * 測定した機械の名前が git に残るだけになる。 過去の baseline には
   * 入っているので、 読める形は残す。
   */
  hostname?: string;
  cpuModel: string;
  /** cpu core 数 (物理 + 論理まとめて os.cpus().length)。 */
  cpuCount: number;
  /** git commit sha (short 7)、 取得失敗時は `unknown`。 */
  gitSha: string;
  /**
   * 測定時に global.gc() を呼べたか。 `--expose-gc` の有無で memory 測定の
   * 意味が変わる (無しでは解放される一時使用まで拾う) ため、 この値が違う
   * baseline とは比較せず作り直す。 v1 baseline には無いので optional。
   */
  gcExposed?: boolean;
  /**
   * 測定の取り方そのものの版。 機械も Node も同じなのに測り方を変えた場合、
   * 保存済みの値は比較対象として使えない。 その切り替えを 1 箇所で表す。
   *
   * 版が違う baseline とは比較せず、 測定が成立している次の実行で作り直す。
   * 記録の無い baseline (この field 導入より前のもの) も同じ扱いにする。
   * 値の意味は `MEASUREMENT_PREMISE` (baseline.ts) が持つ。
   */
  measurementPremise?: number;
  /** ISO8601 UTC。 */
  savedAt: string;
}

/**
 * Baseline JSON envelope。 `{ schema, env, results }`。 results は op 名 → MeasureResult。
 *
 * - v1 = 実測値そのものを記録していた頃
 * - v2 = 結果に基準 op の記録 (`MeasureResult.reference`) が付き得る (#1737)。
 *   交互測定を経ていない結果 (live mode / 単独の `measure`) には付かないので、
 *   v2 であることは「全 result が正規化済み」 を意味しない
 *
 * v1 も読める形は保つ。 読めなくすると、 保存済みの baseline を持つ実行が
 * 「file はあるのに読めない」 扱いになり、 gate を有効にした呼出が一斉に落ちる。
 * 比較対象として使えるかは `isComparableEnv` (測り方の版) が別に判定する。
 */
export interface BaselineEnvelope {
  schema: 1 | 2;
  env: BaselineEnv;
  results: Record<string, MeasureResult>;
}

/** load 時の env mismatch 検出結果。 */
export interface BaselineLoadResult {
  envelope: BaselineEnvelope;
  /**
   * 読んだ時点の file の中身の版 (sha256)。
   *
   * 書く直前に読み直して一致を確かめると、 読んでから書くまでの間に別の実行が
   * 書いていないことが判る (#1757)。
   */
  revision: string;
  /**
   * 現行環境と mismatch した field 名。 empty ならば同一環境。
   *
   * `gcExposed` は boolean で v1 baseline には値そのものが無いが、 利用側の型を
   * 壊さないよう `"true"` / `"false"` / `"missing"` の文字列へ寄せて格納する。
   */
  envMismatch: Array<{
    field: keyof BaselineEnv;
    baseline: string | number;
    current: string | number;
  }>;
}

export interface Thresholds {
  p95Ms?: number;
  costUsd?: number;
  tokens?: number;
  accuracy?: number;
}

export interface PerfGateInput {
  result: MeasureResult;
  baseline?: MeasureResult | null;
  thresholds?: Thresholds;
  metrics?: {
    costUsd?: number;
    tokens?: number;
    accuracy?: number;
  };
}

export interface PerfGateResult {
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  breaches: ReleaseGateBlocker[];
}
