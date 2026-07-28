---
title: "@kiwa-lab/desktop adapters__invoke-cache の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;invoke-cache</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildCacheKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L58) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

axis + target + args を 決定的 に key 化 する SSOT helper。 args は 順序を 保持 (spawn 引数 の semantics 依存)、 env は cache key に 含めない (env は sanitize 済 で spawn 副作用のみ、 result semantics に 影響しない 前提、 v1.62 real behavior SSOT に 準拠)。

```ts
export declare function buildCacheKey(input: {
    axis: DesktopAxis;
    target: DesktopTarget;
    args?: string[];
}): string;
```

#### <code v-pre>InvokeCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L75) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

v1.0 InvokeCache class = LRU + TTL 両立 の in-memory cache。 test で new InvokeCache() 直接生成、 dogfood consumer は withCache helper を使う。 LRU 実装 = Map の insertion order (JS spec で保証) を再挿入 で 更新、 eviction 時は 最古 key を 削除。 TTL 判定 は get 時に entry.capturedAt + ttlMs を 現在時刻 と 比較。

```ts
/**
 * v1.0 InvokeCache class = LRU + TTL 両立 の in-memory cache。 test で
 * new InvokeCache() 直接生成、 dogfood consumer は withCache helper を使う。
 *
 * LRU 実装 = Map の insertion order (JS spec で保証) を再挿入 で 更新、
 * eviction 時は 最古 key を 削除。 TTL 判定 は get 時に entry.capturedAt +
 * ttlMs を 現在時刻 と 比較。
 */
export declare class InvokeCache {
    constructor(config?: InvokeCacheConfig, clock?: () => number);
    /** cache 全体 の enable 状態。 disabled なら 全 op で cache-disabled 返却。 */
    isEnabled(): boolean;
    /** cache 現状 の entry 数、 test / dogfood consumer で observability に使う。 */
    size(): number;
    /** 内部 clock を dogfood consumer に 露出、 withCache helper が 使用。 */
    getClockValue(): number;
    /**
     * cache から 取り出す。 TTL 超過 は cache-invalidated として entry 削除 +
     * null 返却、 未 hit は null 返却、 hit は entry を Map 末尾に 再挿入 (LRU)。
     */
    get(key: string): {
        entry: CachedInvokeEntry;
        status: 'cache-hit';
    } | {
        status: 'cache-miss' | 'cache-invalidated' | 'cache-disabled';
    };
    /** cache に 書込 む。 maxEntries 超過 時 は 最古 (Map 先頭) を evict。 */
    set(key: string, result: NativeInvokeResult): CachedInvokeEntry;
    /** 手動 invalidate、 特定 key の entry を 削除。 存在しない key は no-op。 */
    invalidate(key: string): boolean;
    /** cache 全体 clear、 dogfood 経路 で release 前 に 呼出。 */
    clear(): void;
}
```

#### <code v-pre>withCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L167) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

withCache = probeAndInvoke を cache 経由 で 呼出す 統合 helper。 cache-miss / cache-invalidated / cache-disabled 時 は 実 probeAndInvoke を 実行 して 結果 を cache に 書込む、 cache-hit 時 は そのまま 返却。 shape 契約 preserving = NativeInvokeResult は そのまま 保持、 cache 経由 判定 は cacheStatus field で 別軸 露出。 dogfood consumer は invokeResult を 触るだけ で v0.9 相当 の 動作、 cacheStatus は observability 目的。

```ts
export declare function withCache(input: {
    cache: InvokeCache;
    invokeInput: NativeInvokeInput;
}): Promise<CachedNativeInvokeResult>;
```

### 型

#### <code v-pre>CachedInvokeEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L24) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

cache 済 invoke 結果 の envelope、 TTL 判定 用 の capturedAt 保持。

```ts
export interface CachedInvokeEntry {
    key: string;
    capturedAt: number;
    result: NativeInvokeResult;
}
```

#### <code v-pre>CachedNativeInvokeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L31) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

v1.0 invoke-cache の 結果、 NativeInvokeResult 拡張 additive。

```ts
export interface CachedNativeInvokeResult {
    invokeResult: NativeInvokeResult;
    cacheStatus: CacheStatus;
    cacheKey: string;
    cachedAt: number | null;
    cacheAgeMs: number | null;
}
```

#### <code v-pre>CacheStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L21) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

```ts
export type CacheStatus = 'cache-hit' | 'cache-miss' | 'cache-invalidated' | 'cache-disabled';
```

#### <code v-pre>InvokeCacheConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/invoke-cache.ts#L40) <code v-pre>packages/desktop/src/adapters/invoke-cache.ts</code>

cache 設定 SSOT、 全 field default 明示。

```ts
export interface InvokeCacheConfig {
    /** TTL (ms)、 default 5 分。 0 = 無期限、 負値 = disabled。 */
    ttlMs?: number;
    /** LRU 最大 entry 数、 default 128。 0 = 無制限、 負値 = disabled。 */
    maxEntries?: number;
    /** cache 全体 の enable flag、 default true。 */
    enabled?: boolean;
}
```
