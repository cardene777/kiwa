---
title: "@kiwa-lab/streaming semantics__kafka-raw-protocol の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;kafka-raw-protocol</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createKafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L114) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

Create a Kafka raw-protocol semantics model. Exposes the pieces of the wire protocol that show up in exactly-once tests: producer id + epoch, txn coordinator state, incremental fetch sessions, and ISR + high-watermark.

```ts
export declare function createKafkaRawProtocol(config?: KafkaRawProtocolConfig): KafkaRawProtocol;
```

#### <code v-pre>isKafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L235) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

Type guard: recognize a KafkaRawProtocol.

```ts
export declare function isKafkaRawProtocol(value: unknown): value is KafkaRawProtocol;
```

#### <code v-pre>KAFKA&#95;RAW&#95;PROTOCOL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L15) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export declare const KAFKA_RAW_PROTOCOL_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>FetchSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L37) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface FetchSession {
    readonly sessionId: number;
    epoch: number;
}
```

#### <code v-pre>KafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L42) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface KafkaRawProtocol {
    readonly [KAFKA_RAW_PROTOCOL_SYMBOL]: true;
    readonly config: Required<KafkaRawProtocolConfig>;
    /** InitProducerId — assigns a fresh (producerId, epoch=0) pair. */
    initProducerId(): ProducerIdentity;
    /**
     * Fence a producer identity — bumps the current epoch, which causes any
     * older-epoch send to be rejected as `INVALID_PRODUCER_EPOCH`. Matches the
     * KIP-98 fencing rule that a coordinator re-init bumps epoch.
     */
    fenceProducer(producerId: number): ProducerIdentity;
    /** Return true if (producerId, epoch) is still the latest identity. */
    isValidEpoch(identity: ProducerIdentity): boolean;
    /** Transition the transaction coordinator state machine. Rejects invalid transitions. */
    transitionTransaction(from: TransactionCoordinatorState, to: TransactionCoordinatorState): void;
    /** Current transaction coordinator state. */
    transactionState(): TransactionCoordinatorState;
    /** Open a new incremental fetch session (KIP-227). */
    openFetchSession(): FetchSession;
    /** Advance a fetch session epoch and return the current one. Throws on stale sessions. */
    bumpFetchSession(sessionId: number): number;
    /** Add a broker id to the ISR set for the given topic-partition. */
    addToIsr(topic: string, partition: number, brokerId: number): void;
    /** Remove a broker id from the ISR set (lag / heartbeat timeout). */
    removeFromIsr(topic: string, partition: number, brokerId: number): void;
    /** Current ISR set for a topic-partition. */
    getIsr(topic: string, partition: number): readonly number[];
    /**
     * Try to advance the high-watermark to `nextOffset`. Only succeeds when the
     * ISR set size >= `minInSyncReplicas`. Returns the resulting HW.
     */
    advanceHighWatermark(topic: string, partition: number, nextOffset: number): number;
    /** Current high watermark for a topic-partition. */
    getHighWatermark(topic: string, partition: number): number;
    /** Reset all state — useful between test cases. */
    reset(): void;
}
```

#### <code v-pre>KafkaRawProtocolConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L17) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface KafkaRawProtocolConfig {
    /** How many replicas a partition has. Default 3, matches broker.default. */
    readonly replicationFactor?: number;
    /** min.insync.replicas — commit gate. Default 2. */
    readonly minInSyncReplicas?: number;
}
```

#### <code v-pre>ProducerIdentity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L32) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface ProducerIdentity {
    readonly producerId: number;
    readonly epoch: number;
}
```

#### <code v-pre>TransactionCoordinatorState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L24) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export type TransactionCoordinatorState = 'Empty' | 'Ongoing' | 'PrepareCommit' | 'CompleteCommit' | 'PrepareAbort' | 'CompleteAbort';
```
