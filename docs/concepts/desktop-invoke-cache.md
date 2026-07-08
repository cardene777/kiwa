---
title: Desktop v1.0 invoke-cache layer SSOT
---

# Desktop v1.0 invoke-cache layer SSOT

## What this covers

`@kiwa/desktop` v1.0 の invoke-cache layer SSOT。 v1.67 で v0.9 実 native binding 呼出 → v1.0 invoke-cache 統合、 Desktop 縦深化 pair の第 10 段、 **depth-6 pattern 2 例目確定 candidate** (Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6 の 2 例目化)、 v0.9 baseline (`docs/concepts/desktop-native-invoke.md`) を extend。

## InvokeCache class SSOT

```ts
export class InvokeCache {
  constructor(config?: InvokeCacheConfig, clock?: () => number);

  isEnabled(): boolean;
  size(): number;
  getClockValue(): number;
  get(key: string): { entry; status: 'cache-hit' } | { status: 'cache-miss' | 'cache-invalidated' | 'cache-disabled' };
  set(key: string, result: NativeInvokeResult): CachedInvokeEntry;
  invalidate(key: string): boolean;
  clear(): void;
}
```

## 4 status 経路 SSOT

| status | 条件 | 挙動 |
|---|---|---|
| cache-hit | TTL 内 かつ 存在 | 実 spawn 呼出なし、 entry を Map 末尾 に touch (LRU) |
| cache-miss | 未 cache (key 不在) | 実 probeAndInvoke 実行 + 結果 cache に set |
| cache-invalidated | TTL 超過 | entry 削除 + 実 probeAndInvoke 実行 + 結果 再 cache |
| cache-disabled | enabled=false or 負値 config | 毎回 実 probeAndInvoke 実行、 cache に 書込まない |

## isEnabled 判定 SSOT

```ts
isEnabled(): boolean {
  if (!this.enabled) return false;
  if (this.ttlMs < 0) return false;
  if (this.maxEntries < 0) return false;
  return true;
}
```

3 条件 の いずれか で cache 無効化、 disabled 経路 で v0.9 相当 の 動作 に 戻る。

## LRU 実装 SSOT

- Map の insertion order (JS spec 保証) を LRU 順序 として利用
- get で hit 時 = delete → re-insert で 末尾 に touch
- set で maxEntries 超過 時 = Map の 最古 (先頭) key を delete
- maxEntries=0 = 無制限 (eviction なし)

## TTL 実装 SSOT

- ttlMs > 0 で TTL 有効、 entry.capturedAt + ttlMs を clock() と比較
- age >= ttlMs で invalidated (境界 は inclusive)
- ttlMs=0 = 無期限 (invalidated 発火せず)
- ttlMs 負値 = disabled

## buildCacheKey SSOT

```ts
export function buildCacheKey(input: {
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
}): string {
  const args = input.args ?? [];
  return `${input.axis}:${input.target}:${JSON.stringify(args)}`;
}
```

- axis + target + args (JSON.stringify、 順序保持) で key 生成
- env は cache key に 含めない (v1.62 real behavior SSOT 準拠、 env は spawn 副作用のみ)
- args 順序 で key 差別化 (spawn 引数 semantics 依存)

## withCache helper SSOT

```ts
export async function withCache(input: {
  cache: InvokeCache;
  invokeInput: NativeInvokeInput;
}): Promise<CachedNativeInvokeResult>;
```

- cache.get(key) で 4 status 判定
- cache-hit → entry.result を invokeResult に、 cacheAgeMs 計算
- cache-miss / cache-invalidated / cache-disabled → probeAndInvoke 実行 + set

## CachedNativeInvokeResult shape SSOT

```ts
export interface CachedNativeInvokeResult {
  invokeResult: NativeInvokeResult;  // v0.9 shape そのまま
  cacheStatus: CacheStatus;           // v1.0 新 field
  cacheKey: string;                   // v1.0 新 field
  cachedAt: number | null;            // v1.0 新 field
  cacheAgeMs: number | null;          // v1.0 新 field
}
```

- invokeResult は v0.9 NativeInvokeResult そのまま (shape 契約 preserving)
- 4 追加 field は additive extension、 consumer は invokeResult だけ触っても v0.9 相当 動作

## Backward compat 絶対維持 SSOT

- v0.1-v0.9 の 全 export (probeAndInvoke / probeAndInvokeAll / spawn-driver / spawn-executor 等) signature 変更 0
- NativeInvokeResult interface 変更 0 (shape 契約 preserving)
- 既存 210 test の signature 変更 0、 追加 15 test のみ で v1.0 統合 cover
- withCache 使わない consumer = v0.9 相当

## depth-6 pattern 2 例目確定 candidate SSOT

- **1 例目 (depth-5) confirmed** = quality-metrics v0.1-v0.5 (release gate 5 段深化) → v1.65
- **1 例目 (depth-5) confirmed** = Mobile v1.51-v1.55 (native storage adapter 5 段深化)
- **1 例目 (depth-5) confirmed** = Desktop v1.57-v1.61 (native process spawn 5 段深化)
- **v1.67 = 2 例目 (depth-6) candidate** = Desktop v0.1-v1.0 (invoke-cache で 4 layer separation 完成)

Desktop pair pioneer record 更新、 depth-6 pattern 2 例目確定 は v1.68+ で v1.0 の 実運用 継続 verify + 別 pair の depth-6 拡張 で 判定。

## systematic pattern 42 度目適用

- shape 契約 preserving (NativeInvokeResult 変更 0)
- additive-only (cache field は 別軸 additive extension)
- backward compat 絶対維持 (withCache 使わない consumer は v0.9 相当)
- LRU + TTL + enabled の 3 SSOT 統合
- observability additive (cacheStatus / cacheAgeMs で 経路可視化)

5 原則統合 pattern が 42 度目適用で完全定着。

## Reference

- 実装 = `packages/desktop/src/adapters/invoke-cache.ts`
- test = `packages/desktop/tests/adapters/invoke-cache.test.ts` § T-DT-IC-001-015 (15 test)
- dogfood = `examples/dogfood-desktop-invoke-cache-app/` (4 pattern workflow)
- tutorial = `docs/tutorials/127-desktop-invoke-cache.md`
- migration = `docs/migrations/v1.66-to-v1.67.md`
