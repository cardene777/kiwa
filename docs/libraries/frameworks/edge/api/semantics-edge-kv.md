---
title: "@kiwa-lab/edge semantics-edge-kv の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-edge-kv</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createEdgeKvSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L36) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

Construct a KV session. No event is emitted — the store is simply opened. Defaults to eventual consistency, the common edge-KV replication model.

```ts
export declare function createEdgeKvSession(input: {
    platform: EdgePlatform;
    state?: KvState;
}): EdgeKvSession;
```

#### <code v-pre>kvRangeQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L102) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

Range query over a key prefix. Returns the matching keys (sorted, up to `limit`) alongside the emitted step. Emits `kv.read` since a range scan is a store read. `limit` defaults to no cap.

```ts
export declare function kvRangeQuery(session: EdgeKvSession, input: {
    prefix: string;
    limit?: number;
}): {
    matches: string[];
    step: AxisStep<KvState>;
};
```

#### <code v-pre>kvRead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L55) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

Read a key. Three outcomes: - cache warm → `kv.cache-hit` - store only → `kv.read` and the cache is populated (read-through) - absent → `kv.cache-miss`

```ts
export declare function kvRead(session: EdgeKvSession, input: {
    key: string;
}): AxisStep<KvState>;
```

#### <code v-pre>kvWrite</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L82) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

Write a key. Updates the backing store and invalidates the cache entry so the next read goes through to the store. Emits `kv.write`.

```ts
export declare function kvWrite(session: EdgeKvSession, input: {
    key: string;
    value: string;
}): AxisStep<KvState>;
```

### 型

#### <code v-pre>EdgeKvSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L18) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

```ts
export interface EdgeKvSession {
    platform: EdgePlatform;
    store: Map<string, string>;
    cache: Map<string, string>;
    state: KvState;
    history: AxisStep<KvState>[];
}
```

#### <code v-pre>KvState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L16) <code v-pre>packages/edge/src/semantics/edge-kv.ts</code>

Edge KV — a globally replicated key/value store with a read-through cache. Cloudflare KV, Vercel Edge Config, and Deno KV all trade strong consistency for low-latency edge reads: a write may take time to propagate, and reads are served from a per-POP cache when warm. The mock models the observable surface: a backing `store`, a `cache` layer that a read populates and a write invalidates, and a range query over a key prefix. There is no state machine per se — the store is always usable. `state` records the consistency model the caller declared so downstream tests can assert on it. The 4 neutral events distinguish a cold read, a write, a warm cache hit, and a miss on an absent key.

```ts
export type KvState = 'consistent' | 'eventually-consistent';
```
