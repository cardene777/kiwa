---
title: "@kiwa-lab/orm semantics__sqlite-wal の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;sqlite-wal</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSqliteWalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L43) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function createSqliteWalSession(input: {
    databasePath: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): SqliteWalSession;
```

#### <code v-pre>crossWalSizeThreshold</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L83) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function crossWalSizeThreshold(session: SqliteWalSession, input: {
    walSizeBytes: number;
    thresholdBytes: number;
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>mapSharedMemory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L132) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function mapSharedMemory(session: SqliteWalSession, input: {
    regionBytes: number;
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>switchJournalMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L61) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function switchJournalMode(session: SqliteWalSession, input: {
    mode: 'WAL';
}): AxisStep<SqliteWalState>;
```

#### <code v-pre>triggerWalCheckpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L108) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export declare function triggerWalCheckpoint(session: SqliteWalSession, input: {
    mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
}): AxisStep<SqliteWalState>;
```

### 型

#### <code v-pre>SqliteWalSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L23) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

```ts
export interface SqliteWalSession {
    databasePath: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: SqliteWalState;
    journalMode: 'DELETE' | 'WAL';
    walSizeBytes: number;
    checkpointCount: number;
    sharedMemoryMapped: boolean;
    history: AxisStep<SqliteWalState>[];
}
```

#### <code v-pre>SqliteWalState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/sqlite-wal.ts#L16) <code v-pre>packages/orm/src/semantics/sqlite-wal.ts</code>

SQLite WAL — journal_mode=WAL switch, WAL checkpoint, size threshold, and shared-memory wal-index mapping. SQLite maps to PRAGMA journal_mode / wal_checkpoint and wal-index telemetry; Postgres / MySQL use write-ahead log fallback names. State transitions: created → 'rollback-journal' switchJournalMode → 'wal-enabled' crossWalSizeThreshold → 'threshold-crossed' triggerWalCheckpoint → 'checkpointed' mapSharedMemory → 'shared-memory-mapped'

```ts
export type SqliteWalState = 'rollback-journal' | 'wal-enabled' | 'threshold-crossed' | 'checkpointed' | 'shared-memory-mapped';
```
