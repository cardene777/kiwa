# fresh リファレンス

## route

`invokeFreshHandler` は handler object または単一 handler function を実行します。context には params、URL、route、mutable state、`render`、`renderNotFound`、`redirect`、`next` があります。`next` は middleware を進めず、404 Response を返します。

| handler の結果 | 実行結果 |
| --- | --- |
| Response | response としてそのまま返す |
| `ctx.render(data)` | renderData を捕捉し、page があれば HTML を作る |
| Response 以外の値 | render data として扱う |
| redirect signal | redirect と location を持つ Response |
| not found signal | notFound と 404 Response |
| その他の例外 | error と 500 Response |

`defineRoute` は route function をブランド化し、`invokeDefineRoute` が synthetic `FreshPageProps` で実行します。`redirect` と `notFound` は signal object を返すだけなので、`throw` して停止させます。

`h` は `FreshVNode` を作り、`stringify` は virtual tree を HTML に変換します。`findNodes` は depth-first に一致する node を返します。

## Islands

`defineIsland` は空でない name を要求します。`islandPlaceholder` は `data-island` と JSON の `data-props` を持つ空の div を作ります。`mountIsland` は component を同期で呼び、HTML と event handler map を作ります。

`hydrateIslands` は placeholder の name を定義と照合し、hydrated、missing、unregistered、HTML を返します。壊れた props JSON と object 以外の props は空 object として扱われます。

`simulateInteraction` は `click`、`input`、`submit` など任意の event 名を小文字化して dispatch します。返り値には呼び出した handler 数と `preventDefault` の有無が入ります。

## Head

`defineHead` は typed fragment を作ります。`mergeHead` は fragment を順に統合し、`renderHead` は title、base、meta、link、script の順で HTML を出力します。

| 要素 | 重複規則 |
| --- | --- |
| title | 空でない最後の値 |
| meta | name、property、httpEquiv の順で key を選び、後の値 |
| charset | 最後の1件 |
| link | `rel + href` が同じものは後の値 |
| script src | 同じ src は後の値 |
| inline script | すべて保持する |
| base | 最後の値 |

`extractHead` は virtual tree 内の `Head` と `head` node から tag を集め、同じ規則で統合します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'defineIsland: name is required' | [packages/fresh/src/islands.ts](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L53) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `defineHead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L78) `packages/fresh/src/head.ts`

Build a HeadFragment from a typed spec. Every field is optional; missing fields fall back to their neutral value (empty array / undefined) and get dropped during merge dedup.

```ts
export function defineHead(opts: {
  readonly title?: string;
  readonly meta?: readonly HeadMetaTag[];
  readonly link?: readonly HeadLinkTag[];
  readonly script?: readonly HeadScriptTag[];
  readonly base?: HeadBaseTag;
}): HeadFragment;
```

#### `defineIsland`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L48) `packages/fresh/src/islands.ts`

Register a Fresh island. `name` is the placeholder attribute (`&lt;div data-island="Name"&gt;`) that `hydrateIslands` looks for.

```ts
export function defineIsland<P extends IslandProps = IslandProps>(opts: {
  readonly name: string;
  readonly component: IslandComponent<P>;
  readonly defaultProps?: P;
}): IslandDefinition<P>;
```

#### `defineRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L449) `packages/fresh/src/route.ts`

Wrap a page fn so it registers as a Fresh-defined route (brand + passthrough).

```ts
export function defineRoute<TData = unknown, TState = Record<string, unknown>>(
  fn: DefineRouteFn<TData, TState>,
): DefinedRoute<TData, TState>;
```

#### `extractHead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L233) `packages/fresh/src/head.ts`

Walk a Fresh virtual tree, harvest every `&lt;Head&gt;` or `&lt;head&gt;` element's children (meta / title / link / script / base), and merge them into a single HeadFragment. This mirrors Fresh's server-side head collection where any component can drop a `&lt;Head&gt;` block anywhere in the tree.

```ts
export function extractHead(tree: FreshChild): HeadFragment;
```

