---
title: "@kiwa-lab/perf-harness report の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>report</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/report.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>emitPerfReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/report.ts#L3) <code v-pre>packages/perf-harness/src/report.ts</code>

```ts
export declare function emitPerfReport(result: MeasureResult, opts?: {
    baseline?: MeasureResult;
    includeSamples?: boolean;
    /**
     * 今回の値を baseline を測った時の機械の速さへ換算する倍率
     * (`RegressionResult.normalizationScale`)。 既定 1 = 換算しない。
     *
     * 渡さないと、 この表だけが実測値どうしを比べることになる。 回帰判定は換算後の
     * 値を読むため、 同じ report の中で verdict が `regressed` の行に改善を示す
     * 差分が並ぶ (実測 +15.6% / 換算後 +23% のように符号ごと食い違う場合がある)。
     */
    normalizationScale?: number;
}): string;
```


