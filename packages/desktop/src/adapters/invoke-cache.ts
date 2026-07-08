/**
 * v1.0 invoke-cache layer = probeAndInvoke 結果 の キャッシュ 経路。
 *
 * v0.9 で 確立した probe + invoke 統合経路の 上位 layer として、 同一 axis +
 * target + args-hash の invoke を 2 回目以降 skip して 実 spawn cost を削減。
 * TTL / LRU / invalidate の 3 SSOT で cache 制御、 4 status 経路
 * (cache-hit / cache-miss / cache-invalidated / cache-disabled) で shape 契約 preserving。
 *
 * v1.62 real behavior + v1.63 probe + v1.64 実 invoke + v1.67 result-cache の
 * 4 layer separation を 完成させる depth-6 pattern 2 例目確定 candidate
 * (Mobile v1.55 depth-5 → Desktop v1.61 depth-5 → Desktop v1.67 depth-6 の
 * 2 例目化、 4 例目 は 別 pair の 自然 発生 待ち)。
 *
 * shape 契約 preserving 絶対維持 = NativeInvokeResult 構造 変更 0、 cache
 * hit 時も status field は 'invoked' を そのまま 保持し、 cacheStatus field で
 * cache 経由か否か を 明示 (additive extension pattern)。
 */
import type { DesktopAxis, DesktopTarget } from '../semantics/types.js';
import { probeAndInvoke, type NativeInvokeInput, type NativeInvokeResult } from './native-invoke.js';

export type CacheStatus = 'cache-hit' | 'cache-miss' | 'cache-invalidated' | 'cache-disabled';

/** cache 済 invoke 結果 の envelope、 TTL 判定 用 の capturedAt 保持。 */
export interface CachedInvokeEntry {
  key: string;
  capturedAt: number;
  result: NativeInvokeResult;
}

/** v1.0 invoke-cache の 結果、 NativeInvokeResult 拡張 additive。 */
export interface CachedNativeInvokeResult {
  invokeResult: NativeInvokeResult;
  cacheStatus: CacheStatus;
  cacheKey: string;
  cachedAt: number | null;
  cacheAgeMs: number | null;
}

/** cache 設定 SSOT、 全 field default 明示。 */
export interface InvokeCacheConfig {
  /** TTL (ms)、 default 5 分。 0 = 無期限、 負値 = disabled。 */
  ttlMs?: number;
  /** LRU 最大 entry 数、 default 128。 0 = 無制限、 負値 = disabled。 */
  maxEntries?: number;
  /** cache 全体 の enable flag、 default true。 */
  enabled?: boolean;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 128;

/**
 * axis + target + args を 決定的 に key 化 する SSOT helper。 args は
 * 順序を 保持 (spawn 引数 の semantics 依存)、 env は cache key に 含めない
 * (env は sanitize 済 で spawn 副作用のみ、 result semantics に 影響しない
 * 前提、 v1.62 real behavior SSOT に 準拠)。
 */
export function buildCacheKey(input: {
  axis: DesktopAxis;
  target: DesktopTarget;
  args?: string[];
}): string {
  const args = input.args ?? [];
  return `${input.axis}:${input.target}:${JSON.stringify(args)}`;
}

/**
 * v1.0 InvokeCache class = LRU + TTL 両立 の in-memory cache。 test で
 * new InvokeCache() 直接生成、 dogfood consumer は withCache helper を使う。
 *
 * LRU 実装 = Map の insertion order (JS spec で保証) を再挿入 で 更新、
 * eviction 時は 最古 key を 削除。 TTL 判定 は get 時に entry.capturedAt +
 * ttlMs を 現在時刻 と 比較。
 */
export class InvokeCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly enabled: boolean;
  private readonly entries: Map<string, CachedInvokeEntry>;
  private readonly clock: () => number;

  constructor(config?: InvokeCacheConfig, clock?: () => number) {
    this.ttlMs = config?.ttlMs ?? DEFAULT_TTL_MS;
    this.maxEntries = config?.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.enabled = config?.enabled ?? true;
    this.entries = new Map();
    this.clock = clock ?? (() => Date.now());
  }

