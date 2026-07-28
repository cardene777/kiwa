---
title: "@kiwa-lab/streaming semantics-nats-kv-object の API 契約"
---

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics-nats-kv-object</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createNatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L129) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

Create a combined KV + Object-store model. KV supports history depth + delete tombstones; Object splits inputs into chunks with per-chunk digest and an optional LZ4-tagged compression pass so tests can validate the chunk boundary + digest + reassembly.

```ts
export declare function createNatsKvObject(): NatsKvObject;
```

#### <code v-pre>isNatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L296) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

Type guard: recognize a NatsKvObject.

```ts
export declare function isNatsKvObject(value: unknown): value is NatsKvObject;
```

#### <code v-pre>NATS&#95;KV&#95;OBJECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L11) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export declare const NATS_KV_OBJECT_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>CompressionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L13) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export type CompressionKind = 'none' | 'lz4';
```

#### <code v-pre>KvBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L15) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvBucketConfig {
    readonly bucket: string;
    /** History depth — max revisions kept per key. Default 1. */
    readonly historyDepth?: number;
    /** ttl in ms — 0 = keep forever. Default 0. */
    readonly ttlMs?: number;
}
```

#### <code v-pre>KvRevision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L23) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvRevision<TValue = unknown> {
    readonly bucket: string;
    readonly key: string;
    readonly value: TValue;
    readonly revision: number;
    readonly createdAt: number;
    readonly operation: 'put' | 'delete';
}
```

#### <code v-pre>KvWatchEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L32) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvWatchEvent<TValue = unknown> {
    readonly revision: KvRevision<TValue>;
}
```

#### <code v-pre>NatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L58) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface NatsKvObject {
    readonly [NATS_KV_OBJECT_SYMBOL]: true;
    createKvBucket(config: KvBucketConfig): void;
    putKv<TValue = unknown>(bucket: string, key: string, value: TValue): KvRevision<TValue>;
    getKv<TValue = unknown>(bucket: string, key: string): KvRevision<TValue> | null;
    historyKv<TValue = unknown>(bucket: string, key: string): readonly KvRevision<TValue>[];
    deleteKv(bucket: string, key: string): KvRevision<null>;
    watchKv(bucket: string): AsyncIterable<KvWatchEvent>;
    emitWatchEvents(bucket: string, now: number): void;
    createObjectBucket(config: ObjectBucketConfig): void;
    putObject(bucket: string, name: string, bytes: Uint8Array): ObjectRecord;
    getObject(bucket: string, name: string): ObjectRecord | null;
    reassembleObject(bucket: string, name: string): Uint8Array | null;
    reset(): void;
}
```

#### <code v-pre>ObjectBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L36) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectBucketConfig {
    readonly bucket: string;
    /** Chunk size in bytes for object writes. Default 128 * 1024. */
    readonly chunkSizeBytes?: number;
    readonly compression?: CompressionKind;
}
```

#### <code v-pre>ObjectChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L43) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectChunk {
    readonly index: number;
    readonly bytes: Uint8Array;
    readonly digest: string;
}
```

#### <code v-pre>ObjectRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L49) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectRecord {
    readonly bucket: string;
    readonly name: string;
    readonly size: number;
    readonly chunks: readonly ObjectChunk[];
    readonly compression: CompressionKind;
    readonly writtenAt: number;
}
```
