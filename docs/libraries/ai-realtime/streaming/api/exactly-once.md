---
title: "@kiwa-lab/streaming exactly-once の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>exactly-once</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createIdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L39) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Idempotent producer — dedups (producerId, sequenceNumber) pairs so retries from the client side don't produce double writes. Kafka's real implementation stores (pid, seq) → last offset per partition; the mock uses a single global set which is enough to model the observable behavior.

```ts
export declare function createIdempotentProducer(config: IdempotentProducerConfig): IdempotentProducer;
```

#### <code v-pre>createReadCommittedFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L203) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Read-committed filter — shaped like kafkajs's `isolationLevel: 'read_committed'` consumer flag. In the mock, aborted transactions are never flushed to the underlying broker so the filter is a no-op by construction; the identity exists as a symmetric API surface for tests.

```ts
export declare function createReadCommittedFilter(level?: IsolationLevel): ReadCommittedFilter;
```

#### <code v-pre>createTransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L104) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Transactional producer — messages sent between beginTransaction() and commitTransaction() are only visible to read-committed consumers after the commit lands. abortTransaction() marks the batch aborted and read-committed consumers skip it entirely. The mock defers the actual `producer.send()` until commit — this matches the observable behavior read-committed consumers see, without modeling the transaction coordinator's on-disk state.

```ts
export declare function createTransactionalProducer(config: TransactionalProducerConfig): TransactionalProducer;
```

#### <code v-pre>IDEMPOTENT&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L10) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const IDEMPOTENT_PRODUCER_SYMBOL: unique symbol;
```

#### <code v-pre>isIdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L221) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Type guard: recognize an IdempotentProducer.

```ts
export declare function isIdempotentProducer(value: unknown): value is IdempotentProducer;
```

#### <code v-pre>isTransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L230) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Type guard: recognize a TransactionalProducer.

```ts
export declare function isTransactionalProducer(value: unknown): value is TransactionalProducer;
```

#### <code v-pre>READ&#95;COMMITTED&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L12) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const READ_COMMITTED_SYMBOL: unique symbol;
```

#### <code v-pre>TRANSACTIONAL&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L11) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const TRANSACTIONAL_PRODUCER_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>IdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L20) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface IdempotentProducer {
    readonly [IDEMPOTENT_PRODUCER_SYMBOL]: true;
    readonly producerId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>, sequenceNumber: number): Promise<PublishResult[]>;
    /** Returns true when the (producerId, sequenceNumber) has already been observed. */
    isDuplicate(sequenceNumber: number): boolean;
}
```

#### <code v-pre>IdempotentProducerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L14) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface IdempotentProducerConfig {
    readonly kafka: KafkaMock;
    /** Producer identity used for dedup. In real Kafka this is broker-assigned. */
    readonly producerId?: string;
}
```

#### <code v-pre>IsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L179) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export type IsolationLevel = 'read-committed' | 'read-uncommitted';
```

#### <code v-pre>ReadCommittedFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L181) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface ReadCommittedFilter {
    readonly [READ_COMMITTED_SYMBOL]: true;
    readonly isolationLevel: IsolationLevel;
    /**
     * Filter a raw message stream to only committed records. The mock treats
     * every message emitted through `createTransactionalProducer.commit()` as
     * committed; uncommitted / aborted batches never reach the underlying
     * KafkaMock so this filter is effectively an identity for messages sourced
     * through the mock's own flow — but the shape mirrors kafkajs so tests can
     * assert against the same field.
     */
    filter<TValue = unknown, TKey = string>(messages: readonly StreamingMessage<TValue, TKey>[]): readonly StreamingMessage<TValue, TKey>[];
}
```

#### <code v-pre>TransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L79) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface TransactionalProducer {
    readonly [TRANSACTIONAL_PRODUCER_SYMBOL]: true;
    readonly transactionalId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    initTransactions(): Promise<void>;
    beginTransaction(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>): Promise<PublishResult[]>;
    commitTransaction(): Promise<void>;
    abortTransaction(): Promise<void>;
    currentState(): TransactionState;
}
```

#### <code v-pre>TransactionalProducerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L72) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface TransactionalProducerConfig {
    readonly kafka: KafkaMock;
    readonly transactionalId: string;
}
```

#### <code v-pre>TransactionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L77) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export type TransactionState = 'idle' | 'active' | 'committed' | 'aborted';
```
