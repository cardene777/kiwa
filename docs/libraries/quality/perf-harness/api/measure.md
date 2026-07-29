---
title: "@kiwa-lab/perf-harness measure の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>measure</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildMeasureResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L110) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function buildMeasureResult(name: string, iterations: number, warmup: number, samples: number[], trimPercent?: number, warmupConverged?: boolean): MeasureResult;
```

#### <code v-pre>measure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L13) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function measure(input: MeasureInput): Promise<MeasureResult>;
```

#### <code v-pre>measureHarnessResolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L63) <code v-pre>packages/perf-harness/src/measure.ts</code>

この測定系が op に帰属できる最小の差 (ms) を実測する。 何もしない関数を `measure` と同じ経路 (async 関数を await する) で呼び、 その p10 を返す。 得られる値は op の中身と無関係な往復の費用そのもので、 これより小さい差を 実装の変化として読むことはできない。 回帰判定の絶対下限に固定値を置かないのはこのため。 妥当な値は機械と Node の版で 変わるので、 比較する実行の中で測って渡す。

```ts
export declare function measureHarnessResolution(input?: {
    iterations?: number;
    warmup?: number;
}): Promise<number>;
```


