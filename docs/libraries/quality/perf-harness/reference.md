# Perf Harness リファレンス

`@kiwa-lab/perf-harness` は測定結果を保存し、同じ条件の baseline と比較します。

## 測定 API

`measure` は `name`、非同期可の `fn`、`iterations` を受け取り、ms単位の `samples`、Type 7補間のp50、p95、p99、平均、MADを返します。`iterations` は1以上です。`warmup` は固定回数、`warmupStrategy` が `convergent` の場合は直近windowの収束を待ちます。

収束warmupの既定値はwindow 20、p95に対して5%以内、最大200回です。収束しなくても本測定を実行し、結果の `warmupConverged` はfalseになります。`trimPercent` を指定すると、元の `samples` を保持したまま `trimmed` に再計算値を返します。`measureConcurrent` はworkerごとにwarmupしてから計測し、sample数は `concurrency * iterationsPerWorker` です。`measureMemory` はメモリを計測します。

## 回帰 API

`detectRegression` は `current` と `baseline` のp95差をbootstrapで比較します。既定値は2,000回、95%信頼区間、20%しきい値です。`RegressionResult` の `verdict` は `improved`、`stable`、`regressed` のいずれかです。信頼区間がゼロをまたぐ場合、または変化率がしきい値に届かない場合は `stable` です。

`detectRegressionStrict` は既定で99%信頼区間と10%しきい値を使います。`evaluatePerfGate` は性能結果、p95、cost、token、accuracyのしきい値から `QualityReport` とblockerを返します。しきい値を一つも渡さない場合はaxesを評価せずpassします。指定したcost、token、accuracyの実測値がない場合はfail扱いです。

## Baseline

`saveBaseline(path, result)` はschema 1のenvelopeを保存します。`loadBaseline(path)` は `null` または `envelope` と `envMismatch` を返します。legacyの単一resultも読み込みますが、環境値はunknownとなるため現行環境との不一致になります。比較前にNode version、platform、hostname、CPU、git SHAの不一致を確認してください。

`defaultBaselinePath(moduleName)` は `.perf-baseline` 配下の保存先を返します。複数操作を保存する場合は `saveBaselineEnvelope` を使います。

## 制約と後始末

wall clockのsub millisecond測定はOS schedulerの影響を受けます。共有CIでは絶対値ではなく、同じ環境での差分を比較します。`measureMemory` は `--expose-gc` がない環境ではforced GCを使えずノイズが増えます。baselineを更新する前に環境mismatchを解消してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `measureConcurrent: concurrency must be >= 1, got ${input.concurrency}` | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L37) |
| `measureConcurrent: iterationsPerWorker must be >= 1, got ${input.iterationsPerWorker}` | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L40) |
| `measureConcurrent: warmup must be >= 0, got ${warmup}` | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L46) |
| `measure: iterations must be >= 1, got ${input.iterations}` | [packages/perf-harness/src/measure.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L15) |
| `measure: warmup must be >= 0, got ${warmupCount}` | [packages/perf-harness/src/measure.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L24) |
| `measureMemory: iterations must be >= 1, got ${input.iterations}` | [packages/perf-harness/src/memory.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L30) |
| `Could not resolve repo root from ${start}` | [packages/perf-harness/src/three-layer.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L325) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `buildMeasureResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L82) `packages/perf-harness/src/measure.ts`

```ts
export function buildMeasureResult(
  name: string,
  iterations: number,
  warmup: number,
  samples: number[],
  trimPercent = 0,
  warmupConverged = true,
): MeasureResult;
```

#### `captureEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L61) `packages/perf-harness/src/baseline.ts`

現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。

```ts
export function captureEnv(): BaselineEnv;
```

#### `defaultBaselinePath`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L56) `packages/perf-harness/src/baseline.ts`

```ts
export function defaultBaselinePath(moduleName: string): string;
```

#### `detectRegression`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L14) `packages/perf-harness/src/regression.ts`

Bootstrap CI on p95 delta で regression を判定する。 旧実装は mean で Welch t-test を回しつつ deltaPct を p95 で計算していたため、 統計軸が矛盾していた。 (mean で「有意差なし」 と判定しつつ p95 が 20% 悪化 → stable と誤判定される事故) 本実装は p95 の差そのものに対して bootstrap 分布を作り、 (1) 信頼区間が 0 を含まない (= 有意な差) かつ (2) delta が threshold を超えた 場合のみ regressed / improved と判定する。

```ts
export function detectRegression(input: RegressionInput): RegressionResult;
```

#### `detectRegressionStrict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L58) `packages/perf-harness/src/regression.ts`

strict mode — CI 99% + threshold 10%。 false negative を最小化。 見逃し (regressed を stable と判定) が致命的な release gate 経路で使う。

```ts
export function detectRegressionStrict(input: RegressionInput): RegressionResult;
```

#### `emitPerfReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/report.ts#L3) `packages/perf-harness/src/report.ts`

```ts
export function emitPerfReport(
  result: MeasureResult,
  opts: {
    baseline?: MeasureResult;
    includeSamples?: boolean;
  } = {},
): string;
```

