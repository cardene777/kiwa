# astro リファレンス

## endpoint

`invokeEndpoint(options)` は `endpoint` に simulated `APIContext` を渡し、`InvokeEndpointResult` を返します。context には Request、params、cookies、url、site、locals、`redirect` があります。

| option | 内容 |
| --- | --- |
| `url` | 必須の absolute URL |
| `method` | Request method。body がなければ既定は GET |
| `params` | endpoint に渡す route params |
| `headers` | Request headers |
| `cookies` | memory cookie jar の初期値 |
| `formData` | form body。jsonBody より優先される |
| `jsonBody` | JSON 化する body。既定 method は POST |
| `locals` | endpoint に渡す local values |
| `site` | context の site URL |

3xx の Response は `redirect` として location と status が返ります。location header がない場合は空文字列です。

## ページ

`renderAstroPage(options)` は simulated `Astro` context をページ関数へ渡します。context は Request、URL、params、props、site、generator、locals、cookies、`redirect`、`rewrite` を持ちます。

| ページの結果 | `RenderAstroPageResult` |
| --- | --- |
| string | html と 200 Response |
| Response | response と cloned body の html |
| `redirect` signal | redirect と指定 status の Response |
| `kiwaAstroNotFound` signal | notFound と指定 Response または 404 |
| `rewrite` signal | rewrite と 200 Response |
| その他の例外 | error と 500 Response |

`ASTRO_REDIRECT_SYMBOL`、`ASTRO_NOT_FOUND_SYMBOL`、`ASTRO_REWRITE_SYMBOL` は signal の識別に使われます。通常は `redirect`、`rewrite`、`kiwaAstroNotFound` を使い、symbol を直接操作しません。

## View Transitions

`setupAstroViewTransitionEnv(options)` は from と to の URL、listener registry、minimal document、dispatch API を返します。

`dispatchAll()` の順序は `astro:before-preparation`、`astro:after-preparation`、`astro:before-swap`、`astro:after-swap` です。before preparation で cancel されると残りは null で返ります。before swap は listener の後に必ず1回 `swap()` を呼びます。

`dispatch(type)` は1つの event だけを dispatch します。`diffDom()` は from と to の body の最上位 tag を `added`、`removed`、`kept` に分けます。属性、text、深い子要素の差分は比較しません。`reset()` は document、listener、form data を初期状態へ戻します。

`supportsViewTransitions` は `before-swap` の `viewTransition` の有無を制御します。visual transition の再現や browser の `document.startViewTransition()` 呼び出しは行いません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `unknown event type: ${String(type)}` | [packages/astro/src/setup-view-transition-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L381) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `ASTRO_NOT_FOUND_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L18) `packages/astro/src/render-astro-page.ts`

```ts
export declare const ASTRO_NOT_FOUND_SYMBOL: unique symbol;
```

#### `ASTRO_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L17) `packages/astro/src/render-astro-page.ts`

```ts
export declare const ASTRO_REDIRECT_SYMBOL: unique symbol;
```

#### `ASTRO_REWRITE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L19) `packages/astro/src/render-astro-page.ts`

```ts
export declare const ASTRO_REWRITE_SYMBOL: unique symbol;
```

#### `invokeEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L89) `packages/astro/src/invoke-endpoint.ts`

```ts
export declare function invokeEndpoint<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeEndpointOptions<TParams>): Promise<InvokeEndpointResult>;
```

#### `kiwaAstroNotFound`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L198) `packages/astro/src/render-astro-page.ts`

Construct a notFound signal the same way `Astro.notFound(response?)` does in production. Pages can `throw Astro.notFound()` to short-circuit; in kiwa tests the page can `throw kiwaAstroNotFound()` to be captured.

```ts
export declare function kiwaAstroNotFound(response?: Response): AstroNotFoundSignal;
```

#### `renderAstroPage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L129) `packages/astro/src/render-astro-page.ts`

