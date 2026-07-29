---
title: "@kiwa-lab/perf-harness types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



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

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L242) <code v-pre>packages/perf-harness/src/types.ts</code>

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

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L253) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface PerfGateResult {
    report: QualityReport;
    verdict: ReleaseGateVerdict;
    breaches: ReleaseGateBlocker[];
}
```

#### <code v-pre>RegressionInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L100) <code v-pre>packages/perf-harness/src/types.ts</code>

Regression 判定 input。 bootstrap CI 経路。

```ts
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
```

#### <code v-pre>RegressionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L130) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface RegressionResult {
    regressed: boolean;
    /** p10 の変化率。 例 0.15 = 15% 悪化。 verdict はこの値で決まる。 */
    deltaPct: number;
    /**
     * 判定に使った統計量そのもの (ms)。
     *
     * 保存済み baseline の世代によっては `p10` field が無く sample から計算し直すため、
     * 呼出側が同じ値を再現しようとすると計算が二重になる。 報告に出す値はここから取る。
     */
    judged: {
        current: number;
        baseline: number;
    };
    /**
     * p95 の変化率。 判定には使わない。
     *
     * 一部の呼出だけが遅くなる変化 (条件分岐が増えた / 稀に遅い経路に入る) は
     * 下側に出ない。 p10 が動かないまま裾だけ伸びた事実を報告に残すために持つ。
     * この軸は実行をまたぐと実装と無関係に数百 % 動くため gate には載せられない。
     */
    tailDeltaPct: number;
    /** bootstrap で推定した p10 delta の 95% CI (lower / upper、 単位 = ms)。 */
    ci: {
        lower: number;
        upper: number;
    };
    /** CI が 0 を含まないかつ delta > threshold なら true。 */
    significant: boolean;
    verdict: 'improved' | 'stable' | 'regressed';
    /** 判定に使った絶対下限 (ms)。 */
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
}
```

#### <code v-pre>Thresholds</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/types.ts#L235) <code v-pre>packages/perf-harness/src/types.ts</code>

```ts
export interface Thresholds {
    p95Ms?: number;
    costUsd?: number;
    tokens?: number;
    accuracy?: number;
}
```
