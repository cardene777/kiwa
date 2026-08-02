---
title: "@kiwa-lab/perf-harness memory の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>memory</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>measureMemory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L93) <code v-pre>packages/perf-harness/src/memory.ts</code>

```ts
export declare function measureMemory(input: MemoryInput): Promise<MemorySample>;
```

### 型

#### <code v-pre>MemoryInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L55) <code v-pre>packages/perf-harness/src/memory.ts</code>

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
    /**
     * 測定区間を何回に分けるか (default 1、 #1719)。
     *
     * 2 以上を渡すと `iterations` 回の区間をその数だけ続けて回し、
     * **最後の区間の増分だけ** を代表値として返す。 手前の区間は捨てる。
     *
     * fs を触る op では Node の Buffer pool が反復数に応じて段階的に伸びる。
     * 空回し (`warmup`) は固定回数なので、 反復数が増えるとその先で pool が
     * また伸び、 1 区間しか測らないと伸びた分が「1 回あたりの保持」 として載る。
     * 実測では `file_scaffold_workflow` の増分が同じ実装のまま
     * 118,387 から 198,899 B まで動き、 上限 102,400 B を跨いでいた (#1719)。
     *
     * 区間を分けると、 手前の区間が反復数ぶんの pool の伸びを引き受け、
     * 最後の区間には飽和後の増分だけが残る。 反復ごとに実際に保持している op は
     * どの区間でも同じ量を出すため、 検知は落ちない。
     *
     * 既定を 1 にしているのは、 published API の直接の呼出で挙動を変えないため。
     * `fn` の呼出回数が倍になるので、 副作用を持つ op では既定のまま変えない方が安全である。
     * kiwa 内部の 3 層測定は `memoryWindows` で明示的に渡す。
     */
    windows?: number;
}
```

#### <code v-pre>MemorySample</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L13) <code v-pre>packages/perf-harness/src/memory.ts</code>

measureMemory — capture heap deltas around a target function. Real production concerns include memory growth per call. A p95 of 5ms is useless if every call leaks 100KB of retained heap. This helper wraps a target function with a global.gc() + process.memoryUsage() bracket so tests can assert on `heapUsedDelta` / `rssUsedDelta` per call. Requires Node to be launched with `--expose-gc` for stable readings. When GC is not exposed we fall back to a delta without forced GC — the numbers are noisier but the trend still catches egregious leaks.

```ts
export interface MemorySample {
    iterationCount: number;
    /**
     * 測定区間の前に空回しした回数。
     *
     * 空回しは測定区間の外で `fn` を呼ぶ。 副作用や件数依存を持つ op では、
     * その呼出も store の件数や cache の状態を進めるため、 同じ `iterations` でも
     * 空回しの有無で測っているものが変わる (#1730)。
     */
    warmupCount: number;
    /**
     * `fn` を呼んだ総回数 (`warmupCount + iterationCount * windowCount`)。
     *
     * 「N 反復」 とだけ報告すると、 空回しや窓を入れた実行が実際には
     * それ以上呼んでいることが読み手に伝わらない。 副作用を持つ op ではこの差が
     * そのまま測定対象の違いになるので、 実際に呼んだ回数を残す。
     */
    totalCallCount: number;
    /**
     * 測定区間を何回に分けたか (#1719)。
     *
     * 1 なら従来どおりの 1 区間。 2 以上なら最後の区間の値を代表値として返し、
     * 手前の区間は飽和させるためだけに使う。
     */
    windowCount: number;
    /**
     * 区間ごとの `arrayBuffers` 増分 (#1719)。
     *
     * 代表値 (`arrayBuffersDeltaBytes`) は最後の要素と一致する。
     * 手前の区間との差が、 その op の増分が飽和したかどうかの証跡になる。
     * 飽和していれば後ろの区間ほど 0 に近づき、 実装が反復ごとに保持していれば
     * どの区間でも同じ量が出る。
     */
    arrayBuffersDeltaByWindowBytes: number[];
    heapUsedDeltaBytes: number;
    heapUsedDeltaPerIterationBytes: number;
    rssDeltaBytes: number;
    externalDeltaBytes: number;
    arrayBuffersDeltaBytes: number;
    gcExposed: boolean;
}
```
