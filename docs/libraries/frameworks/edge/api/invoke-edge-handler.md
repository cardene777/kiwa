---
title: "@kiwa-lab/edge invoke-edge-handler の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>invoke-edge-handler</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeEdgeHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L92) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

Invoke an edge runtime fetch handler in isolation and capture the returned Response + ExecutionContext side effects. The caller supplies `env` so KV / R2 / vars stay explicit in each test (no global state).

```ts
export declare function invokeEdgeHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings>(opts: InvokeEdgeHandlerOptions<TEnv>): Promise<InvokeEdgeHandlerResult>;
```

### 型

#### <code v-pre>EdgeEnvBindings</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L19) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

```ts
export interface EdgeEnvBindings {
    readonly [bindingName: string]: KVNamespace | Record<string, unknown> | string | undefined;
}
```

#### <code v-pre>EdgeFetchHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L23) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

```ts
export type EdgeFetchHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings> = (request: Request, env: TEnv, ctx: SimulatedExecutionContext) => Promise<Response> | Response;
```

#### <code v-pre>InvokeEdgeHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L29) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

```ts
export interface InvokeEdgeHandlerOptions<TEnv extends EdgeEnvBindings = EdgeEnvBindings> {
    readonly handler: EdgeFetchHandler<TEnv>;
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
    readonly env: TEnv;
}
```

#### <code v-pre>InvokeEdgeHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L39) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

```ts
export interface InvokeEdgeHandlerResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
    readonly ctx: SimulatedExecutionContext;
    readonly error: unknown;
}
```

#### <code v-pre>SimulatedExecutionContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L12) <code v-pre>packages/edge/src/invoke-edge-handler.ts</code>

```ts
export interface SimulatedExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
    readonly waitedPromises: Promise<unknown>[];
    passThroughCalled: boolean;
}
```
