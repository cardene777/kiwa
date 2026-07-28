---
title: "@kiwa-lab/nextjs semantics__concurrent-transitions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics&#95;&#95;concurrent-transitions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>commitTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L91) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function commitTransition(session: ConcurrentTransitionSession, committedValue: string): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>interruptTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L78) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function interruptTransition(session: ConcurrentTransitionSession): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>markTransitionPending</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L65) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function markTransitionPending(session: ConcurrentTransitionSession): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>startConcurrentTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L45) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function startConcurrentTransition(input: {
    target: NextTarget;
    transitionId: string;
}): ConcurrentTransitionSession;
```

### 型

#### <code v-pre>ConcurrentTransitionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L15) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export interface ConcurrentTransitionSession {
    target: NextTarget;
    transitionId: string;
    interruptions: number;
    pendingCount: number;
    state: ConcurrentTransitionState;
    committedValue: string | null;
    history: AxisStep<ConcurrentTransitionState>[];
}
```

#### <code v-pre>ConcurrentTransitionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L8) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

v1.49 concurrent-transitions axis — React 18/19 concurrent features (startTransition + useTransition + useDeferredValue) を target-neutral に 扱う state machine。 interrupt-and-restart semantics も含む。

```ts
export type ConcurrentTransitionState = 'idle' | 'started' | 'pending' | 'interrupted' | 'committed';
```
