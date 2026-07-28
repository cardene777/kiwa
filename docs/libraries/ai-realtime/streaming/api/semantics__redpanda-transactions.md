---
title: "@kiwa-lab/streaming semantics__redpanda-transactions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;redpanda-transactions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createRedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L82) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

Create the Redpanda transaction coordinator model. Fencing is enforced via `guardEpoch(transactionalId, providedEpoch)` — the same call the broker uses to reject stale producers when the same `transactional.id` re-registers.

```ts
export declare function createRedpandaTransactions(config?: RedpandaTransactionsConfig): RedpandaTransactions;
```

#### <code v-pre>isRedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L206) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

Type guard: recognize a RedpandaTransactions instance.

```ts
export declare function isRedpandaTransactions(value: unknown): value is RedpandaTransactions;
```

#### <code v-pre>REDPANDA&#95;TRANSACTIONS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L11) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export declare const REDPANDA_TRANSACTIONS_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>ProducerEpoch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L18) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface ProducerEpoch {
    readonly producerId: number;
    readonly epoch: number;
    readonly transactionalId?: string;
}
```

#### <code v-pre>RedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L40) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface RedpandaTransactions {
    readonly [REDPANDA_TRANSACTIONS_SYMBOL]: true;
    readonly config: Required<RedpandaTransactionsConfig>;
    /** InitTransactions equivalent — assign producer id + starting epoch. */
    initTransactions(transactionalId: string): ProducerEpoch;
    /**
     * Bump the epoch when a new client with the same transactionalId connects.
     * The old epoch is fenced — subsequent writes with it get InvalidProducerEpoch.
     */
    bumpEpoch(transactionalId: string): ProducerEpoch;
    /** Open a new transaction for the given producer. */
    beginTransaction(transactionalId: string, producer: ProducerEpoch): void;
    /** Register a partition that will receive writes inside the open transaction. */
    addPartition(transactionalId: string, topic: string, partition: number): void;
    /** Commit — moves phase idle → prepareCommit → committed. */
    commitTransaction(transactionalId: string): void;
    /** Abort — moves phase ongoing → prepareAbort → aborted, or short-circuits on fence. */
    abortTransaction(transactionalId: string, reason?: string): void;
    /** Auto-abort any transactions that have exceeded `transactionTimeoutMs`. */
    expireStale(now: number): readonly string[];
    currentPhase(transactionalId: string): TxnPhase;
    currentProducer(transactionalId: string): ProducerEpoch | null;
    /** Guard: throw InvalidProducerEpoch if `provided` is older than the current. */
    guardEpoch(transactionalId: string, provided: ProducerEpoch): void;
    reset(): void;
}
```

#### <code v-pre>RedpandaTransactionsConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L13) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface RedpandaTransactionsConfig {
    /** Transaction timeout after which the coordinator auto-aborts. Default 60_000ms. */
    readonly transactionTimeoutMs?: number;
}
```

#### <code v-pre>TxnPhase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L24) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export type TxnPhase = 'idle' | 'ongoing' | 'prepareCommit' | 'prepareAbort' | 'committed' | 'aborted';
```

#### <code v-pre>TxnRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L32) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface TxnRecord {
    readonly transactionalId: string;
    readonly producer: ProducerEpoch;
    phase: TxnPhase;
    readonly openedAt: number;
    readonly participatingPartitions: Set<string>;
}
```
