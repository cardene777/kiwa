---
title: "@kiwa-lab/perf-harness memory の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>memory</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>measureMemory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L40) <code v-pre>packages/perf-harness/src/memory.ts</code>

```ts
export declare function measureMemory(input: MemoryInput): Promise<MemorySample>;
```

### 型

#### <code v-pre>MemoryInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L23) <code v-pre>packages/perf-harness/src/memory.ts</code>

```ts
export interface MemoryInput {
    fn: () => Promise<unknown> | unknown;
    iterations: number;
    /**
     * 計測区間の前に空回しする回数 (default 0)。
     *
     * 初回の呼出には 1 回きりの確保が混ざる。 Node の Buffer は 8KB の pool 単位で
     * 伸びるため、 fs を触る対象では最初の数回で pool がまとめて確保され、
     * それを反復数で割った値が「1 回あたりの保持」 として報告される。
     * 実測では暖機 3 回で 15 反復の arrayBuffers 増分が 24576B から 0B になった。
     *
     * 既定を 0 にしているのは、 published API の直接の呼出で挙動を変えないため。
     * kiwa 内部の 3 層測定は `memoryWarmup` で明示的に渡す。
     */
    warmup?: number;
}
```

#### <code v-pre>MemorySample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L13) <code v-pre>packages/perf-harness/src/memory.ts</code>

measureMemory — capture heap deltas around a target function. Real production concerns include memory growth per call. A p95 of 5ms is useless if every call leaks 100KB of retained heap. This helper wraps a target function with a global.gc() + process.memoryUsage() bracket so tests can assert on `heapUsedDelta` / `rssUsedDelta` per call. Requires Node to be launched with `--expose-gc` for stable readings. When GC is not exposed we fall back to a delta without forced GC — the numbers are noisier but the trend still catches egregious leaks.

```ts
export interface MemorySample {
    iterationCount: number;
    heapUsedDeltaBytes: number;
    heapUsedDeltaPerIterationBytes: number;
    rssDeltaBytes: number;
    externalDeltaBytes: number;
    arrayBuffersDeltaBytes: number;
    gcExposed: boolean;
}
```