  /** cache 全体 の enable 状態。 disabled なら 全 op で cache-disabled 返却。 */
  isEnabled(): boolean {
    if (!this.enabled) return false;
    if (this.ttlMs < 0) return false;
    if (this.maxEntries < 0) return false;
    return true;
  }

  /** cache 現状 の entry 数、 test / dogfood consumer で observability に使う。 */
  size(): number {
    return this.entries.size;
  }

  /** 内部 clock を dogfood consumer に 露出、 withCache helper が 使用。 */
  getClockValue(): number {
    return this.clock();
  }

  /**
   * cache から 取り出す。 TTL 超過 は cache-invalidated として entry 削除 +
   * null 返却、 未 hit は null 返却、 hit は entry を Map 末尾に 再挿入 (LRU)。
   */
  get(key: string): { entry: CachedInvokeEntry; status: 'cache-hit' } | { status: 'cache-miss' | 'cache-invalidated' | 'cache-disabled' } {
    if (!this.isEnabled()) return { status: 'cache-disabled' };
    const entry = this.entries.get(key);
    if (entry === undefined) return { status: 'cache-miss' };
    if (this.ttlMs > 0) {
      const age = this.clock() - entry.capturedAt;
      if (age >= this.ttlMs) {
        this.entries.delete(key);
        return { status: 'cache-invalidated' };
      }
    }
    // LRU touch: 削除 → 再挿入 で 順序 更新
    this.entries.delete(key);
    this.entries.set(key, entry);
    return { entry, status: 'cache-hit' };
  }

  /** cache に 書込 む。 maxEntries 超過 時 は 最古 (Map 先頭) を evict。 */
  set(key: string, result: NativeInvokeResult): CachedInvokeEntry {
    const entry: CachedInvokeEntry = {
      key,
      capturedAt: this.clock(),
      result,
    };
    if (this.isEnabled()) {
      if (this.entries.has(key)) this.entries.delete(key);
      this.entries.set(key, entry);
      if (this.maxEntries > 0 && this.entries.size > this.maxEntries) {
        const oldestKey = this.entries.keys().next().value;
        if (oldestKey !== undefined) this.entries.delete(oldestKey);
      }
    }
    return entry;
  }

  /** 手動 invalidate、 特定 key の entry を 削除。 存在しない key は no-op。 */
  invalidate(key: string): boolean {
    return this.entries.delete(key);
  }

  /** cache 全体 clear、 dogfood 経路 で release 前 に 呼出。 */
  clear(): void {
    this.entries.clear();
  }
}

/**
 * withCache = probeAndInvoke を cache 経由 で 呼出す 統合 helper。
 * cache-miss / cache-invalidated / cache-disabled 時 は 実 probeAndInvoke
 * を 実行 して 結果 を cache に 書込む、 cache-hit 時 は そのまま 返却。
 *
 * shape 契約 preserving = NativeInvokeResult は そのまま 保持、 cache 経由
 * 判定 は cacheStatus field で 別軸 露出。 dogfood consumer は invokeResult
 * を 触るだけ で v0.9 相当 の 動作、 cacheStatus は observability 目的。
 */
export async function withCache(input: {
  cache: InvokeCache;
  invokeInput: NativeInvokeInput;
}): Promise<CachedNativeInvokeResult> {
  const key = buildCacheKey({
    axis: input.invokeInput.axis,
    target: input.invokeInput.target,
    ...(input.invokeInput.args !== undefined ? { args: input.invokeInput.args } : {}),
  });
  const now = input.cache.getClockValue();
  const lookup = input.cache.get(key);
  if (lookup.status === 'cache-hit') {
    return {
      invokeResult: lookup.entry.result,
      cacheStatus: 'cache-hit',
      cacheKey: key,
      cachedAt: lookup.entry.capturedAt,
      cacheAgeMs: now - lookup.entry.capturedAt,
    };
  }
  const freshResult = await probeAndInvoke(input.invokeInput);
  const entry = input.cache.set(key, freshResult);
  return {
    invokeResult: freshResult,
    cacheStatus: lookup.status,
    cacheKey: key,
    cachedAt: input.cache.isEnabled() ? entry.capturedAt : null,
    cacheAgeMs: 0,
  };
}
