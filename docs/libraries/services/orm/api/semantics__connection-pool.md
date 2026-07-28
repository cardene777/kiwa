---
title: "@kiwa-lab/orm semantics__connection-pool の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;connection-pool</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>acquire</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L84) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Acquire a connection. If the pool is at capacity, throws — call {@link waitInQueue} first when saturation is expected. Emits `pool.acquired` and moves the session into 'in-use' (or 'saturated' when the acquisition tips the pool over the cap). Rejects when the session is in a terminal outcome (`cancelled` from `statementTimeout` or `evicted` from `idleTimeout`) — silently reviving a cancelled / evicted session masks the prior fault and breaks the telemetry invariant that a terminal pool session stays terminal.

```ts
export declare function acquire(session: PoolSession, input: {
    clientId: string;
    at: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>createPoolSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L48) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Create a pool session with a cap on connections and per-connection idle / statement timeouts (both in milliseconds). State starts at 'idle'.

```ts
export declare function createPoolSession(input: {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    maxConnections: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
}): PoolSession;
```

#### <code v-pre>idleTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L153) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Evict a connection whose idle time exceeds `idleTimeoutMs`. Requires the connection to be idle for at least that long — a premature eviction is a bug. Emits `pool.idle-timeout` and returns the pool to 'idle' when it was the last active handle.

```ts
export declare function idleTimeout(session: PoolSession, input: {
    clientId: string;
    at: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>statementTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L193) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Cancel a client's statement because it exceeded `statementTimeoutMs`. Requires the client to be currently active. Emits `pool.statement-timeout` and moves the session into 'cancelled'.

```ts
export declare function statementTimeout(session: PoolSession, input: {
    clientId: string;
    elapsedMs: number;
}): AxisStep<PoolState>;
```

#### <code v-pre>waitInQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L123) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Enqueue a client that could not acquire (because the pool was saturated). Moves the session into 'saturated' and emits `pool.wait-queued`.

```ts
export declare function waitInQueue(session: PoolSession, input: {
    clientId: string;
}): AxisStep<PoolState>;
```

### 型

#### <code v-pre>ConnectionHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L20) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

```ts
export interface ConnectionHandle {
    id: string;
    acquiredAt: number;
    lastActivityAt: number;
}
```

#### <code v-pre>PoolSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L26) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

```ts
export interface PoolSession {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PoolState;
    maxConnections: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
    active: Map<string, ConnectionHandle>;
    waitQueue: string[];
    history: AxisStep<PoolState>[];
}
```

#### <code v-pre>PoolState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/connection-pool.ts#L18) <code v-pre>packages/orm/src/semantics/connection-pool.ts</code>

Connection pool — max_connections cap, idle_timeout eviction, statement_timeout cancellation, and a bounded wait queue when the pool is saturated. Postgres uses pgbouncer, MySQL uses ProxySQL, SQLite emulates with a WAL writer serialization queue. Same 4 neutral events across all backends, with backend / provider dialect via {@link backendEventName}. State transitions: created → 'idle' acquire → 'in-use' (or 'saturated' if maxConnections reached) waitInQueue → 'saturated' idleTimeout → 'evicted' statementTimeout → 'cancelled'

```ts
export type PoolState = 'idle' | 'in-use' | 'saturated' | 'evicted' | 'cancelled';
```
