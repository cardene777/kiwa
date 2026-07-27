# solidjs リファレンス

## 公開 API

`mockSignal`、`mockEffect`、`batch`、`track` は状態依存を扱います。`createResourceStub` は pending、ready、errored、refreshing を扱います。`renderSolid`、`hydrate`、`createRoot`、`h` は軽量 tree を扱います。`invokeSolidRoute`、`renderWithSuspense`、`errorBoundary` は route と failure boundary を扱います。

## 設定

route は page、load、params、query を受け取ります。Suspense は component、fallback、`waitFor`、`timeoutMs` を受け取ります。timeout 時は resolved が `null` です。

## 結果の分岐

Signal の値、Effect の観測、Resource の pending と error は別の状態です。route の redirect は通常 response と異なるシグナルなので、表示結果だけで判定しません。

`renderWithSuspense` は fallback tree、resolved tree、timeout 状態を返します。timeout 時の resolved は null です。`errorBoundary` は component の throw を fallback と caught error を持つ signal にします。いずれも実 streaming や hydration を実行しません。

## 後始末と制約

effect と root の `dispose` を呼びます。これは Solid の実 owner tree やブラウザ hydration を再現せず、軽量 tree と signal の依存関係を扱います。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L168) `packages/solidjs/src/signal.ts`

Group multiple signal writes so subscribed effects run at most once for the whole batch (dedup via Set). Matches Solid's `batch()` semantics for tests.

```ts
export declare function batch<T>(fn: () => T): T;
```

#### `createResourceStub`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L193) `packages/solidjs/src/signal.ts`

Mock Solid's `createResource(fetcher)` — awaits the fetcher, exposes `resource()` accessor + `resource.state` + `refetch()` + `mutate()`. Tests can drive the resource lifecycle explicitly without racing against a real async runtime.

```ts
export declare function createResourceStub<T>(fetcher: () => Promise<T> | T): ResourceHandle<T>;
```

#### `createRoot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L151) `packages/solidjs/src/render.ts`

Emulate Solid's `createRoot(fn)` — runs `fn(dispose)` inside a fresh effect scope and returns the accumulated dispose handle plus a scope object so tests can assert on `scope.disposed()`.

```ts
export declare function createRoot<T>(fn: (dispose: () => void) => T): {
    result: T;
    scope: RootScope;
    dispose: () => void;
};
```

#### `EFFECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L18) `packages/solidjs/src/signal.ts`

```ts
export declare const EFFECT_SYMBOL: unique symbol;
```

#### `ERROR_BOUNDARY_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L29) `packages/solidjs/src/route.ts`

```ts
export declare const ERROR_BOUNDARY_SYMBOL: unique symbol;
```

#### `errorBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L207) `packages/solidjs/src/route.ts`

Wrap a component in a Solid-shaped `&lt;ErrorBoundary fallback={err =&gt; ...}&gt;` so a throw in the body materializes the fallback tree instead of bubbling.

```ts
export declare function errorBoundary(opts: ErrorBoundaryOptions): SolidChild | ErrorBoundarySignal;
```

#### `findElements`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L212) `packages/solidjs/src/render.ts`

Depth-first traversal of a Solid virtual tree. Collects every element whose `type` matches the predicate; strings / numbers / nulls are skipped.

```ts
export declare function findElements(tree: SolidChild, predicate: (el: SolidElement) => boolean): SolidElement[];
```

#### `h`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L98) `packages/solidjs/src/render.ts`

Lightweight JSX-shaped element factory. Callers can write `h('div', { class: 'x' }, 'hello')` in tests and pass the result to `renderSolid` or return it from a component body.

```ts
export declare function h(type: string, props: Record<string, unknown> | null, ...children: SolidChild[]): SolidElement;
```

#### `hydrate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L135) `packages/solidjs/src/render.ts`

