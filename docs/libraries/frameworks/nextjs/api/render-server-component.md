---
title: "@kiwa-lab/nextjs render-server-component の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>render-server-component</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>findAll</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L77) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Recursively walk an RSC tree and collect every node that satisfies the predicate. Children are read from `props.children` and are normalized to a flat array regardless of how the component spelled them.

```ts
export declare function findAll(tree: RscNode, predicate: (node: RscElement) => boolean): RscElement[];
```

#### <code v-pre>FORBIDDEN&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L16) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const FORBIDDEN_SYMBOL: unique symbol;
```

#### <code v-pre>NOT&#95;FOUND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L15) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const NOT_FOUND_SYMBOL: unique symbol;
```

#### <code v-pre>renderServerComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L127) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Invoke an async server component in isolation and capture its return tree. Throws of `notFound() / forbidden() / redirect()` from `next/navigation` should be replaced with the kiwa signals below (Pattern A from the server-action seam doc); the helper normalizes them into `result.signal` instead of leaving them as `result.error`.

```ts
export declare function renderServerComponent<TProps = Record<string, unknown>>(opts: RenderServerComponentOptions<TProps>): Promise<RenderServerComponentResult>;
```

#### <code v-pre>RSC&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L17) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const RSC_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>textContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L100) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Concatenate every string/number leaf of an RSC tree, joined by a single space. Useful for `expect(textContent(tree)).toContain('hello')` style assertions where the exact element structure does not matter.

```ts
export declare function textContent(tree: RscNode): string;
```

### 型

#### <code v-pre>ForbiddenSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L22) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface ForbiddenSignal {
    readonly [FORBIDDEN_SYMBOL]: true;
}
```

#### <code v-pre>NotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L19) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface NotFoundSignal {
    readonly [NOT_FOUND_SYMBOL]: true;
}
```

#### <code v-pre>RenderServerComponentOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L41) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RenderServerComponentOptions<TProps> {
    readonly component: (props: TProps) => Promise<RscNode> | RscNode;
    readonly props?: TProps;
}
```

#### <code v-pre>RenderServerComponentResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L46) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RenderServerComponentResult {
    readonly tree: RscNode;
    readonly signal: RscSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>RscElement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L33) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RscElement {
    readonly type: string | symbol | ((props: Record<string, unknown>) => unknown);
    readonly props: Record<string, unknown>;
    readonly key: string | null;
}
```

#### <code v-pre>RscNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L39) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export type RscNode = RscElement | string | number | boolean | null | undefined | RscNode[];
```

#### <code v-pre>RscRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L25) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RscRedirectSignal {
    readonly [RSC_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly type: 'replace' | 'push';
}
```

#### <code v-pre>RscSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L31) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export type RscSignal = NotFoundSignal | ForbiddenSignal | RscRedirectSignal;
```
