# kiwa v1.67 x-thread (English)

## Tweet 1

kiwa v1.67 is out — Desktop deepening IX. **@kiwa-lab/desktop v1.0** (major bump) adds invoke-cache layer, InvokeCache class = LRU + TTL in-memory cache, withCache helper integrates probeAndInvoke, 4 status routes (cache-hit / cache-miss / cache-invalidated / cache-disabled). Inherits v1.55-v1.66 4-PR rhythm (**14 milestones = 56 PRs same rhythm**), **systematic pattern 42nd application**, **depth-6 pattern 2nd case candidate**.

## Tweet 2

Default 5-min TTL + 128 maxEntries + enabled=true. buildCacheKey SSOT = axis + target + args deterministic key. shape contract preserving absolute (NativeInvokeResult 5 fields unchanged, v0.1-v0.9 API 0 changes). withCache-free consumers behave as v0.9.

## Tweet 3

dogfood-desktop-invoke-cache-app new, 4-pattern workflow (warmupCacheWithMatrix + probeAndInvokeCached + trackCacheEffectiveness + invalidateAndRefetch), 11 tests all pass. **45-milestone consecutive snippet-validation streak** (v1.23-v1.67) achieved.

## Tweet 4

`pnpm add -D @kiwa-lab/desktop@^1.0`. Migration: https://cardene777.github.io/kiwa/migrations/v1.66-to-v1.67

**depth-6 pattern 2nd case candidate** = Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6 = 4 layer separation completed (real behavior + probe + real invoke + invoke-cache). Desktop pair pioneer record updated.

4 subs completed (v1.67-1 v1.0 invoke-cache + 15 tests / v1.67-2 dogfood 11 tests / v1.67-3 docs 45 streak / v1.67-4 publish).

#kiwa #desktop #invoke-cache #testing #vitest #lru #ttl
