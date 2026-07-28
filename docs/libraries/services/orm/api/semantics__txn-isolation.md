---
title: "@kiwa-lab/orm semantics__txn-isolation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;txn-isolation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>blockDirtyRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L82) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockDirtyRead(session: TxnIsolationSession, input: {
    readerTxnId: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>blockNonRepeatableRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L107) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockNonRepeatableRead(session: TxnIsolationSession, input: {
    rowKey: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>blockPhantomRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L138) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function blockPhantomRead(session: TxnIsolationSession, input: {
    predicate: string;
}): AxisStep<TxnIsolationState>;
```

#### <code v-pre>createTxnIsolationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L47) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function createTxnIsolationSession(input: {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): TxnIsolationSession;
```

#### <code v-pre>setTxnIsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L63) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export declare function setTxnIsolationLevel(session: TxnIsolationSession, input: {
    level: TxnIsolationLevel;
}): AxisStep<TxnIsolationState>;
```

### 型

#### <code v-pre>TxnIsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L23) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export type TxnIsolationLevel = 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';
```

#### <code v-pre>TxnIsolationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L29) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

```ts
export interface TxnIsolationSession {
    txnId: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: TxnIsolationState;
    level: TxnIsolationLevel | null;
    blockedPhenomena: Set<string>;
    history: AxisStep<TxnIsolationState>[];
}
```

#### <code v-pre>TxnIsolationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/txn-isolation.ts#L16) <code v-pre>packages/orm/src/semantics/txn-isolation.ts</code>

Transaction isolation — level switching across read-uncommitted, read-committed, repeatable-read, and serializable plus blocking the classic ANSI phenomena. Postgres / MySQL map to SET TRANSACTION ISOLATION; SQLite maps to pragma locking / read-uncommitted controls. State transitions: created → 'idle' setTxnIsolationLevel → 'level-set' blockDirtyRead → 'dirty-read-blocked' blockNonRepeatableRead → 'non-repeatable-read-blocked' blockPhantomRead → 'phantom-read-blocked'

```ts
export type TxnIsolationState = 'idle' | 'level-set' | 'dirty-read-blocked' | 'non-repeatable-read-blocked' | 'phantom-read-blocked';
```
