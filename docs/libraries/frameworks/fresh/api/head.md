---
title: "@kiwa-lab/fresh head の API 契約"
---

# <code v-pre>@kiwa-lab/fresh</code> <code v-pre>head</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

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

#### <code v-pre>extractHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L233) <code v-pre>packages/fresh/src/head.ts</code>

Walk a Fresh virtual tree, harvest every `&lt;Head&gt;` or `&lt;head&gt;` element's children (meta / title / link / script / base), and merge them into a single HeadFragment. This mirrors Fresh's server-side head collection where any component can drop a `&lt;Head&gt;` block anywhere in the tree.

```ts
export declare function extractHead(tree: FreshChild): HeadFragment;
```

#### <code v-pre>HEAD&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L28) <code v-pre>packages/fresh/src/head.ts</code>

```ts
export declare const HEAD_SYMBOL: unique symbol;
```

#### <code v-pre>isHeadFragment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L96) <code v-pre>packages/fresh/src/head.ts</code>

Type guard: recognize a HeadFragment.

```ts
export declare function isHeadFragment(value: unknown): value is HeadFragment;
```

#### <code v-pre>mergeHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L114) <code v-pre>packages/fresh/src/head.ts</code>

Merge N head fragments in order. Later fragments override earlier ones: - `title` — last non-empty wins - `meta` — dedup by `name` / `property` / `httpEquiv` (in that order), with `charset` treated as a singleton (last wins) - `link` — dedup by `rel + href` - `script` — dedup by `src` (inline scripts are always kept) - `base` — last non-null wins

```ts
export declare function mergeHead(fragments: readonly HeadFragment[]): HeadFragment;
```

#### <code v-pre>renderHead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/head.ts#L194) <code v-pre>packages/fresh/src/head.ts</code>

Stringify a merged head into an HTML fragment. The rendering order is deterministic (`title` → `base` → `meta` → `link` → `script`) so tests can diff on the exact serialized shape.

```ts
export declare function renderHead(head: HeadFragment): string;
```

### 型

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
