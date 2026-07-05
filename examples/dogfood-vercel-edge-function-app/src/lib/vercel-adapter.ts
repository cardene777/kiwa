/**
 * Provider-neutral Vercel Edge Function + Vercel KV + geo-based routing +
 * SSE streaming adapter contract for the dogfood-vercel-edge-function-app.
 *
 * The dogfood app talks to Vercel Edge only through this interface.
 * Two implementations exist —
 *
 * - {@link makeMockAdapter} — backed by `@kiwa-test/edge` v0.2 8 axis
 *   semantics helpers on the `geo-replicated` + `edge-kv` +
 *   `streaming-response` axes (createGeoReplicatedSession /
 *   geoPrimaryWrite / syncReplica / createEdgeKvSession / kvRead / kvWrite
 *   / kvRangeQuery / openStream / sendChunk / closeStream). Always runs.
 * - {@link makeRealAdapter} — targets a real Vercel Edge runtime via the
 *   Vercel Edge sandbox (or `vercel dev` subprocess). Requires
 *   `KIWA_MODE=real` + `VERCEL_KEY=1` to opt in; otherwise every method
 *   records `KIWA_VERCEL_EDGE_ENV_MISSING` and refuses to run.
 *
 * Both satisfy the same 8-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the fidelity harness.
 *
 * The 8 ops correspond to the 8 axis routing pattern inherited from
 * v1.24-1 (`@kiwa-test/edge` v0.2 semantics): geo-replicated (3 events) +
 * edge-kv (3 events) + streaming-response (2 events) = 8 op surface.
 *
 * User journey — a client hits a Next.js 15 edge route. The middleware
 * inspects Accept-Language + geo IP and picks a POP region. The route
 * reads a KV entry (cache-hit or read-through), optionally writes a new
 * value (cache invalidation), and streams an SSE response with
 * backpressure semantics. A follow-up region-failover flow syncs replicas
 * so the fidelity harness observes the multi-region write path.
 */

/** Region resolution snapshot — negotiated region + language + fallback flag. */
export interface GeoRouteSnapshot {
  readonly requestId: string;
  readonly acceptLanguage: string;
  readonly clientCountry: string;
  readonly resolvedRegion: string;
  readonly fellBack: boolean;
}

/** Primary write snapshot — region + version + replicas marked lagging. */
export interface GeoPrimaryWriteSnapshot {
  readonly primaryRegion: string;
  readonly version: number;
  readonly laggingReplicas: readonly string[];
  readonly payload: string;
}

/** Replica sync snapshot — replicas caught up + resulting state. */
export interface GeoReplicaSyncSnapshot {
  readonly syncedReplicas: readonly string[];
  readonly finalState: 'in-sync' | 'lagging' | 'conflict-detected';
  readonly version: number;
}

/** KV read snapshot — key + value + hit path (cold / cache-hit / miss). */
export interface KvReadSnapshot {
  readonly key: string;
  readonly value: string | null;
  readonly hitPath: 'cache-hit' | 'read' | 'cache-miss';
}

/** KV write snapshot — key + value + cache invalidation flag. */
export interface KvWriteSnapshot {
  readonly key: string;
  readonly value: string;
  readonly invalidatedCache: boolean;
}

/** KV range query snapshot — prefix + returned keys + count. */
export interface KvRangeQuerySnapshot {
  readonly prefix: string;
  readonly keys: readonly string[];
  readonly count: number;
}

/** SSE open snapshot — stream id + kind + first chunk delivered. */
export interface SseOpenSnapshot {
  readonly streamId: string;
  readonly firstChunk: string;
  readonly chunksSent: number;
}

