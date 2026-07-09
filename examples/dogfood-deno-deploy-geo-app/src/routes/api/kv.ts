/**
 * `/api/kv` Fresh route handler — Deno KV multi-region write + eventual
 * consistency observation. Uses the `@kiwa-lab/edge` v0.2 `edge-kv` +
 * `geo-replicated` axes via the adapter. On POST the handler issues a
 * primary-region KV write (`kv.set`), bumps the geo replication version,
 * marks all replicas as lagging until a follow-up sync catches them up.
 * On GET the handler returns a range query over a prefix so callers can
 * observe the multi-region write's propagation via range scan.
 *
 * Real Deno Deploy exposes `Deno.openKv()` returning a `Deno.Kv` that
 * supports `kv.set(key, value)` + `kv.list({ prefix })`; the mock
 * reproduces the same observable surface without a live KV process.
 */

import type { DenoDeployAdapter } from '../../lib/deno-adapter.js';

/** Response payload for POST /api/kv (write). */
export interface KvPostPayload {
  ok: boolean;
  key: string;
  value: string;
  invalidatedCache: boolean;
  primaryRegion: string;
  version: number;
  laggingReplicas: readonly string[];
}

/** Response payload for GET /api/kv?prefix=... (range). */
export interface KvRangePayload {
  ok: boolean;
  prefix: string;
  keys: readonly string[];
  count: number;
}

/**
 * Multi-region write. Persists to the primary region KV then bumps the
 * geo-replicated axis version so subsequent reads see the write. The
 * response echoes the lagging replicas so callers can wait for
 * propagation before reading from a non-primary region.
 */
export async function handleKvWrite(
  adapter: DenoDeployAdapter,
  input: { key: string; value: string },
): Promise<{ status: number; body: KvPostPayload }> {
  const write = await adapter.driveKvWrite({ key: input.key, value: input.value });
  // Multi-region propagation — the primary write updates the store then
  // the geo-replicated axis records the new version + lagging replicas.
  const geoWrite = await adapter.driveGeoPrimaryWrite({ payload: input.value });
  return {
    status: 200,
    body: {
      ok: true,
      key: write.key,
      value: write.value,
      invalidatedCache: write.invalidatedCache,
      primaryRegion: geoWrite.primaryRegion,
      version: geoWrite.version,
      laggingReplicas: geoWrite.laggingReplicas,
    },
  };
}

/** Range query over a key prefix. Used by dashboards + purge jobs. */
export async function handleKvRange(
  adapter: DenoDeployAdapter,
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
