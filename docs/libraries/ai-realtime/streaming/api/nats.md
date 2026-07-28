---
title: "@kiwa-lab/streaming nats の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>nats</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>compileSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L156) <code v-pre>packages/streaming/src/nats.ts</code>

Compile a NATS subject pattern (`orders.&gt;`, `orders.*.created`) into a regex. `*` matches exactly one token, `&gt;` matches one or more trailing tokens. Literal matches are supported as-is.

```ts
export declare function compileSubject(pattern: string): SubjectMatcher;
```

#### <code v-pre>createNatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L187) <code v-pre>packages/streaming/src/nats.ts</code>

Create a NATS-shaped mock — the returned object mirrors the surface of `connect({...})` from the `nats` package. All subscriptions / streams / stores share one instance so tests can publish in one place and observe in another.

```ts
export declare function createNatsMock(config?: NatsMockConfig): NatsMock;
```

#### <code v-pre>isNatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L488) <code v-pre>packages/streaming/src/nats.ts</code>

Type guard: recognize a NatsMock.

```ts
export declare function isNatsMock(value: unknown): value is NatsMock;
```

#### <code v-pre>matchSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L177) <code v-pre>packages/streaming/src/nats.ts</code>

Match a subject against a compiled pattern.

```ts
export declare function matchSubject(matcher: SubjectMatcher, subject: string): boolean;
```

#### <code v-pre>NATS&#95;JETSTREAM&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L13) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_JETSTREAM_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;KV&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L14) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_KV_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L12) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_MOCK_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;OBJECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L15) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_OBJECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>JetStreamConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L33) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConfig {
    readonly name: string;
    readonly subjects: readonly string[];
    /** Retention policy — `limits` = size/time based, `interest` = consumer-based, `workqueue` = consume-once. */
    readonly retention?: 'limits' | 'interest' | 'workqueue';
    readonly maxMsgs?: number;
}
```

#### <code v-pre>JetStreamConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L53) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConsumer {
    readonly durable: string;
    fetch(batch: number): Promise<StreamingMessage[]>;
    ack(message: StreamingMessage): void;
    info(): {
        readonly delivered: number;
        readonly ackFloor: number;
    };
}
```

#### <code v-pre>JetStreamConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L47) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConsumerConfig {
    readonly durable: string;
    readonly filterSubject?: string;
    readonly ackPolicy?: 'explicit' | 'none' | 'all';
}
```

#### <code v-pre>JetStreamPublishAck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L41) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamPublishAck {
    readonly stream: string;
    readonly seq: number;
    readonly duplicate: boolean;
}
```

#### <code v-pre>JetStreamStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L60) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamStore {
    readonly [NATS_JETSTREAM_SYMBOL]: true;
    addStream(config: JetStreamConfig): Promise<void>;
    publish<TValue = unknown>(subject: string, data: TValue): Promise<JetStreamPublishAck>;
    consumer(streamName: string, config: JetStreamConsumerConfig): Promise<JetStreamConsumer>;
    listStreams(): readonly string[];
    getStreamMessages(streamName: string): readonly StreamingMessage[];
}
```

#### <code v-pre>KVEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L79) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface KVEntry<TValue = unknown> {
    readonly bucket: string;
    readonly key: string;
    readonly value: TValue;
    readonly revision: number;
    readonly timestamp: number;
}
```

#### <code v-pre>KVStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L69) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface KVStore {
    readonly [NATS_KV_SYMBOL]: true;
    readonly bucket: string;
    put<TValue = unknown>(key: string, value: TValue): Promise<number>;
    get<TValue = unknown>(key: string): Promise<KVEntry<TValue> | null>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
    watch(): AsyncIterable<KVEntry>;
}
```

#### <code v-pre>NatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L109) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsMock {
    readonly [NATS_MOCK_SYMBOL]: true;
    readonly config: NatsMockConfig;
    publish<TValue = unknown>(subject: string, data: TValue, options?: NatsPublishOptions): Promise<PublishResult>;
    subscribe<TValue = unknown>(subject: string, handler: MessageHandler<TValue>): NatsSubscription;
    request<TIn = unknown, TOut = unknown>(subject: string, data: TIn): Promise<StreamingMessage<TOut>>;
    jetstream(): JetStreamStore;
    kv(bucket: string): KVStore;
    objectStore(bucket: string): ObjectStore;
    drain(): Promise<void>;
    reset(): void;
    getSubjectMessages(subject: string): readonly StreamingMessage[];
}
```

#### <code v-pre>NatsMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L17) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsMockConfig {
    readonly servers?: readonly string[];
    readonly name?: string;
}
```

#### <code v-pre>NatsPublishOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L22) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsPublishOptions {
    readonly headers?: Record<string, string>;
    readonly reply?: string;
}
```

#### <code v-pre>NatsSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L27) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsSubscription {
    readonly subject: string;
    unsubscribe(): void;
    isClosed(): boolean;
}
```

#### <code v-pre>ObjectEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L104) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectEntry {
    readonly info: ObjectInfo;
    readonly data: Uint8Array;
}
```

#### <code v-pre>ObjectInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L96) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectInfo {
    readonly bucket: string;
    readonly name: string;
    readonly size: number;
    readonly digest: string;
    readonly timestamp: number;
}
```

#### <code v-pre>ObjectStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L87) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectStore {
    readonly [NATS_OBJECT_SYMBOL]: true;
    readonly bucket: string;
    put(name: string, data: Uint8Array | string): Promise<ObjectInfo>;
    get(name: string): Promise<ObjectEntry | null>;
    delete(name: string): Promise<void>;
    list(): Promise<ObjectInfo[]>;
}
```
