---
title: "@kiwa-lab/edge semantics__middleware-chain の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;middleware-chain</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L129) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Complete the chain after every stage has been entered (or after the final stage). Emits `middleware.completed` with the total stage count.

```ts
export declare function completeMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState>;
```

#### <code v-pre>enterMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L44) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Enter the next stage. Emits `middleware.entered` and transitions to `running`. Rejects if the chain has already short-circuited or completed.

```ts
export declare function enterMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState>;
```

#### <code v-pre>rewriteRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L73) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Rewrite the URL/request within the current stage (e.g. locale prefix, a/b split). Records the rewritten URL and emits `middleware.rewritten`.

```ts
export declare function rewriteRequest(session: MiddlewareSession, input: {
    url: string;
}): AxisStep<MiddlewareState>;
```

#### <code v-pre>shortCircuit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L101) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Short-circuit the chain (auth reject, cache hit, terminating rewrite). Transitions to `short-circuited` and emits `middleware.short-circuited`. Downstream stages are not invoked.

```ts
export declare function shortCircuit(session: MiddlewareSession, input: {
    reason: string;
}): AxisStep<MiddlewareState>;
```

#### <code v-pre>startMiddlewareChain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L27) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Open a middleware chain over the given ordered stages. The chain begins `idle` and needs an explicit `enterMiddleware` call per stage.

```ts
export declare function startMiddlewareChain(input: {
    platform: EdgePlatform;
    stages: MiddlewareStage[];
}): MiddlewareSession;
```

### 型

#### <code v-pre>MiddlewareSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L14) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

```ts
export interface MiddlewareSession {
    platform: EdgePlatform;
    stages: MiddlewareStage[];
    currentIndex: number;
    state: MiddlewareState;
    history: AxisStep<MiddlewareState>[];
    rewrittenUrl?: string;
}
```

#### <code v-pre>MiddlewareStage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L12) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

```ts
export type MiddlewareStage = 'auth' | 'rewrite' | 'cache' | 'transform';
```

#### <code v-pre>MiddlewareState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L10) <code v-pre>packages/edge/src/semantics/middleware-chain.ts</code>

Middleware chain axis — edge runtime middleware pipeline (auth → rewrite → cache → transform). Each middleware can pass, rewrite, short-circuit (return without invoking downstream), or complete. The chain preserves order so downstream tests can assert the exact sequence of stages executed.

```ts
export type MiddlewareState = 'idle' | 'running' | 'short-circuited' | 'completed';
```
