---
title: "@kiwa-lab/component semantics-streaming-ssr の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics-streaming-ssr</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureErrorBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L48) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export declare function captureErrorBoundary(session: StreamingSsrSession, input: {
    boundaryId: string;
    error: Error | string;
    recoverable?: boolean;
}): AxisStep<StreamingSsrState>;
```

#### <code v-pre>completeSelectiveHydration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L78) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export declare function completeSelectiveHydration(session: StreamingSsrSession, boundaryId: string): AxisStep<StreamingSsrState>;
```

#### <code v-pre>markSuspensePending</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L38) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export declare function markSuspensePending(session: StreamingSsrSession, boundaryId: string): AxisStep<StreamingSsrState>;
```

#### <code v-pre>startProgressiveHydration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L66) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export declare function startProgressiveHydration(session: StreamingSsrSession, boundaryId: string): AxisStep<StreamingSsrState>;
```

#### <code v-pre>startStreamingSsr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L20) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export declare function startStreamingSsr(input: {
    target: ComponentTarget;
    routeId: string;
}): StreamingSsrSession;
```

### 型

#### <code v-pre>StreamingSsrSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L10) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export interface StreamingSsrSession {
    target: ComponentTarget;
    routeId: string;
    state: StreamingSsrState;
    pendingBoundaries: Set<string>;
    hydratedBoundaries: Set<string>;
    errors: Array<{
        boundaryId: string;
        message: string;
    }>;
    history: AxisStep<StreamingSsrState>[];
}
```

#### <code v-pre>StreamingSsrState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L3) <code v-pre>packages/component/src/semantics/streaming-ssr.ts</code>

```ts
export type StreamingSsrState = 'idle' | 'suspense-pending' | 'error-captured' | 'progressive-hydrating' | 'selective-hydrated';
```
