import { describe, expect, it } from 'vitest';
import type { CachedNativeInvokeResult } from '@kiwa-lab/desktop';
import {
  createDefaultCache,
  invalidateAndRefetch,
  probeAndInvokeCached,
  trackCacheEffectiveness,
  warmupCacheWithMatrix,
} from '../src/workflow.js';

describe('dogfood-desktop-invoke-cache-app (v1.67-2、 depth-6 pattern 2 例目確定 candidate)', () => {
  it('Pattern 1: warmupCacheWithMatrix — 12 axis × 3 target = 36 pair 全 warm-up', async () => {
    const cache = createDefaultCache();
    const { totalWarmed, cacheStatusBreakdown } = await warmupCacheWithMatrix({ cache });
    expect(totalWarmed).toBe(36);
    expect(cacheStatusBreakdown['cache-miss']).toBe(36); // 初回 全 miss
    expect(cache.size()).toBe(36);
  });

  it('Pattern 1: warmupCacheWithMatrix — 2 回目 は 全 cache-hit', async () => {
    const cache = createDefaultCache();
    await warmupCacheWithMatrix({ cache });
    const { cacheStatusBreakdown } = await warmupCacheWithMatrix({ cache });
    expect(cacheStatusBreakdown['cache-hit']).toBe(36);
    expect(cacheStatusBreakdown['cache-miss']).toBe(0);
  });

  it('Pattern 1: warmupCacheWithMatrix — subset (2 axis × 2 target = 4 pair) warm-up', async () => {
    const cache = createDefaultCache();
    const { totalWarmed } = await warmupCacheWithMatrix({
      cache,
      axes: ['clipboard', 'notification'],
      targets: ['macos', 'linux'],
    });
    expect(totalWarmed).toBe(4);
  });

  it('Pattern 2: probeAndInvokeCached — 1-shot cache-backed invoke で cache-miss → cache-hit', async () => {
    const cache = createDefaultCache();
    const r1 = await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos' });
    expect(r1.cacheStatus).toBe('cache-miss');
    const r2 = await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos' });
    expect(r2.cacheStatus).toBe('cache-hit');
    expect(r2.cacheKey).toBe(r1.cacheKey);
  });

  it('Pattern 2: probeAndInvokeCached — args 差 で 別 key 化 (順序保持 semantics)', async () => {
    const cache = createDefaultCache();
    const r1 = await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos', args: ['copy'] });
    const r2 = await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos', args: ['paste'] });
    expect(r1.cacheKey).not.toBe(r2.cacheKey);
    expect(cache.size()).toBe(2);
  });

  it('Pattern 3: trackCacheEffectiveness — hit ratio + savedSpawnCount 計算', async () => {
    const cache = createDefaultCache();
    const results: CachedNativeInvokeResult[] = [];
    // 3 axis × 2 回 = 6 request、 うち 3 が hit
    for (const axis of ['clipboard', 'notification', 'dark-mode'] as const) {
      const r1 = await probeAndInvokeCached({ cache, axis, target: 'macos' });
      results.push(r1);
      const r2 = await probeAndInvokeCached({ cache, axis, target: 'macos' });
      results.push(r2);
    }
    const report = trackCacheEffectiveness({ cache, results });
    expect(report.totalRequests).toBe(6);
    expect(report.cacheHits).toBe(3);
    expect(report.cacheMisses).toBe(3);
    expect(report.hitRatio).toBe(0.5);
    expect(report.savedSpawnCount).toBe(3);
    expect(report.currentCacheSize).toBe(3);
  });

  it('Pattern 3: trackCacheEffectiveness — 空 results で hitRatio = 0 (division-safe)', () => {
    const cache = createDefaultCache();
    const report = trackCacheEffectiveness({ cache, results: [] });
    expect(report.totalRequests).toBe(0);
    expect(report.hitRatio).toBe(0);
  });

  it('Pattern 4: invalidateAndRefetch — 手動 invalidate + refetch で cache-miss', async () => {
    const cache = createDefaultCache();
    await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos' });
    const { invalidated, refetchResult } = await invalidateAndRefetch({
      cache,
      axis: 'clipboard',
      target: 'macos',
    });
    expect(invalidated).toBe(true);
    expect(refetchResult.cacheStatus).toBe('cache-miss'); // refetch = 実 spawn 呼出し
    expect(cache.size()).toBe(1); // refetch 結果 が 再 cache 済
  });

  it('Pattern 4: invalidateAndRefetch — 未 cache axis で invalidated=false (no-op)', async () => {
    const cache = createDefaultCache();
    const { invalidated } = await invalidateAndRefetch({
      cache,
      axis: 'notification',
      target: 'linux',
    });
    expect(invalidated).toBe(false);
  });

  it('Pattern 4: invalidateAndRefetch — args 付き で 特定 args key のみ 削除', async () => {
    const cache = createDefaultCache();
    await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos', args: ['copy'] });
    await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos', args: ['paste'] });
    const { invalidated } = await invalidateAndRefetch({
      cache,
      axis: 'clipboard',
      target: 'macos',
      args: ['copy'],
    });
    expect(invalidated).toBe(true);
    // paste key は 残存 (invalidate は 特定 key のみ)
    const paste = await probeAndInvokeCached({ cache, axis: 'clipboard', target: 'macos', args: ['paste'] });
    expect(paste.cacheStatus).toBe('cache-hit');
  });

  it('4 pattern 統合 workflow — warm-up → track → invalidate → refetch chain', async () => {
    const cache = createDefaultCache();

    // Step 1: warm-up (2 axis × 2 target)
    const { totalWarmed } = await warmupCacheWithMatrix({
      cache,
      axes: ['clipboard', 'notification'],
      targets: ['macos', 'linux'],
    });
    expect(totalWarmed).toBe(4);

    // Step 2: 再度 呼出 で 全 hit
    const hitResults: CachedNativeInvokeResult[] = [];
    for (const axis of ['clipboard', 'notification'] as const) {
      for (const target of ['macos', 'linux'] as const) {
        hitResults.push(await probeAndInvokeCached({ cache, axis, target }));
      }
    }
    const report = trackCacheEffectiveness({ cache, results: hitResults });
    expect(report.hitRatio).toBe(1.0);
    expect(report.savedSpawnCount).toBe(4);

    // Step 3: 1 pair invalidate + refetch = 実 spawn 発火
    const { refetchResult } = await invalidateAndRefetch({
      cache,
      axis: 'clipboard',
      target: 'macos',
    });
    expect(refetchResult.cacheStatus).toBe('cache-miss');
    expect(cache.size()).toBe(4); // invalidate 後 refetch で 再 cache
  });
});
