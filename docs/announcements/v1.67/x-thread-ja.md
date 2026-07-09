# kiwa v1.67 x-thread (日本語)

## Tweet 1

kiwa v1.67 リリース — Desktop 深化 IX。 **@kiwa-lab/desktop v1.0** (major bump) で invoke-cache layer 統合、 InvokeCache class = LRU + TTL 両立 in-memory cache + withCache helper = probeAndInvoke 統合、 4 status 経路 (cache-hit / cache-miss / cache-invalidated / cache-disabled)。 v1.55-v1.66 4 PR rhythm 継承 (**14 milestone 連続 = 56 PR 連続同 rhythm**)、 **systematic pattern 42 度目適用**、 **depth-6 pattern 2 例目確定 candidate**。

## Tweet 2

default 5 分 TTL + 128 maxEntries + enabled=true。 buildCacheKey SSOT = axis + target + args を 決定的 key 化。 shape 契約 preserving 絶対維持 = NativeInvokeResult 5 field 変更 0、 v0.1-v0.9 API 変更 0。 withCache 使わない consumer は v0.9 相当 の 動作。

## Tweet 3

dogfood-desktop-invoke-cache-app 新規、 4 pattern workflow (warmupCacheWithMatrix + probeAndInvokeCached + trackCacheEffectiveness + invalidateAndRefetch)、 11 test 全 PASS。 **45 milestone 連続 snippet validation streak** (v1.23-v1.67) 達成。

## Tweet 4

`pnpm add -D @kiwa-lab/desktop@^1.0`。 migration: https://cardene777.github.io/kiwa/migrations/v1.66-to-v1.67

**depth-6 pattern 2 例目確定 candidate** = Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6 = 4 layer separation 完成 (real behavior + probe + 実 invoke + invoke-cache)。 Desktop pair pioneer record 更新。

4 sub 完遂 (v1.67-1 v1.0 invoke-cache + 15 test / v1.67-2 dogfood 11 test / v1.67-3 docs 45 streak / v1.67-4 publish)。

#kiwa #desktop #invoke-cache #testing #vitest #lru #ttl
