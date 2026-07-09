---
title: "kiwa v1.67 リリース — Desktop 深化 IX (@kiwa-lab/desktop v1.0 invoke-cache layer、 depth-6 pattern 2 例目確定 candidate、 systematic pattern 42 度目、 45 milestone streak)"
emoji: "💾"
type: "tech"
topics: ["testing", "vitest", "desktop", "cache", "lru"]
published: false
---

# kiwa v1.67 リリース — Desktop 深化 IX

## Summary

**Desktop 深化 IX** 単軸 milestone、 v0.9 実 native binding 呼出 に **v1.0 で invoke-cache layer を統合**、 InvokeCache class = LRU + TTL 両立 in-memory cache + withCache helper = probeAndInvoke 統合、 同一 axis + target + args-hash の 2 回目以降 invoke を skip して release cycle 全体 の 実 spawn cost を削減。 v1.55-v1.66 4 PR rhythm 継承 (**14 milestone 連続 = 56 PR 連続同 rhythm**)、 **systematic pattern 42 度目適用**、 **45 milestone 連続 snippet validation streak** 達成、 shape 契約 preserving 絶対維持、 **depth-6 pattern 2 例目確定 candidate**。

## What's new

### InvokeCache class SSOT

| method | 用途 |
|---|---|
| constructor(config, clock) | LRU + TTL 両立 cache 生成 |
| isEnabled | enabled + ttlMs + maxEntries の 3 条件 判定 |
| get(key) | 4 status 経路 (hit / miss / invalidated / disabled) |
| set(key, result) | LRU eviction 込み 書込 |
| invalidate(key) | 手動 削除 |
| clear() | 全 clear |

### 4 status 経路

| status | 条件 | 挙動 |
|---|---|---|
| cache-hit | TTL 内 かつ 存在 | 実 spawn 呼出なし、 LRU touch |
| cache-miss | 未 cache | 実 probeAndInvoke + cache set |
| cache-invalidated | TTL 超過 | 実 probeAndInvoke + 再 cache |
| cache-disabled | enabled=false | 毎回 実 probeAndInvoke |

### 4 code pattern

```ts
// Pattern 1 — InvokeCache 生成
const cache = new InvokeCache();

// Pattern 2 — withCache 経路
const result = await withCache({
  cache,
  invokeInput: { axis: 'clipboard', target: 'macos' },
});

// Pattern 3 — 決定的 key 生成
const key = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['copy'] });

// Pattern 4 — 手動 invalidate + clear
cache.invalidate(key);
cache.clear();
```

### backward compat 絶対維持

v1.0 = 既存 NativeInvokeResult 構造無変更、 v0.1-v0.9 API 変更 0、 additive のみ、 withCache 使わない consumer は v0.9 相当。

### dogfood 新規

`dogfood-desktop-invoke-cache-app` = 4 pattern workflow、 11 test 全 PASS。 v0.9 native-invoke dogfood を invoke-cache 統合経路に拡張。

### 45 milestone 連続 snippet validation streak

v1.23 → v1.67 = **45 milestone**、 kiwa 史上最長記録更新継続。

### depth-6 pattern 2 例目確定 candidate

- **1 例目 (depth-5)** = Mobile / Desktop / quality-metrics の 3 例安定化到達済
- **v1.67 = 2 例目 (depth-6) candidate** = Desktop v0.1-v1.0 で 4 layer separation 完成 (real behavior + probe + 実 invoke + invoke-cache)

Desktop pair pioneer record 更新、 v1.68+ 実運用継続で 2 例目確定 判定。

## Install

```bash
pnpm add -D @kiwa-lab/desktop@^1.0
```

## Migration guide

[v1.66 → v1.67](https://cardene777.github.io/kiwa/migrations/v1.66-to-v1.67)

## What's next

- v1.68+ = depth-6 実運用継続 or v2.0 rename milestone (@kiwa-lab/* → @kiwa-lab/*)
