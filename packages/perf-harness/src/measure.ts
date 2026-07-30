import type {
  MeasureInput,
  MeasureResult,
  PerfReferenceKind,
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

export interface MeasureAlternatingInput {
  name: string;
  fn: () => void | Promise<void>;
  /** 同じ実行の中で対象と交互に測る基準 op。 */
  reference: {
    kind: PerfReferenceKind;
    name: string;
    /**
     * 基準 op の実装の版 (`REFERENCE_IMPL_VERSION`)。 種類が同じままでも実装を
     * 変えれば分母の大きさが変わるため、 記録して比較の可否に使う。
     */
    implVersion: number;
    fn: () => void | Promise<void>;
  };
  iterations: number;
  /** 対象と基準の両方を捨てで回す回数 (default 0)。 */
  warmup?: number;
}

export interface AlternatingMeasureResult {
  /**
   * 対象の実測値。 上限判定はこれを読む。 `reference` field に同じ実行で測った
   * 基準の p10 が入るので、 回帰判定はこの 1 つを持ち回れば足りる。
   */
  target: MeasureResult;
  /** 基準 op の実測値。 report が分母を示すために持つ。 */
  reference: MeasureResult;
  /** 対象 p10 ÷ 基準 p10。 */
  ratio: number;
}

/**
 * 対象と基準を 1 呼出ずつ交互に測る。
 *
 * まとめて測ると、 実行の中のどの時点で測られたかが対象と基準で変わる。
 * 実行内のずれまで分母に入れるには、 2 つを隣り合わせて測る必要がある。
 *
 * 順序は毎回「基準 → 対象」 で固定する。 直前に何が動いたかで費用が変わる
 * (実測で fs op の p10 が直前の op 次第で 2 倍動いた) ため、 順序が実行ごとに
 * 変わると比にその差が乗る。
 */
export async function measureAlternating(
  input: MeasureAlternatingInput,
): Promise<AlternatingMeasureResult> {
  if (input.iterations < 1) {
    throw new Error(`measureAlternating: iterations must be >= 1, got ${input.iterations}`);
  }
  const warmup = input.warmup ?? 0;
  if (warmup < 0) {
    throw new Error(`measureAlternating: warmup must be >= 0, got ${warmup}`);
  }

  for (let index = 0; index < warmup; index += 1) {
    await input.reference.fn();
    await input.fn();
  }

  const targetSamples: number[] = [];
  const referenceSamples: number[] = [];
  for (let index = 0; index < input.iterations; index += 1) {
    const start = process.hrtime.bigint();
    await input.reference.fn();
    const middle = process.hrtime.bigint();
    await input.fn();
    const end = process.hrtime.bigint();
    referenceSamples.push(Number(middle - start) / 1_000_000);
    targetSamples.push(Number(end - middle) / 1_000_000);
  }

  const reference = buildMeasureResult(
    input.reference.name,
    input.iterations,
    warmup,
    referenceSamples,
  );

  // 分母が 0 の比は判定に使えない。 基準は計時の粒度の数百倍になるよう選んで
  // あるので、 ここに来るのは測定系そのものが壊れている場合に限る。 黙って
  // 正規化なしに落とすと、 その実行だけ実行間のずれを含んだまま gate にかかる。
  if (!(reference.p10 > 0)) {
    throw new Error(
      `measureAlternating: 基準 op ${input.reference.name} の p10 が ${reference.p10}ms で分母にできない。` +
        ' 計時が機能していないか、 基準 op が最適化で消えている。',
    );
  }

  const target = buildMeasureResult(input.name, input.iterations, warmup, targetSamples);
  target.reference = {
    kind: input.reference.kind,
    name: input.reference.name,
    p10: reference.p10,
    implVersion: input.reference.implVersion,
  };

  return { target, reference, ratio: target.p10 / reference.p10 };
}

/**
 * この測定系が op に帰属できる最小の差 (ms) を実測する。
 *
 * 何もしない関数を `measure` と同じ経路 (async 関数を await する) で呼び、 その p10 を返す。
 * 得られる値は op の中身と無関係な往復の費用そのもので、 これより小さい差を
 * 実装の変化として読むことはできない。
 *
 * 回帰判定の絶対下限に固定値を置かないのはこのため。 妥当な値は機械と Node の版で
 * 変わるので、 比較する実行の中で測って渡す。
 */
export async function measureHarnessResolution(input: {
  iterations?: number;
  warmup?: number;
} = {}): Promise<number> {
  const empty = (): void => {};
  const result = await measure({
    name: 'harness.resolution',
    iterations: input.iterations ?? 200,
    warmup: input.warmup ?? 5,
    // op 側の包み方 (`async () => { await op.fn(); }`) と同じ深さで呼ぶ。
    // 深さが違うと往復の回数が変わり、 下限が実際より小さく出る。
    fn: async () => {
      await empty();
    },
  });
  return result.p10;
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
    p10: percentileType7(sorted, 0.1),
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
