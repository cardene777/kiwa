---
title: "@kiwa-lab/perf-harness measure の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>measure</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildMeasureResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L208) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function buildMeasureResult(name: string, iterations: number, warmup: number, samples: number[], trimPercent?: number, warmupConverged?: boolean): MeasureResult;
```

#### <code v-pre>measure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L14) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function measure(input: MeasureInput): Promise<MeasureResult>;
```

#### <code v-pre>measureAlternating</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L95) <code v-pre>packages/perf-harness/src/measure.ts</code>

対象と基準を 1 呼出ずつ交互に測る。 まとめて測ると、 実行の中のどの時点で測られたかが対象と基準で変わる。 実行内のずれまで分母に入れるには、 2 つを隣り合わせて測る必要がある。 順序は毎回「基準 → 対象」 で固定する。 直前に何が動いたかで費用が変わる (実測で fs op の p10 が直前の op 次第で 2 倍動いた) ため、 順序が実行ごとに 変わると比にその差が乗る。

```ts
export declare function measureAlternating(input: MeasureAlternatingInput): Promise<AlternatingMeasureResult>;
```

#### <code v-pre>measureHarnessResolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L161) <code v-pre>packages/perf-harness/src/measure.ts</code>

この測定系が op に帰属できる最小の差 (ms) を実測する。 何もしない関数を `measure` と同じ経路 (async 関数を await する) で呼び、 その p10 を返す。 得られる値は op の中身と無関係な往復の費用そのもので、 これより小さい差を 実装の変化として読むことはできない。 回帰判定の絶対下限に固定値を置かないのはこのため。 妥当な値は機械と Node の版で 変わるので、 比較する実行の中で測って渡す。

```ts
export declare function measureHarnessResolution(input?: {
    iterations?: number;
    warmup?: number;
}): Promise<number>;
```

### 型

#### <code v-pre>AlternatingMeasureResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L73) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
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
```

#### <code v-pre>MeasureAlternatingInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L54) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
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
```