#### `findNodes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L170) `packages/fresh/src/route.ts`

Depth-first traversal of a Fresh virtual tree. Collects every node whose `type` matches the predicate; strings / numbers / nulls are skipped.

```ts
export function findNodes(tree: FreshChild, predicate: (n: FreshVNode) => boolean): FreshVNode[];
```

#### `FRESH_NOT_FOUND_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L29) `packages/fresh/src/route.ts`

```ts
export declare const FRESH_NOT_FOUND_SYMBOL: typeof FRESH_NOT_FOUND_SYMBOL;
```

#### `FRESH_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L28) `packages/fresh/src/route.ts`

```ts
export declare const FRESH_REDIRECT_SYMBOL: typeof FRESH_REDIRECT_SYMBOL;
```

#### `FRESH_ROUTE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L30) `packages/fresh/src/route.ts`

```ts
export declare const FRESH_ROUTE_SYMBOL: typeof FRESH_ROUTE_SYMBOL;
```

#### `h`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L98) `packages/fresh/src/route.ts`

Lightweight JSX-shaped element factory. Tests write `h('div', { class: 'x' }, 'hello')` and pass the result to a Fresh route or Island.

```ts
export function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: FreshChild[]
): FreshVNode;
```

#### `HEAD_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L28) `packages/fresh/src/head.ts`

```ts
export declare const HEAD_SYMBOL: typeof HEAD_SYMBOL;
```

#### `hydrateIslands`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L200) `packages/fresh/src/islands.ts`

Walk the SSR tree, find every `&lt;div data-island="Name"&gt;` placeholder, mount the matching island definition (decoding `data-props`), and produce a diff describing which islands hydrated / which registered islands never appeared in the SSR tree / which placeholders had no matching island.

```ts
export function hydrateIslands(opts: HydrateIslandsOptions): HydrateIslandsResult;
```

#### `invokeDefineRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L485) `packages/fresh/src/route.ts`

Run a `defineRoute`-wrapped page. Synthesizes a minimal `ctx` (params / url / state / render is a no-op returning 200) and captures redirect / not-found signals the body throws.

```ts
export async function invokeDefineRoute<TData = unknown, TState = Record<string, unknown>>(
  opts: InvokeDefineRouteOptions<TData, TState>,
): Promise<InvokeDefineRouteResult>;
```

#### `invokeFreshHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L266) `packages/fresh/src/route.ts`

Dispatch a Fresh handler for the given `req.method`. If the handler returns a `Response` directly, that's the result. If the handler calls `ctx.render(data)`, we capture `data`, optionally invoke `page(props)` to materialize the tree, and synthesize a 200 HTML response. If the handler calls `ctx.renderNotFound()` / `ctx.redirect(...)`, the corresponding signal fields on the result are populated.

```ts
export async function invokeFreshHandler<TData = unknown, TState = Record<string, unknown>>(
  opts: InvokeFreshHandlerOptions<TData, TState>,
): Promise<InvokeFreshHandlerResult<TData>>;
```

#### `isDefinedRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L456) `packages/fresh/src/route.ts`

Type guard: recognize a `defineRoute()`-wrapped page.

```ts
export function isDefinedRoute<TData, TState>(value: unknown): value is DefinedRoute<TData, TState>;
```

#### `isFreshVNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L111) `packages/fresh/src/route.ts`

Type guard: recognize a Fresh virtual node (used by walkers + tests).

```ts
export function isFreshVNode(value: unknown): value is FreshVNode;
```

#### `isHeadFragment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L96) `packages/fresh/src/head.ts`

Type guard: recognize a HeadFragment.

```ts
export function isHeadFragment(value: unknown): value is HeadFragment;
```

#### `isIslandDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L63) `packages/fresh/src/islands.ts`

Type guard: recognize an island definition.

```ts
export function isIslandDefinition(value: unknown): value is IslandDefinition;
```

#### `isIslandMount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L134) `packages/fresh/src/islands.ts`

Type guard: recognize a mounted island.

```ts
export function isIslandMount(value: unknown): value is IslandMount;
```

