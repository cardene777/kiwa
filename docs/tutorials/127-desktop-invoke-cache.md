# Desktop v1.0 invoke-cache layer in 15 min

## What you'll build

A vitest suite wired to `@kiwa/desktop` v1.0 (invoke-cache layer、 v1.67 で **depth-6 pattern 2 例目確定 candidate** = Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6 の 2 例目化、 **systematic pattern 42 度目適用**、 **45 milestone streak**、 4 PR rhythm 14 milestone 連続 = 56 PR 連続)、 v0.9 で確立した probeAndInvoke 統合経路 の 上位 layer として、 同一 axis + target + args-hash の invoke を 2 回目以降 skip、 LRU + TTL 両立 in-memory cache で release cycle 全体 の 実 spawn cost を削減。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/desktop` v1.0 (`pnpm add -D @kiwa/desktop@^1.0`)

## Step-by-step build

### 1. InvokeCache 生成

default config (5 分 TTL + 128 maxEntries + enabled=true) で cache instance を生成。

```ts
import { InvokeCache } from '@kiwa/desktop';

const cache = new InvokeCache();
// または config 明示指定
const strictCache = new InvokeCache({ ttlMs: 60_000, maxEntries: 32, enabled: true });
```

### 2. withCache helper で probeAndInvoke を cache 経由 呼出

```ts
import { withCache } from '@kiwa/desktop';

const result = await withCache({
  cache,
  invokeInput: { axis: 'clipboard', target: 'macos' },
});
// result.invokeResult = v0.9 NativeInvokeResult (shape 契約 preserving)
// result.cacheStatus = 'cache-miss' (初回) → 'cache-hit' (2 回目)
// result.cacheKey = 'clipboard:macos:[]'
// result.cachedAt = 内部 clock 時刻 (cache-hit 時)
// result.cacheAgeMs = 経過時間 (cache-hit 時)
```

### 3. buildCacheKey で 決定的 key 生成

cache key は axis + target + args を 順序保持 で JSON.stringify 化。 env は cache key に 含めない (v1.62 real behavior SSOT に準拠、 env は spawn 副作用のみ)。

```ts
import { buildCacheKey } from '@kiwa/desktop';

const key1 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['copy'] });
// 'clipboard:macos:["copy"]'
const key2 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['paste'] });
// 'clipboard:macos:["paste"]' — 別 key
```

### 4. LRU + TTL の 4 status 経路

```ts
const result = await withCache({ cache, invokeInput: { axis, target } });

switch (result.cacheStatus) {
  case 'cache-hit':        // TTL 内 かつ 存在、 実 spawn 呼出なし
  case 'cache-miss':       // 未 cache、 実 spawn 実行 + 結果 cache
  case 'cache-invalidated': // TTL 超過、 実 spawn 実行 + 結果 再 cache
  case 'cache-disabled':   // enabled=false or 負値 config、 毎回 実 spawn
}
```

## systematic pattern 42 度目適用 の 5 原則

- shape 契約 preserving = NativeInvokeResult 構造 変更 0
- additive-only = cache field (cacheStatus / cacheKey / cachedAt / cacheAgeMs) は 別軸 additive
- backward compat 絶対維持 = v0.1-v0.9 API 変更 0、 withCache 使わない consumer は v0.9 相当
- LRU + TTL + enabled の 3 SSOT 統合
- observability additive (cacheStatus / cacheAgeMs で 経路 の可視化)

## depth-6 pattern 2 例目確定 candidate

- **1 例目 (depth-5)** = Mobile v1.54-v1.55 (native storage adapter 5 段深化)
- **1 例目 (depth-5)** = Desktop v1.60-v1.61 (native process spawn 5 段深化)
- **1 例目 (depth-5)** = quality-metrics v0.1-v0.5 (release gate 5 段深化)
- **v1.67 = 2 例目 (depth-6) candidate** = Desktop v0.1-v1.0 (invoke-cache で 4 layer separation 完成)

Desktop pair pioneer record 更新、 depth-6 pattern 2 例目確定 は v1.68+ の 実運用 継続で 判定。

## Reference: dogfood-desktop-invoke-cache-app

4 pattern workflow (`warmupCacheWithMatrix` + `probeAndInvokeCached` + `trackCacheEffectiveness` + `invalidateAndRefetch`) の実装は `examples/dogfood-desktop-invoke-cache-app/` を参照。

## What's next

- v1.67 で v1.0 の 実運用 経路 が 確立 = 次 v1.68 は depth-6 実運用 継続 or v2.0 rename milestone (@kiwa/* → @kiwa/*)
