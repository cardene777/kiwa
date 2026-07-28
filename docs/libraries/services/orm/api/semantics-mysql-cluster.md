---
title: "@kiwa-lab/orm semantics-mysql-cluster の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-mysql-cluster</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMysqlClusterSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L43) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function createMysqlClusterSession(input: {
    groupName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): MysqlClusterSession;
```

#### <code v-pre>detectClusterConflict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L115) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function detectClusterConflict(session: MysqlClusterSession, input: {
    transactionId: string;
    winnerMemberId: string;
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>electClusterPrimary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L89) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function electClusterPrimary(session: MysqlClusterSession, input: {
    memberId: string;
    mode: 'single-primary' | 'multi-primary';
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>joinClusterMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L60) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function joinClusterMember(session: MysqlClusterSession, input: {
    memberId: string;
    weight: number;
}): AxisStep<MysqlClusterState>;
```

#### <code v-pre>leaveClusterMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L144) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export declare function leaveClusterMember(session: MysqlClusterSession, input: {
    memberId: string;
}): AxisStep<MysqlClusterState>;
```

### 型

#### <code v-pre>MysqlClusterSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L24) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

```ts
export interface MysqlClusterSession {
    groupName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: MysqlClusterState;
    members: Set<string>;
    primaryId: string | null;
    conflictCount: number;
    history: AxisStep<MysqlClusterState>[];
}
```

#### <code v-pre>MysqlClusterState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mysql-cluster.ts#L17) <code v-pre>packages/orm/src/semantics/mysql-cluster.ts</code>

MySQL cluster — group replication membership, single-primary election, write conflict detection, and member leave. MySQL maps to group_replication / performance_schema; Postgres approximates via Patroni-style leader telemetry; SQLite falls back to neutral cluster events. State transitions: created → 'empty' joinClusterMember → 'joined' electClusterPrimary → 'primary-elected' detectClusterConflict→ 'conflict-detected' leaveClusterMember → 'member-left'

```ts
export type MysqlClusterState = 'empty' | 'joined' | 'primary-elected' | 'conflict-detected' | 'member-left';
```
