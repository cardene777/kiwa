---
title: "@kiwa-lab/nextjs semantics__parallel-routes-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics&#95;&#95;parallel-routes-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureParallelError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L62) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function captureParallelError(session: ParallelRoutesAdvancedSession, input: {
    slot: string;
    error: Error | string;
}): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>navigateSlot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L77) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function navigateSlot(session: ParallelRoutesAdvancedSession, input: {
    slot: string;
    from: string;
    to: string;
}): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>renderDefaultSlot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L38) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function renderDefaultSlot(session: ParallelRoutesAdvancedSession, slot: string, html: string): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>renderLoadingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L49) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function renderLoadingState(session: ParallelRoutesAdvancedSession, slot: string): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>startParallelRoutesAdvanced</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L20) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function startParallelRoutesAdvanced(input: {
    target: NextTarget;
    layoutId: string;
}): ParallelRoutesAdvancedSession;
```

### 型

#### <code v-pre>ParallelRoutesAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L10) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export interface ParallelRoutesAdvancedSession {
    target: NextTarget;
    layoutId: string;
    state: ParallelRoutesAdvancedState;
    slots: Map<string, string>;
    loadingSlots: Set<string>;
    errors: Array<{
        slot: string;
        message: string;
    }>;
    history: AxisStep<ParallelRoutesAdvancedState>[];
}
```

#### <code v-pre>ParallelRoutesAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L3) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export type ParallelRoutesAdvancedState = 'idle' | 'default-rendered' | 'loading-rendered' | 'error-captured' | 'slot-navigated';
```