Render a `.astro` page in isolation and capture HTML / Response / redirect / notFound / rewrite signals. The page receives a synthetic AstroContext with the same shape as the real `Astro` global.

```ts
export declare function renderAstroPage<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: RenderAstroPageOptions<TProps, TParams, TLocals>): Promise<RenderAstroPageResult>;
```

#### `setupAstroViewTransitionEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L262) `packages/astro/src/setup-view-transition-env.ts`

```ts
export declare function setupAstroViewTransitionEnv(options: SetupAstroViewTransitionEnvOptions): AstroViewTransitionEnv;
```

### 型

#### `APIRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L28) `packages/astro/src/invoke-endpoint.ts`

```ts
export type APIRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (context: SimulatedAPIContext<TParams>) => Promise<Response> | Response;
```

#### `AstroAfterPreparationEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L61) `packages/astro/src/setup-view-transition-env.ts`

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_PREPARATION)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to / newDocument は持たない。

```ts
export interface AstroAfterPreparationEvent {
    readonly type: 'astro:after-preparation';
}
```

#### `AstroAfterSwapEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L80) `packages/astro/src/setup-view-transition-env.ts`

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_SWAP)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to は持たない (nav 後 URL は `document.location.href`)。

```ts
export interface AstroAfterSwapEvent {
    readonly type: 'astro:after-swap';
}
```

#### `AstroBeforePreparationEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L49) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroBeforePreparationEvent extends AstroViewTransitionEventPayload {
    readonly type: 'astro:before-preparation';
    defaultPrevented: boolean;
    preventDefault(): void;
    /** Loader を override 可能 (公式 router 互換、 navigate cancellation / replace 用) */
    loader: (() => Promise<void>) | undefined;
}
```

#### `AstroBeforeSwapEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L65) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroBeforeSwapEvent extends AstroViewTransitionEventPayload {
    readonly type: 'astro:before-swap';
    /**
     * DOM swap 関数 (公式 router 互換)。 listener が override 可。
     * 公式 router は listener dispatch 後に必ず event.swap() を 1 回呼ぶため、
     * listener が swap() を呼ぶと swap が計 2 回実行される (swapCallCount で観測可能)。
     * listener が swap を no-op 化したい場合は `event.swap = () => {}` で上書きする。
     */
    swap: () => void;
}
```

#### `AstroNotFoundSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L27) `packages/astro/src/render-astro-page.ts`

```ts
export interface AstroNotFoundSignal {
    readonly [ASTRO_NOT_FOUND_SYMBOL]: true;
    readonly response: Response | undefined;
}
```

#### `AstroPageComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L61) `packages/astro/src/render-astro-page.ts`

```ts
export type AstroPageComponent<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>> = (context: SimulatedAstroContext<TProps, TParams, TLocals>) => Promise<string | Response> | string | Response;
```

#### `AstroRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L21) `packages/astro/src/render-astro-page.ts`

```ts
export interface AstroRedirectSignal {
    readonly [ASTRO_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### `AstroRewriteSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L32) `packages/astro/src/render-astro-page.ts`

```ts
export interface AstroRewriteSignal {
    readonly [ASTRO_REWRITE_SYMBOL]: true;
    readonly target: string | URL | Request;
}
```

#### `AstroSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L37) `packages/astro/src/render-astro-page.ts`

```ts
export type AstroSignal = AstroRedirectSignal | AstroNotFoundSignal | AstroRewriteSignal;
```

