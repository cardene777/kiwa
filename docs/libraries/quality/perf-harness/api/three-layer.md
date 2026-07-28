---
title: "@kiwa-lab/perf-harness three-layer の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>three-layer</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>resolveKiwaRepoRoot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L433) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

resolveKiwaRepoRoot — walk upward from `start` until finding a package.json whose `name` matches `kiwa-monorepo`. Used by every kiwa perf test to resolve the report path regardless of vitest cwd.

```ts
export declare function resolveKiwaRepoRoot(start: string): string;
```

#### <code v-pre>runPerf3Layer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L152) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export declare function runPerf3Layer(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult>;
```

#### <code v-pre>runPerf3LayerStrict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L415) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

runPerf3LayerStrict — v0.3 strict variant。 iter 2 倍 + Welch |t|&gt;3 + delta 10%。 test 漏れゼロを狙う fail-fast mode。 defaults ... - serialIterations: 400 (v0.2 200) - serialWarmup: 10 (v0.2 5) - concurrency: 20 (v0.2 10) - iterationsPerWorker: 100 (v0.2 50) - memoryIterations: 400 (v0.2 200) regression 判定は detectRegressionStrict 経由 (|t|&gt;3 + delta 10%)。

```ts
export declare function runPerf3LayerStrict(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult>;
```

### 型

#### <code v-pre>OpOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L117) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

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

#### <code v-pre>PerfOpSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L35) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

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
     * 回帰と判定する p95 差の下限 (ms、default 0.5)。
     *
     * 既定値は測定の揺らぎを除くためのものだが、高頻度 op には緩すぎる。
     * 0.10ms → 0.59ms は 490% の悪化でも差が 0.49ms なので既定では stable になる。
     * そうした op は実測の noise floor に合わせて小さくする。
     */
    regressionMinDeltaMs?: number;
    /**
     * Optional override for memory arrayBuffers cap.
     * Default = 100 KB across 200 iterations.
     */
    memoryArrayBuffersCapBytes?: number;
}
```

#### <code v-pre>RunPerf3LayerInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L61) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

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
    /**
     * 今回測っていない op を baseline から削除する (default false)。
     *
     * op 名を別処理へ付け替えたときに無関係な過去値と比較しないための掃除だが、
     * 常に有効だと絞り込み実行で op が一度欠けるだけで過去値が消える。
     * 次の完全実行では再 seed されて直前の退行を見逃すので、suite 全体を
     * 回す呼出だけが明示的に有効化する。
     */
    pruneStaleBaselineOps?: boolean;
    /**
     * GC を呼べない測定を memory gate の失敗として扱う (default false)。
     *
     * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
     * 成立しない。 ただし既定で失敗にすると、 GC 無しでも動いていた既存の
     * 呼出が一斉に落ちる。 kiwa 内部の suite のように前提を固定できる呼出だけが
     * 有効化する。
     */
    requireGc?: boolean;
}
```

#### <code v-pre>RunPerf3LayerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L128) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export interface RunPerf3LayerResult {
    outcomes: OpOutcome[];
    allPassed: boolean;
    baselineSeeded: boolean;
}
```
