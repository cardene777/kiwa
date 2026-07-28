---
title: "@kiwa-lab/cache semantics__cache-lifecycle-orchestrator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cache</code> <code v-pre>semantics&#95;&#95;cache-lifecycle-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L35) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

```ts
export declare function startCache(input: {
    timestamp: string;
}): CacheSession;
```

#### <code v-pre>summarizeCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L146) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeCache(session: CacheSession): CacheSummary;
```

### 型

#### <code v-pre>CacheEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L14) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

```ts
export type CacheEvent = 'write-committed' | 'read-hit' | 'read-miss' | 'ttl-warning' | 'ttl-expired' | 'invalidate-requested' | 'evict-requested' | 'timeout';
```

#### <code v-pre>CacheSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L24) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

```ts
export interface CacheSession {
    state: CacheState;
    writesCommitted: number;
    readHits: number;
    readMisses: number;
    ttlWarnings: number;
    evictions: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>CacheState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L7) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

v0.6 cache-lifecycle-orchestrator = 3 provider (Redis + Memcached + KeyDB) の 継続合成 layer。 depth-5 pattern 11 例目 candidate、 backend systems layer 第 3 例、 systematic pattern 53 度目。

```ts
export type CacheState = 'filling' | 'hot' | 'expiring' | 'stale' | 'evicted';
```

#### <code v-pre>CacheSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cache/src/semantics/cache-lifecycle-orchestrator.ts#L133) <code v-pre>packages/cache/src/semantics/cache-lifecycle-orchestrator.ts</code>

```ts
export interface CacheSummary {
    currentState: CacheState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    writesCommitted: number;
    readHits: number;
    readMisses: number;
    ttlWarnings: number;
    evictions: number;
}
```
