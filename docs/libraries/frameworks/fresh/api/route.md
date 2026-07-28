---
title: "@kiwa-lab/fresh route の API 契約"
---

# <code v-pre>@kiwa-lab/fresh</code> <code v-pre>route</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>defineRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L449) <code v-pre>packages/fresh/src/route.ts</code>

Wrap a page fn so it registers as a Fresh-defined route (brand + passthrough).

```ts
export declare function defineRoute<TData = unknown, TState = Record<string, unknown>>(fn: DefineRouteFn<TData, TState>): DefinedRoute<TData, TState>;
```

#### <code v-pre>findNodes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L170) <code v-pre>packages/fresh/src/route.ts</code>

Depth-first traversal of a Fresh virtual tree. Collects every node whose `type` matches the predicate; strings / numbers / nulls are skipped.

```ts
export declare function findNodes(tree: FreshChild, predicate: (n: FreshVNode) => boolean): FreshVNode[];
```

#### <code v-pre>FRESH&#95;NOT&#95;FOUND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L29) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export declare const FRESH_NOT_FOUND_SYMBOL: unique symbol;
```

#### <code v-pre>FRESH&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L28) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export declare const FRESH_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>FRESH&#95;ROUTE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L30) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export declare const FRESH_ROUTE_SYMBOL: unique symbol;
```

#### <code v-pre>h</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L98) <code v-pre>packages/fresh/src/route.ts</code>

Lightweight JSX-shaped element factory. Tests write `h('div', { class: 'x' }, 'hello')` and pass the result to a Fresh route or Island.

```ts
export declare function h(type: string, props: Record<string, unknown> | null, ...children: FreshChild[]): FreshVNode;
```

#### <code v-pre>invokeDefineRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L485) <code v-pre>packages/fresh/src/route.ts</code>

Run a `defineRoute`-wrapped page. Synthesizes a minimal `ctx` (params / url / state / render is a no-op returning 200) and captures redirect / not-found signals the body throws.

```ts
export declare function invokeDefineRoute<TData = unknown, TState = Record<string, unknown>>(opts: InvokeDefineRouteOptions<TData, TState>): Promise<InvokeDefineRouteResult>;
```

#### <code v-pre>invokeFreshHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L266) <code v-pre>packages/fresh/src/route.ts</code>

Dispatch a Fresh handler for the given `req.method`. If the handler returns a `Response` directly, that's the result. If the handler calls `ctx.render(data)`, we capture `data`, optionally invoke `page(props)` to materialize the tree, and synthesize a 200 HTML response. If the handler calls `ctx.renderNotFound()` / `ctx.redirect(...)`, the corresponding signal fields on the result are populated.

```ts
export declare function invokeFreshHandler<TData = unknown, TState = Record<string, unknown>>(opts: InvokeFreshHandlerOptions<TData, TState>): Promise<InvokeFreshHandlerResult<TData>>;
```

#### <code v-pre>isDefinedRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L456) <code v-pre>packages/fresh/src/route.ts</code>

Type guard: recognize a `defineRoute()`-wrapped page.

```ts
export declare function isDefinedRoute<TData, TState>(value: unknown): value is DefinedRoute<TData, TState>;
```

#### <code v-pre>isFreshVNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L111) <code v-pre>packages/fresh/src/route.ts</code>

Type guard: recognize a Fresh virtual node (used by walkers + tests).

```ts
export declare function isFreshVNode(value: unknown): value is FreshVNode;
```

#### <code v-pre>isNotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L74) <code v-pre>packages/fresh/src/route.ts</code>

Type guard: recognize a Fresh not-found signal (mirrors the internal check).

```ts
export declare function isNotFoundSignal(value: unknown): value is FreshNotFoundSignal;
```

#### <code v-pre>isRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L69) <code v-pre>packages/fresh/src/route.ts</code>

Type guard: recognize a Fresh redirect signal (mirrors the internal check).

```ts
export declare function isRedirectSignal(value: unknown): value is FreshRedirectSignal;
```

#### <code v-pre>notFound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L48) <code v-pre>packages/fresh/src/route.ts</code>

Throw this from a Fresh handler or a defineRoute page body to signal a 404.

```ts
export declare function notFound(): FreshNotFoundSignal;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L43) <code v-pre>packages/fresh/src/route.ts</code>

Throw this from a Fresh handler or a defineRoute page body to signal a redirect.

```ts
export declare function redirect(location: string, status?: number): FreshRedirectSignal;
```

#### <code v-pre>stringify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L125) <code v-pre>packages/fresh/src/route.ts</code>

Recursively serialize a Fresh virtual tree into an HTML string. Boolean attributes render as bare keys, `null` / `undefined` / `false` skip, and children are stringified without any XSS escaping — tests assert on shape, not on production output. Void elements (matching the HTML5 spec list) render as self-closing (`&lt;br /&gt;` / `&lt;meta ... /&gt;` / etc.) rather than `&lt;br&gt;&lt;/br&gt;` so `head.ts` can emit spec-shaped `&lt;meta&gt;` / `&lt;link&gt;` tags.

```ts
export declare function stringify(node: FreshChild): string;
```

### 型

#### <code v-pre>DefinedRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L443) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface DefinedRoute<TData, TState> {
    readonly [FRESH_ROUTE_SYMBOL]: true;
    readonly fn: DefineRouteFn<TData, TState>;
}
```

