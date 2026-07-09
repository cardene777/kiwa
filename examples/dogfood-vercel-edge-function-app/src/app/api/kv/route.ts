/**
 * `/api/kv` route handler — Vercel KV Redis read/write + cache
 * invalidation. Uses the `@kiwa-lab/edge` v0.2 `edge-kv` axis via the
 * adapter. On GET the handler reads from KV (cache-hit path when the key
 * is warm); on POST it writes to KV and invalidates the cache entry so
 * the next read pulls the fresh value.
 *
 * Real Vercel exposes `@vercel/kv` on the edge runtime with async
 * `kv.get(key)` + `kv.set(key, value)`; the mock reproduces the same
 * observable surface without a live Redis behind it.
 */

import type { VercelEdgeAdapter } from '../../../lib/vercel-adapter.js';

export const runtime = 'edge';

export interface KvGetPayload {
  ok: boolean;
  key: string;
  value: string | null;
  hitPath: 'cache-hit' | 'read' | 'cache-miss';
}

export interface KvPostPayload {
  ok: boolean;
  key: string;
  value: string;
  invalidatedCache: boolean;
}

export interface KvRangePayload {
  ok: boolean;
  prefix: string;
  keys: readonly string[];
  count: number;
}

/** Read a key. Routes through the adapter's `driveKvRead` for observability. */
export async function handleKvGet(
  adapter: VercelEdgeAdapter,
  input: { key: string },
): Promise<{ status: number; body: KvGetPayload }> {
  const snapshot = await adapter.driveKvRead({ key: input.key });
  return {
    status: snapshot.value === null ? 404 : 200,
    body: {
      ok: snapshot.value !== null,
      key: snapshot.key,
      value: snapshot.value,
      hitPath: snapshot.hitPath,
    },
  };
}

/** Write a key. Routes through the adapter's `driveKvWrite` for observability. */
export async function handleKvPost(
  adapter: VercelEdgeAdapter,
  input: { key: string; value: string },
): Promise<{ status: number; body: KvPostPayload }> {
  const snapshot = await adapter.driveKvWrite({ key: input.key, value: input.value });
  return {
    status: 200,
    body: {
      ok: true,
      key: snapshot.key,
      value: snapshot.value,
      invalidatedCache: snapshot.invalidatedCache,
    },
  };
}

/** Range query over a key prefix. Used by cache-invalidation flows. */
export async function handleKvRange(
  adapter: VercelEdgeAdapter,
  input: { prefix: string },
): Promise<{ status: number; body: KvRangePayload }> {
  const snapshot = await adapter.driveKvRangeQuery({ prefix: input.prefix });
  return {
    status: 200,
    body: {
      ok: true,
      prefix: snapshot.prefix,
      keys: snapshot.keys,
      count: snapshot.count,
    },
  };
}