#### `ISLAND_MOUNT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L31) `packages/fresh/src/islands.ts`

```ts
export declare const ISLAND_MOUNT_SYMBOL: typeof ISLAND_MOUNT_SYMBOL;
```

#### `ISLAND_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L30) `packages/fresh/src/islands.ts`

```ts
export declare const ISLAND_SYMBOL: typeof ISLAND_SYMBOL;
```

#### `islandPlaceholder`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L76) `packages/fresh/src/islands.ts`

Render a Fresh island placeholder. Server-side output contains only the `&lt;div data-island="Name" data-props="..."&gt;` marker — no children — so hydration can find it and expand it into the real tree.

```ts
export function islandPlaceholder<P extends IslandProps = IslandProps>(
  island: IslandDefinition<P>,
  props?: Partial<P>,
): FreshVNode;
```

#### `isNotFoundSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L74) `packages/fresh/src/route.ts`

Type guard: recognize a Fresh not-found signal (mirrors the internal check).

```ts
export function isNotFoundSignal(value: unknown): value is FreshNotFoundSignal;
```

#### `isRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L69) `packages/fresh/src/route.ts`

Type guard: recognize a Fresh redirect signal (mirrors the internal check).

```ts
export function isRedirectSignal(value: unknown): value is FreshRedirectSignal;
```

#### `mergeHead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L114) `packages/fresh/src/head.ts`

Merge N head fragments in order. Later fragments override earlier ones: - `title` — last non-empty wins - `meta` — dedup by `name` / `property` / `httpEquiv` (in that order), with `charset` treated as a singleton (last wins) - `link` — dedup by `rel + href` - `script` — dedup by `src` (inline scripts are always kept) - `base` — last non-null wins

```ts
export function mergeHead(fragments: readonly HeadFragment[]): HeadFragment;
```

#### `mountIsland`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L116) `packages/fresh/src/islands.ts`

Mount an island synchronously — invokes the component fn with the merged props and captures the returned virtual tree. Collects any event handlers present in the tree so `simulateInteraction` can dispatch against them.

```ts
export function mountIsland<P extends IslandProps = IslandProps>(
  island: IslandDefinition<P>,
  props?: Partial<P>,
): IslandMount<P>;
```

#### `notFound`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L48) `packages/fresh/src/route.ts`

Throw this from a Fresh handler or a defineRoute page body to signal a 404.

```ts
export function notFound(): FreshNotFoundSignal;
```

#### `redirect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L43) `packages/fresh/src/route.ts`

Throw this from a Fresh handler or a defineRoute page body to signal a redirect.

```ts
export function redirect(location: string, status = 302): FreshRedirectSignal;
```

#### `renderHead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L194) `packages/fresh/src/head.ts`

Stringify a merged head into an HTML fragment. The rendering order is deterministic (`title` → `base` → `meta` → `link` → `script`) so tests can diff on the exact serialized shape.

```ts
export function renderHead(head: HeadFragment): string;
```

#### `simulateInteraction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L279) `packages/fresh/src/islands.ts`

Dispatch a synthetic event against a mounted island. `event` is the DOM event name (e.g. `click` / `input` / `submit`), `targetType` filters by element tag (e.g. only fire against `button` elements), and `value` is exposed on the event object for `input` handlers.

```ts
export function simulateInteraction(opts: SimulateInteractionOptions): SimulateInteractionResult;
```

#### `stringify`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L125) `packages/fresh/src/route.ts`

Recursively serialize a Fresh virtual tree into an HTML string. Boolean attributes render as bare keys, `null` / `undefined` / `false` skip, and children are stringified without any XSS escaping — tests assert on shape, not on production output. Void elements (matching the HTML5 spec list) render as self-closing (`&lt;br /&gt;` / `&lt;meta ... /&gt;` / etc.) rather than `&lt;br&gt;&lt;/br&gt;` so `head.ts` can emit spec-shaped `&lt;meta&gt;` / `&lt;link&gt;` tags.

```ts
export function stringify(node: FreshChild): string;
```

### 型

