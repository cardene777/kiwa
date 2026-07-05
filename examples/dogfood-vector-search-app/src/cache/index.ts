/**
 * Embedding cache — every embedding lookup goes through a small LRU-ish
 * cache keyed by document body hash + model version. Production
 * SvelteKit `src/routes/api/embedding/+server.ts` reads Redis; the mock
 * reproduces the observable surface (`get` / `set` / `metrics` /
 * `reset`) and records hit + miss counts so the fidelity harness can
 * assert on cache hit-rate improvements after an on-demand re-index.
 *
 * The cache never talks to the network. Production Redis semantics
 * (TTL, eviction) are not modelled — the point is to make hit-rate
 * observable in the same shape as `real` records it, so per-op traces
 * agree across mock and real when the same corpus + query pattern is
 * driven.
 */

export interface CacheMetrics {
  readonly hits: number;
  readonly misses: number;
  readonly size: number;
  readonly hitRate: number;
}

export interface EmbeddingCache {
  readonly get: (key: string) => readonly number[] | undefined;
  readonly set: (key: string, value: readonly number[]) => void;
  readonly delete: (key: string) => boolean;
  readonly metrics: () => CacheMetrics;
  readonly reset: () => void;
}

/**
 * Deterministic small-string key hash. FNV-1a mix over the input, folded
 * to a 8-hex-char id — cache keys are stable across processes without
 * needing a native crypto binding. Not cryptographic strength; only
 * needs to be a well-distributed identity for equality.
 */
export function cacheKey(input: { body: string; model: string }): string {
  const payload = `${input.model}::${input.body}`;
  let a = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    a = Math.imul(a ^ payload.charCodeAt(i), 0x01000193) >>> 0;
  }
  return a.toString(16).padStart(8, '0');
}

/**
 * Build an in-memory embedding cache. `maxEntries` bounds the map so
 * long fidelity runs do not leak memory; when the cap is exceeded the
 * oldest inserted key is evicted (insertion-order eviction, matches
 * what a Redis `maxmemory-policy allkeys-lru` reset behaves like when
 * every entry has the same age).
 */
export function createEmbeddingCache(opts: { maxEntries?: number } = {}): EmbeddingCache {
  const cap = opts.maxEntries ?? 1024;
  const store = new Map<string, readonly number[]>();
  let hits = 0;
  let misses = 0;

  function evictIfNeeded(): void {
    while (store.size > cap) {
      const oldest = store.keys().next();
      if (oldest.done) return;
      store.delete(oldest.value);
    }
  }

  return {
    get(key: string): readonly number[] | undefined {
      const v = store.get(key);
      if (v === undefined) {
        misses += 1;
        return undefined;
      }
      hits += 1;
      return v;
    },
    set(key: string, value: readonly number[]): void {
      // Delete first so re-insert updates the recency order (Map keeps
      // insertion order, so removing + re-adding pushes the entry to
      // the end).
      store.delete(key);
      store.set(key, value);
      evictIfNeeded();
    },
    delete(key: string): boolean {
      return store.delete(key);
    },
    metrics(): CacheMetrics {
      const total = hits + misses;
      return {
        hits,
        misses,
        size: store.size,
        hitRate: total === 0 ? 0 : hits / total,
      };
    },
    reset(): void {
      store.clear();
      hits = 0;
      misses = 0;
    },
  };
}
