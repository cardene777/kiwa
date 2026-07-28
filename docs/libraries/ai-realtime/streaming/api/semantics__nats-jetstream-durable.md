---
title: "@kiwa-lab/streaming semantics__nats-jetstream-durable の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;nats-jetstream-durable</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createNatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L102) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

Create a durable-consumer model. `deliver(now)` picks the next eligible message (either a new one or a redelivery whose backoff has elapsed) and increments its attempt count. On the `maxDeliver`+1st failure, the message is quarantined for inspection.

```ts
export declare function createNatsJetStreamDurable<TValue = unknown>(config: DurableConsumerConfig): NatsJetStreamDurable<TValue>;
```

#### <code v-pre>isNatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L247) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

Type guard: recognize a NatsJetStreamDurable.

```ts
export declare function isNatsJetStreamDurable(value: unknown): value is NatsJetStreamDurable<unknown>;
```

#### <code v-pre>NATS&#95;JETSTREAM&#95;DURABLE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L12) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export declare const NATS_JETSTREAM_DURABLE_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>AckPendingEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L40) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface AckPendingEntry {
    readonly seq: number;
    readonly deliveries: number;
    readonly lastDeliveredAt: number;
}
```

#### <code v-pre>AckPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L16) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export type AckPolicy = 'explicit' | 'all' | 'none';
```

#### <code v-pre>DeliveryAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L33) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface DeliveryAttempt<TValue = unknown> {
    readonly seq: number;
    readonly attempt: number;
    readonly deliveredAt: number;
    readonly message: StreamingMessage<TValue>;
}
```

#### <code v-pre>DurableConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L18) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface DurableConsumerConfig {
    readonly durableName: string;
    readonly filterSubject?: string;
    /** ack_wait — after this many ms with no ack, the message is redelivered. Default 30_000. */
    readonly ackWaitMs?: number;
    /** max_deliver — total delivery attempts before quarantine. Default 3. */
    readonly maxDeliver?: number;
    readonly ackPolicy?: AckPolicy;
    /**
     * backoff schedule (ms) — delay between redelivery attempts. When exhausted,
     * the last entry is used for further redeliveries. Empty ⇒ immediate.
     */
    readonly backoff?: readonly number[];
}
```

#### <code v-pre>NatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L53) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface NatsJetStreamDurable<TValue = unknown> {
    readonly [NATS_JETSTREAM_DURABLE_SYMBOL]: true;
    readonly config: Required<Pick<DurableConsumerConfig, 'durableName' | 'ackWaitMs' | 'maxDeliver' | 'ackPolicy'>> & {
        readonly backoff: readonly number[];
        readonly filterSubject: string | undefined;
    };
    /** Enqueue a fresh message onto the stream. Returns the assigned seq. */
    publish(message: Omit<StreamingMessage<TValue>, 'offset'> & {
        readonly subject?: string;
    }): number;
    /** Deliver the next unacked / pending message to the consumer. */
    deliver(now: number): DeliveryAttempt<TValue> | null;
    /** Ack a delivered message by seq — marks it done. */
    ack(seq: number): void;
    /** Nack — mark the delivery failed. Redelivered on next `deliver()` respecting backoff. */
    nack(seq: number, now: number): void;
    /**
     * Sweep — advance any pending deliveries whose `ack_wait` has elapsed. This
     * is what real JetStream does on a timer; tests drive it explicitly.
     */
    sweepExpired(now: number): readonly number[];
    /** Current ack-pending window (seq → deliveries + lastDeliveredAt). */
    ackPending(): readonly AckPendingEntry[];
    /** Messages that exceeded `maxDeliver` and were quarantined. */
    quarantined(): readonly QuarantinedMessage<TValue>[];
    info(): {
        readonly delivered: number;
        readonly ackFloor: number;
        readonly pending: number;
    };
    reset(): void;
}
```

#### <code v-pre>QuarantinedMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L46) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface QuarantinedMessage<TValue = unknown> {
    readonly seq: number;
    readonly attempts: number;
    readonly message: StreamingMessage<TValue>;
    readonly reason: string;
}
```
