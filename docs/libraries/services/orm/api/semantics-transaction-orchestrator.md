---
title: "@kiwa-lab/orm semantics-transaction-orchestrator の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-transaction-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startTransaction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L36) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export declare function startTransaction(input: {
    timestamp: string;
}): TransactionSession;
```

#### <code v-pre>summarizeTransaction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L152) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export declare function summarizeTransaction(session: TransactionSession): TransactionSummary;
```

### 型

#### <code v-pre>TransactionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L15) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export type TransactionEvent = 'begin-completed' | 'query-executed' | 'savepoint-created' | 'savepoint-released' | 'commit-requested' | 'commit-succeeded' | 'rollback-requested' | 'timeout';
```

#### <code v-pre>TransactionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L25) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export interface TransactionSession {
    state: TransactionState;
    queriesExecuted: number;
    savepointsCreated: number;
    savepointsReleased: number;
    commitsSucceeded: number;
    rollbacksExecuted: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>TransactionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L8) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

v0.6 transaction-orchestrator = txn-isolation + mvcc + connection-pool + logical-replication + partitioning の 継続合成 layer。 depth-5 pattern 9 例目 = systematic law 継続強化 第 3 例、 systematic pattern 51 度目 (継続深化 pattern 9 例目 candidate、 backend systems layer への 初適用)。

```ts
export type TransactionState = 'beginning' | 'active' | 'savepoint-nested' | 'committing' | 'aborted';
```

#### <code v-pre>TransactionSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/transaction-orchestrator.ts#L139) <code v-pre>packages/orm/src/semantics/transaction-orchestrator.ts</code>

```ts
export interface TransactionSummary {
    currentState: TransactionState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    queriesExecuted: number;
    savepointsCreated: number;
    savepointsReleased: number;
    commitsSucceeded: number;
    rollbacksExecuted: number;
}
```
