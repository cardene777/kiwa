---
title: "@kiwa-lab/chart observability の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>observability</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L19) <code v-pre>packages/chart/src/observability.ts</code>

render 動作を metric として emit、 downstream (Datadog / OTel / console) に渡す hook 経路。 real chart lib の performance measurement 相当。

```ts
export declare function withObservability<T>(fn: () => T, hook: ObservabilityHook, context: {
    operation: string;
    provider: string;
    seriesCount: number;
    now?: () => number;
}): T;
```

### 型

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L10) <code v-pre>packages/chart/src/observability.ts</code>

```ts
export interface ObservabilityHook {
    onRender?: (metric: RenderMetric) => void;
    onError?: (error: Error, context: Record<string, unknown>) => void;
}
```

#### <code v-pre>RenderMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L1) <code v-pre>packages/chart/src/observability.ts</code>

```ts
export interface RenderMetric {
    operation: string;
    provider: string;
    durationMs: number;
    seriesCount: number;
    timestamp: number;
    status: 'ok' | 'error';
}
```
