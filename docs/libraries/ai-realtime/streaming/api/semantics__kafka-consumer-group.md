---
title: "@kiwa-lab/streaming semantics__kafka-consumer-group の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics&#95;&#95;kafka-consumer-group</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createKafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L91) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

Create a coordinator-side consumer-group model. Static members (`groupInstanceId` set) survive a re-join without triggering a rebalance — this is the KIP-345 flow that keeps assignments sticky across pod restarts. Cooperative protocol emits `reassignedMembers` = only those whose partitions moved, so tests can assert incremental behavior.

```ts
export declare function createKafkaConsumerGroup(config: KafkaConsumerGroupConfig): KafkaConsumerGroup;
```

#### <code v-pre>isKafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L264) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

Type guard: recognize a KafkaConsumerGroup.

```ts
export declare function isKafkaConsumerGroup(value: unknown): value is KafkaConsumerGroup;
```

#### <code v-pre>KAFKA&#95;CONSUMER&#95;GROUP&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L10) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export declare const KAFKA_CONSUMER_GROUP_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>GroupMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L22) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface GroupMember {
    readonly memberId: string;
    /** Group instance id from KIP-345. Present ⇒ member is "static". */
    readonly groupInstanceId: string | undefined;
    readonly subscribedTopics: readonly string[];
    lastHeartbeatAt: number;
    assignedPartitions: Map<string, number[]>;
}
```

#### <code v-pre>KafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L39) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface KafkaConsumerGroup {
    readonly [KAFKA_CONSUMER_GROUP_SYMBOL]: true;
    readonly groupId: string;
    readonly config: Required<KafkaConsumerGroupConfig>;
    /** Register topic partition counts so the coordinator can compute assignments. */
    registerTopic(topic: string, numPartitions: number): void;
    /** JoinGroup RPC — returns the assigned memberId. Blocks until SyncGroup. */
    joinGroup(input: {
        readonly subscribedTopics: readonly string[];
        readonly groupInstanceId?: string;
    }): {
        readonly memberId: string;
        readonly generationId: number;
    };
    /** LeaveGroup RPC — removes the member and triggers a rebalance. */
    leaveGroup(memberId: string): void;
    /** Heartbeat — extend the member's liveness. Throws if the member is unknown. */
    heartbeat(memberId: string, now?: number): void;
    /**
     * Detect expired members (no heartbeat within `sessionTimeoutMs`) and remove
     * them. Returns removed member ids. Callers typically loop this on a timer.
     */
    expireDeadMembers(now: number): readonly string[];
    /** Force a rebalance — recomputes assignments across the current member set. */
    rebalance(): RebalanceResult;
    /** Current generation id. */
    generation(): number;
    listMembers(): readonly GroupMember[];
    reset(): void;
}
```

#### <code v-pre>KafkaConsumerGroupConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L14) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface KafkaConsumerGroupConfig {
    readonly groupId: string;
    /** `sessionTimeoutMs` from KIP-32 — heartbeat expiry window. Default 30_000. */
    readonly sessionTimeoutMs?: number;
    /** Rebalance protocol — `cooperative` = KIP-429 incremental. Default `eager`. */
    readonly protocol?: RebalanceProtocol;
}
```

#### <code v-pre>RebalanceProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L12) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export type RebalanceProtocol = 'eager' | 'cooperative';
```

#### <code v-pre>RebalanceResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L31) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface RebalanceResult {
    readonly generationId: number;
    readonly protocol: RebalanceProtocol;
    readonly assignments: ReadonlyMap<string, ReadonlyMap<string, readonly number[]>>;
    /** Members whose assignments changed compared to the previous generation. */
    readonly reassignedMembers: readonly string[];
}
```
