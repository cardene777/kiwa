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
| <code v-pre>defineIsland: name is required</code> | [packages/fresh/src/islands.ts](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L53) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>defineHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L78) <code v-pre>packages/fresh/src/head.ts</code>

Build a HeadFragment from a typed spec. Every field is optional; missing fields fall back to their neutral value (empty array / undefined) and get dropped during merge dedup.

```ts
export declare function defineHead(opts: {
    readonly title?: string;
    readonly meta?: readonly HeadMetaTag[];
    readonly link?: readonly HeadLinkTag[];
    readonly script?: readonly HeadScriptTag[];
    readonly base?: HeadBaseTag;
}): HeadFragment;
```

#### <code v-pre>defineIsland</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L48) <code v-pre>packages/fresh/src/islands.ts</code>

Register a Fresh island. `name` is the placeholder attribute (`&lt;div data-island="Name"&gt;`) that `hydrateIslands` looks for.

```ts
export declare function defineIsland<P extends IslandProps = IslandProps>(opts: {
    readonly name: string;
    readonly component: IslandComponent<P>;
    readonly defaultProps?: P;
}): IslandDefinition<P>;
```

#### <code v-pre>defineRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L449) <code v-pre>packages/fresh/src/route.ts</code>

Wrap a page fn so it registers as a Fresh-defined route (brand + passthrough).

```ts
export declare function defineRoute<TData = unknown, TState = Record<string, unknown>>(fn: DefineRouteFn<TData, TState>): DefinedRoute<TData, TState>;
```

#### <code v-pre>extractHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L233) <code v-pre>packages/fresh/src/head.ts</code>

Walk a Fresh virtual tree, harvest every `&lt;Head&gt;` or `&lt;head&gt;` element's children (meta / title / link / script / base), and merge them into a single HeadFragment. This mirrors Fresh's server-side head collection where any component can drop a `&lt;Head&gt;` block anywhere in the tree.

```ts
export declare function extractHead(tree: FreshChild): HeadFragment;
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

#### <code v-pre>HEAD&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L28) <code v-pre>packages/fresh/src/head.ts</code>

```ts
export declare const HEAD_SYMBOL: unique symbol;
```

#### <code v-pre>hydrateIslands</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L200) <code v-pre>packages/fresh/src/islands.ts</code>

Walk the SSR tree, find every `&lt;div data-island="Name"&gt;` placeholder, mount the matching island definition (decoding `data-props`), and produce a diff describing which islands hydrated / which registered islands never appeared in the SSR tree / which placeholders had no matching island.

```ts
export declare function hydrateIslands(opts: HydrateIslandsOptions): HydrateIslandsResult;
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

#### <code v-pre>isHeadFragment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L96) <code v-pre>packages/fresh/src/head.ts</code>

Type guard: recognize a HeadFragment.

```ts
export declare function isHeadFragment(value: unknown): value is HeadFragment;
```

#### <code v-pre>isIslandDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L63) <code v-pre>packages/fresh/src/islands.ts</code>

Type guard: recognize an island definition.

```ts
export declare function isIslandDefinition(value: unknown): value is IslandDefinition;
```

#### <code v-pre>isIslandMount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L134) <code v-pre>packages/fresh/src/islands.ts</code>

Type guard: recognize a mounted island.

```ts
export declare function isIslandMount(value: unknown): value is IslandMount;
```

#### <code v-pre>ISLAND&#95;MOUNT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L31) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export declare const ISLAND_MOUNT_SYMBOL: unique symbol;
```

#### <code v-pre>ISLAND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L30) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export declare const ISLAND_SYMBOL: unique symbol;
```

#### <code v-pre>islandPlaceholder</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L76) <code v-pre>packages/fresh/src/islands.ts</code>

Render a Fresh island placeholder. Server-side output contains only the `&lt;div data-island="Name" data-props="..."&gt;` marker — no children — so hydration can find it and expand it into the real tree.

```ts
export declare function islandPlaceholder<P extends IslandProps = IslandProps>(island: IslandDefinition<P>, props?: Partial<P>): FreshVNode;
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

#### <code v-pre>mergeHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L114) <code v-pre>packages/fresh/src/head.ts</code>

Merge N head fragments in order. Later fragments override earlier ones: - `title` — last non-empty wins - `meta` — dedup by `name` / `property` / `httpEquiv` (in that order), with `charset` treated as a singleton (last wins) - `link` — dedup by `rel + href` - `script` — dedup by `src` (inline scripts are always kept) - `base` — last non-null wins

```ts
export declare function mergeHead(fragments: readonly HeadFragment[]): HeadFragment;
```

#### <code v-pre>mountIsland</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L116) <code v-pre>packages/fresh/src/islands.ts</code>

Mount an island synchronously — invokes the component fn with the merged props and captures the returned virtual tree. Collects any event handlers present in the tree so `simulateInteraction` can dispatch against them.

```ts
export declare function mountIsland<P extends IslandProps = IslandProps>(island: IslandDefinition<P>, props?: Partial<P>): IslandMount<P>;
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

