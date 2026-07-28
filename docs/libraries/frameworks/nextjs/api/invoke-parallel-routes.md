---
title: "@kiwa-lab/nextjs invoke-parallel-routes の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>invoke-parallel-routes</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeParallelRoutes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L120) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

Invoke an App Router parallel-routes layout in isolation. All slot components are rendered in parallel (Promise.all) so a slow slot cannot block fast siblings; per-slot errors are captured into `slotResults` without aborting the layout render.

```ts
export declare function invokeParallelRoutes<TSlots extends string, TLayoutProps = Record<string, unknown>, TNode = unknown>(opts: InvokeParallelRoutesOptions<TSlots, TLayoutProps, TNode>): Promise<InvokeParallelRoutesResult<TSlots, TNode>>;
```

#### <code v-pre>PARALLEL&#95;INTERCEPTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L20) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export declare const PARALLEL_INTERCEPTION_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>DefaultFallbackComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L34) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type DefaultFallbackComponent<TNode = unknown> = () => Promise<TNode> | TNode;
```

#### <code v-pre>InterceptionMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L22) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InterceptionMatch<TSlot extends string> {
    readonly [PARALLEL_INTERCEPTION_SYMBOL]: true;
    readonly slot: TSlot;
    readonly variant: 'intercepted' | 'default';
    readonly url: string;
    readonly distance: 'sibling' | 'parent' | 'root';
}
```

#### <code v-pre>InvokeParallelRoutesOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L57) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InvokeParallelRoutesOptions<TSlots extends string, TLayoutProps, TNode = unknown> {
    readonly layout: ParallelLayoutFunction<TSlots, TLayoutProps, TNode>;
    readonly children: SlotComponent<Record<string, unknown>, TNode>;
    readonly childrenProps?: Record<string, unknown>;
    readonly slots: ReadonlyArray<SlotInput<TSlots, TNode>>;
    readonly layoutProps?: TLayoutProps;
}
```

#### <code v-pre>InvokeParallelRoutesResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L73) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InvokeParallelRoutesResult<TSlots extends string, TNode = unknown> {
    readonly tree: TNode | null;
    readonly slotResults: ReadonlyArray<SlotRenderResult<TSlots, TNode>>;
    readonly childrenError: unknown;
    readonly layoutError: unknown;
}
```

#### <code v-pre>ParallelLayoutChildren</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L36) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface ParallelLayoutChildren<TSlots extends string, TNode = unknown> {
    readonly children: TNode;
    readonly slots: Readonly<Record<TSlots, TNode>>;
}
```

#### <code v-pre>ParallelLayoutFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L41) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type ParallelLayoutFunction<TSlots extends string, TLayoutProps, TNode = unknown> = (props: TLayoutProps & ParallelLayoutChildren<TSlots, TNode>) => Promise<TNode> | TNode;
```

#### <code v-pre>SlotComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L30) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type SlotComponent<TProps = Record<string, unknown>, TNode = unknown> = (props: TProps) => Promise<TNode> | TNode;
```

#### <code v-pre>SlotInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L45) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface SlotInput<TSlots extends string, TNode = unknown> {
    readonly slot: TSlots;
    readonly component: SlotComponent<Record<string, unknown>, TNode> | null;
    readonly props?: Record<string, unknown>;
    readonly defaultFallback?: DefaultFallbackComponent<TNode>;
    readonly intercepting?: {
        readonly variant: 'intercepted' | 'default';
        readonly url: string;
        readonly distance?: 'sibling' | 'parent' | 'root';
    };
}
```

#### <code v-pre>SlotRenderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L65) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface SlotRenderResult<TSlots extends string, TNode = unknown> {
    readonly slot: TSlots;
    readonly tree: TNode | null;
    readonly usedDefault: boolean;
    readonly interception: InterceptionMatch<TSlots> | null;
    readonly error: unknown;
}
```
