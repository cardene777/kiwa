---
title: "@kiwa-lab/orm semantics-logical-replication-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-logical-replication-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>confirmTwoSafeCommit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L128) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function confirmTwoSafeCommit(session: LogicalReplicationAdvancedSession, input: {
    confirmedFlushLsn: number;
    synchronousStandbys: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>createLogicalReplicationAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L44) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function createLogicalReplicationAdvancedSession(input: {
    streamId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): LogicalReplicationAdvancedSession;
```

#### <code v-pre>startLogicalStreaming</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L62) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function startLogicalStreaming(session: LogicalReplicationAdvancedSession, input: {
    startLsn: number;
    protocolVersion: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>syncCascadedSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L160) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function syncCascadedSubscription(session: LogicalReplicationAdvancedSession, input: {
    upstreamId: string;
    subscriberId: string;
}): AxisStep<LogicalReplicationAdvancedState>;
```

#### <code v-pre>trackReplicationOrigin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L95) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export declare function trackReplicationOrigin(session: LogicalReplicationAdvancedSession, input: {
    originId: string;
    remoteLsn: number;
}): AxisStep<LogicalReplicationAdvancedState>;
```

### 型

#### <code v-pre>LogicalReplicationAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L24) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

```ts
export interface LogicalReplicationAdvancedSession {
    streamId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: LogicalReplicationAdvancedState;
    startLsn: number;
    originId: string | null;
    confirmedLsn: number;
    cascadedSubscribers: Set<string>;
    history: AxisStep<LogicalReplicationAdvancedState>[];
}
```

#### <code v-pre>LogicalReplicationAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/logical-replication-advanced.ts#L17) <code v-pre>packages/orm/src/semantics/logical-replication-advanced.ts</code>

Logical replication advanced — streaming replication protocol start, replication-origin progress, two-safe confirmation, and cascaded subscription sync. Postgres maps to pgoutput / replication origin / synchronous commit primitives; MySQL approximates with group replication; SQLite falls back to session-style telemetry. State transitions: created → 'idle' startLogicalStreaming → 'streaming' trackReplicationOrigin → 'origin-tracked' confirmTwoSafeCommit → 'two-safe-confirmed' syncCascadedSubscription → 'cascade-synced'

```ts
export type LogicalReplicationAdvancedState = 'idle' | 'streaming' | 'origin-tracked' | 'two-safe-confirmed' | 'cascade-synced';
```
