---
title: "@kiwa-lab/observability flaky の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/observability</code> <code v-pre>flaky</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>detectFlaky</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L11) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export declare function detectFlaky(opts: DetectFlakyOptions): FlakyTest[];
```

### 型

#### <code v-pre>DetectFlakyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/observability/src/flaky.ts#L3) <code v-pre>packages/observability/src/flaky.ts</code>

```ts
export interface DetectFlakyOptions {
    history: RunHistory;
    /** Minimum number of runs before a test is eligible for flaky scoring */
    minRuns?: number;
    /** Failure rate threshold; tests with 0 < rate < 1 are flaky; tests above this are reported */
    threshold?: number;
}
```
