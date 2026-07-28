---
title: "@kiwa-lab/orm semantics-partitioning の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-partitioning</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPartitioningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L50) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Create a partitioning session bound to a table. State starts at 'undeclared' and no buckets exist.

```ts
export declare function createPartitioningSession(input: {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): PartitioningSession;
```

#### <code v-pre>declarePartition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L71) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Declare a new partition bucket. Range partitions require low + high; list partitions require `values`; hash partitions require `modulus` + `remainder`. Emits `partition.declared`.

```ts
export declare function declarePartition(session: PartitioningSession, input: PartitionBucket): AxisStep<PartitionState>;
```

#### <code v-pre>partitionWiseJoin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L164) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Signal that a partition-wise join was planned between this table and another partitioned table on the same key. Requires both sides to have matching partition counts (Postgres constraint). Emits `partition.wise-joined`. Rejects when `matchedBuckets` is strictly less than the declared bucket count — Postgres partition-wise join requires **all** buckets on both sides to match (a partial match falls back to a global join plan and is not partition-wise). Permitting partial matches silently mislabels a non-partition-wise plan as `joined`.

```ts
export declare function partitionWiseJoin(session: PartitioningSession, input: {
    otherTable: string;
    matchedBuckets: number;
}): AxisStep<PartitionState>;
```

#### <code v-pre>prunePartitions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L123) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Prune partitions that cannot match a predicate. `keptCount` must be smaller than or equal to the current bucket count. Emits `partition.pruned`.

```ts
export declare function prunePartitions(session: PartitioningSession, input: {
    predicate: string;
    keptCount: number;
}): AxisStep<PartitionState>;
```

#### <code v-pre>routeInsert</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L205) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Route a single row insert to a specific partition. Deterministic on the partition strategy: range picks the bucket whose bounds enclose the key, list picks the bucket whose values include the key, hash uses key % modulus === remainder. Emits `partition.route-selected` and returns the chosen bucket name in metadata.

```ts
export declare function routeInsert(session: PartitioningSession, input: {
    key: number | string;
}): AxisStep<PartitionState>;
```

### 型

#### <code v-pre>PartitionBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L22) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export interface PartitionBucket {
    name: string;
    strategy: PartitionStrategy;
    bounds: {
        low?: number;
        high?: number;
        values?: (string | number)[];
        modulus?: number;
        remainder?: number;
    };
}
```

#### <code v-pre>PartitioningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L28) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export interface PartitioningSession {
    tableId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PartitionState;
    buckets: PartitionBucket[];
    prunedCount: number;
    history: AxisStep<PartitionState>[];
}
```

#### <code v-pre>PartitionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L18) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

Declarative partitioning — RANGE / LIST / HASH partition strategies, partition pruning, partition-wise join planning, and per-row routing. Postgres has native declarative partitioning; MySQL has RANGE / LIST / HASH partition types; SQLite emulates via ATTACH DATABASE shards. All 3 backends map to the same 4 neutral events with backend dialect via {@link backendEventName}. State transitions: created → 'undeclared' declarePartition → 'declared' prunePartitions → 'pruned' partitionWiseJoin → 'joined' routeInsert → (state unchanged, routing is stateless)

```ts
export type PartitionState = 'undeclared' | 'declared' | 'pruned' | 'joined';
```

#### <code v-pre>PartitionStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/partitioning.ts#L20) <code v-pre>packages/orm/src/semantics/partitioning.ts</code>

```ts
export type PartitionStrategy = 'range' | 'list' | 'hash';
```