#### `AstroViewTransitionDispatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L168) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroViewTransitionDispatchResult {
    readonly beforePreparation: AstroBeforePreparationEvent | null;
    readonly afterPreparation: AstroAfterPreparationEvent | null;
    readonly beforeSwap: AstroBeforeSwapEvent | null;
    readonly afterSwap: AstroAfterSwapEvent | null;
    /**
     * swap() が呼ばれた回数。 公式 router は listener dispatch 後に必ず 1 回呼ぶため、
     * listener が swap() を呼ばなければ 1、 listener も呼べば 2 になる。
     * 2 を期待しない user code は double-swap bug 候補。
     */
    readonly swapCallCount: number;
    /** before-preparation で preventDefault された場合 true (preparation 中断) */
    readonly cancelled: boolean;
}
```

#### `AstroViewTransitionDomDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L183) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroViewTransitionDomDiff {
    /** from-page にあって to-page にない top-level tag (順序保持) */
    readonly removed: string[];
    /** to-page にあって from-page にない top-level tag */
    readonly added: string[];
    /** 両方にある top-level tag */
    readonly kept: string[];
}
```

#### `AstroViewTransitionEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L124) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroViewTransitionEnv {
    readonly fromUrl: URL;
    readonly toUrl: URL;
    /** named transition name (Astro `transition:name` SSOT) */
    readonly transitionName: string;
    /** browser supportsViewTransitions snapshot */
    readonly supportsViewTransitions: boolean;
    /**
     * to-page 側 Document (newDocument)、 before-swap listener が mutate 可能。
     * dispatchAll() の前後で同一参照、 reset() 後に initial HTML へ復元される。
     */
    readonly newDocument: Document;
    /**
     * 各 lifecycle event の listener を登録する (公式 `document.addEventListener` 相当)。
     * 同型 event 複数登録時は登録順に呼ばれる。
     */
    on<TType extends AstroViewTransitionEventType>(type: TType, listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>): void;
    /** 1 listener を解除 */
    off<TType extends AstroViewTransitionEventType>(type: TType, listener: AstroViewTransitionListener<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>): void;
    /**
     * 4 event を順に dispatch ... before-preparation → after-preparation → before-swap → after-swap。
     * before-preparation で preventDefault() / signal abort された場合は preparation 経路を中断
     * (公式 `doPreparation` 同等、 router は event を return するが後続 transition は走らない)。
     */
    dispatchAll(): Promise<AstroViewTransitionDispatchResult>;
    /** 個別 event のみ dispatch (sequence 検証用) */
    dispatch<TType extends AstroViewTransitionEventType>(type: TType): Promise<Extract<AstroViewTransitionEvent, {
        type: TType;
    }>>;
    /**
     * from-page DOM と to-page DOM の root-level innerHTML 差分を抽出。
     * 子要素 tag-name 列で簡易比較する (real diff library は意図的に依存しない)。
     */
    diffDom(): AstroViewTransitionDomDiff;
    /** newDocument / listener / formData を初期 snapshot に戻す */
    reset(): void;
}
```

#### `AstroViewTransitionEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L84) `packages/astro/src/setup-view-transition-env.ts`

```ts
export type AstroViewTransitionEvent = AstroBeforePreparationEvent | AstroAfterPreparationEvent | AstroBeforeSwapEvent | AstroAfterSwapEvent;
```

#### `AstroViewTransitionEventPayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L37) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface AstroViewTransitionEventPayload {
    readonly from: URL;
    readonly to: URL;
    readonly navigationType: 'traverse' | 'push' | 'replace';
    readonly direction: 'forward' | 'back' | string;
    readonly sourceElement: Element | undefined;
    readonly info: unknown;
    readonly newDocument: Document;
    readonly viewTransition: {
        skipTransition(): void;
    } | undefined;
    readonly formData: FormData | undefined;
}
```

#### `AstroViewTransitionEventType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L90) `packages/astro/src/setup-view-transition-env.ts`

```ts
export type AstroViewTransitionEventType = AstroViewTransitionEvent['type'];
```

#### `AstroViewTransitionListener`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L92) `packages/astro/src/setup-view-transition-env.ts`

```ts
export type AstroViewTransitionListener<TEvent extends AstroViewTransitionEvent = AstroViewTransitionEvent> = (event: TEvent) => void | Promise<void>;
```

#### `InvokeEndpointOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L32) `packages/astro/src/invoke-endpoint.ts`

