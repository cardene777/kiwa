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
| <code v-pre>unknown event type: $&#123;String(type)&#125;</code> | [packages/astro/src/setup-view-transition-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L381) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>ASTRO&#95;NOT&#95;FOUND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L18) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export declare const ASTRO_NOT_FOUND_SYMBOL: unique symbol;
```

#### <code v-pre>ASTRO&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L17) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export declare const ASTRO_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>ASTRO&#95;REWRITE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L19) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export declare const ASTRO_REWRITE_SYMBOL: unique symbol;
```

#### <code v-pre>invokeEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L89) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export declare function invokeEndpoint<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(opts: InvokeEndpointOptions<TParams>): Promise<InvokeEndpointResult>;
```

#### <code v-pre>kiwaAstroNotFound</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L198) <code v-pre>packages/astro/src/render-astro-page.ts</code>

Construct a notFound signal the same way `Astro.notFound(response?)` does in production. Pages can `throw Astro.notFound()` to short-circuit; in kiwa tests the page can `throw kiwaAstroNotFound()` to be captured.

```ts
export declare function kiwaAstroNotFound(response?: Response): AstroNotFoundSignal;
```

#### <code v-pre>renderAstroPage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L129) <code v-pre>packages/astro/src/render-astro-page.ts</code>

Render a `.astro` page in isolation and capture HTML / Response / redirect / notFound / rewrite signals. The page receives a synthetic AstroContext with the same shape as the real `Astro` global.

```ts
export declare function renderAstroPage<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>>(opts: RenderAstroPageOptions<TProps, TParams, TLocals>): Promise<RenderAstroPageResult>;
```

#### <code v-pre>setupAstroViewTransitionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L262) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export declare function setupAstroViewTransitionEnv(options: SetupAstroViewTransitionEnvOptions): AstroViewTransitionEnv;
```

### 型

#### <code v-pre>APIRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L28) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export type APIRoute<TParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (context: SimulatedAPIContext<TParams>) => Promise<Response> | Response;
```

#### <code v-pre>AstroAfterPreparationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L61) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_PREPARATION)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to / newDocument は持たない。

```ts
export interface AstroAfterPreparationEvent {
    readonly type: 'astro:after-preparation';
}
```

#### <code v-pre>AstroAfterSwapEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L80) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

Astro 公式 router は `triggerEvent(TRANSITION_AFTER_SWAP)` で plain `Event` を dispatch する。 listener は `e.type` だけ参照可能で、 from / to は持たない (nav 後 URL は `document.location.href`)。

```ts
export interface AstroAfterSwapEvent {
    readonly type: 'astro:after-swap';
}
```

#### <code v-pre>AstroBeforePreparationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L49) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export interface AstroBeforePreparationEvent extends AstroViewTransitionEventPayload {
    readonly type: 'astro:before-preparation';
    defaultPrevented: boolean;
    preventDefault(): void;
    /** Loader を override 可能 (公式 router 互換、 navigate cancellation / replace 用) */
    loader: (() => Promise<void>) | undefined;
}
```

#### <code v-pre>AstroBeforeSwapEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L65) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>AstroNotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L27) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export interface AstroNotFoundSignal {
    readonly [ASTRO_NOT_FOUND_SYMBOL]: true;
    readonly response: Response | undefined;
}
```

#### <code v-pre>AstroPageComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L61) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export type AstroPageComponent<TProps extends Record<string, unknown> = Record<string, unknown>, TParams extends Record<string, string | undefined> = Record<string, string | undefined>, TLocals extends Record<string, unknown> = Record<string, unknown>> = (context: SimulatedAstroContext<TProps, TParams, TLocals>) => Promise<string | Response> | string | Response;
```

#### <code v-pre>AstroRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L21) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export interface AstroRedirectSignal {
    readonly [ASTRO_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly status: number;
}
```

#### <code v-pre>AstroRewriteSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L32) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export interface AstroRewriteSignal {
    readonly [ASTRO_REWRITE_SYMBOL]: true;
    readonly target: string | URL | Request;
}
```

#### <code v-pre>AstroSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L37) <code v-pre>packages/astro/src/render-astro-page.ts</code>

```ts
export type AstroSignal = AstroRedirectSignal | AstroNotFoundSignal | AstroRewriteSignal;
```

#### <code v-pre>AstroViewTransitionDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L168) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>AstroViewTransitionDomDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L183) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>AstroViewTransitionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L124) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>AstroViewTransitionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L84) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionEvent = AstroBeforePreparationEvent | AstroAfterPreparationEvent | AstroBeforeSwapEvent | AstroAfterSwapEvent;
```

#### <code v-pre>AstroViewTransitionEventPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L37) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>AstroViewTransitionEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L90) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionEventType = AstroViewTransitionEvent['type'];
```

#### <code v-pre>AstroViewTransitionListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L92) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

```ts
export type AstroViewTransitionListener<TEvent extends AstroViewTransitionEvent = AstroViewTransitionEvent> = (event: TEvent) => void | Promise<void>;
```

#### <code v-pre>InvokeEndpointOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L32) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

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

#### <code v-pre>InvokeEndpointResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L45) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

```ts
export interface InvokeEndpointResult {
    readonly response: Response;
    readonly redirect: {
        url: string;
        status: number;
    } | null;
}
```

#### <code v-pre>RenderAstroPageOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L69) <code v-pre>packages/astro/src/render-astro-page.ts</code>

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

#### <code v-pre>RenderAstroPageResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L86) <code v-pre>packages/astro/src/render-astro-page.ts</code>

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

#### <code v-pre>SetupAstroViewTransitionEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L96) <code v-pre>packages/astro/src/setup-view-transition-env.ts</code>

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

#### <code v-pre>SimulatedAPIContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/invoke-endpoint.ts#L13) <code v-pre>packages/astro/src/invoke-endpoint.ts</code>

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

#### <code v-pre>SimulatedAstroContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts#L39) <code v-pre>packages/astro/src/render-astro-page.ts</code>

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
