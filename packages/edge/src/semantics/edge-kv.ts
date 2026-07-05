import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Edge KV — a globally replicated key/value store with a read-through cache.
 * Cloudflare KV, Vercel Edge Config, and Deno KV all trade strong consistency
 * for low-latency edge reads: a write may take time to propagate, and reads
 * are served from a per-POP cache when warm. The mock models the observable
 * surface: a backing `store`, a `cache` layer that a read populates and a
 * write invalidates, and a range query over a key prefix.
 *
 * There is no state machine per se — the store is always usable. `state`
 * records the consistency model the caller declared so downstream tests can
 * assert on it. The 4 neutral events distinguish a cold read, a write, a warm
 * cache hit, and a miss on an absent key.
 */
export type KvState = 'consistent' | 'eventually-consistent';

export interface EdgeKvSession {
  platform: EdgePlatform;
  store: Map<string, string>;
  cache: Map<string, string>;
  state: KvState;
  history: AxisStep<KvState>[];
}

/** Push a fully-formed step onto the session history and return it. */
function record(session: EdgeKvSession, step: AxisStep<KvState>): AxisStep<KvState> {
  session.history.push(step);
  return step;
}

/**
 * Construct a KV session. No event is emitted — the store is simply opened.
 * Defaults to eventual consistency, the common edge-KV replication model.
 */
export function createEdgeKvSession(input: {
  platform: EdgePlatform;
  state?: KvState;
}): EdgeKvSession {
  return {
    platform: input.platform,
    store: new Map(),
    cache: new Map(),
    state: input.state ?? 'eventually-consistent',
    history: [],
  };
}

/**
 * Read a key. Three outcomes:
 *   - cache warm  → `kv.cache-hit`
 *   - store only  → `kv.read` and the cache is populated (read-through)
 *   - absent      → `kv.cache-miss`
 */
export function kvRead(session: EdgeKvSession, input: { key: string }): AxisStep<KvState> {
  let neutral: 'kv.read' | 'kv.cache-hit' | 'kv.cache-miss';
  let hit: boolean;
  if (session.cache.has(input.key)) {
    neutral = 'kv.cache-hit';
    hit = true;
  } else if (session.store.has(input.key)) {
    session.cache.set(input.key, session.store.get(input.key)!);
    neutral = 'kv.read';
    hit = false;
  } else {
    neutral = 'kv.cache-miss';
    hit = false;
  }
  return record(session, {
    neutralEvent: neutral,
    platformEvent: platformEventName(session.platform, neutral),
    state: session.state,
    platform: session.platform,
    metadata: { key: input.key, hit },
  });
}

/**
 * Write a key. Updates the backing store and invalidates the cache entry so
 * the next read goes through to the store. Emits `kv.write`.
 */
export function kvWrite(
  session: EdgeKvSession,
  input: { key: string; value: string },
): AxisStep<KvState> {
  session.store.set(input.key, input.value);
  session.cache.delete(input.key);
  return record(session, {
    neutralEvent: 'kv.write',
    platformEvent: platformEventName(session.platform, 'kv.write'),
    state: session.state,
    platform: session.platform,
    metadata: { key: input.key, size: input.value.length },
  });
}

/**
 * Range query over a key prefix. Returns the matching keys (sorted, up to
 * `limit`) alongside the emitted step. Emits `kv.read` since a range scan is a
 * store read. `limit` defaults to no cap.
 */
export function kvRangeQuery(
  session: EdgeKvSession,
  input: { prefix: string; limit?: number },
): { matches: string[]; step: AxisStep<KvState> } {
  const limit = input.limit ?? Number.POSITIVE_INFINITY;
  const matches = [...session.store.keys()]
    .filter((k) => k.startsWith(input.prefix))
    .sort()
    .slice(0, limit);
  const step = record(session, {
    neutralEvent: 'kv.read',
    platformEvent: platformEventName(session.platform, 'kv.read'),
    state: session.state,
    platform: session.platform,
    metadata: {
      prefix: input.prefix,
      matched: matches.length,
      limit: Number.isFinite(limit) ? limit : 0,
    },
  });
  return { matches, step };
}
