/**
 * v1.67-3 docs 補強 — tutorial 127 code snippet 検証。
 * 45 milestone 連続 snippet validation streak = v1.23 → v1.67。 kiwa 史上最長記録更新継続。
 * systematic pattern 42 度目適用、 depth-6 pattern 2 例目確定 candidate
 * (Mobile v1.55 depth-5 + Desktop v1.61 depth-5 + Desktop v1.67 depth-6)。
 */
import { describe, expect, it } from 'vitest';
import { InvokeCache, buildCacheKey, withCache } from '../src/index.js';

describe('tutorial 127 — Step 1 InvokeCache 生成 snippet', () => {
  it('default config で InvokeCache 生成 (5 分 TTL + 128 maxEntries + enabled=true)', () => {
    const cache = new InvokeCache();
    expect(cache.isEnabled()).toBe(true);
    expect(cache.size()).toBe(0);
  });

  it('config 明示指定 で strictCache 生成', () => {
    const strictCache = new InvokeCache({ ttlMs: 60_000, maxEntries: 32, enabled: true });
    expect(strictCache.isEnabled()).toBe(true);
  });
});

describe('tutorial 127 — Step 2 withCache 経路 snippet', () => {
  it('cache-miss → cache-hit の flow で shape 契約 preserving verify', async () => {
    const cache = new InvokeCache();
    const r1 = await withCache({
      cache,
      invokeInput: { axis: 'clipboard', target: 'macos' },
    });
    expect(r1.cacheStatus).toBe('cache-miss');
    expect(r1.invokeResult).toHaveProperty('axis');
    expect(r1.cacheKey).toBe('clipboard:macos:[]');

    const r2 = await withCache({
      cache,
      invokeInput: { axis: 'clipboard', target: 'macos' },
    });
    expect(r2.cacheStatus).toBe('cache-hit');
  });
});

describe('tutorial 127 — Step 3 buildCacheKey 決定的 key snippet', () => {
  it('axis + target + args を 決定的 key 化 (順序保持)', () => {
    const key1 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['copy'] });
    const key2 = buildCacheKey({ axis: 'clipboard', target: 'macos', args: ['paste'] });
    expect(key1).toBe('clipboard:macos:["copy"]');
    expect(key2).toBe('clipboard:macos:["paste"]');
    expect(key1).not.toBe(key2);
  });
});

describe('tutorial 127 — Step 4 4 status 経路 snippet', () => {
  it('cache-disabled 経路 (enabled=false)', async () => {
    const disabled = new InvokeCache({ enabled: false });
    const result = await withCache({
      cache: disabled,
      invokeInput: { axis: 'notification', target: 'linux' },
    });
    expect(result.cacheStatus).toBe('cache-disabled');
    expect(disabled.size()).toBe(0);
  });

  it('cache-invalidated 経路 (TTL 超過)', async () => {
    let now = 1000;
    const cache = new InvokeCache({ ttlMs: 100 }, () => now);
    await withCache({ cache, invokeInput: { axis: 'clipboard', target: 'macos' } });
    now = 1200; // TTL 超過
    const result = await withCache({ cache, invokeInput: { axis: 'clipboard', target: 'macos' } });
    expect(result.cacheStatus).toBe('cache-invalidated');
  });
});
