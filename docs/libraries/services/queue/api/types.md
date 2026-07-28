---
title: "@kiwa-lab/queue types の API 契約"
---

# <code v-pre>@kiwa-lab/queue</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>BullMQMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L13) <code v-pre>packages/queue/src/types.ts</code>

BullMQ backend selection. - `testcontainers`: start a real Redis in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker + the `testcontainers` + `bullmq` + `ioredis` peer dependencies. - `sandbox`: run against an in-process Redis-compatible stub tied to the test process only. Fast (no container startup), fully offline, and sufficient for a large slice of BullMQ semantics (add / process / retry / fail / drain) but does not exercise Redis-side pipelining semantics.

```ts
export type BullMQMode = 'testcontainers' | 'sandbox';
```

#### <code v-pre>BullMQTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L116) <code v-pre>packages/queue/src/types.ts</code>

Return type of {@link setupBullMQEnv }. Reads much like a mini BullMQ facade — consumers register a processor, add jobs, then use the assertion helpers to observe outcomes without touching BullMQ directly.

```ts
export interface BullMQTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: BullMQMode;
    /** Queue name in use. */
    queueName: string;
    /** Optional Redis connection URL — undefined in sandbox mode. */
    redisUrl: string | undefined;
    /** Register the processor. Overwrites any previous processor. */
    process: <TData = unknown, TResult = unknown>(processor: JobProcessor<TData, TResult>) => void;
    /** Enqueue a job by name + data. Returns the snapshot at enqueue time. */
    addJob: <TData = unknown>(name: string, data: TData, options?: QueueJobOptions) => Promise<QueueJobSnapshot<TData>>;
    /**
     * Wait for at least one job matching `name` to reach a terminal state
     * (`completed` or `failed`). Rejects on timeout (default 5s).
     */
    waitForJob: <TData = unknown, TResult = unknown>(name: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<QueueJobSnapshot<TData, TResult>>;
    /** Assertion — the first job named `name` reached `completed`. */
    assertProcessed: <TData = unknown, TResult = unknown>(name: string, expected?: {
        returnValue?: TResult | undefined;
    } | undefined) => Promise<QueueJobSnapshot<TData, TResult>>;
    /** Assertion — the first job named `name` reached `failed`. */
    assertFailed: <TData = unknown>(name: string, expected?: {
        retry?: number | undefined;
        reasonMatch?: RegExp | undefined;
    } | undefined) => Promise<QueueJobSnapshot<TData>>;
    /** Assertion — the first job named `name` ran `expectedRetry` times before terminal. */
    assertRetried: <TData = unknown>(name: string, expectedRetry: number) => Promise<QueueJobSnapshot<TData>>;
    /** Assertion — the queue has no waiting / active jobs. */
    assertQueueDrained: () => Promise<void>;
    /** Introspection helper — list every snapshot the queue has ever seen. */
    listJobs: () => QueueJobSnapshot[];
}
```

#### <code v-pre>JobProcessor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L62) <code v-pre>packages/queue/src/types.ts</code>

Processor signature — matches the shape of a bullmq `Worker` processor fn.

```ts
export type JobProcessor<TData = unknown, TResult = unknown> = (job: QueueJobSnapshot<TData, TResult>) => Promise<TResult> | TResult;
```

#### <code v-pre>JobState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L22) <code v-pre>packages/queue/src/types.ts</code>

Job lifecycle states surfaced by the helper.

```ts
export type JobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
```

#### <code v-pre>QueueJobOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L52) <code v-pre>packages/queue/src/types.ts</code>

Options accepted by every {@link BullMQTestEnv.addJob} call. Mirrors the subset of `bullmq.JobsOptions` we honour in both testcontainers and sandbox modes.

```ts
export interface QueueJobOptions {
    /** Retry count when the processor throws. `bullmq.JobsOptions.attempts`. */
    attempts?: number | undefined;
    /** Delay before the job becomes eligible (ms). */
    delay?: number | undefined;
    /** Explicit job id — otherwise the queue assigns a monotonically increasing id. */
    jobId?: string | undefined;
}
```

#### <code v-pre>QueueJobSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L37) <code v-pre>packages/queue/src/types.ts</code>

Structural mirror of a persisted job — decoupled from BullMQ's own types.

```ts
export interface QueueJobSnapshot<TData = unknown, TResult = unknown> {
    id: string;
    name: string;
    data: TData;
    state: JobState;
    attemptsMade: number;
    returnValue?: TResult | undefined;
    failedReason?: string | undefined;
}
```

#### <code v-pre>SetupBullMQEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L70) <code v-pre>packages/queue/src/types.ts</code>

Common options for the `setupBullMQEnv` factory. `mode` chooses the backend; `redis` and `sandbox` are backend-specific overrides.

```ts
export interface SetupBullMQEnvOptions {
    /**
     * Backend selector. Defaults to `'sandbox'` when omitted — the fast, offline
     * path suitable for unit tests. Use `'testcontainers'` for integration-shaped
     * suites that exercise the real BullMQ + Redis roundtrip.
     */
    mode?: BullMQMode | undefined;
    /**
     * testcontainers overrides. Ignored when `mode === 'sandbox'`.
     */
    redis?: {
        /** Docker image tag. Defaults to `redis:7-alpine`. */
        image?: string | undefined;
        /**
         * Optional externally-managed Redis connection URL. When supplied the
         * helper skips container creation entirely.
         */
        url?: string | undefined;
    } | undefined;
    /**
     * sandbox overrides. Ignored when `mode === 'testcontainers'`.
     */
    sandbox?: {
        /**
         * How often to poll the sandbox scheduler when processing delayed jobs
         * (ms). Defaults to 1 which is the finest resolution the current
         * implementation supports.
         */
        pollIntervalMs?: number | undefined;
    } | undefined;
    /**
     * Queue name — mirrors `new Queue(name)` in real BullMQ. Defaults to
     * `'test-queue'`.
     */
    queueName?: string | undefined;
}
```
