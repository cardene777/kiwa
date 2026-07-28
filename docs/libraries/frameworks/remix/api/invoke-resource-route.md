---
title: "@kiwa-lab/remix invoke-resource-route の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/remix</code> <code v-pre>invoke-resource-route</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeResourceRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L76) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

Resource Route dispatcher — picks `loader` for GET/HEAD and `action` for POST/PUT/PATCH/DELETE. Method is required (no implicit default) because Resource Routes intentionally rely on HTTP semantics to choose behavior. Methods not implemented by the route module return a 405 Response and a branded `methodNotAllowed` signal so tests can assert dispatch behavior without conflating it with the route's own 4xx responses.

```ts
export declare function invokeResourceRoute(opts: InvokeResourceRouteOptions): Promise<InvokeResourceRouteResult>;
```

#### <code v-pre>RESOURCE&#95;ROUTE&#95;METHOD&#95;NOT&#95;ALLOWED&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L25) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export declare const RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>InvokeResourceRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L38) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface InvokeResourceRouteOptions {
    readonly route: ResourceRouteModule;
    readonly url: string;
    readonly method: string;
    readonly params?: Record<string, string>;
    readonly context?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
}
```

#### <code v-pre>InvokeResourceRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L49) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface InvokeResourceRouteResult extends InvokeRouteResult {
    readonly dispatch: 'loader' | 'action' | 'method-not-allowed';
    readonly methodNotAllowed: ResourceRouteMethodNotAllowedSignal | null;
}
```

#### <code v-pre>ResourceRouteMethodNotAllowedSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L27) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface ResourceRouteMethodNotAllowedSignal {
    readonly [RESOURCE_ROUTE_METHOD_NOT_ALLOWED_SYMBOL]: true;
    readonly method: string;
    readonly allow: ReadonlyArray<'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
}
```

#### <code v-pre>ResourceRouteModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-resource-route.ts#L33) <code v-pre>packages/remix/src/invoke-resource-route.ts</code>

```ts
export interface ResourceRouteModule {
    readonly loader?: LoaderFunction;
    readonly action?: ActionFunction;
}
```
