---
title: "@kiwa-lab/orm semantics__replication の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;replication</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createReplicationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L56) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Create a replication session with a primary and initial set of replicas. State starts at 'streaming' and primary LSN starts at 0. Emits `replication.primary-write` for the initial "snapshot" so history is non-empty on inspection.

```ts
export declare function createReplicationSession(input: {
    primaryId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    replicaIds: string[];
}): ReplicationSession;
```

#### <code v-pre>markReplicaLagged</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L117) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Mark a specific replica as lagged. Sets the session state to 'lagged' if any replica has non-zero lag. Emits `replication.replica-lagged`. Throws if the replica id is unknown so silent typos are impossible.

```ts
export declare function markReplicaLagged(session: ReplicationSession, input: {
    replicaId: string;
    appliedLsn: number;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>primaryWrite</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L87) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Record a primary write. Bumps primary LSN by `bytes` and marks the session 'streaming' unless it is currently in a failover flow. Emits `replication.primary-write`. Rejects when the session has been promoted — the old primary is terminal after `promoteReplica` and cannot resume writes. Regressing a terminal `promoted` state to `streaming` corrupts the failover invariant.

```ts
export declare function primaryWrite(session: ReplicationSession, input: {
    bytes: number;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>promoteReplica</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L182) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Promote a specific replica to primary. Requires the session to be 'failover-in-progress' (a promotion outside a failover flow is a bug). Overwrites the session `primaryId` with the promoted replica id and drops that replica from the `replicas` map. Emits `replication.promoted`.

```ts
export declare function promoteReplica(session: ReplicationSession, input: {
    replicaId: string;
}): AxisStep<ReplicationState>;
```

#### <code v-pre>startFailover</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L158) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Start a failover flow. Requires the session to be either 'streaming' or 'lagged'; a failover that is already 'failover-in-progress' or 'promoted' is rejected so re-entry does not silently corrupt state. Emits `replication.failover-started`.

```ts
export declare function startFailover(session: ReplicationSession, input: {
    reason: string;
}): AxisStep<ReplicationState>;
```

### 型

#### <code v-pre>ReplicaHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L26) <code v-pre>packages/orm/src/semantics/replication.ts</code>

```ts
export interface ReplicaHandle {
    id: string;
    appliedLsn: number;
    lag: number;
}
```

#### <code v-pre>ReplicationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L32) <code v-pre>packages/orm/src/semantics/replication.ts</code>

```ts
export interface ReplicationSession {
    primaryId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: ReplicationState;
    primaryLsn: number;
    replicas: Map<string, ReplicaHandle>;
    history: AxisStep<ReplicationState>[];
}
```

#### <code v-pre>ReplicationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/replication.ts#L20) <code v-pre>packages/orm/src/semantics/replication.ts</code>

Streaming replication — primary write flows into an ordered replica stream (WAL for Postgres, binlog for MySQL, session for SQLite). The mock tracks the primary LSN, per-replica applied LSN, and lag, plus a two-step failover flow (`replication.failover-started` → `replication.promoted`). SQLite has no server-side replication, but the mock still permits the neutral events so downstream tests can drive a "simulated" replica for SQLite in-memory fanout — the backend dialect falls back to the neutral name via {@link backendEventName}. State transitions: created → 'streaming' primaryWrite → 'streaming' (bumps primary LSN) markReplicaLagged → 'lagged' (replica applied LSN falls behind) startFailover → 'failover-in-progress' promoteReplica → 'promoted'

```ts
export type ReplicationState = 'streaming' | 'lagged' | 'failover-in-progress' | 'promoted';
```
