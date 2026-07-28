---
title: "@kiwa-lab/orm semantics__mvcc の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;mvcc</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>abortSerializable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L103) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Abort a serializable transaction due to serialization failure. Requires isolation === 'serializable'; a serialization abort at a lower isolation level is a bug. Emits `mvcc.serializable-aborted`.

```ts
export declare function abortSerializable(session: MvccSession, input: {
    reason: string;
}): AxisStep<MvccState>;
```

#### <code v-pre>blockPhantom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L136) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Signal that a phantom read was blocked by predicate / gap locks. Requires isolation at least 'repeatable-read'; read-committed does not prevent phantoms so blocking one at that level is a bug. Emits `mvcc.phantom-blocked`.

```ts
export declare function blockPhantom(session: MvccSession, input: {
    predicate: string;
    blockingTxn: string;
}): AxisStep<MvccState>;
```

#### <code v-pre>createMvccSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L47) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Create an MVCC transaction session. State starts at 'active' with the requested isolation level and no snapshot taken.

```ts
export declare function createMvccSession(input: {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    isolation: IsolationLevel;
}): MvccSession;
```

#### <code v-pre>detectDeadlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L177) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Detect a deadlock involving this txn. Emits `mvcc.deadlock-detected` and moves the txn into 'deadlocked'. The caller supplies the deadlock cycle (an array of participating txn ids) so telemetry can identify the ring. Rejects when the txn is already in a terminal outcome (`aborted` / `deadlocked`) — overwriting the terminal state with `deadlocked` erases the true termination cause (e.g. `aborted → deadlocked`) and breaks the post-mortem invariant that a txn ends exactly once.

```ts
export declare function detectDeadlock(session: MvccSession, input: {
    cycle: string[];
}): AxisStep<MvccState>;
```

#### <code v-pre>takeSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L73) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

Take a snapshot. Requires the txn to be 'active' or already 'snapshot-held' (re-taking a snapshot at a new LSN is legal). Emits `mvcc.snapshot-taken`. Rejects when the txn is blocked on a phantom read (`phantom-blocked`) — silently promoting a blocked txn to `snapshot-held` corrupts the predicate lock invariant and would masquerade as isolation.

```ts
export declare function takeSnapshot(session: MvccSession, input: {
    snapshotId: number;
}): AxisStep<MvccState>;
```

### 型

#### <code v-pre>IsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L26) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

```ts
export type IsolationLevel = 'read-committed' | 'repeatable-read' | 'serializable';
```

#### <code v-pre>MvccSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L28) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

```ts
export interface MvccSession {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    isolation: IsolationLevel;
    state: MvccState;
    snapshotId: number | null;
    history: AxisStep<MvccState>[];
}
```

#### <code v-pre>MvccState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/mvcc.ts#L19) <code v-pre>packages/orm/src/semantics/mvcc.ts</code>

MVCC — multi-version concurrency control. Snapshot isolation vs serializable isolation, phantom reads, lost updates, and deadlock detection. Postgres has real MVCC with snapshot / serializable isolation, MySQL InnoDB has snapshot + gap locks, SQLite has a single writer + WAL that behaves like coarse-grained snapshot isolation. All 3 backends map to the same 4 neutral events with backend dialect via {@link backendEventName}. State transitions: created → 'active' takeSnapshot → 'snapshot-held' abortSerializable → 'aborted' blockPhantom → 'phantom-blocked' detectDeadlock → 'deadlocked'

```ts
export type MvccState = 'active' | 'snapshot-held' | 'aborted' | 'phantom-blocked' | 'deadlocked';
```
