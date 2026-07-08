import { describe, expect, it } from 'vitest';
import {
  InvokeCache,
  buildCacheKey,
  withCache,
  type NativeInvokeResult,
} from '../../src/index.js';

function makeSyntheticResult(): NativeInvokeResult {
  return {
    axis: 'clipboard',
    target: 'macos',
    status: 'invoked',
    reason: null,
    spawnResult: null,
  };
}

describe('v1.0 buildCacheKey — 決定的 key 生成 SSOT', () => {
  it('T-DT-IC-001 axis + target + args を 決定的 key 化', () => {
    const key = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['copy', 'test'] });
    expect(key).toBe('clipboard:macos:["copy","test"]');
  });

  it('T-DT-IC-002 args 省略 で 空配列 相当 key', () => {
    const key = buildCacheKey({ axis: 'notification', target: 'linux' });
    expect(key).toBe('notification:linux:[]');
  });

  it('T-DT-IC-003 args 順序 で key 差別化 (順序 semantics 保持)', () => {
    const k1 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['a', 'b'] });
    const k2 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['b', 'a'] });
    expect(k1).not.toBe(k2);
  });
});

describe('v1.0 InvokeCache class — LRU + TTL SSOT', () => {
  it('T-DT-IC-004 default config で 5 分 TTL + 128 maxEntries + enabled=true', () => {
    const cache = new InvokeCache();
    expect(cache.isEnabled()).toBe(true);
    expect(cache.size()).toBe(0);
  });

  it('T-DT-IC-005 cache miss → set → hit の 基本 flow', () => {
    const cache = new InvokeCache();
    const key = 'clipboard:macos:[]';
    expect(cache.get(key).status).toBe('cache-miss');
    cache.set(key, makeSyntheticResult());
    const hit = cache.get(key);
    expect(hit.status).toBe('cache-hit');
    if (hit.status === 'cache-hit') {
      expect(hit.entry.result.axis).toBe('clipboard');
    }
  });

  it('T-DT-IC-006 TTL 超過 で cache-invalidated + entry 削除', () => {
    let now = 1000;
    const cache = new InvokeCache({ ttlMs: 100 }, () => now);
    cache.set('key1', makeSyntheticResult());
    now = 1050; // TTL 内
    expect(cache.get('key1').status).toBe('cache-hit');
    now = 1200; // TTL 超過 (age = 200 >= 100)
    expect(cache.get('key1').status).toBe('cache-invalidated');
    // 再度 get で miss (invalidate で 削除済)
    expect(cache.get('key1').status).toBe('cache-miss');
  });

  it('T-DT-IC-007 TTL=0 = 無期限 (invalidated 発火せず)', () => {
    let now = 1000;
    const cache = new InvokeCache({ ttlMs: 0 }, () => now);
    cache.set('key1', makeSyntheticResult());
    now = 10_000_000;
    expect(cache.get('key1').status).toBe('cache-hit');
  });

  it('T-DT-IC-008 enabled=false で cache-disabled 経路', () => {
    const cache = new InvokeCache({ enabled: false });
    expect(cache.isEnabled()).toBe(false);
    cache.set('key1', makeSyntheticResult());
    expect(cache.size()).toBe(0); // 書込みも skip
    expect(cache.get('key1').status).toBe('cache-disabled');
  });

  it('T-DT-IC-009 LRU eviction = maxEntries 超過 で 最古 削除', () => {
    const cache = new InvokeCache({ maxEntries: 2 });
    cache.set('k1', makeSyntheticResult());
    cache.set('k2', makeSyntheticResult());
    cache.set('k3', makeSyntheticResult()); // k1 evict
    expect(cache.size()).toBe(2);
    expect(cache.get('k1').status).toBe('cache-miss');
    expect(cache.get('k2').status).toBe('cache-hit');
    expect(cache.get('k3').status).toBe('cache-hit');
  });

  it('T-DT-IC-010 LRU touch = get で 順序 更新 (最新 hit は evict されない)', () => {
    const cache = new InvokeCache({ maxEntries: 2 });
    cache.set('k1', makeSyntheticResult());
    cache.set('k2', makeSyntheticResult());
    cache.get('k1'); // k1 を 末尾 に touch
    cache.set('k3', makeSyntheticResult()); // 最古 = k2 evict
    expect(cache.get('k1').status).toBe('cache-hit');
    expect(cache.get('k2').status).toBe('cache-miss');
    expect(cache.get('k3').status).toBe('cache-hit');
  });

  it('T-DT-IC-011 invalidate + clear で 手動 削除', () => {
    const cache = new InvokeCache();
    cache.set('k1', makeSyntheticResult());
    cache.set('k2', makeSyntheticResult());
    expect(cache.invalidate('k1')).toBe(true);
    expect(cache.invalidate('nonexistent')).toBe(false);
    expect(cache.size()).toBe(1);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

describe('v1.0 withCache helper — probeAndInvoke 統合', () => {
  it('T-DT-IC-012 cache-miss で 実 probeAndInvoke 実行 + 結果 cache', async () => {
    const cache = new InvokeCache();
    const result1 = await withCache({
      cache,
      invokeInput: { axis: 'clipboard', target: 'macos' },
    });
    expect(result1.cacheStatus).toBe('cache-miss');
    expect(result1.invokeResult.axis).toBe('clipboard');
    expect(cache.size()).toBe(1);
    // 2 回目 = cache-hit
    const result2 = await withCache({
      cache,
      invokeInput: { axis: 'clipboard', target: 'macos' },
    });
    expect(result2.cacheStatus).toBe('cache-hit');
    expect(result2.cacheKey).toBe(result1.cacheKey);
  });

  it('T-DT-IC-013 cache-disabled で 毎回 実 probeAndInvoke 実行', async () => {
    const cache = new InvokeCache({ enabled: false });
    const result1 = await withCache({
      cache,
      invokeInput: { axis: 'notification', target: 'linux' },
    });
    const result2 = await withCache({
      cache,
      invokeInput: { axis: 'notification', target: 'linux' },
    });
    expect(result1.cacheStatus).toBe('cache-disabled');
    expect(result2.cacheStatus).toBe('cache-disabled');
    expect(result1.cachedAt).toBeNull();
    expect(result2.cachedAt).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('T-DT-IC-014 cache-hit の cacheAgeMs は 経過時間 反映 (clock 制御 test)', async () => {
    let now = 5000;
    const cache = new InvokeCache({ ttlMs: 10000 }, () => now);
    await withCache({ cache, invokeInput: { axis: 'clipboard', target: 'macos' } });
    now = 7500;
    const hit = await withCache({ cache, invokeInput: { axis: 'clipboard', target: 'macos' } });
    expect(hit.cacheStatus).toBe('cache-hit');
    expect(hit.cacheAgeMs).toBe(2500);
  });

  it('T-DT-IC-015 shape 契約 preserving = invokeResult 構造 変更 0 (v0.9 NativeInvokeResult と同型)', async () => {
    const cache = new InvokeCache();
    const result = await withCache({
      cache,
      invokeInput: { axis: 'auto-updater', target: 'windows' },
    });
    // v0.9 NativeInvokeResult の 5 field 全存在
    expect(result.invokeResult).toHaveProperty('axis');
    expect(result.invokeResult).toHaveProperty('target');
    expect(result.invokeResult).toHaveProperty('status');
    expect(result.invokeResult).toHaveProperty('reason');
    expect(result.invokeResult).toHaveProperty('spawnResult');
    // v1.0 で 追加された cache field は 別軸
    expect(result).toHaveProperty('cacheStatus');
    expect(result).toHaveProperty('cacheKey');
  });
});
