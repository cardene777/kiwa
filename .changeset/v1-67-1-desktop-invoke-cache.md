---
"@kiwa-test/desktop": major
---

v1.67-1 Desktop v1.0 = invoke-cache layer 新設 + depth-6 pattern 2 例目確定 candidate。

v0.9 で 確立した probeAndInvoke 統合経路 の 上位 layer として、 同一 axis + target + args-hash の invoke を 2 回目以降 skip する invoke-cache を追加。 InvokeCache class = LRU + TTL 両立 の in-memory cache、 withCache helper = probeAndInvoke 統合、 buildCacheKey = 決定的 key 生成 SSOT、 4 status 経路 (cache-hit / cache-miss / cache-invalidated / cache-disabled)、 default 5 分 TTL + 128 maxEntries + enabled=true。

shape 契約 preserving 絶対維持 = NativeInvokeResult 構造 変更 0、 cache hit 時 も status field = 'invoked' そのまま、 cacheStatus / cacheKey / cachedAt / cacheAgeMs は additive extension。 v0.1-v0.9 API 変更 0、 backward compat 絶対維持 (withCache を使わない consumer は そのまま v0.9 相当 の 動作)。

v1.62 real behavior + v1.63 probe + v1.64 実 invoke + v1.67 invoke-cache の 4 layer separation を完成させる depth-6 pattern 2 例目確定 candidate。 systematic pattern 42 度目適用 (additive-only + backward compat + shape 契約 preserving + LRU/TTL/enabled 3 SSOT + observability additive の 5 原則統合)。

15 behavior test 追加 (T-DT-IC-001 〜 T-DT-IC-015) で buildCacheKey / LRU / TTL / withCache / shape preserving の 全経路 cover。

major bump 理由 = v1.x への昇格 (v0.9 → v1.0)、 depth-6 到達 の marker として major version 更新 (Mobile v1.55 depth-5 と Desktop v1.61 depth-5 の 完了 marker は minor だったが、 Desktop pair は depth-6 到達 が pioneer record 更新 = major bump が 自然)。