/** SSE backpressure snapshot — chunks written + backpressure fired + closed. */
export interface SseBackpressureSnapshot {
  readonly streamId: string;
  readonly chunksSent: number;
  readonly bytesSent: number;
  readonly hitBackpressure: boolean;
  readonly closed: boolean;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral Vercel Edge Function driver. 8 ops spread across 3
 * axes (geo-replicated 3 + edge-kv 3 + streaming-response 2):
 *
 * geo-replicated axis:
 *  1. `driveGeoRoute`         — resolveRegion(accept-language + geo-ip)
 *  2. `driveGeoPrimaryWrite`  — geoPrimaryWrite (bumps version, replicas lag)
 *  3. `driveGeoReplicaSync`   — syncReplica (each replica catches up)
 *
 * edge-kv axis:
 *  4. `driveKvRead`           — kvRead (cache-hit / read-through / miss)
 *  5. `driveKvWrite`          — kvWrite (persist + invalidate cache)
 *  6. `driveKvRangeQuery`     — kvRangeQuery (prefix scan)
 *
 * streaming-response axis:
 *  7. `driveSseOpen`          — openStream + sendChunk (initial event)
 *  8. `driveSseBackpressure`  — sendChunk over high-water + closeStream
 */
export interface VercelEdgeAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveGeoRoute(input: {
    requestId: string;
    acceptLanguage: string;
    clientCountry: string;
  }): Promise<GeoRouteSnapshot>;

  driveGeoPrimaryWrite(input: {
    payload: string;
  }): Promise<GeoPrimaryWriteSnapshot>;

  driveGeoReplicaSync(input: {
    replicas: readonly string[];
  }): Promise<GeoReplicaSyncSnapshot>;

  driveKvRead(input: {
    key: string;
  }): Promise<KvReadSnapshot>;

  driveKvWrite(input: {
    key: string;
    value: string;
  }): Promise<KvWriteSnapshot>;

  driveKvRangeQuery(input: {
    prefix: string;
  }): Promise<KvRangeQuerySnapshot>;

  driveSseOpen(input: {
    streamId: string;
    firstChunk: string;
  }): Promise<SseOpenSnapshot>;

  driveSseBackpressure(input: {
    streamId: string;
    chunks: readonly string[];
    highWaterMark: number;
  }): Promise<SseBackpressureSnapshot>;

  metrics(): {
    latencySamplesMs: number[];
    geoRouteCount: number;
    geoPrimaryWriteCount: number;
    geoReplicaSyncCount: number;
    kvReadCount: number;
    kvWriteCount: number;
    kvRangeQueryCount: number;
    sseOpenCount: number;
    sseBackpressureCount: number;
  };

  reset(): Promise<void>;
}

/**
 * Region catalog used by the geo router — mirrors the shape of a real
 * Vercel deployment (iad1, hnd1, sfo1, fra1). `default` is the failover
 * region when the client country cannot be mapped to an IATA.
 */
export const REGION_CATALOG = {
  primary: 'iad1',
  replicas: ['hnd1', 'sfo1', 'fra1'] as const,
} as const;

/**
 * Resolve a POP region for a request. In real Vercel this happens in the
 * middleware (edge runtime). The routing table is intentionally small so
 * unit tests can exhaustively cover it.
 */
export function resolveRegion(input: {
  acceptLanguage: string;
  clientCountry: string;
}): { region: string; fellBack: boolean } {
  // Country → region map. When both signals agree the region is decisive;
  // when they disagree country wins (geo IP is more reliable than
  // Accept-Language, which UAs and translators can rewrite).
  const countryToRegion: Record<string, string> = {
    US: 'iad1',
    JP: 'hnd1',
    KR: 'hnd1',
    GB: 'fra1',
    DE: 'fra1',
    FR: 'fra1',
    CA: 'sfo1',
  };
  const languageToRegion: Record<string, string> = {
    en: 'iad1',
    ja: 'hnd1',
    ko: 'hnd1',
    de: 'fra1',
    fr: 'fra1',
  };
  const country = input.clientCountry.trim().toUpperCase();
  const language = input.acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase() ?? '';
  const byCountry = countryToRegion[country];
  if (byCountry) return { region: byCountry, fellBack: false };
  const byLanguage = languageToRegion[language];
  if (byLanguage) return { region: byLanguage, fellBack: true };
  return { region: REGION_CATALOG.primary, fellBack: true };
}
