---
title: "@kiwa-lab/streaming types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>CompatibilityMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L51) <code v-pre>packages/streaming/src/types.ts</code>

Compatibility mode — controls whether a new schema version can be registered against an existing subject. See Confluent Schema Registry docs for the canonical semantics; the mock enforces the intent, not every corner case.

```ts
export type CompatibilityMode = 'BACKWARD' | 'FORWARD' | 'FULL' | 'BACKWARD_TRANSITIVE' | 'FORWARD_TRANSITIVE' | 'FULL_TRANSITIVE' | 'NONE';
```

#### <code v-pre>DeadLetterEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L33) <code v-pre>packages/streaming/src/types.ts</code>

DLQ (dead-letter queue) entry — a message that exceeded retry budget.

```ts
export interface DeadLetterEntry<TValue = unknown, TKey = string> {
    readonly original: StreamingMessage<TValue, TKey>;
    readonly attempts: number;
    readonly reason: string;
    readonly quarantinedAt: number;
}
```

#### <code v-pre>MessageHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L28) <code v-pre>packages/streaming/src/types.ts</code>

Handler shape shared by consumer / group / subject subscribers.

```ts
export type MessageHandler<TValue = unknown, TKey = string> = (message: StreamingMessage<TValue, TKey>) => void | Promise<void>;
```

#### <code v-pre>PublishResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L9) <code v-pre>packages/streaming/src/types.ts</code>

Result of a single message publish.

```ts
export interface PublishResult {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
    readonly timestamp: number;
}
```

#### <code v-pre>SchemaKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L41) <code v-pre>packages/streaming/src/types.ts</code>

Schema kind supported by the schema-registry mock.

```ts
export type SchemaKind = 'avro' | 'protobuf' | 'json';
```

#### <code v-pre>StreamingMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L17) <code v-pre>packages/streaming/src/types.ts</code>

Single received message shared across all provider mocks.

```ts
export interface StreamingMessage<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
    readonly timestamp: number;
    readonly key: TKey | null;
    readonly value: TValue;
    readonly headers: Record<string, string>;
}
```

#### <code v-pre>StreamingProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L6) <code v-pre>packages/streaming/src/types.ts</code>

```ts
export type StreamingProvider = 'kafka' | 'redpanda' | 'nats';
```

#### <code v-pre>SubjectNamingStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L44) <code v-pre>packages/streaming/src/types.ts</code>

Subject naming strategy — how subjects derive from topic.

```ts
export type SubjectNamingStrategy = 'topic-name' | 'record-name' | 'topic-record-name';
```
