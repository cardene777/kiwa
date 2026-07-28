---
title: "@kiwa-lab/queue inngest__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>inngest&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>InngestDevServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L114) <code v-pre>packages/queue/src/inngest/types.ts</code>

Options for the `dev-server` backend. Either supply `url` to point at an externally managed dev-server, or leave `url` undefined to let the helper spawn one via `npx inngest-cli@latest dev`.

```ts
export interface InngestDevServerOptions {
    /** Existing dev-server URL (e.g. `http://127.0.0.1:8288`). */
    url?: string | undefined;
    /** Port for the auto-spawned dev-server. Defaults to `8288`. */
    port?: number | undefined;
    /**
     * Milliseconds to wait for the auto-spawned dev-server before timing out.
     * Defaults to `15000`.
     */
    startupTimeoutMs?: number | undefined;
}
```

#### <code v-pre>InngestEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L34) <code v-pre>packages/queue/src/inngest/types.ts</code>

Structural mirror of an Inngest event — decoupled from the `inngest` SDK types so tests can build events without importing from the SDK.

```ts
export interface InngestEvent<TData = unknown> {
    /** Event name — Inngest routes events to functions by matching this field. */
    name: string;
    /** Arbitrary event payload. */
    data: TData;
    /** Optional event id — dev-server assigns one when omitted. */
    id?: string | undefined;
    /** Optional ISO timestamp — defaults to the send time. */
    ts?: number | undefined;
    /** Optional user object — matches the `user` field on real Inngest events. */
    user?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>InngestFunctionContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L62) <code v-pre>packages/queue/src/inngest/types.ts</code>

Context surfaced to an Inngest function handler.

```ts
export interface InngestFunctionContext<TData = unknown> {
    event: InngestEvent<TData>;
    step: InngestStepContext;
    attempt: number;
}
```

#### <code v-pre>InngestFunctionDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L77) <code v-pre>packages/queue/src/inngest/types.ts</code>

Registered function definition. Structural mirror of the `inngest.createFunction` argument set.

```ts
export interface InngestFunctionDefinition<TData = unknown, TResult = unknown> {
    /** Stable identifier for the function — matches `id` in `inngest.createFunction`. */
    id: string;
    /** Event that triggers this function. Matches `event.name` on send. */
    event: string;
    /**
     * Retry count — total number of attempts including the first. Defaults to 1
     * (no retries). Matches the `retries` field on `inngest.createFunction`.
     */
    retries?: number | undefined;
    /**
     * Optional concurrency cap. `stub` mode enforces this by queuing extra events
     * behind the cap and running them sequentially. Defaults to unbounded.
     */
    concurrency?: number | undefined;
    /** Function body — receives `event` + `step` + `attempt`. */
    handler: InngestFunctionHandler<TData, TResult>;
}
```

#### <code v-pre>InngestFunctionHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L69) <code v-pre>packages/queue/src/inngest/types.ts</code>

Function handler signature — mirrors the `handler` parameter of `inngest.createFunction`.

```ts
export type InngestFunctionHandler<TData = unknown, TResult = unknown> = (ctx: InngestFunctionContext<TData>) => Promise<TResult> | TResult;
```

#### <code v-pre>InngestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L14) <code v-pre>packages/queue/src/inngest/types.ts</code>

Inngest backend selection. - `stub`: fully in-process. Functions register by name + event key, and `sendEvent` invokes them directly without going through the Inngest wire protocol. Fast, offline, deterministic. Suitable for unit tests that need to exercise retry / step / concurrency semantics without a dev-server. - `dev-server`: talks to a real Inngest dev-server (either an externally managed one supplied via `devServer.url` or one spawned by the helper). Exercises the actual event dispatch + function execution round-trip. Best for integration lanes that need prod-shape parity.

```ts
export type InngestMode = 'stub' | 'dev-server';
```

#### <code v-pre>InngestRunSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L97) <code v-pre>packages/queue/src/inngest/types.ts</code>

Snapshot of a single function run — the shape assertion helpers observe.

```ts
export interface InngestRunSnapshot<TData = unknown, TResult = unknown> {
    runId: string;
    functionId: string;
    event: InngestEvent<TData>;
    state: InngestRunState;
    attemptsMade: number;
    returnValue?: TResult | undefined;
    failedReason?: string | undefined;
    /** Ordered list of step ids the run executed (including sleeps). */
    stepsRun: string[];
}
```