Mount a component in "hydration" mode. Compares the freshly-rendered HTML against `ssrMarkup` and reports whether hydration matched (mirrors Solid's `hydrate()` mismatch warning path).

```ts
export declare function hydrate<TProps>(opts: HydrateOptions<TProps>): HydrateResult;
```

#### `invokeSolidRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L117) `packages/solidjs/src/route.ts`

Run a SolidStart-shaped route: awaits the loader (if any), invokes the page component with `{ params, query, data }`, and captures redirect / not-found signals that either the loader or the page body throws.

```ts
export declare function invokeSolidRoute<TData>(opts: InvokeSolidRouteOptions<TData>): Promise<InvokeSolidRouteResult<TData>>;
```

#### `isEffectHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L242) `packages/solidjs/src/signal.ts`

Type guard: recognize a mockEffect handle.

```ts
export declare function isEffectHandle(value: unknown): value is EffectHandle<unknown>;
```

#### `isErrorBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L229) `packages/solidjs/src/route.ts`

Type guard: recognize an ErrorBoundary signal.

```ts
export declare function isErrorBoundary(value: unknown): value is ErrorBoundarySignal;
```

#### `isResourceAccessor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L251) `packages/solidjs/src/signal.ts`

Type guard: recognize a createResourceStub accessor.

```ts
export declare function isResourceAccessor(value: unknown): value is ResourceAccessor<unknown>;
```

#### `isSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L237) `packages/solidjs/src/signal.ts`

Type guard: recognize a mockSignal getter (used by helpers + tests).

```ts
export declare function isSignal(value: unknown): value is SignalGetter<unknown>;
```

#### `isSolidElement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L200) `packages/solidjs/src/render.ts`

Type guard: recognize a Solid virtual element (used by walkers + tests).

```ts
export declare function isSolidElement(value: unknown): value is SolidElement;
```

#### `isSuspenseBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L220) `packages/solidjs/src/route.ts`

Type guard: recognize a Suspense boundary signal.

```ts
export declare function isSuspenseBoundary(value: unknown): value is SuspenseBoundarySignal<unknown>;
```

#### `mockEffect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L131) `packages/solidjs/src/signal.ts`

Run a Solid-shaped `createEffect(fn)` — the body is invoked immediately and again every time a subscribed signal changes. Every run captures which signal values were read into an ordered trace so tests can assert on the exact sequence of transitions.

```ts
export declare function mockEffect<T>(fn: () => T): EffectHandle<T>;
```

#### `mockSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L81) `packages/solidjs/src/signal.ts`

Create a Solid-shaped Signal without a Solid runtime. Returns `[get, set]` where reading the getter inside a `mockEffect` body subscribes the effect, and writing through the setter re-runs subscribed effects (deduplicated inside `batch()`).

```ts
export declare function mockSignal<T>(initial: T): readonly [SignalGetter<T>, SignalSetter<T>];
```

#### `notFound`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L108) `packages/solidjs/src/route.ts`

Throw this from a route loader / page body to signal a 404.

```ts
export declare function notFound(): SolidRouteNotFoundSignal;
```

#### `popEffectScope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L79) `packages/solidjs/src/render.ts`

Pop the current effect-collection scope and return the collected handles.

```ts
export declare function popEffectScope(): EffectHandle<unknown>[];
```

#### `pushEffectScope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L74) `packages/solidjs/src/render.ts`

Push a fresh effect-collection scope onto the stack. Used internally by `renderSolid` / `createRoot` so any effects registered during the callback are attributed to that scope.

```ts
export declare function pushEffectScope(): void;
```

#### `redirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L103) `packages/solidjs/src/route.ts`

Throw this from a route loader / page body to signal a redirect.

```ts
export declare function redirect(url: string, status?: number): SolidRouteRedirectSignal;
```

#### `registerEffect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L88) `packages/solidjs/src/render.ts`

Register an effect handle with the innermost active scope (if any). Skill tests call this directly after `mockEffect(...)` when they want the effect cleaned up on `dispose()`.

```ts
export declare function registerEffect(handle: EffectHandle<unknown>): void;
```

#### `renderSolid`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L111) `packages/solidjs/src/render.ts`

Mount a Solid component synchronously, capture effects registered during the mount, and expose a `dispose()` handle that tears down every effect.

```ts
export declare function renderSolid<TProps>(opts: RenderSolidOptions<TProps>): RenderSolidResult;
```

#### `renderWithSuspense`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L159) `packages/solidjs/src/route.ts`

Model a `&lt;Suspense fallback={...}&gt;{component}&lt;/Suspense&gt;` boundary. First mounts the fallback (matching Solid's first-render behavior when a resource is still pending), awaits `waitFor`, then remounts the real component and records both trees in a boundary signal.

```ts
export declare function renderWithSuspense<T>(opts: RenderWithSuspenseOptions<T>): Promise<SuspenseBoundarySignal<T> & {
    component: RenderSolidResult;
    fallbackResult: RenderSolidResult;
}>;
```

#### `RESOURCE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L19) `packages/solidjs/src/signal.ts`

```ts
export declare const RESOURCE_SYMBOL: unique symbol;
```

#### `SIGNAL_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L17) `packages/solidjs/src/signal.ts`

```ts
export declare const SIGNAL_SYMBOL: unique symbol;
```

#### `SOLID_ELEMENT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L28) `packages/solidjs/src/render.ts`

```ts
export declare const SOLID_ELEMENT_SYMBOL: unique symbol;
```

#### `SOLID_NOT_FOUND_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L27) `packages/solidjs/src/route.ts`

```ts
export declare const SOLID_NOT_FOUND_SYMBOL: unique symbol;
```

#### `SOLID_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L26) `packages/solidjs/src/route.ts`

```ts
export declare const SOLID_REDIRECT_SYMBOL: unique symbol;
```

#### `SOLID_ROOT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L29) `packages/solidjs/src/render.ts`

```ts
export declare const SOLID_ROOT_SYMBOL: unique symbol;
```

#### `stringify`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L175) `packages/solidjs/src/render.ts`

Recursively serialize a Solid virtual tree into an SSR-shaped HTML string. Boolean attributes are elided, `class` maps to the `class` attribute (Solid convention, not React's `className`), and children are stringified without any XSS escaping — tests assert on shape, not on production output.

```ts
export declare function stringify(node: SolidChild): string;
```

#### `SUSPENSE_BOUNDARY_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L28) `packages/solidjs/src/route.ts`

```ts
export declare const SUSPENSE_BOUNDARY_SYMBOL: unique symbol;
```

#### `track`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L106) `packages/solidjs/src/signal.ts`

Run `fn` and capture every signal it reads. Useful for asserting a component body reads the expected signals before committing to a full effect subscribe.

```ts
export declare function track<T>(fn: () => T): {
    result: T;
    reads: SignalGetter<unknown>[];
};
```

### 型

#### `EffectHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L118) `packages/solidjs/src/signal.ts`

```ts
export interface EffectHandle<T> {
    readonly [EFFECT_SYMBOL]: true;
    readonly runCount: () => number;
    readonly trace: () => ReadonlyArray<EffectTraceEntry<T>>;
    readonly dispose: () => void;
}
```

#### `EffectTraceEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L31) `packages/solidjs/src/signal.ts`

Effect trace entry — captures which signal values the body observed on that run.

```ts
export interface EffectTraceEntry<T> {
    readonly runIndex: number;
    readonly readValues: T[];
}
```

#### `ErrorBoundaryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L198) `packages/solidjs/src/route.ts`

```ts
export interface ErrorBoundaryOptions {
    readonly component: SolidComponent<Record<string, unknown>>;
    readonly fallback: (error: unknown) => SolidChild;
}
```

#### `ErrorBoundarySignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L49) `packages/solidjs/src/route.ts`

```ts
export interface ErrorBoundarySignal {
    readonly [ERROR_BOUNDARY_SYMBOL]: true;
    readonly caught: unknown;
    readonly fallback: SolidChild;
}
```

#### `HydrateOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L54) `packages/solidjs/src/render.ts`

```ts
export interface HydrateOptions<TProps> extends RenderSolidOptions<TProps> {
    readonly ssrMarkup: string;
}
```

#### `HydrateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L58) `packages/solidjs/src/render.ts`

```ts
export interface HydrateResult extends RenderSolidResult {
    readonly hydrated: boolean;
    readonly mismatch: string | null;
}
```

#### `InvokeSolidRouteOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L71) `packages/solidjs/src/route.ts`

```ts
export interface InvokeSolidRouteOptions<TData> {
    readonly page: SolidComponent<RouteSectionProps<TData>>;
    readonly load?: RouteLoader<TData>;
    readonly params?: RouteParams;
    readonly query?: RouteQuery;
}
```

#### `InvokeSolidRouteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L78) `packages/solidjs/src/route.ts`

```ts
export interface InvokeSolidRouteResult<TData> {
    readonly tree: SolidChild | null;
    readonly data: TData | undefined;
    readonly redirect: SolidRouteRedirectSignal | null;
    readonly notFound: SolidRouteNotFoundSignal | null;
    readonly error: unknown;
}
```

#### `RenderSolidOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L42) `packages/solidjs/src/render.ts`

```ts
export interface RenderSolidOptions<TProps> {
    readonly component: SolidComponent<TProps>;
    readonly props?: TProps;
}
```

#### `RenderSolidResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L47) `packages/solidjs/src/render.ts`

```ts
export interface RenderSolidResult {
    readonly tree: SolidChild;
    readonly effects: EffectHandle<unknown>[];
    readonly dispose: () => void;
    readonly html: () => string;
}
```

#### `RenderWithSuspenseOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L145) `packages/solidjs/src/route.ts`

```ts
export interface RenderWithSuspenseOptions<T> {
    readonly component: SolidComponent<Record<string, unknown>>;
    readonly fallback: SolidComponent<Record<string, unknown>> | SolidChild;
    readonly waitFor: Promise<T>;
    /** ms before the boundary reports `timedOut: true`; default 5000. */
    readonly timeoutMs?: number;
}
```

#### `ResourceAccessor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L39) `packages/solidjs/src/signal.ts`

```ts
export interface ResourceAccessor<T> {
    (): T | undefined;
    readonly state: ResourceState;
    readonly loading: boolean;
    readonly error: unknown;
    readonly latest: T | undefined;
    readonly [RESOURCE_SYMBOL]: true;
}
```

#### `ResourceActions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L48) `packages/solidjs/src/signal.ts`

```ts
export interface ResourceActions<T> {
    readonly refetch: () => Promise<T | undefined>;
    readonly mutate: (value: T | undefined) => T | undefined;
}
```

#### `ResourceHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L53) `packages/solidjs/src/signal.ts`

```ts
export interface ResourceHandle<T> {
    readonly accessor: ResourceAccessor<T>;
    readonly actions: ResourceActions<T>;
    readonly initialFetch: Promise<T | undefined>;
}
```

#### `ResourceState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L37) `packages/solidjs/src/signal.ts`

Resource state — mirrors Solid's `resource.state` machine.

```ts
export type ResourceState = 'unresolved' | 'pending' | 'ready' | 'errored' | 'refreshing';
```

#### `RootScope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L63) `packages/solidjs/src/render.ts`

```ts
export interface RootScope {
    readonly disposed: () => boolean;
}
```

#### `RouteLoader`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L69) `packages/solidjs/src/route.ts`

```ts
export type RouteLoader<TData> = (ctx: {
    params: RouteParams;
    query: RouteQuery;
}) => Promise<TData> | TData;
```

#### `RouteParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L55) `packages/solidjs/src/route.ts`

```ts
export interface RouteParams {
    readonly [key: string]: string | undefined;
}
```

#### `RouteQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L59) `packages/solidjs/src/route.ts`

```ts
export interface RouteQuery {
    readonly [key: string]: string | undefined;
}
```

#### `RouteSectionProps`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L63) `packages/solidjs/src/route.ts`

```ts
export interface RouteSectionProps<TData = unknown> {
    readonly params: RouteParams;
    readonly query: RouteQuery;
    readonly data: TData | undefined;
}
```

#### `SignalGetter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L22) `packages/solidjs/src/signal.ts`

Read accessor for a mockSignal — mirrors Solid's `[getter, setter] = createSignal()`.

```ts
export type SignalGetter<T> = {
    (): T;
    readonly [SIGNAL_SYMBOL]: true;
};
```

#### `SignalSetter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L28) `packages/solidjs/src/signal.ts`

Write setter for a mockSignal — accepts a next value or an updater fn.

```ts
export type SignalSetter<T> = (next: T | ((prev: T) => T)) => T;
```

#### `SolidChild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L31) `packages/solidjs/src/render.ts`

```ts
export type SolidChild = SolidElement | string | number | boolean | null | undefined | SolidChild[];
```

#### `SolidComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L40) `packages/solidjs/src/render.ts`

```ts
export type SolidComponent<TProps = Record<string, unknown>> = (props: TProps) => SolidChild;
```

#### `SolidElement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/render.ts#L33) `packages/solidjs/src/render.ts`

```ts
export interface SolidElement {
    readonly [SOLID_ELEMENT_SYMBOL]: true;
    readonly type: string;
    readonly props: Record<string, unknown>;
    readonly children: SolidChild[];
}
```

#### `SolidRouteNotFoundSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L37) `packages/solidjs/src/route.ts`

```ts
export interface SolidRouteNotFoundSignal {
    readonly [SOLID_NOT_FOUND_SYMBOL]: true;
}
```

#### `SolidRouteRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L31) `packages/solidjs/src/route.ts`

```ts
export interface SolidRouteRedirectSignal {
    readonly [SOLID_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### `SuspenseBoundarySignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/route.ts#L41) `packages/solidjs/src/route.ts`

```ts
export interface SuspenseBoundarySignal<T> {
    readonly [SUSPENSE_BOUNDARY_SYMBOL]: true;
    readonly fallback: SolidChild;
    readonly resolved: SolidChild | null;
    readonly waitedFor: Promise<T>;
    readonly timedOut: boolean;
}
```
<!-- kiwa-public-api:end -->
