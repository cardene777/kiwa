---
title: "@kiwa-lab/nextjs semantics__partial-prerendering の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics&#95;&#95;partial-prerendering</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completePartialPrerendering</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L86) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function completePartialPrerendering(session: PartialPrerenderingSession): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>flushStreamingBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L67) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function flushStreamingBoundary(session: PartialPrerenderingSession, input: {
    holeId: string;
    html: string;
}): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>openDynamicHole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L48) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function openDynamicHole(session: PartialPrerenderingSession, input: {
    holeId: string;
    fallback: string;
}): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>renderStaticShell</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L33) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function renderStaticShell(session: PartialPrerenderingSession, html: string): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>startPartialPrerendering</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L15) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function startPartialPrerendering(input: {
    target: NextTarget;
    routeId: string;
}): PartialPrerenderingSession;
```

### 型

#### <code v-pre>PartialPrerenderingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L5) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export interface PartialPrerenderingSession {
    target: NextTarget;
    routeId: string;
    state: PartialPrerenderingState;
    shellHtml: string | null;
    dynamicHoles: Map<string, string>;
    streamedBoundaries: string[];
    history: AxisStep<PartialPrerenderingState>[];
}
```

#### <code v-pre>PartialPrerenderingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L3) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export type PartialPrerenderingState = 'idle' | 'static-shell' | 'dynamic-hole' | 'streaming' | 'completed';
```
