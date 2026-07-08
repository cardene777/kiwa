import {
  InvokeCache,
  buildCacheKey,
  withCache,
  type CachedNativeInvokeResult,
  type CacheStatus,
  type DesktopAxis,
  type DesktopTarget,
  type InvokeCacheConfig,
} from '@kiwa/desktop';

/**
 * Pattern 1 — warmupCacheWithMatrix = 12 axis × 3 target の invoke を 事前 warm-up、
 * 以降 の release cycle で 全 cache-hit を 目指す 経路。 CI 初回起動 の 遅延 を
 * 一括 cost 化、 2 回目以降 は 高速化。
 */
export async function warmupCacheWithMatrix(input: {
  cache: InvokeCache;
  axes?: DesktopAxis[];
  targets?: DesktopTarget[];
}): Promise<{
  totalWarmed: number;
  cacheStatusBreakdown: Record<CacheStatus, number>;
}> {
  const ALL_AXES: DesktopAxis[] = [
    'electron',
    'tauri',
    'webview',
    'auto-updater',
    'fs-permissions',
    'notification',
    'menu-bar',
    'tray-icon',
    'screen-recording',
    'global-shortcut',
    'clipboard',
    'dark-mode',
  ];
  const ALL_TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];
  const axes = input.axes ?? ALL_AXES;
  const targets = input.targets ?? ALL_TARGETS;

  const breakdown: Record<CacheStatus, number> = {
    'cache-hit': 0,
    'cache-miss': 0,
    'cache-invalidated': 0,
    'cache-disabled': 0,
  };

  let total = 0;
  for (const axis of axes) {
    for (const target of targets) {
      const result = await withCache({
        cache: input.cache,
        invokeInput: { axis, target },
      });
      breakdown[result.cacheStatus] += 1;
      total += 1;
    }
  }

  return { totalWarmed: total, cacheStatusBreakdown: breakdown };
}

/**
 * Pattern 2 — probeAndInvokeCached = 標準経路 の 1-shot cache-backed invoke。
 * dogfood consumer が v0.9 相当 の probeAndInvoke を そのまま 呼び替えて
 * cache 経路 に 乗せる 最短 helper。 shape 契約 preserving = 戻り値 は
 * CachedNativeInvokeResult (invokeResult + cacheStatus additive)。
 */
export async function probeAndInvokeCached(input: {
  cache: InvokeCache;
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
}): Promise<CachedNativeInvokeResult> {
  return withCache({
    cache: input.cache,
    invokeInput: {
      axis: input.axis,
      target: input.target,
      ...(input.args !== undefined ? { args: input.args } : {}),
    },
  });
}

/**
 * Pattern 3 — trackCacheEffectiveness = cache hit ratio + saved-spawn count を
 * 計測、 release cycle 全体 の cache 効果 を 数値化。 dogfood consumer が
 * release quality metrics に 統合可能 な shape。
 */
export interface CacheEffectivenessReport {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  savedSpawnCount: number;
  currentCacheSize: number;
}

export function trackCacheEffectiveness(input: {
  cache: InvokeCache;
  results: CachedNativeInvokeResult[];
}): CacheEffectivenessReport {
  const hits = input.results.filter((r) => r.cacheStatus === 'cache-hit').length;
  const misses = input.results.filter((r) => r.cacheStatus === 'cache-miss').length;
  const total = input.results.length;
  const hitRatio = total === 0 ? 0 : hits / total;
  return {
    totalRequests: total,
    cacheHits: hits,
    cacheMisses: misses,
    hitRatio,
    savedSpawnCount: hits,
    currentCacheSize: input.cache.size(),
  };
}

/**
 * Pattern 4 — invalidateAndRefetch = 特定 axis / target の cache を 手動 invalidate
 * して 次回 呼出 で 実 spawn を 強制。 CLI update / OS 環境 変更 で cache 汚染
 * を 排除する 経路。 hit ratio 再計測 の 前提 として 使う。
 */
export async function invalidateAndRefetch(input: {
  cache: InvokeCache;
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
}): Promise<{
  invalidated: boolean;
  refetchResult: CachedNativeInvokeResult;
}> {
  const key = buildCacheKey({
    axis: input.axis,
    target: input.target,
    ...(input.args !== undefined ? { args: input.args } : {}),
  });
  const invalidated = input.cache.invalidate(key);
  const refetchResult = await withCache({
    cache: input.cache,
    invokeInput: {
      axis: input.axis,
      target: input.target,
      ...(input.args !== undefined ? { args: input.args } : {}),
    },
  });
  return { invalidated, refetchResult };
}

/**
 * util — dogfood 経路 で cache を default config で 生成 する 標準 helper。
 * consumer は new InvokeCache() 直接 生成 でも 良いが、 明示的な helper を 提供
 * すると dogfood shape が 統一される。
 */
export function createDefaultCache(config?: InvokeCacheConfig): InvokeCache {
  return new InvokeCache(config);
}
