---
title: "@kiwa-lab/solidjs signal の API 契約"
---

# <code v-pre>@kiwa-lab/solidjs</code> <code v-pre>signal</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>batch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L168) <code v-pre>packages/solidjs/src/signal.ts</code>

Group multiple signal writes so subscribed effects run at most once for the whole batch (dedup via Set). Matches Solid's `batch()` semantics for tests.

```ts
export declare function batch<T>(fn: () => T): T;
```

#### <code v-pre>createResourceStub</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L193) <code v-pre>packages/solidjs/src/signal.ts</code>

Mock Solid's `createResource(fetcher)` — awaits the fetcher, exposes `resource()` accessor + `resource.state` + `refetch()` + `mutate()`. Tests can drive the resource lifecycle explicitly without racing against a real async runtime.

```ts
export declare function createResourceStub<T>(fetcher: () => Promise<T> | T): ResourceHandle<T>;
```

#### <code v-pre>EFFECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L18) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export declare const EFFECT_SYMBOL: unique symbol;
```

#### <code v-pre>isEffectHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L242) <code v-pre>packages/solidjs/src/signal.ts</code>

Type guard: recognize a mockEffect handle.

```ts
export declare function isEffectHandle(value: unknown): value is EffectHandle<unknown>;
```

#### <code v-pre>isResourceAccessor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L251) <code v-pre>packages/solidjs/src/signal.ts</code>

Type guard: recognize a createResourceStub accessor.

```ts
export declare function isResourceAccessor(value: unknown): value is ResourceAccessor<unknown>;
```

#### <code v-pre>isSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L237) <code v-pre>packages/solidjs/src/signal.ts</code>

Type guard: recognize a mockSignal getter (used by helpers + tests).

```ts
export declare function isSignal(value: unknown): value is SignalGetter<unknown>;
```

#### <code v-pre>mockEffect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L131) <code v-pre>packages/solidjs/src/signal.ts</code>

Run a Solid-shaped `createEffect(fn)` — the body is invoked immediately and again every time a subscribed signal changes. Every run captures which signal values were read into an ordered trace so tests can assert on the exact sequence of transitions.

```ts
export declare function mockEffect<T>(fn: () => T): EffectHandle<T>;
```

#### <code v-pre>mockSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L81) <code v-pre>packages/solidjs/src/signal.ts</code>

Create a Solid-shaped Signal without a Solid runtime. Returns `[get, set]` where reading the getter inside a `mockEffect` body subscribes the effect, and writing through the setter re-runs subscribed effects (deduplicated inside `batch()`).

```ts
export declare function mockSignal<T>(initial: T): readonly [SignalGetter<T>, SignalSetter<T>];
```

#### <code v-pre>RESOURCE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L19) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export declare const RESOURCE_SYMBOL: unique symbol;
```

#### <code v-pre>SIGNAL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L17) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export declare const SIGNAL_SYMBOL: unique symbol;
```

#### <code v-pre>track</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L106) <code v-pre>packages/solidjs/src/signal.ts</code>

Run `fn` and capture every signal it reads. Useful for asserting a component body reads the expected signals before committing to a full effect subscribe.

```ts
export declare function track<T>(fn: () => T): {
    result: T;
    reads: SignalGetter<unknown>[];
};
```

### 型

#### <code v-pre>EffectHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L118) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export interface EffectHandle<T> {
    readonly [EFFECT_SYMBOL]: true;
    readonly runCount: () => number;
    readonly trace: () => ReadonlyArray<EffectTraceEntry<T>>;
    readonly dispose: () => void;
}
```

#### <code v-pre>EffectTraceEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L31) <code v-pre>packages/solidjs/src/signal.ts</code>

Effect trace entry — captures which signal values the body observed on that run.

```ts
export interface EffectTraceEntry<T> {
    readonly runIndex: number;
    readonly readValues: T[];
}
```

#### <code v-pre>ResourceAccessor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L39) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export interface ResourceAccessor<T> {
    (): T | undefined;
    readonly state: ResourceState;
    readonly loading: boolean;
    readonly error: unknown;
    readonly latest: T | undefined;
    readonly [RESOURCE_SYMBOL]: true;
}
```

#### <code v-pre>ResourceActions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L48) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export interface ResourceActions<T> {
    readonly refetch: () => Promise<T | undefined>;
    readonly mutate: (value: T | undefined) => T | undefined;
}
```

#### <code v-pre>ResourceHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L53) <code v-pre>packages/solidjs/src/signal.ts</code>

```ts
export interface ResourceHandle<T> {
    readonly accessor: ResourceAccessor<T>;
    readonly actions: ResourceActions<T>;
    readonly initialFetch: Promise<T | undefined>;
}
```

#### <code v-pre>ResourceState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L37) <code v-pre>packages/solidjs/src/signal.ts</code>

Resource state — mirrors Solid's `resource.state` machine.

```ts
export type ResourceState = 'unresolved' | 'pending' | 'ready' | 'errored' | 'refreshing';
```

#### <code v-pre>SignalGetter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L22) <code v-pre>packages/solidjs/src/signal.ts</code>

Read accessor for a mockSignal — mirrors Solid's `[getter, setter] = createSignal()`.

```ts
export type SignalGetter<T> = {
    (): T;
    readonly [SIGNAL_SYMBOL]: true;
};
```

#### <code v-pre>SignalSetter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/signal.ts#L28) <code v-pre>packages/solidjs/src/signal.ts</code>

Write setter for a mockSignal — accepts a next value or an updater fn.

```ts
export type SignalSetter<T> = (next: T | ((prev: T) => T)) => T;
```
