---
title: "@kiwa-lab/orm semantics-pool-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-pool-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPoolAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L42) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function createPoolAdvancedSession(input: {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    minWarmConnections: number;
}): PoolAdvancedSession;
```

#### <code v-pre>drainPoolGracefully</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L121) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function drainPoolGracefully(session: PoolAdvancedSession, input: {
    deadlineMs: number;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>exportPoolMetrics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L147) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function exportPoolMetrics(session: PoolAdvancedSession, input: {
    active: number;
    idle: number;
    waiting: number;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>runPoolHealthCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L64) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function runPoolHealthCheck(session: PoolAdvancedSession, input: {
    latencyMs: number;
    ok: boolean;
}): AxisStep<PoolAdvancedState>;
```

#### <code v-pre>warmPoolConnections</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L96) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export declare function warmPoolConnections(session: PoolAdvancedSession, input: {
    connectionCount: number;
}): AxisStep<PoolAdvancedState>;
```

### 型

#### <code v-pre>PoolAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L22) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

```ts
export interface PoolAdvancedSession {
    poolId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: PoolAdvancedState;
    minWarmConnections: number;
    activeConnections: number;
    lastHealthLatencyMs: number;
    metrics: Record<string, number>;
    history: AxisStep<PoolAdvancedState>[];
}
```

#### <code v-pre>PoolAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/pool-advanced.ts#L15) <code v-pre>packages/orm/src/semantics/pool-advanced.ts</code>

Pool advanced — health checks, connection warmup, graceful drain, and pool metrics export. Postgres maps to PgBouncer, MySQL to ProxySQL, and SQLite to sqlite3_status / close-v2 style primitives. State transitions: created → 'cold' runPoolHealthCheck → 'healthy' warmPoolConnections → 'warmed-up' drainPoolGracefully → 'draining' exportPoolMetrics → 'metrics-exported'

```ts
export type PoolAdvancedState = 'cold' | 'healthy' | 'warmed-up' | 'draining' | 'metrics-exported';
```