#### `AnyIslandDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L174) `packages/fresh/src/islands.ts`

```ts
export type AnyIslandDefinition = IslandDefinition<any>;
```

#### `DefinedRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L443) `packages/fresh/src/route.ts`

```ts
export interface DefinedRoute<TData, TState> {
  readonly [FRESH_ROUTE_SYMBOL]: true;
  readonly fn: DefineRouteFn<TData, TState>;
}
```

#### `DefineRouteFn`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L438) `packages/fresh/src/route.ts`

`defineRoute&lt;T&gt;(fn)` mirrors Fresh's route wrapper. The returned brand lets `invokeDefineRoute` recognize the value; the handler itself just proxies to `fn(req, ctx)`.

```ts
export type DefineRouteFn<TData, TState> = (
  req: Request,
  ctx: FreshHandlerContext<TState>,
) => FreshChild | Promise<FreshChild>;
```

#### `FreshChild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L91) `packages/fresh/src/route.ts`

```ts
export type FreshChild = FreshVNode | string | number | boolean | null | undefined | FreshChild[];
```

#### `FreshHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L216) `packages/fresh/src/route.ts`

```ts
export type FreshHandler<TData = unknown, TState = Record<string, unknown>> = (
  req: Request,
  ctx: FreshHandlerContext<TState>,
) => Response | Promise<Response> | TData | Promise<TData>;
```

#### `FreshHandlerContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L205) `packages/fresh/src/route.ts`

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

#### `FreshHandlers`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L226) `packages/fresh/src/route.ts`

`Handlers&lt;T, S&gt;` — Fresh's `export const handler` shape. Each optional method key maps to a handler for that HTTP method; missing methods fall through to a `405 Method Not Allowed` response.

```ts
export type FreshHandlers<TData = unknown, TState = Record<string, unknown>> = Partial<
  Record<FreshHttpMethod, FreshHandler<TData, TState>>
>;
```

#### `FreshHttpMethod`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L78) `packages/fresh/src/route.ts`

```ts
export type FreshHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

#### `FreshNotFoundSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L38) `packages/fresh/src/route.ts`

```ts
export interface FreshNotFoundSignal {
  readonly [FRESH_NOT_FOUND_SYMBOL]: true;
}
```

#### `FreshPageProps`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L190) `packages/fresh/src/route.ts`

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

#### `FreshRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L32) `packages/fresh/src/route.ts`

```ts
export interface FreshRedirectSignal {
  readonly [FRESH_REDIRECT_SYMBOL]: true;
  readonly location: string;
  readonly status: number;
}
```

#### `FreshRouteParams`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L80) `packages/fresh/src/route.ts`

```ts
export interface FreshRouteParams {
  readonly [key: string]: string | undefined;
}
```

#### `FreshVNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L85) `packages/fresh/src/route.ts`

JSX-shaped virtual node returned by a Fresh route or Island.

```ts
export interface FreshVNode {
  readonly type: string;
  readonly props: Record<string, unknown>;
  readonly children: FreshChild[];
}
```

#### `HeadBaseTag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L59) `packages/fresh/src/head.ts`

```ts
export interface HeadBaseTag {
  readonly href?: string;
  readonly target?: string;
}
```

#### `HeadFragment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L64) `packages/fresh/src/head.ts`

```ts
export interface HeadFragment {
  readonly [HEAD_SYMBOL]: true;
  readonly title: string | undefined;
  readonly meta: readonly HeadMetaTag[];
  readonly link: readonly HeadLinkTag[];
  readonly script: readonly HeadScriptTag[];
  readonly base: HeadBaseTag | undefined;
}
```

#### `HeadLinkTag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L38) `packages/fresh/src/head.ts`

```ts
export interface HeadLinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly sizes?: string;
  readonly media?: string;
  readonly crossorigin?: string;
  readonly integrity?: string;
}
```

#### `HeadMetaTag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L30) `packages/fresh/src/head.ts`

```ts
export interface HeadMetaTag {
  readonly name?: string;
  readonly property?: string;
  readonly httpEquiv?: string;
  readonly charset?: string;
  readonly content?: string;
}
```

