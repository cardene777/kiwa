---
title: "@kiwa-lab/astro render-astro-page の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/astro</code> <code v-pre>render-astro-page</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/render-astro-page.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

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

### 型

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