#### <code v-pre>InngestRunState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L23) <code v-pre>packages/queue/src/inngest/types.ts</code>

Terminal + intermediate states an Inngest function run can reach.

```ts
export type InngestRunState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
```

#### <code v-pre>InngestStepContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L51) <code v-pre>packages/queue/src/inngest/types.ts</code>

Shape passed to a step's handler. Mirrors the surface the `step` object on a real Inngest function exposes for the pieces of the API we honour.

```ts
export interface InngestStepContext {
    /**
     * Run a named step. The `run` name is what tests observe through
     * `assertStepRan(functionId, stepId)`.
     */
    run: <T>(stepId: string, fn: () => Promise<T> | T) => Promise<T>;
    /** Sleep for `ms` milliseconds — stub mode advances a virtual clock. */
    sleep: (stepId: string, ms: number) => Promise<void>;
}
```

#### <code v-pre>InngestTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L148) <code v-pre>packages/queue/src/inngest/types.ts</code>

Return type of {@link setupInngestEnv }. Same surface across both backends so consumer tests can switch modes with a one-argument change.

```ts
export interface InngestTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: InngestMode;
    /** App id in use. */
    appId: string;
    /** Optional dev-server URL — undefined in stub mode. */
    devServerUrl: string | undefined;
    /** Register (or replace) a function definition after env creation. */
    registerFunction: <TData = unknown, TResult = unknown>(fn: InngestFunctionDefinition<TData, TResult>) => void;
    /**
     * Send an event by name + data. Returns the event id. The env dispatches
     * matching functions asynchronously — use `assertFunctionRan` / etc. to await
     * outcomes.
     */
    sendEvent: <TData = unknown>(name: string, data: TData) => Promise<string>;
    /**
     * Await the first run of `functionId` reaching a terminal state
     * (`completed` / `failed` / `cancelled`). Rejects on timeout (default 5s).
     */
    waitForRun: <TData = unknown, TResult = unknown>(functionId: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<InngestRunSnapshot<TData, TResult>>;
    /** Assertion — the first run of `functionId` reached `completed`. */
    assertFunctionRan: <TData = unknown, TResult = unknown>(functionId: string, expected?: {
        returnValue?: TResult | undefined;
    } | undefined) => Promise<InngestRunSnapshot<TData, TResult>>;
    /** Assertion — the first run of `functionId` failed. */
    assertFunctionFailed: <TData = unknown>(functionId: string, expected?: {
        attempts?: number | undefined;
        reasonMatch?: RegExp | undefined;
    } | undefined) => Promise<InngestRunSnapshot<TData>>;
    /** Assertion — the first run of `functionId` ran `expectedAttempts` times. */
    assertRetried: <TData = unknown>(functionId: string, expectedAttempts: number) => Promise<InngestRunSnapshot<TData>>;
    /** Assertion — the first run of `functionId` executed `stepId`. */
    assertStepRan: <TData = unknown>(functionId: string, stepId: string) => Promise<InngestRunSnapshot<TData>>;
    /**
     * Assertion — the queue has no queued / running runs. Waits up to 250ms for
     * inflight runs to settle, then throws if any remain.
     */
    assertQueueDrained: () => Promise<void>;
    /** Introspection helper — every run snapshot the env has ever seen. */
    listRuns: () => InngestRunSnapshot[];
}
```

#### <code v-pre>SetupInngestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L127) <code v-pre>packages/queue/src/inngest/types.ts</code>

Common options for the `setupInngestEnv` factory.

```ts
export interface SetupInngestEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: InngestMode | undefined;
    /**
     * Function definitions registered against the env. Registering a duplicate
     * `id` overwrites the previous one.
     */
    functions?: InngestFunctionDefinition[] | undefined;
    /** dev-server overrides. Ignored when `mode === 'stub'`. */
    devServer?: InngestDevServerOptions | undefined;
    /**
     * Inngest app name — mirrors `new Inngest({ id })` on the real SDK. Defaults
     * to `'kiwa-test-app'`.
     */
    appId?: string | undefined;
}
```
