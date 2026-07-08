# kiwa v1.67 released — Desktop 深化 IX (v1.0 invoke-cache layer、 depth-6 pattern 2 例目確定 candidate、 systematic pattern 42 度目、 45 milestone streak)

## Summary

kiwa v1.67 is out。 **Desktop 深化 IX** 単軸 milestone、 v0.9 実 native binding 呼出 に **v1.0 で invoke-cache layer を統合**、 InvokeCache class = LRU + TTL 両立 in-memory cache + withCache helper = probeAndInvoke 統合、 同一 axis + target + args-hash の 2 回目以降 invoke を skip して release cycle 全体 の 実 spawn cost を削減。 v1.55-v1.66 4 PR rhythm 継承 (**14 milestone 連続 = 56 PR 連続同 rhythm**)、 **systematic pattern 42 度目適用**、 **45 milestone snippet streak 到達**、 shape 契約 preserving 絶対維持、 **depth-6 pattern 2 例目確定 candidate** (Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6 の 2 例目化 candidate)。

## What's new

### `@kiwa-test/desktop` v0.9 → v1.0 major bump

- **InvokeCache class** = LRU + TTL 両立 in-memory cache、 default 5 分 TTL + 128 maxEntries + enabled=true
- **withCache helper** = probeAndInvoke 統合、 4 status 経路 (cache-hit / cache-miss / cache-invalidated / cache-disabled)
- **buildCacheKey SSOT** = axis + target + args を 決定的 key 化
- **shape 契約 preserving 絶対維持** = NativeInvokeResult 5 field 変更 0、 cache field は additive extension

### dogfood 新規

- `dogfood-desktop-invoke-cache-app` = warmupCacheWithMatrix + probeAndInvokeCached + trackCacheEffectiveness + invalidateAndRefetch の 4 pattern、 11 test 全 PASS

### 1 new tutorial + migration + concept

- **[Tutorial 127 — Desktop v1.0 invoke-cache](https://cardene777.github.io/kiwa/tutorials/127-desktop-invoke-cache)**
- Migration v1.66 → v1.67 additive
- Concept doc `desktop-invoke-cache.md`

### 45-milestone consecutive snippet validation streak

v1.23 → v1.67 = **45 milestone**、 kiwa 史上最長記録更新継続。

### depth-6 pattern 2 例目確定 candidate

- **1 例目 (depth-5)** = Mobile v1.54-v1.55 / Desktop v1.60-v1.61 / quality-metrics v0.1-v0.5
- **v1.67 = 2 例目 (depth-6) candidate** = Desktop v0.1-v1.0 (4 layer separation 完成)

## Install

```bash
pnpm add -D @kiwa-test/desktop@^1.0
```

## Migration guide

[v1.66 → v1.67](https://cardene777.github.io/kiwa/migrations/v1.66-to-v1.67)

## What's next

- v1.68+ = depth-6 実運用継続 or v2.0 rename milestone (@kiwa-test/* → @kiwa/*)
