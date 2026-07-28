---
title: "@kiwa-lab/edge semantics__kv-eventual-consistency の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;kv-eventual-consistency</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>forceConvergence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L108) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

Force convergence by advancing the observed pointer on every replica to the latest write. Returns the count of keys reconciled.

```ts
export declare function forceConvergence(session: KvConsistencySession): number;
```

#### <code v-pre>observeRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L64) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

Observe a read of `key` returning value at timestamp `readTs` from replica `replicaId`. Classifies: `stale` if readTs &lt; writes[key], `converged` if equal, `violated` if this read is older than a previously observed monotonic read on same session (monotonic-reads violation).

```ts
export declare function observeRead(session: KvConsistencySession, input: {
    key: string;
    readTs: number;
    replicaId: string;
}): AxisStep<KvConsistencyState>;
```

#### <code v-pre>recordWriteQuorum</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L39) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

Record a write with monotonic timestamp `ts` reaching quorum. Emits `kv-consistency.write-quorum` and updates the write pointer. Later timestamps overwrite earlier ones (last-writer-wins).

```ts
export declare function recordWriteQuorum(session: KvConsistencySession, input: {
    key: string;
    ts: number;
}): AxisStep<KvConsistencyState>;
```

#### <code v-pre>startKvConsistency</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L23) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

Open a consistency session. Writes and observations start empty.

```ts
export declare function startKvConsistency(input: {
    platform: EdgePlatform;
}): KvConsistencySession;
```

### 型

#### <code v-pre>KvConsistencySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L13) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

```ts
export interface KvConsistencySession {
    platform: EdgePlatform;
    writes: Record<string, number>;
    observed: Record<string, number>;
    history: AxisStep<KvConsistencyState>[];
}
```

#### <code v-pre>KvConsistencyState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L11) <code v-pre>packages/edge/src/semantics/kv-eventual-consistency.ts</code>

KV eventual consistency axis — models the read-your-writes / monotonic-reads subset of consistency guarantees that edge KV stores expose. Writes converge across quorum, but until convergence a read from a lagging replica returns stale data. The helper tracks per-key write timestamps and per-session last-observed timestamps, then detects violations (client writes t=100 → reads t=50 back = read-your-writes violation).

```ts
export type KvConsistencyState = 'writing' | 'converged' | 'stale' | 'violated';
```