```ts
export interface InvokeEndpointOptions<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly endpoint: APIRoute<TParams>;
    readonly url: string;
    readonly method?: string;
    readonly params?: TParams;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly formData?: Record<string, string>;
    readonly jsonBody?: unknown;
    readonly locals?: Record<string, unknown>;
    readonly site?: string;
}
```

#### `InvokeEndpointResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L45) `packages/astro/src/invoke-endpoint.ts`

```ts
export interface InvokeEndpointResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### `RenderAstroPageOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L69) `packages/astro/src/render-astro-page.ts`

```ts
export interface RenderAstroPageOptions<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>> {
    readonly page: AstroPageComponent<TProps, TParams, TLocals>;
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly params?: TParams;
    readonly props?: TProps;
    readonly locals?: TLocals;
    readonly site?: string;
    readonly generator?: string;
}
```

#### `RenderAstroPageResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L86) `packages/astro/src/render-astro-page.ts`

```ts
export interface RenderAstroPageResult {
    readonly html: string;
    readonly response: Response;
    readonly redirect: AstroRedirectSignal | null;
    readonly notFound: AstroNotFoundSignal | null;
    readonly rewrite: AstroRewriteSignal | null;
    readonly error: unknown;
}
```

#### `SetupAstroViewTransitionEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L96) `packages/astro/src/setup-view-transition-env.ts`

```ts
export interface SetupAstroViewTransitionEnvOptions {
    readonly fromPath: string;
    readonly toPath: string;
    /** named view transitions (Astro `transition:name` attribute、 default `''`) */
    readonly transitionName?: string;
    /** History API 動作種別 (default `'push'`) */
    readonly navigationType?: 'traverse' | 'push' | 'replace';
    /** ナビゲート方向 (`back` button / `forward` button、 default `'forward'`) */
    readonly direction?: 'forward' | 'back' | string;
    /** to-page side で render される HTML (default は最小の `<html><body></body></html>`) */
    readonly toHtml?: string;
    /** from-page side で初期表示される HTML (default は最小の `<html><body></body></html>`) */
    readonly fromHtml?: string;
    /**
     * browser の View Transitions API support flag (default `true`)。
     * 公式 router 動作と整合 ... preparation event は support 有無に **関係なく** dispatch される。
     * 本 flag は before-swap event の `viewTransition` field 公開有無のみ制御する
     * (= `document.startViewTransition()` を browser が持つかどうか、 視覚 transition 用)。
     */
    readonly supportsViewTransitions?: boolean;
    /** Astro form submission event 由来 — submit data を formData として公開 */
    readonly formData?: FormData;
    /** sourceElement (a / area / form / Element) を listener に渡したい場合 */
    readonly sourceElement?: Element;
    /** navigate() の info 引数 (Astro custom payload、 default `undefined`) */
    readonly info?: unknown;
}
```

#### `SimulatedAPIContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L13) `packages/astro/src/invoke-endpoint.ts`

```ts
export interface SimulatedAPIContext<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> {
    readonly request: Request;
    readonly params: TParams;
    readonly cookies: {
        get(name: string): {
            value: string;
        } | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string, options?: Record<string, unknown>): void;
        has(name: string): boolean;
    };
    readonly url: URL;
    readonly site: URL | undefined;
    readonly locals: Record<string, unknown>;
    redirect(path: string, status?: number): Response;
}
```

#### `SimulatedAstroContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L39) `packages/astro/src/render-astro-page.ts`

```ts
export interface SimulatedAstroContext<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>> {
    readonly request: Request;
    readonly url: URL;
    readonly params: TParams;
    readonly props: TProps;
    readonly site: URL | undefined;
    readonly generator: string;
    readonly locals: TLocals;
    readonly cookies: {
        get(name: string): {
            value: string;
        } | undefined;
        set(name: string, value: string, options?: Record<string, unknown>): void;
        delete(name: string, options?: Record<string, unknown>): void;
        has(name: string): boolean;
    };
    redirect(path: string, status?: number): never;
    rewrite(target: string | URL | Request): never;
}
```
<!-- kiwa-public-api:end -->
