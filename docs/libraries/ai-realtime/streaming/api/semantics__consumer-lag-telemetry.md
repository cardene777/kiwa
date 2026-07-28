---
title: "@kiwa-lab/streaming semantics__consumer-lag-telemetry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;consumer-lag-telemetry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>CONSUMER&#95;LAG&#95;TELEMETRY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L13) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export declare const CONSUMER_LAG_TELEMETRY_SYMBOL: unique symbol;
```

#### <code v-pre>createConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L97) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

Create a consumer-lag + telemetry aggregator. Producers call `recordHighWatermark` on each append, consumers call `recordCommittedOffset` on each commit. `snapshot()` returns the pair as a single row — the same shape observability platforms pull off Kafka via JMX exports.

```ts
export declare function createConsumerLagTelemetry(config: ConsumerLagTelemetryConfig): ConsumerLagTelemetry;
```

#### <code v-pre>isConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L193) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

Type guard: recognize a ConsumerLagTelemetry.

```ts
export declare function isConsumerLagTelemetry(value: unknown): value is ConsumerLagTelemetry;
```

### 型

#### <code v-pre>ConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L36) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface ConsumerLagTelemetry {
    readonly [CONSUMER_LAG_TELEMETRY_SYMBOL]: true;
    readonly config: Required<ConsumerLagTelemetryConfig>;
    /** Update the broker-side high watermark for a topic-partition. */
    recordHighWatermark(topic: string, partition: number, offset: number, timestamp: number): void;
    /** Update the consumer group's committed offset for a topic-partition. */
    recordCommittedOffset(consumerGroup: string, topic: string, partition: number, offset: number, timestamp: number): void;
    /** Capture a snapshot for a single (group, topic, partition). */
    snapshot(input: {
        readonly consumerGroup: string;
        readonly topic: string;
        readonly partition: number;
        readonly now: number;
    }): OffsetSnapshot | null;
    /** Capture snapshots for every (group, topic, partition) known to the telemetry. */
    snapshotAll(now: number): readonly OffsetSnapshot[];
    /** Aggregate lag across all partitions of a topic for a single group. */
    aggregateGroupLag(consumerGroup: string, topic: string, now: number): {
        readonly totalOffsetLag: number;
        readonly maxOffsetLag: number;
        readonly partitionCount: number;
    };
    reset(): void;
}
```

#### <code v-pre>ConsumerLagTelemetryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L17) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface ConsumerLagTelemetryConfig {
    readonly provider: StreamingProvider;
    /** Refresh interval in ms — throttles snapshot generation. Default 5_000. */
    readonly refreshIntervalMs?: number;
}
```

#### <code v-pre>OffsetSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L23) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface OffsetSnapshot {
    readonly topic: string;
    readonly partition: number;
    readonly consumerGroup: string;
    readonly highWatermark: number;
    readonly committedOffset: number;
    readonly offsetLag: number;
    readonly headTimestamp: number;
    readonly lastConsumedTimestamp: number;
    readonly timeLagMs: number;
    readonly capturedAt: number;
}
```
