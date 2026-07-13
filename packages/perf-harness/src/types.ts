/**
 * `@kiwa-lab/perf-harness` — spec SSOT (types.ts + README.md の 2 file を SSOT 化)。
 *
 * # 精度契約
 *
 * 本 package が保証する精度は以下 5 軸。
 *
 * 1. **percentile 補間** = Type 7 linear interpolation (NumPy / R default)。 nearest-rank 方式より n < 100 で 5-10pt 精度が高い。
 * 2. **regression 判定** = bootstrap CI on p95 delta。 mean で有意性判定 + p95 で magnitude 判定の統計軸矛盾を廃止、 p95 分布上で 95% CI を bootstrap 推定し CI が 0 を含まないかつ delta が threshold を超えた場合のみ regressed 判定。
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
  /** p95 delta の判定 threshold (default 0.2 = 20%)。 */
  threshold?: number;
  /** bootstrap 反復回数 (default 2000)。 少ないと CI が広くなり検出感度が下がる。 */
  bootstrapIterations?: number;
  /** 信頼区間 (default 0.95)。 */
  confidenceLevel?: number;
}

export interface RegressionResult {
  regressed: boolean;
  /** p95 の変化率。 例 0.15 = 15% 悪化。 */
  deltaPct: number;
  /** bootstrap で推定した p95 delta の 95% CI (lower / upper、 単位 = ms)。 */
  ci: { lower: number; upper: number };
  /** CI が 0 を含まないかつ delta > threshold なら true。 */
  significant: boolean;
  verdict: 'improved' | 'stable' | 'regressed';
}

/** Baseline に記録する環境メタデータ。 machine mismatch 検出用。 */
export interface BaselineEnv {
  nodeVersion: string;
  /** os.platform() + os.arch()。 例 `darwin-arm64`。 */
  platform: string;
  hostname: string;
  cpuModel: string;
  /** cpu core 数 (物理 + 論理まとめて os.cpus().length)。 */
  cpuCount: number;
  /** git commit sha (short 7)、 取得失敗時は `unknown`。 */
  gitSha: string;
  /** ISO8601 UTC。 */
  savedAt: string;
}

/**
 * Baseline JSON envelope。 v1 スキーマ = `{ schema: 1, env, results }`。
 * results は op 名 → MeasureResult。
 */
export interface BaselineEnvelope {
  schema: 1;
  env: BaselineEnv;
  results: Record<string, MeasureResult>;
}

/** load 時の env mismatch 検出結果。 */
export interface BaselineLoadResult {
  envelope: BaselineEnvelope;
  /** 現行環境と mismatch した field 名。 empty ならば同一環境。 */
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
