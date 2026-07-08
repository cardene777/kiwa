/**
 * Mock adapter — drives the Vercel Edge Function harness directly using
 * `@kiwa/edge` v0.2 8 axis semantics helpers on 3 axes
 * (geo-replicated / edge-kv / streaming-response). Always runs; no
 * environment gate.
 *
 * Emits axis events on all 3 axes so the fidelity harness measures each
 * axis on the mock side. When paired with a real adapter (Vercel Edge
 * sandbox-backed), every emit has a counterpart the harness can diff.
 *
 * Every op appends 1 latency sample + 1 trace event so the fidelity
 * report never reads as 0-sample.
 */

import {
  createEdgeKvSession,
  createGeoReplicatedSession,
  geoPrimaryWrite,
  kvRangeQuery,
  kvRead,
  kvWrite,
  markReplicaLagged,
  openStream,
  resolveConflict,
  sendChunk,
  syncReplica,
  closeStream,
  type EdgeKvSession,
  type GeoReplicatedSession,
  type StreamSession,
} from '@kiwa/edge';
import {
  REGION_CATALOG,
  resolveRegion,
  type GeoPrimaryWriteSnapshot,
  type GeoReplicaSyncSnapshot,
  type GeoRouteSnapshot,
  type KvRangeQuerySnapshot,
  type KvReadSnapshot,
  type KvWriteSnapshot,
  type SseBackpressureSnapshot,
  type SseOpenSnapshot,
  type TraceEvent,
  type VercelEdgeAdapter,
} from './vercel-adapter.js';