#### `evaluatePerfGate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/gate.ts#L13) `packages/perf-harness/src/gate.ts`

```ts
export function evaluatePerfGate(input: PerfGateInput): PerfGateResult;
```

#### `loadBaseline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L16) `packages/perf-harness/src/baseline.ts`

Baseline を load して現行環境と envelope の env を比較、 mismatch field を検出する。 legacy schema (単一 MeasureResult) は自動 upgrade して読む。

```ts
export async function loadBaseline(path: string): Promise<BaselineLoadResult | null>;
```

#### `measure`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L13) `packages/perf-harness/src/measure.ts`

```ts
export async function measure(input: MeasureInput): Promise<MeasureResult>;
```

#### `measureConcurrent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L35) `packages/perf-harness/src/concurrent.ts`

```ts
export async function measureConcurrent(input: ConcurrentInput): Promise<MeasureResult>;
```

#### `measureMemory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L28) `packages/perf-harness/src/memory.ts`

```ts
export async function measureMemory(input: MemoryInput): Promise<MemorySample>;
```

#### `resolveKiwaRepoRoot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L316) `packages/perf-harness/src/three-layer.ts`

resolveKiwaRepoRoot — walk upward from `start` until finding a package.json whose `name` matches `kiwa-monorepo`. Used by every kiwa perf test to resolve the report path regardless of vitest cwd.

```ts
export function resolveKiwaRepoRoot(start: string): string;
```

#### `runPerf3Layer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L102) `packages/perf-harness/src/three-layer.ts`

```ts
export async function runPerf3Layer(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult>;
```

#### `runPerf3LayerLive`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L66) `packages/perf-harness/src/live.ts`

```ts
export async function runPerf3LayerLive(
  input: RunPerf3LayerLiveInput,
): Promise<RunPerf3LayerLiveResult>;
```

#### `runPerf3LayerStrict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L298) `packages/perf-harness/src/three-layer.ts`

runPerf3LayerStrict — v0.3 strict variant。 iter 2 倍 + Welch |t|&gt;3 + delta 10%。 test 漏れゼロを狙う fail-fast mode。 defaults ... - serialIterations: 400 (v0.2 200) - serialWarmup: 10 (v0.2 5) - concurrency: 20 (v0.2 10) - iterationsPerWorker: 100 (v0.2 50) - memoryIterations: 400 (v0.2 200) regression 判定は detectRegressionStrict 経由 (|t|&gt;3 + delta 10%)。

```ts
export async function runPerf3LayerStrict(
  input: RunPerf3LayerInput,
): Promise<RunPerf3LayerResult>;
```

#### `saveBaseline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L34) `packages/perf-harness/src/baseline.ts`

単一結果 baseline を保存する compat 経路。 内部で envelope に wrap して保存する。 `moduleName` は複数 op を 1 baseline に集約する時 (three-layer) に使う default key。

```ts
export async function saveBaseline(
  path: string,
  result: MeasureResult,
  opts?: { key?: string },
): Promise<void>;
```

#### `saveBaselineEnvelope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L48) `packages/perf-harness/src/baseline.ts`

Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。

```ts
export async function saveBaselineEnvelope(
  path: string,
  envelope: BaselineEnvelope,
): Promise<void>;
```

### 型

#### `ConcurrentInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L27) `packages/perf-harness/src/concurrent.ts`

measureConcurrent — drive `fn` under a fixed concurrency load and record per-call latency. Real production traffic is not serial. A p95 that looks fine at `iterations = 200, concurrency = 1` (the default `measure`) can collapse once N clients hit the same code path at once because contention on the shared engine / recorder / queue kicks in. This helper spawns `concurrency` parallel workers, each of which loops `iterationsPerWorker` times. Total sample count = concurrency × iterationsPerWorker. Every sample is a wall-clock per-call latency (from `process.hrtime.bigint()` around each `fn()` invocation). Returned {@link MeasureResult} has the same shape as `measure` so downstream regression / gate / report code does not need to branch.

```ts
export interface ConcurrentInput {
  name: string;
  fn: () => Promise<unknown> | unknown;
  concurrency: number;
  iterationsPerWorker: number;
  warmup?: number;
}
```

#### `LiveOpOutcome`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L53) `packages/perf-harness/src/live.ts`

```ts
export interface LiveOpOutcome extends Partial<OpOutcome> {
  name: string;
  skipped: boolean;
  skipReason: string | null;
}
```

#### `LivePerfOpSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L32) `packages/perf-harness/src/live.ts`

```ts
export interface LivePerfOpSpec extends PerfOpSpec {
  /**
   * Env vars that must all be set for this op to reach the live API.
   * When any is missing the op is skipped and reported as LIVE_ENV_MISSING.
   */
  requiredEnv: string[];
}
```

#### `MeasureInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L33) `packages/perf-harness/src/types.ts`

```ts
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
```

#### `MeasureResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L50) `packages/perf-harness/src/types.ts`

```ts
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
```

#### `MemoryInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L23) `packages/perf-harness/src/memory.ts`

