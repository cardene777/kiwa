---
title: "@kiwa-lab/nextjs semantics__turbopack-hmr の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics&#95;&#95;turbopack-hmr</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>applyHmrPatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L80) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function applyHmrPatch(session: TurbopackHmrSession): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>completeFastRefresh</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L92) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function completeFastRefresh(session: TurbopackHmrSession): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>findHmrBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L68) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function findHmrBoundary(session: TurbopackHmrSession, boundaryModuleId: string): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>markModuleUpdated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L56) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function markModuleUpdated(session: TurbopackHmrSession, moduleId: string): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>startTurbopackHmr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L39) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function startTurbopackHmr(input: {
    target: NextTarget;
    sessionId: string;
}): TurbopackHmrSession;
```

### 型

#### <code v-pre>TurbopackHmrSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L10) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export interface TurbopackHmrSession {
    target: NextTarget;
    sessionId: string;
    updatedModuleIds: string[];
    boundaryModuleId: string | null;
    state: TurbopackHmrState;
    history: AxisStep<TurbopackHmrState>[];
}
```

#### <code v-pre>TurbopackHmrState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L8) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

v1.49 turbopack-hmr axis — Next.js 15 Turbopack HMR + fast refresh を target-neutral に扱う state machine。 pages-router では webpack HMR、 edge-runtime では esbuild HMR に mapping。

```ts
export type TurbopackHmrState = 'idle' | 'updating' | 'boundary-found' | 'applied' | 'refresh-completed';
```