export function makeMockAdapter(): VercelEdgeAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    geoRouteCount: 0,
    geoPrimaryWriteCount: 0,
    geoReplicaSyncCount: 0,
    kvReadCount: 0,
    kvWriteCount: 0,
    kvRangeQueryCount: 0,
    sseOpenCount: 0,
    sseBackpressureCount: 0,
  };

  // Sessions are lazily rebuilt after `reset()` so each test gets a
  // fresh state without leaking edge sessions across cases.
  let state: {
    geoSession: GeoReplicatedSession;
    kvSession: EdgeKvSession;
    streams: Map<string, StreamSession>;
  } | null = null;

  function ensure(): {
    geoSession: GeoReplicatedSession;
    kvSession: EdgeKvSession;
    streams: Map<string, StreamSession>;
  } {
    if (state) return state;
    state = {
      geoSession: createGeoReplicatedSession({
        platform: 'vercel',
        primaryRegion: REGION_CATALOG.primary,
        replicaRegions: [...REGION_CATALOG.replicas],
      }),
      kvSession: createEdgeKvSession({ platform: 'vercel' }),
      streams: new Map(),
    };
    return state;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'VERCEL_EDGE_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveGeoRoute(input): Promise<GeoRouteSnapshot> {
      return timed('driveGeoRoute', () => {
        metricsAgg.geoRouteCount += 1;
        // Region resolution reads accept-language + country, then routes.
        // No axis session emit here — the geo-replicated axis reserves
        // events for write / replica-sync flows. Routing is a stateless
        // lookup on the middleware side.
        const { region, fellBack } = resolveRegion({
          acceptLanguage: input.acceptLanguage,
          clientCountry: input.clientCountry,
        });
        const snapshot: GeoRouteSnapshot = {
          requestId: input.requestId,
          acceptLanguage: input.acceptLanguage,
          clientCountry: input.clientCountry,
          resolvedRegion: region,
          fellBack,
        };
        record('driveGeoRoute', true, {
          detail: {
            requestId: input.requestId,
            resolvedRegion: region,
            fellBack,
          },
        });
        return snapshot;
      });
    },

    async driveGeoPrimaryWrite(input): Promise<GeoPrimaryWriteSnapshot> {
      return timed('driveGeoPrimaryWrite', () => {
        metricsAgg.geoPrimaryWriteCount += 1;
        const { geoSession } = ensure();
        // Emit `geo.primary-write` via the axis session. All replicas are
        // now lagging behind the primary until a subsequent `syncReplica`
        // catches them up.
        geoPrimaryWrite(geoSession, { data: input.payload });
        const snapshot: GeoPrimaryWriteSnapshot = {
          primaryRegion: geoSession.primaryRegion,
          version: geoSession.version,
          laggingReplicas: [...geoSession.replicaRegions],
          payload: input.payload,
        };
        record('driveGeoPrimaryWrite', true, {
          detail: {
            primaryRegion: geoSession.primaryRegion,
            version: geoSession.version,
            laggingCount: geoSession.replicaRegions.length,
          },
        });
        return snapshot;
      });
    },

    async driveGeoReplicaSync(input): Promise<GeoReplicaSyncSnapshot> {
      return timed('driveGeoReplicaSync', () => {
        metricsAgg.geoReplicaSyncCount += 1;
        const { geoSession } = ensure();
        // Model each replica catching up. `markReplicaLagged` reasserts
        // the lag then `syncReplica` clears it — a real Vercel Edge
        // Config replication run would tick these events per region.
        const synced: string[] = [];
        for (const region of input.replicas) {
          markReplicaLagged(geoSession, { region, lagMs: 50 });
          syncReplica(geoSession, { region });
          synced.push(region);
        }
        // Explicit conflict-resolution path — used when replicas caught up
        // on divergent versions. The axis exposes `resolveConflict` so
        // downstream observers see the reconciliation step.
        if (geoSession.state === 'conflict-detected') {
          resolveConflict(geoSession, {
            region: geoSession.replicaRegions[0] ?? geoSession.primaryRegion,
            chosenVersion: geoSession.version,
          });
        }
        const snapshot: GeoReplicaSyncSnapshot = {
          syncedReplicas: synced,
          finalState: geoSession.state,
          version: geoSession.version,
        };
        record('driveGeoReplicaSync', true, {
          detail: {
            syncedCount: synced.length,
            finalState: geoSession.state,
            version: geoSession.version,
          },
        });
        return snapshot;
      });
    },

    async driveKvRead(input): Promise<KvReadSnapshot> {
      return timed('driveKvRead', () => {
        metricsAgg.kvReadCount += 1;
        const { kvSession } = ensure();
        // Emit `kv.read` / `kv.cache-hit` / `kv.cache-miss` depending on
        // the store + cache state. The axis session records the neutral
        // event; the snapshot exposes the same info to callers.
        //
        // On `cache-hit` the snapshot must reflect the cache (not the
        // store) — matches real Vercel KV behaviour where a stale cache
        // entry masks a fresh store value until the cache is invalidated.
        const step = kvRead(kvSession, { key: input.key });
        let value: string | null;
        let hitPath: KvReadSnapshot['hitPath'];
        if (step.neutralEvent === 'kv.cache-hit') {
          value = kvSession.cache.get(input.key) ?? null;
          hitPath = 'cache-hit';
        } else if (step.neutralEvent === 'kv.read') {
          value = kvSession.store.get(input.key) ?? null;
          hitPath = 'read';
        } else {
          value = null;
          hitPath = 'cache-miss';
        }
        const snapshot: KvReadSnapshot = {
          key: input.key,
          value,
          hitPath,
        };
        record('driveKvRead', true, {
          detail: { key: input.key, hitPath, hasValue: value !== null },
        });
        return snapshot;
      });
    },

    async driveKvWrite(input): Promise<KvWriteSnapshot> {
      return timed('driveKvWrite', () => {
        metricsAgg.kvWriteCount += 1;
        const { kvSession } = ensure();
        const preCache = kvSession.cache.has(input.key);
        // Emit `kv.write` — the axis session persists to store + drops
        // the cache entry so the next read is read-through.
        kvWrite(kvSession, { key: input.key, value: input.value });
        const snapshot: KvWriteSnapshot = {
          key: input.key,
          value: input.value,
          invalidatedCache: preCache,
        };
        record('driveKvWrite', true, {
          detail: {
            key: input.key,
            invalidatedCache: preCache,
          },
        });
        return snapshot;
      });
    },

    async driveKvRangeQuery(input): Promise<KvRangeQuerySnapshot> {
      return timed('driveKvRangeQuery', () => {
        metricsAgg.kvRangeQueryCount += 1;
        const { kvSession } = ensure();
        // Emit `kv.read` via the axis session. Range scan returns matched
        // keys sorted lexicographically (matches Vercel KV Redis SCAN
        // MATCH ordering under the default hash-slot).
        const { matches } = kvRangeQuery(kvSession, { prefix: input.prefix });
        const snapshot: KvRangeQuerySnapshot = {
          prefix: input.prefix,
          keys: matches,
          count: matches.length,
        };
        record('driveKvRangeQuery', true, {
          detail: { prefix: input.prefix, count: matches.length },
        });
        return snapshot;
      });
    },

    async driveSseOpen(input): Promise<SseOpenSnapshot> {
      return timed('driveSseOpen', () => {
        metricsAgg.sseOpenCount += 1;
        const { streams } = ensure();
        // Emit `stream.opened` via the axis session. The high-water mark
        // defaults to 64 KiB, matching Vercel Edge Response defaults.
        const session = openStream({
          id: input.streamId,
          platform: 'vercel',
          kind: 'sse',
        });
        // Write the initial event chunk. A real SSE client would receive
        // the first `data: ...\n\n` frame here.
        sendChunk(session, { data: input.firstChunk });
        streams.set(input.streamId, session);
        const snapshot: SseOpenSnapshot = {
          streamId: input.streamId,
          firstChunk: input.firstChunk,
          chunksSent: session.chunksSent,
        };
        record('driveSseOpen', true, {
          detail: { streamId: input.streamId, chunksSent: session.chunksSent },
        });
        return snapshot;
      });
    },

    async driveSseBackpressure(input): Promise<SseBackpressureSnapshot> {
      return timed('driveSseBackpressure', () => {
        metricsAgg.sseBackpressureCount += 1;
        const { streams } = ensure();
        // Callers may pre-open the stream via `driveSseOpen` or drive
        // backpressure standalone — support both by lazily creating the
        // session here when absent. If a session already exists, adopt
        // the caller's high-water mark so backpressure semantics respect
        // the intent of this op (driveSseOpen defaults to 64 KiB, which
        // hides backpressure for typical byte volumes).
        let session = streams.get(input.streamId);
        if (session?.state === 'closed') {
          // Reusing a closed streamId is a caller error — silently
          // dropping the chunks would hide bugs where a retry loop
          // reuses stream ids after close. Record the failure and throw
          // so the caller notices; the trace still reflects reality.
          record('driveSseBackpressure', false, {
            errorKind: 'VERCEL_EDGE_STREAM_ALREADY_CLOSED',
            detail: { streamId: input.streamId },
          });
          throw new Error(
            `driveSseBackpressure: stream ${input.streamId} is already closed`,
          );
        }
        if (!session) {
          session = openStream({
            id: input.streamId,
            platform: 'vercel',
            kind: 'sse',
            highWaterMark: input.highWaterMark,
          });
          streams.set(input.streamId, session);
        } else {
          // Adopt the caller's high-water mark. The state flip to
          // 'backpressure' is left to the next `sendChunk` — that keeps
          // the axis history honest by emitting `stream.backpressure`
          // through the semantics helper rather than mutating state
          // out-of-band. When the caller has no follow-up chunks the
          // snapshot's `hitBackpressure` may under-report; callers that
          // want an explicit backpressure event should send at least one
          // chunk after lowering the mark.
          session.highWaterMark = input.highWaterMark;
        }
        // Write each chunk. `sendChunk` will flip the session to
        // `backpressure` once bytesSent exceeds the high-water mark.
        let hitBackpressure = session.state === 'backpressure';
        for (const chunk of input.chunks) {
          sendChunk(session, { data: chunk });
          if (session.state === 'backpressure') hitBackpressure = true;
        }
        // Close cleanly. Emits `stream.closed`.
        closeStream(session, { reason: 'end-of-stream' });
        const snapshot: SseBackpressureSnapshot = {
          streamId: input.streamId,
          chunksSent: session.chunksSent,
          bytesSent: session.bytesSent,
          hitBackpressure,
          closed: session.state === 'closed',
        };
        record('driveSseBackpressure', true, {
          detail: {
            streamId: input.streamId,
            chunksSent: session.chunksSent,
            bytesSent: session.bytesSent,
            hitBackpressure,
          },
        });
        return snapshot;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        geoRouteCount: metricsAgg.geoRouteCount,
        geoPrimaryWriteCount: metricsAgg.geoPrimaryWriteCount,
        geoReplicaSyncCount: metricsAgg.geoReplicaSyncCount,
        kvReadCount: metricsAgg.kvReadCount,
        kvWriteCount: metricsAgg.kvWriteCount,
        kvRangeQueryCount: metricsAgg.kvRangeQueryCount,
        sseOpenCount: metricsAgg.sseOpenCount,
        sseBackpressureCount: metricsAgg.sseBackpressureCount,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.geoRouteCount = 0;
      metricsAgg.geoPrimaryWriteCount = 0;
      metricsAgg.geoReplicaSyncCount = 0;
      metricsAgg.kvReadCount = 0;
      metricsAgg.kvWriteCount = 0;
      metricsAgg.kvRangeQueryCount = 0;
      metricsAgg.sseOpenCount = 0;
      metricsAgg.sseBackpressureCount = 0;
      state = null;
    },
  };
}
