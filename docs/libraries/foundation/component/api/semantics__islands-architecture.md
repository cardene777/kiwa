---
title: "@kiwa-lab/component semantics__islands-architecture の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics&#95;&#95;islands-architecture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>assertStaticBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L122) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export declare function assertStaticBoundary(session: IslandsSession, boundaryId: string): AxisStep<IslandsState>;
```

#### <code v-pre>beginIslandHydration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L82) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export declare function beginIslandHydration(session: IslandsSession, islandId: string): AxisStep<IslandsState>;
```

#### <code v-pre>bootstrapIslandsRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L51) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export declare function bootstrapIslandsRoute(input: {
    target: ComponentTarget;
    routeId: string;
}): IslandsSession;
```

#### <code v-pre>markIslandInteractive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L100) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export declare function markIslandInteractive(session: IslandsSession, islandId: string): AxisStep<IslandsState>;
```

#### <code v-pre>registerIsland</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L69) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export declare function registerIsland(session: IslandsSession, island: IslandSpec): AxisStep<IslandsState>;
```

### 型

#### <code v-pre>IslandSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L15) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export interface IslandSpec {
    islandId: string;
    loadStrategy: 'load' | 'idle' | 'visible' | 'media' | 'only';
    interactiveBoundary: boolean;
}
```

#### <code v-pre>IslandsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L21) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

```ts
export interface IslandsSession {
    target: ComponentTarget;
    routeId: string;
    islands: IslandSpec[];
    state: IslandsState;
    hydratedIslandIds: string[];
    staticBoundaryIds: string[];
    history: AxisStep<IslandsState>[];
}
```

#### <code v-pre>IslandsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L8) <code v-pre>packages/component/src/semantics/islands-architecture.ts</code>

v1.49 islands-architecture axis — Astro / Deno Fresh / Solid Start の Islands architecture (partial hydration + selective interactivity) を target-neutral に扱う state machine。

```ts
export type IslandsState = 'idle' | 'registered' | 'hydrating' | 'interactive' | 'static-verified';
```
