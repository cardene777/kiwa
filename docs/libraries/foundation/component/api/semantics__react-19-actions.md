---
title: "@kiwa-lab/component semantics__react-19-actions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics&#95;&#95;react-19-actions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>beginActionTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L63) <code v-pre>packages/component/src/semantics/react-19-actions.ts</code>

```ts
export declare function beginActionTransition(session: ReactActionsSession): AxisStep<ReactActionsState>;
```

#### <code v-pre>initializeReactActions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L43) <code v-pre>packages/component/src/semantics/react-19-actions.ts</code>

```ts
export declare function initializeReactActions(input: {
    target: ComponentTarget;
    actionId: string;
}): ReactActionsSession;
```

#### <code v-pre>resolveAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L88) <code v-pre>packages/component/src/semantics/react-19-actions.ts</code>

```ts
export declare function resolveAction(session: ReactActionsSession, resolvedValue: string): AxisStep<ReactActionsState>;
```

### 型

#### <code v-pre>ReactActionsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L13) <code v-pre>packages/component/src/semantics/react-19-actions.ts</code>

```ts
export interface ReactActionsSession {
    target: ComponentTarget;
    actionId: string;
    state: ReactActionsState;
    pendingCount: number;
    optimisticValues: string[];
    resolvedValue: string | null;
    history: AxisStep<ReactActionsState>[];
}
```

#### <code v-pre>ReactActionsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L7) <code v-pre>packages/component/src/semantics/react-19-actions.ts</code>

v1.49 react-19-actions axis — useActionState + useOptimistic + useFormStatus を統合した React 19 Actions API の deterministic state machine。

```ts
export type ReactActionsState = 'idle' | 'transition-pending' | 'optimistic-committed' | 'resolved';
```