```ts
export interface MemoryInput {
  fn: () => Promise<unknown> | unknown;
  iterations: number;
}
```

#### `MemorySample`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L13) `packages/perf-harness/src/memory.ts`

measureMemory — capture heap deltas around a target function. Real production concerns include memory growth per call. A p95 of 5ms is useless if every call leaks 100KB of retained heap. This helper wraps a target function with a global.gc() + process.memoryUsage() bracket so tests can assert on `heapUsedDelta` / `rssUsedDelta` per call. Requires Node to be launched with `--expose-gc` for stable readings. When GC is not exposed we fall back to a delta without forced GC — the numbers are noisier but the trend still catches egregious leaks.

```ts
export interface MemorySample {
  iterationCount: number;
  heapUsedDeltaBytes: number;
  heapUsedDeltaPerIterationBytes: number;
  rssDeltaBytes: number;
  externalDeltaBytes: number;
  arrayBuffersDeltaBytes: number;
  gcExposed: boolean;
}
```

#### `OpOutcome`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L85) `packages/perf-harness/src/three-layer.ts`

```ts
export interface OpOutcome {
  name: string;
  serial: MeasureResult;
  concurrent: MeasureResult;
  memory: MemorySample;
  serialGatePassed: boolean;
  concurrentGatePassed: boolean;
  memoryGatePassed: boolean;
  regressionVerdict: 'stable' | 'improved' | 'regressed' | 'n/a (baseline seeded)';
}
```

#### `PerfGateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L156) `packages/perf-harness/src/types.ts`

```ts
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
```

#### `PerfGateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L167) `packages/perf-harness/src/types.ts`

```ts
export interface PerfGateResult {
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  breaches: ReleaseGateBlocker[];
}
```

#### `PerfOpSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L29) `packages/perf-harness/src/three-layer.ts`

```ts
export interface PerfOpSpec {
  name: string;
  fn: () => Promise<unknown> | unknown;
  /**
   * Serial p95 hard cap (ms). Source: docs/quality/perf-thresholds.md.
   */
  serialP95CapMs: number;
  /**
   * Optional override for concurrent cap. Default = 2 × serial cap per SSOT.
   */
  concurrentP95CapMs?: number;
  /**
   * Optional override for memory arrayBuffers cap.
   * Default = 100 KB across 200 iterations.
   */
  memoryArrayBuffersCapBytes?: number;
}
```

#### `RegressionInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L91) `packages/perf-harness/src/types.ts`

Regression 判定 input。 bootstrap CI 経路。

```ts
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
```

#### `RegressionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L102) `packages/perf-harness/src/types.ts`

```ts
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
```

#### `RunPerf3LayerInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L47) `packages/perf-harness/src/three-layer.ts`

```ts
export interface RunPerf3LayerInput {
  moduleName: string;
  ops: PerfOpSpec[];
  /**
   * Absolute path to the markdown report file. Overwritten each run.
   */
  reportPath: string;
  /**
   * Optional override for baseline path. Default = defaultBaselinePath(moduleName).
   */
  baselinePath?: string;
  /**
   * Iterations for the serial phase. Default 200.
   */
  serialIterations?: number;
  /**
   * Warmup iterations for the serial phase (discarded). Default 5.
   */
  serialWarmup?: number;
  /**
   * Worker count for the concurrent phase. Default 10.
   */
  concurrency?: number;
  /**
   * Per-worker iterations for the concurrent phase. Default 50.
   */
  iterationsPerWorker?: number;
  /**
   * Iterations for the memory phase. Default 200.
   */
  memoryIterations?: number;
  /**
   * Path (relative to reportPath's directory tree) that the report references
   * as the threshold SSOT. Default: '../../quality/perf-thresholds'.
   */
  thresholdDocLink?: string;
}
```

#### `RunPerf3LayerLiveInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L40) `packages/perf-harness/src/live.ts`

```ts
export interface RunPerf3LayerLiveInput {
  moduleName: string;
  ops: LivePerfOpSpec[];
  reportPath: string;
  baselinePath?: string;
  serialIterations?: number;
  serialWarmup?: number;
  concurrency?: number;
  iterationsPerWorker?: number;
  memoryIterations?: number;
  thresholdDocLink?: string;
}
```

#### `RunPerf3LayerLiveResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L59) `packages/perf-harness/src/live.ts`

```ts
export interface RunPerf3LayerLiveResult {
  outcomes: LiveOpOutcome[];
  allPassed: boolean;
  anySkipped: boolean;
  baselineSeeded: boolean;
}
```

#### `RunPerf3LayerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L96) `packages/perf-harness/src/three-layer.ts`

```ts
export interface RunPerf3LayerResult {
  outcomes: OpOutcome[];
  allPassed: boolean;
  baselineSeeded: boolean;
}
```

#### `Thresholds`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L149) `packages/perf-harness/src/types.ts`

```ts
export interface Thresholds {
  p95Ms?: number;
  costUsd?: number;
  tokens?: number;
  accuracy?: number;
}
```
<!-- kiwa-public-api:end -->
