---
title: "@kiwa-lab/orm semantics-logical-replication の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-logical-replication</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createLogicalRepSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L49) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Create a logical replication session bound to a publisher id. State starts at 'unpublished' with no publication and no subscribers.

```ts
export declare function createLogicalRepSession(input: {
    publisherId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): LogicalRepSession;
```

#### <code v-pre>createPublication</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L77) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Create a publication over one or more tables. Moves the session into 'published'. Emits `logical.publication-created`. Rejects when the session already has a live subscription (`synced` / `conflict-resolved`) — overwriting the publication under a live topology silently orphans subscribers from the new publication and corrupts the replication invariant. Callers must drop subscribers first or start a new session.

```ts
export declare function createPublication(session: LogicalRepSession, input: {
    name: string;
    tables: string[];
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>heartbeat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L190) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Send a heartbeat from publisher to subscribers. Does not change state (heartbeat is passive), but bumps `lastHeartbeatAt`. Emits `logical.heartbeat`.

```ts
export declare function heartbeat(session: LogicalRepSession, input: {
    at: number;
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>resolveConflict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L143) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Resolve a divergent write conflict between publisher and subscriber. The caller picks the strategy; the mock records the winner + strategy in metadata. Requires the session to be 'synced' first (a conflict without a synced subscriber is a bug). Emits `logical.conflict-resolved`.

```ts
export declare function resolveConflict(session: LogicalRepSession, input: {
    subscriberId: string;
    strategy: ConflictStrategy;
    winner: 'publisher' | 'subscriber';
}): AxisStep<LogicalRepState>;
```

#### <code v-pre>syncSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L110) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Bootstrap a subscription — mark a subscriber as synced with the publisher. Requires a publication to exist; a subscription without a publication is rejected. Emits `logical.subscription-synced`.

```ts
export declare function syncSubscription(session: LogicalRepSession, input: {
    subscriberId: string;
}): AxisStep<LogicalRepState>;
```

### 型

#### <code v-pre>ConflictStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L23) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

```ts
export type ConflictStrategy = 'last-write-wins' | 'primary-wins' | 'reject';
```

#### <code v-pre>LogicalRepSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L25) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

```ts
export interface LogicalRepSession {
    publisherId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: LogicalRepState;
    publication: {
        name: string;
        tables: string[];
    } | null;
    subscribers: Set<string>;
    syncedSubscribers: Set<string>;
    lastHeartbeatAt: number;
    history: AxisStep<LogicalRepState>[];
}
```

#### <code v-pre>LogicalRepState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication.ts#L17) <code v-pre>packages/orm/src/semantics/logical-replication.ts</code>

Logical replication — publication + subscription topology where publisher ships row-level events to subscribers, with initial-sync bootstrap, conflict resolution on divergent writes, and periodic heartbeat. Postgres exposes `pg_publication` / `pg_subscription`; MySQL has group replication with similar semantics but different names; SQLite has no analogue. State transitions: created → 'unpublished' createPublication → 'published' syncSubscription → 'synced' resolveConflict → 'conflict-resolved' heartbeat → (state unchanged, heartbeat is passive)

```ts
export type LogicalRepState = 'unpublished' | 'published' | 'synced' | 'conflict-resolved';
```
