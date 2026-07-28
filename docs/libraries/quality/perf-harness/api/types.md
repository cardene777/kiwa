---
title: "@kiwa-lab/perf-harness types の API 契約"
---

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>MeasureInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L33) <code v-pre>packages/perf-harness/src/types.ts</code>

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

#### <code v-pre>MeasureResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L50) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface MeasureResult {
    name: string;
    iterations: number;
    warmup: number;
    /** 収束判定を通ったかどうか。 fixed strategy では常に true、 convergent で maxIterations 到達時は false。 */
    warmupConverged: boolean;
    /** 実測 sample 配列 (単位 = ms、 trim 前)。 */
    samples: number[];
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    stdev: number;
    minMs: number;
    maxMs: number;
    totalMs: number;
    /** 中央値 = p50 (別名、 API 明示化のため冗長保持)。 */
    median: number;
    /** Median Absolute Deviation。 stdev の非パラメトリック版、 log-normal 分布で robust。 */
    mad: number;
    /** 外れ値検出 = median ± 3 * MAD の外側にある sample 数。 */
    outlierCount: number;
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

#### <code v-pre>PerfGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L174) <code v-pre>packages/perf-harness/src/types.ts</code>

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

#### <code v-pre>PerfGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L185) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface PerfGateResult {
    report: QualityReport;
    verdict: ReleaseGateVerdict;
    breaches: ReleaseGateBlocker[];
}
```

#### <code v-pre>RegressionInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L91) <code v-pre>packages/perf-harness/src/types.ts</code>

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
    /**
     * p95 の差がこの ms 未満なら回帰と判定しない (default 0.5)。
     *
     * 相対比だけで判定すると値が小さいほど厳しくなる。 0.03ms から 0.04ms への
     * 変化はサンプルが安定していれば「有意な 33% 悪化」になるが、 実害はない。
     */
    minDeltaMs?: number;
}
```

#### <code v-pre>RegressionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L109) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface RegressionResult {
    regressed: boolean;
    /** p95 の変化率。 例 0.15 = 15% 悪化。 */
    deltaPct: number;
    /** bootstrap で推定した p95 delta の 95% CI (lower / upper、 単位 = ms)。 */
    ci: {
        lower: number;
        upper: number;
    };
    /** CI が 0 を含まないかつ delta > threshold なら true。 */
    significant: boolean;
    verdict: 'improved' | 'stable' | 'regressed';
}
```

#### <code v-pre>Thresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L167) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface Thresholds {
    p95Ms?: number;
    costUsd?: number;
    tokens?: number;
    accuracy?: number;
}
```
