---
title: "@kiwa-lab/component semantics__view-transitions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics&#95;&#95;view-transitions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertAnimation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L77) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export declare function assertAnimation(session: ViewTransitionSession, input: {
    assertionId: string;
    durationMs: number;
    easing?: string;
}): AxisStep<ViewTransitionState>;
```

#### <code v-pre>finishElementTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L50) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export declare function finishElementTransition(session: ViewTransitionSession, elementId: string): AxisStep<ViewTransitionState>;
```

#### <code v-pre>startDocumentTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L65) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export declare function startDocumentTransition(session: ViewTransitionSession, input: {
    name: string;
    fromUrl: string;
    toUrl: string;
}): AxisStep<ViewTransitionState>;
```

#### <code v-pre>startElementTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L38) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export declare function startElementTransition(session: ViewTransitionSession, input: {
    elementId: string;
    from: string;
    to: string;
}): AxisStep<ViewTransitionState>;
```

#### <code v-pre>startViewTransitionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L20) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export declare function startViewTransitionSession(input: {
    target: ComponentTarget;
    transitionId: string;
}): ViewTransitionSession;
```

### 型

#### <code v-pre>ViewTransitionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L10) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export interface ViewTransitionSession {
    target: ComponentTarget;
    transitionId: string;
    state: ViewTransitionState;
    activeElements: Set<string>;
    documentTransition: string | null;
    assertions: string[];
    history: AxisStep<ViewTransitionState>[];
}
```

#### <code v-pre>ViewTransitionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L3) <code v-pre>packages/component/src/semantics/view-transitions.ts</code>

```ts
export type ViewTransitionState = 'idle' | 'element-transitioning' | 'document-transitioning' | 'asserted' | 'finished';
```
