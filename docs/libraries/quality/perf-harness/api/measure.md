---
title: "@kiwa-lab/perf-harness measure の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>measure</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildMeasureResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L82) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function buildMeasureResult(name: string, iterations: number, warmup: number, samples: number[], trimPercent?: number, warmupConverged?: boolean): MeasureResult;
```

#### <code v-pre>measure</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L13) <code v-pre>packages/perf-harness/src/measure.ts</code>

```ts
export declare function measure(input: MeasureInput): Promise<MeasureResult>;
```