#### <code v-pre>DefineRouteFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L438) <code v-pre>packages/fresh/src/route.ts</code>

`defineRoute&lt;T&gt;(fn)` mirrors Fresh's route wrapper. The returned brand lets `invokeDefineRoute` recognize the value; the handler itself just proxies to `fn(req, ctx)`.

```ts
export type DefineRouteFn<TData, TState> = (req: Request, ctx: FreshHandlerContext<TState>) => FreshChild | Promise<FreshChild>;
```

#### <code v-pre>FreshChild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L91) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export type FreshChild = FreshVNode | string | number | boolean | null | undefined | FreshChild[];
```

#### <code v-pre>FreshHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L216) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export type FreshHandler<TData = unknown, TState = Record<string, unknown>> = (req: Request, ctx: FreshHandlerContext<TState>) => Response | Promise<Response> | TData | Promise<TData>;
```

#### <code v-pre>FreshHandlerContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L205) <code v-pre>packages/fresh/src/route.ts</code>

`HandlerContext&lt;S&gt;` shrinks Fresh's `ctx` to what tests observe: `render` to hand data to the page component, `renderNotFound` / `redirect` for direct 404 / 302 responses, and `next()` returning a 404 shape used by fall-through handlers. `state` is a mutable per-request bag matching Fresh's middleware→handler contract.

```ts
export interface FreshHandlerContext<TState = Record<string, unknown>> {
    readonly params: FreshRouteParams;
    readonly url: URL;
    readonly route: string;
    readonly state: TState;
    readonly render: <TData>(data?: TData, init?: ResponseInit) => Response;
    readonly renderNotFound: () => Response;
    readonly redirect: (location: string, status?: number) => Response;
    readonly next: () => Promise<Response>;
}
```

#### <code v-pre>FreshHandlers</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L226) <code v-pre>packages/fresh/src/route.ts</code>

`Handlers&lt;T, S&gt;` — Fresh's `export const handler` shape. Each optional method key maps to a handler for that HTTP method; missing methods fall through to a `405 Method Not Allowed` response.

```ts
export type FreshHandlers<TData = unknown, TState = Record<string, unknown>> = Partial<Record<FreshHttpMethod, FreshHandler<TData, TState>>>;
```

#### <code v-pre>FreshHttpMethod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L78) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export type FreshHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

#### <code v-pre>FreshNotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L38) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface FreshNotFoundSignal {
    readonly [FRESH_NOT_FOUND_SYMBOL]: true;
}
```

#### <code v-pre>FreshPageProps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L190) <code v-pre>packages/fresh/src/route.ts</code>

`PageProps&lt;T&gt;` mirrors Fresh's page component props. `data` is what the handler passed to `ctx.render(data)`, and `params` / `url` / `route` / `state` come from the router.

```ts
export interface FreshPageProps<TData = unknown, TState = Record<string, unknown>> {
    readonly url: URL;
    readonly route: string;
    readonly params: FreshRouteParams;
    readonly state: TState;
    readonly data: TData | undefined;
}
```

#### <code v-pre>FreshRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L32) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface FreshRedirectSignal {
    readonly [FRESH_REDIRECT_SYMBOL]: true;
    readonly location: string;
    readonly status: number;
}
```

#### <code v-pre>FreshRouteParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L80) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface FreshRouteParams {
    readonly [key: string]: string | undefined;
}
```

#### <code v-pre>FreshVNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L85) <code v-pre>packages/fresh/src/route.ts</code>

JSX-shaped virtual node returned by a Fresh route or Island.

```ts
export interface FreshVNode {
    readonly type: string;
    readonly props: Record<string, unknown>;
    readonly children: FreshChild[];
}
```

#### <code v-pre>InvokeDefineRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L464) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface InvokeDefineRouteOptions<TData, TState> {
    readonly route: DefinedRoute<TData, TState> | DefineRouteFn<TData, TState>;
    readonly req: Request;
    readonly params?: FreshRouteParams;
    readonly state?: TState;
    readonly path?: string;
}
```

#### <code v-pre>InvokeDefineRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L472) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface InvokeDefineRouteResult {
    readonly tree: FreshChild | null;
    readonly redirect: FreshRedirectSignal | null;
    readonly notFound: FreshNotFoundSignal | null;
    readonly error: unknown;
    readonly html: string;
}
```

#### <code v-pre>InvokeFreshHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L230) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface InvokeFreshHandlerOptions<TData, TState> {
    readonly handlers: FreshHandlers<TData, TState> | FreshHandler<TData, TState>;
    readonly req: Request;
    readonly params?: FreshRouteParams;
    readonly state?: TState;
    readonly route?: string;
    /**
     * Optional page component invoked when the handler calls `ctx.render(data)`.
     * Tests that only care about the HTTP response can omit this.
     */
    readonly page?: (props: FreshPageProps<TData, TState>) => FreshChild;
}
```

#### <code v-pre>InvokeFreshHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L243) <code v-pre>packages/fresh/src/route.ts</code>

```ts
export interface InvokeFreshHandlerResult<TData> {
    readonly response: Response;
    readonly renderData: TData | undefined;
    readonly page: FreshChild | null;
    readonly redirect: FreshRedirectSignal | null;
    readonly notFound: FreshNotFoundSignal | null;
    readonly error: unknown;
}
```
