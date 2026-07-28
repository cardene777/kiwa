---
title: "@kiwa-lab/solidjs route の API 契約"
---

# <code v-pre>@kiwa-lab/solidjs</code> <code v-pre>route</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>ERROR&#95;BOUNDARY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L29) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export declare const ERROR_BOUNDARY_SYMBOL: unique symbol;
```

#### <code v-pre>errorBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L207) <code v-pre>packages/solidjs/src/route.ts</code>

Wrap a component in a Solid-shaped `&lt;ErrorBoundary fallback={err =&gt; ...}&gt;` so a throw in the body materializes the fallback tree instead of bubbling.

```ts
export declare function errorBoundary(opts: ErrorBoundaryOptions): SolidChild | ErrorBoundarySignal;
```

#### <code v-pre>invokeSolidRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L117) <code v-pre>packages/solidjs/src/route.ts</code>

Run a SolidStart-shaped route: awaits the loader (if any), invokes the page component with `{ params, query, data }`, and captures redirect / not-found signals that either the loader or the page body throws.

```ts
export declare function invokeSolidRoute<TData>(opts: InvokeSolidRouteOptions<TData>): Promise<InvokeSolidRouteResult<TData>>;
```

#### <code v-pre>isErrorBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L229) <code v-pre>packages/solidjs/src/route.ts</code>

Type guard: recognize an ErrorBoundary signal.

```ts
export declare function isErrorBoundary(value: unknown): value is ErrorBoundarySignal;
```

#### <code v-pre>isSuspenseBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L220) <code v-pre>packages/solidjs/src/route.ts</code>

Type guard: recognize a Suspense boundary signal.

```ts
export declare function isSuspenseBoundary(value: unknown): value is SuspenseBoundarySignal<unknown>;
```

#### <code v-pre>notFound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L108) <code v-pre>packages/solidjs/src/route.ts</code>

Throw this from a route loader / page body to signal a 404.

```ts
export declare function notFound(): SolidRouteNotFoundSignal;
```

#### <code v-pre>redirect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L103) <code v-pre>packages/solidjs/src/route.ts</code>

Throw this from a route loader / page body to signal a redirect.

```ts
export declare function redirect(url: string, status?: number): SolidRouteRedirectSignal;
```

#### <code v-pre>renderWithSuspense</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L159) <code v-pre>packages/solidjs/src/route.ts</code>

Model a `&lt;Suspense fallback={...}&gt;{component}&lt;/Suspense&gt;` boundary. First mounts the fallback (matching Solid's first-render behavior when a resource is still pending), awaits `waitFor`, then remounts the real component and records both trees in a boundary signal.

```ts
export declare function renderWithSuspense<T>(opts: RenderWithSuspenseOptions<T>): Promise<SuspenseBoundarySignal<T> & {
    component: RenderSolidResult;
    fallbackResult: RenderSolidResult;
}>;
```

#### <code v-pre>SOLID&#95;NOT&#95;FOUND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L27) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export declare const SOLID_NOT_FOUND_SYMBOL: unique symbol;
```

#### <code v-pre>SOLID&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L26) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export declare const SOLID_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>SUSPENSE&#95;BOUNDARY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L28) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export declare const SUSPENSE_BOUNDARY_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>ErrorBoundaryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L198) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface ErrorBoundaryOptions {
    readonly component: SolidComponent<Record<string, unknown>>;
    readonly fallback: (error: unknown) => SolidChild;
}
```

#### <code v-pre>ErrorBoundarySignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L49) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface ErrorBoundarySignal {
    readonly [ERROR_BOUNDARY_SYMBOL]: true;
    readonly caught: unknown;
    readonly fallback: SolidChild;
}
```

#### <code v-pre>InvokeSolidRouteOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L71) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface InvokeSolidRouteOptions<TData> {
    readonly page: SolidComponent<RouteSectionProps<TData>>;
    readonly load?: RouteLoader<TData>;
    readonly params?: RouteParams;
    readonly query?: RouteQuery;
}
```

#### <code v-pre>InvokeSolidRouteResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L78) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface InvokeSolidRouteResult<TData> {
    readonly tree: SolidChild | null;
    readonly data: TData | undefined;
    readonly redirect: SolidRouteRedirectSignal | null;
    readonly notFound: SolidRouteNotFoundSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>RenderWithSuspenseOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L145) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface RenderWithSuspenseOptions<T> {
    readonly component: SolidComponent<Record<string, unknown>>;
    readonly fallback: SolidComponent<Record<string, unknown>> | SolidChild;
    readonly waitFor: Promise<T>;
    /** ms before the boundary reports `timedOut: true`; default 5000. */
    readonly timeoutMs?: number;
}
```

#### <code v-pre>RouteLoader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L69) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export type RouteLoader<TData> = (ctx: {
    params: RouteParams;
    query: RouteQuery;
}) => Promise<TData> | TData;
```

#### <code v-pre>RouteParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L55) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface RouteParams {
    readonly [key: string]: string | undefined;
}
```

#### <code v-pre>RouteQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L59) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface RouteQuery {
    readonly [key: string]: string | undefined;
}
```

#### <code v-pre>RouteSectionProps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L63) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface RouteSectionProps<TData = unknown> {
    readonly params: RouteParams;
    readonly query: RouteQuery;
    readonly data: TData | undefined;
}
```

#### <code v-pre>SolidRouteNotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L37) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface SolidRouteNotFoundSignal {
    readonly [SOLID_NOT_FOUND_SYMBOL]: true;
}
```

#### <code v-pre>SolidRouteRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L31) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface SolidRouteRedirectSignal {
    readonly [SOLID_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### <code v-pre>SuspenseBoundarySignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L41) <code v-pre>packages/solidjs/src/route.ts</code>

```ts
export interface SuspenseBoundarySignal<T> {
    readonly [SUSPENSE_BOUNDARY_SYMBOL]: true;
    readonly fallback: SolidChild;
    readonly resolved: SolidChild | null;
    readonly waitedFor: Promise<T>;
    readonly timedOut: boolean;
}
```