#### <code v-pre>renderHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L194) <code v-pre>packages/fresh/src/head.ts</code>

Stringify a merged head into an HTML fragment. The rendering order is deterministic (`title` → `base` → `meta` → `link` → `script`) so tests can diff on the exact serialized shape.

```ts
export declare function renderHead(head: HeadFragment): string;
```

#### <code v-pre>simulateInteraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L279) <code v-pre>packages/fresh/src/islands.ts</code>

Dispatch a synthetic event against a mounted island. `event` is the DOM event name (e.g. `click` / `input` / `submit`), `targetType` filters by element tag (e.g. only fire against `button` elements), and `value` is exposed on the event object for `input` handlers.

```ts
export declare function simulateInteraction(opts: SimulateInteractionOptions): SimulateInteractionResult;
```

#### <code v-pre>stringify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/route.ts#L125) <code v-pre>packages/fresh/src/route.ts</code>

Recursively serialize a Fresh virtual tree into an HTML string. Boolean attributes render as bare keys, `null` / `undefined` / `false` skip, and children are stringified without any XSS escaping — tests assert on shape, not on production output. Void elements (matching the HTML5 spec list) render as self-closing (`&lt;br /&gt;` / `&lt;meta ... /&gt;` / etc.) rather than `&lt;br&gt;&lt;/br&gt;` so `head.ts` can emit spec-shaped `&lt;meta&gt;` / `&lt;link&gt;` tags.

```ts
export declare function stringify(node: FreshChild): string;
```

### 型

#### <code v-pre>AnyIslandDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L174) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export type AnyIslandDefinition = IslandDefinition<any>;
```

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

#### <code v-pre>HeadBaseTag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L59) <code v-pre>packages/fresh/src/head.ts</code>

```ts
export interface HeadBaseTag {
    readonly href?: string;
    readonly target?: string;
}
```

#### <code v-pre>HeadFragment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L64) <code v-pre>packages/fresh/src/head.ts</code>

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

#### <code v-pre>HeadLinkTag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L38) <code v-pre>packages/fresh/src/head.ts</code>

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

#### <code v-pre>HeadMetaTag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L30) <code v-pre>packages/fresh/src/head.ts</code>

```ts
export interface HeadMetaTag {
    readonly name?: string;
    readonly property?: string;
    readonly httpEquiv?: string;
    readonly charset?: string;
    readonly content?: string;
}
```

#### <code v-pre>HeadScriptTag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L48) <code v-pre>packages/fresh/src/head.ts</code>

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

#### <code v-pre>HydratedIslandEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L181) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface HydratedIslandEntry {
    readonly name: string;
    readonly mount: IslandMount<IslandProps>;
    readonly placeholder: FreshVNode;
}
```

#### <code v-pre>HydrateIslandsOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L176) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface HydrateIslandsOptions {
    readonly ssrTree: FreshChild;
    readonly islands: readonly AnyIslandDefinition[];
}
```

#### <code v-pre>HydrateIslandsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L187) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface HydrateIslandsResult {
    readonly hydrated: HydratedIslandEntry[];
    readonly missing: string[];
    readonly unregistered: string[];
    readonly html: string;
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

#### <code v-pre>IslandComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L35) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export type IslandComponent<P extends IslandProps = IslandProps> = (props: P) => FreshChild;
```

#### <code v-pre>IslandDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L37) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface IslandDefinition<P extends IslandProps = IslandProps> {
    readonly [ISLAND_SYMBOL]: true;
    readonly name: string;
    readonly component: IslandComponent<P>;
    readonly defaultProps: P | undefined;
}
```

#### <code v-pre>IslandMount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L102) <code v-pre>packages/fresh/src/islands.ts</code>

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

#### <code v-pre>IslandProps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L33) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export type IslandProps = Record<string, unknown>;
```

#### <code v-pre>SimulateInteractionOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L261) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface SimulateInteractionOptions {
    readonly mount: IslandMount;
    readonly event: string;
    readonly value?: unknown;
    readonly targetType?: string;
}
```

#### <code v-pre>SimulateInteractionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L268) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export interface SimulateInteractionResult {
    readonly invoked: number;
    readonly defaultPrevented: boolean;
}
```

#### <code v-pre>SyntheticEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L142) <code v-pre>packages/fresh/src/islands.ts</code>

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
