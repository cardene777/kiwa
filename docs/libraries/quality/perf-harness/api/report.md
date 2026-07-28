---
title: "@kiwa-lab/perf-harness report の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>report</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/report.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>emitPerfReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/report.ts#L3) <code v-pre>packages/perf-harness/src/report.ts</code>

```ts
export declare function emitPerfReport(result: MeasureResult, opts?: {
    baseline?: MeasureResult;
    includeSamples?: boolean;
}): string;
```


