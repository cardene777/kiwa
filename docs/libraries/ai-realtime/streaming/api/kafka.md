---
title: "@kiwa-lab/streaming kafka の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>kafka</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createKafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L141) <code v-pre>packages/streaming/src/kafka.ts</code>

Create a Kafka-shaped mock — the object returned mirrors the surface of `new Kafka({...})` from the `kafkajs` package. Every producer / consumer / admin issued from the same mock shares topic state so tests can write in one client and assert in another.

```ts
export declare function createKafkaMock(config?: KafkaMockConfig): KafkaMock;
```

#### <code v-pre>isKafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L488) <code v-pre>packages/streaming/src/kafka.ts</code>

Type guard: recognize a KafkaMock.

```ts
export declare function isKafkaMock(value: unknown): value is KafkaMock;
```

#### <code v-pre>KAFKA&#95;ADMIN&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L18) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_ADMIN_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;CONSUMER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L17) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_CONSUMER_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L15) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_MOCK_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L16) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_PRODUCER_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>CommittedOffset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L82) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface CommittedOffset {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
}
```

#### <code v-pre>ConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L49) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ConsumerConfig {
    readonly groupId: string;
    readonly partitionAssigner?: PartitionAssigner;
    readonly sessionTimeoutMs?: number;
}
```

#### <code v-pre>KafkaAdmin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L88) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaAdmin {
    readonly [KAFKA_ADMIN_SYMBOL]: true;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createTopics(opts: {
        readonly topics: readonly {
            readonly topic: string;
            readonly numPartitions?: number;
        }[];
    }): Promise<void>;
    listTopics(): Promise<string[]>;
    deleteTopics(opts: {
        readonly topics: readonly string[];
    }): Promise<void>;
    fetchTopicMetadata(opts: {
        readonly topics: readonly string[];
    }): Promise<{
        readonly topics: readonly KafkaTopicSpec[];
    }>;
}
```

#### <code v-pre>KafkaConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L66) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaConsumer {
    readonly [KAFKA_CONSUMER_SYMBOL]: true;
    readonly groupId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(opts: {
        readonly topics: readonly string[];
        readonly fromBeginning?: boolean;
    }): Promise<void>;
    run<TValue = unknown, TKey = string>(opts: {
        readonly eachMessage: MessageHandler<TValue, TKey>;
        readonly autoCommit?: boolean;
    }): Promise<void>;
    commitOffsets(offsets: readonly CommittedOffset[]): Promise<void>;
    seek(opts: {
        readonly topic: string;
        readonly partition: number;
        readonly offset: number;
    }): void;
    assignments(): ReadonlyMap<string, readonly number[]>;
    isConnected(): boolean;
}
```

#### <code v-pre>KafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L105) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaMock {
    readonly [KAFKA_MOCK_SYMBOL]: true;
    readonly config: KafkaMockConfig;
    producer(): KafkaProducer;
    consumer(config: ConsumerConfig): KafkaConsumer;
    admin(): KafkaAdmin;
    /** Reset all producers / consumers / topics — useful between test cases. */
    reset(): void;
    /** Direct topic access for lower-level assertions. */
    getTopicMessages(topic: string): readonly StreamingMessage[];
    getCommittedOffset(groupId: string, topic: string, partition: number): number | undefined;
}
```

#### <code v-pre>KafkaMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L22) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaMockConfig {
    readonly clientId?: string;
    readonly brokers?: readonly string[];
    /** Default partition count for auto-created topics. */
    readonly defaultPartitionCount?: number;
}
```

#### <code v-pre>KafkaProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L55) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaProducer {
    readonly [KAFKA_PRODUCER_SYMBOL]: true;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>): Promise<PublishResult[]>;
    sendBatch(records: readonly ProducerRecord[]): Promise<PublishResult[]>;
    isConnected(): boolean;
}
```

#### <code v-pre>KafkaTopicSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L29) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaTopicSpec {
    readonly topic: string;
    readonly numPartitions: number;
    /** Optional per-partition ownership map — group id → member id. */
    readonly assignments?: ReadonlyMap<number, string>;
}
```

#### <code v-pre>PartitionAssigner</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L20) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export type PartitionAssigner = 'range' | 'round-robin';
```

#### <code v-pre>ProducerMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L41) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ProducerMessage<TValue = unknown, TKey = string> {
    readonly key?: TKey;
    readonly value: TValue;
    readonly partition?: number;
    readonly headers?: Record<string, string>;
    readonly timestamp?: number;
}
```

#### <code v-pre>ProducerRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L36) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ProducerRecord<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly messages: readonly ProducerMessage<TValue, TKey>[];
}
```