#### `HeadScriptTag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L48) `packages/fresh/src/head.ts`

```ts
export interface HeadScriptTag {
  readonly src?: string;
  readonly type?: string;
  readonly async?: boolean;
  readonly defer?: boolean;
  readonly nomodule?: boolean;
  readonly integrity?: string;
  readonly crossorigin?: string;
  readonly children?: string;
}
```

#### `HydratedIslandEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L181) `packages/fresh/src/islands.ts`

```ts
export interface HydratedIslandEntry {
  readonly name: string;
  readonly mount: IslandMount<IslandProps>;
  readonly placeholder: FreshVNode;
}
```

#### `HydrateIslandsOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L176) `packages/fresh/src/islands.ts`

```ts
export interface HydrateIslandsOptions {
  readonly ssrTree: FreshChild;
  readonly islands: readonly AnyIslandDefinition[];
}
```

#### `HydrateIslandsResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L187) `packages/fresh/src/islands.ts`

```ts
export interface HydrateIslandsResult {
  readonly hydrated: HydratedIslandEntry[];
  readonly missing: string[];
  readonly unregistered: string[];
  readonly html: string;
}
```

#### `InvokeDefineRouteOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L464) `packages/fresh/src/route.ts`

```ts
export interface InvokeDefineRouteOptions<TData, TState> {
  readonly route: DefinedRoute<TData, TState> | DefineRouteFn<TData, TState>;
  readonly req: Request;
  readonly params?: FreshRouteParams;
  readonly state?: TState;
  readonly path?: string;
}
```

#### `InvokeDefineRouteResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L472) `packages/fresh/src/route.ts`

```ts
export interface InvokeDefineRouteResult {
  readonly tree: FreshChild | null;
  readonly redirect: FreshRedirectSignal | null;
  readonly notFound: FreshNotFoundSignal | null;
  readonly error: unknown;
  readonly html: string;
}
```

#### `InvokeFreshHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L230) `packages/fresh/src/route.ts`

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

#### `InvokeFreshHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L243) `packages/fresh/src/route.ts`

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

#### `IslandComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L35) `packages/fresh/src/islands.ts`

```ts
export type IslandComponent<P extends IslandProps = IslandProps> = (props: P) => FreshChild;
```

#### `IslandDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L37) `packages/fresh/src/islands.ts`

```ts
export interface IslandDefinition<P extends IslandProps = IslandProps> {
  readonly [ISLAND_SYMBOL]: true;
  readonly name: string;
  readonly component: IslandComponent<P>;
  readonly defaultProps: P | undefined;
}
```

#### `IslandMount`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L102) `packages/fresh/src/islands.ts`

```ts
export interface IslandMount<P extends IslandProps = IslandProps> {
  readonly [ISLAND_MOUNT_SYMBOL]: true;
  readonly island: IslandDefinition<P>;
  readonly props: P;
  readonly tree: FreshChild;
  readonly html: string;
  handlers: Map<string, Array<(event: SyntheticEvent) => void>>;
}
```

#### `IslandProps`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L33) `packages/fresh/src/islands.ts`

```ts
export type IslandProps = Record<string, unknown>;
```

#### `SimulateInteractionOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L261) `packages/fresh/src/islands.ts`

```ts
export interface SimulateInteractionOptions {
  readonly mount: IslandMount;
  readonly event: string;
  readonly value?: unknown;
  readonly targetType?: string;
}
```

#### `SimulateInteractionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L268) `packages/fresh/src/islands.ts`

```ts
export interface SimulateInteractionResult {
  readonly invoked: number;
  readonly defaultPrevented: boolean;
}
```

#### `SyntheticEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L142) `packages/fresh/src/islands.ts`

```ts
export interface SyntheticEvent {
  readonly type: string;
  readonly target: FreshVNode | undefined;
  readonly value: unknown;
  defaultPrevented: boolean;
  preventDefault(): void;
}
```
<!-- kiwa-public-api:end -->
