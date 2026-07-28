---
title: "@kiwa-lab/nextjs setup-next-rsc-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>setup-next-rsc-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>RSC&#95;ERROR&#95;BOUNDARY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L26) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export declare const RSC_ERROR_BOUNDARY_SYMBOL: unique symbol;
```

#### <code v-pre>setupNextRscEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L199) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

Drive an async RSC stream through a single Suspense boundary and capture every chunk + the fallback + the resolved subtree + any error-boundary trigger. The helper is deterministic — chunks arrive in the order the source yields them, and the timeout is wall-clock-bounded so tests cannot hang on a stuck stream. Typical usage: const env = await setupNextRscEnv({ dataSource: streamItems(), suspenseFallback: &lt;Skeleton /&gt;, streamingTimeout: 1000, }); expect(env.fallback).toEqual(&lt;Skeleton /&gt;); expect(env.chunks).toHaveLength(3); expect(env.resolved).toEqual(&lt;ItemList items={items} /&gt;); expect(env.errorBoundary).toBeNull(); expect(env.timedOut).toBe(false);

```ts
export declare function setupNextRscEnv(opts?: SetupNextRscEnvOptions): Promise<SetupNextRscEnvResult>;
```

### 型

#### <code v-pre>RscErrorBoundarySignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L28) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface RscErrorBoundarySignal {
    readonly [RSC_ERROR_BOUNDARY_SYMBOL]: true;
    readonly error: unknown;
}
```

#### <code v-pre>RscStreamSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L46) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

An async source the helper consumes chunk-by-chunk. Each yielded value is one streaming frame; the helper appends it to `env.chunks` in arrival order and uses the last chunk as `env.resolved` once the source completes. Use a plain async generator for most cases: async function* source() { yield &lt;Spinner /&gt;; // initial chunk yield &lt;Skeleton rows={3} /&gt;; // partial data yield &lt;Items list={data} /&gt;; // final resolved chunk }

```ts
export type RscStreamSource = AsyncIterable<RscNode>;
```

#### <code v-pre>SetupNextRscEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L48) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface SetupNextRscEnvOptions {
    /**
     * The async server component under test. If `dataSource` is omitted, the
     * helper awaits this function once and treats its return value as the only
     * (resolved) chunk — equivalent to a synchronous resolution.
     *
     * The component may throw to trigger the error boundary path. See
     * `injectError` for the test-side variant.
     */
    readonly component?: (props: Record<string, unknown>) => Promise<RscNode> | RscNode;
    /**
     * Optional props forwarded to `component`. Defaults to `{}`.
     */
    readonly props?: Record<string, unknown>;
    /**
     * Explicit streaming source. When provided, the helper iterates this and
     * ignores `component`. Useful when the production code already produces a
     * stream and the test wants to feed a deterministic sequence.
     */
    readonly dataSource?: RscStreamSource;
    /**
     * Markup shown while the (first) chunk is pending. Captured as
     * `env.fallback` so tests can assert that `<Suspense fallback={...}>`
     * surfaces the right loading state before the data arrives.
     */
    readonly suspenseFallback?: RscNode;
    /**
     * Hard timeout (ms) for the whole stream. If the source has not completed
     * by this deadline, the helper resolves with `env.timedOut = true` and the
     * chunks collected so far. Default 5000ms.
     */
    readonly streamingTimeout?: number;
    /**
     * Test-side error injection. When set, the helper short-circuits before
     * iterating the source and routes the error into `env.errorBoundary` —
     * the same shape a production `error.tsx` boundary would see.
     */
    readonly injectError?: unknown;
}
```

#### <code v-pre>SetupNextRscEnvResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L88) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface SetupNextRscEnvResult {
    /**
     * Streaming chunks in arrival order. For a Suspense boundary, the first
     * chunk is typically the fallback markup and the last chunk is the
     * resolved subtree.
     */
    readonly chunks: RscNode[];
    /**
     * The fallback markup captured before the source produced its first
     * non-fallback chunk. `null` when the test did not pass `suspenseFallback`
     * or when the source resolved synchronously without an explicit fallback.
     */
    readonly fallback: RscNode | null;
    /**
     * The last chunk yielded by the source — the markup a real Next.js page
     * would settle on after streaming finishes. `null` when the source threw
     * or timed out before producing any chunk.
     */
    readonly resolved: RscNode | null;
    /**
     * Set when the component or source threw, or when `injectError` was
     * provided. Mirrors the value a production `error.tsx` boundary receives.
     * `null` for happy-path streams.
     */
    readonly errorBoundary: RscErrorBoundarySignal | null;
    /**
     * `true` when `streamingTimeout` elapsed before the source completed.
     * `chunks` still contains any chunks that arrived before the deadline.
     */
    readonly timedOut: boolean;
}
```
