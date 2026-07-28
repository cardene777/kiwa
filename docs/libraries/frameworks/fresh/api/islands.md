---
title: "@kiwa-lab/fresh islands の API 契約"
---

# <code v-pre>@kiwa-lab/fresh</code> <code v-pre>islands</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

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

#### <code v-pre>hydrateIslands</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L200) <code v-pre>packages/fresh/src/islands.ts</code>

Walk the SSR tree, find every `&lt;div data-island="Name"&gt;` placeholder, mount the matching island definition (decoding `data-props`), and produce a diff describing which islands hydrated / which registered islands never appeared in the SSR tree / which placeholders had no matching island.

```ts
export declare function hydrateIslands(opts: HydrateIslandsOptions): HydrateIslandsResult;
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

#### <code v-pre>mountIsland</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L116) <code v-pre>packages/fresh/src/islands.ts</code>

Mount an island synchronously — invokes the component fn with the merged props and captures the returned virtual tree. Collects any event handlers present in the tree so `simulateInteraction` can dispatch against them.

```ts
export declare function mountIsland<P extends IslandProps = IslandProps>(island: IslandDefinition<P>, props?: Partial<P>): IslandMount<P>;
```

#### <code v-pre>simulateInteraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L279) <code v-pre>packages/fresh/src/islands.ts</code>

Dispatch a synthetic event against a mounted island. `event` is the DOM event name (e.g. `click` / `input` / `submit`), `targetType` filters by element tag (e.g. only fire against `button` elements), and `value` is exposed on the event object for `input` handlers.

```ts
export declare function simulateInteraction(opts: SimulateInteractionOptions): SimulateInteractionResult;
```

### 型

#### <code v-pre>AnyIslandDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L174) <code v-pre>packages/fresh/src/islands.ts</code>

```ts
export type AnyIslandDefinition = IslandDefinition<any>;
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
