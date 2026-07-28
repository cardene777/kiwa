---
title: "@kiwa-lab/perf-harness concurrent の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>concurrent</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>measureConcurrent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L35) <code v-pre>packages/perf-harness/src/concurrent.ts</code>

```ts
export declare function measureConcurrent(input: ConcurrentInput): Promise<MeasureResult>;
```

### 型

#### <code v-pre>ConcurrentInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L27) <code v-pre>packages/perf-harness/src/concurrent.ts</code>

measureConcurrent — drive `fn` under a fixed concurrency load and record per-call latency. Real production traffic is not serial. A p95 that looks fine at `iterations = 200, concurrency = 1` (the default `measure`) can collapse once N clients hit the same code path at once because contention on the shared engine / recorder / queue kicks in. This helper spawns `concurrency` parallel workers, each of which loops `iterationsPerWorker` times. Total sample count = concurrency × iterationsPerWorker. Every sample is a wall-clock per-call latency (from `process.hrtime.bigint()` around each `fn()` invocation). Returned {@link MeasureResult} has the same shape as `measure` so downstream regression / gate / report code does not need to branch.

```ts
export interface ConcurrentInput {
    name: string;
    fn: () => Promise<unknown> | unknown;
    concurrency: number;
    iterationsPerWorker: number;
    warmup?: number;
}
```
