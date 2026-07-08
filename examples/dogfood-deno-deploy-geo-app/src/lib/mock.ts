/**
 * Mock adapter — drives the Deno Deploy harness directly using
 * `@kiwa/edge` v0.2 8 axis semantics helpers on 3 axes
 * (geo-replicated / edge-kv / cron-trigger). Always runs; no environment
 * gate.
 *
 * Emits axis events on all 3 axes so the fidelity harness measures each
 * axis on the mock side. When paired with a real adapter (Deno Deploy
 * sandbox-backed), every emit has a counterpart the harness can diff.
 *
 * Every op appends 1 latency sample + 1 trace event so the fidelity
 * report never reads as 0-sample.
 */

import {
  completeCron,
  createEdgeKvSession,
  createGeoReplicatedSession,
  failCron,
  geoPrimaryWrite,
  kvRangeQuery,
  kvRead,
  kvWrite,
  markReplicaLagged,
  resolveConflict,
  scheduleCron,
  startCron,
  syncReplica,
  type CronSession,
  type EdgeKvSession,
  type GeoReplicatedSession,
} from '@kiwa/edge';
import {
  REGION_CATALOG,
  normalizeCronSpec,
  resolveRegion,
  type CronCompletionSnapshot,
  type CronFailureSnapshot,
  type CronScheduleSnapshot,
  type DenoDeployAdapter,
  type GeoPrimaryWriteSnapshot,
  type GeoReplicaSyncSnapshot,
  type GeoRouteSnapshot,
  type KvRangeQuerySnapshot,
  type KvWriteSnapshot,
  type ReadYourWritesSnapshot,
  type TraceEvent,
} from './deno-adapter.js';

export function makeMockAdapter(): DenoDeployAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    geoRouteCount: 0,
    geoPrimaryWriteCount: 0,
    geoReplicaSyncCount: 0,
    kvWriteCount: 0,
    kvRangeQueryCount: 0,
    readYourWritesCount: 0,
    cronScheduleCount: 0,
    cronCompleteCount: 0,
  };

  // Sessions are lazily rebuilt after `reset()` so each test gets a
  // fresh state without leaking edge sessions across cases.
  let state: {
    geoSession: GeoReplicatedSession;
    kvSession: EdgeKvSession;
    cronById: Map<string, CronSession>;
  } | null = null;

  function ensure(): {
    geoSession: GeoReplicatedSession;
    kvSession: EdgeKvSession;
    cronById: Map<string, CronSession>;
  } {
    if (state) return state;
    state = {
      geoSession: createGeoReplicatedSession({
        platform: 'deno',
        primaryRegion: REGION_CATALOG.primary,
        replicaRegions: [...REGION_CATALOG.replicas],
      }),
      // Deno KV advertises strong consistency at the primary region and
      // eventual at replicas. The mock defaults to strong so
      // read-your-writes stays honest at the primary; the eventual path
      // is exercised via `driveReadYourWrites({ fromLaggingReplica: true })`.
      kvSession: createEdgeKvSession({ platform: 'deno', state: 'consistent' }),
      cronById: new Map(),
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
        errorKind: 'DENO_DEPLOY_MOCK_ERROR',
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
        // lookup on the Fresh handler side.
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
        // the lag then `syncReplica` clears it — a real Deno KV replica
        // sync run would tick these events per region.
        const synced: string[] = [];
        for (const region of input.replicas) {
          markReplicaLagged(geoSession, { region, lagMs: 25 });
          syncReplica(geoSession, { region });
          synced.push(region);
        }
        // Explicit conflict-resolution path — used when replicas caught up
        // on divergent versions. Deno KV's atomic transactions raise a
        // conflict when the version does not match; the mock exposes
        // `resolveConflict` so downstream observers see the reconciliation
        // step.
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

    async driveKvWrite(input): Promise<KvWriteSnapshot> {
      return timed('driveKvWrite', () => {
        metricsAgg.kvWriteCount += 1;
        const { kvSession } = ensure();
        const preCache = kvSession.cache.has(input.key);
        // Emit `kv.write` — the axis session persists to store + drops
        // the cache entry so the next read is read-through. Deno KV
        // strong consistency implies the primary-region read sees the
        // written value immediately; replica reads may lag.
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
        // keys sorted lexicographically (matches Deno KV `list({ prefix })`
        // key order — Deno KV keys are compared byte-wise by their
        // Uint8Array encoding, which agrees with lexicographic sort for
        // ASCII strings).
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

    async driveReadYourWrites(input): Promise<ReadYourWritesSnapshot> {
      return timed('driveReadYourWrites', () => {
        metricsAgg.readYourWritesCount += 1;
        const { kvSession } = ensure();
        // Capture the prior state BEFORE the primary write so the
        // lagging-replica branch can surface the prior value (models a
        // replica that has not yet applied the freshest write). If we
        // captured after `kvWrite` the "prior" state would already be
        // the new write, defeating the eventual-consistency observation.
        const priorStore = kvSession.store.get(input.key) ?? null;
        // Write goes through the axis to preserve emission ordering.
        kvWrite(kvSession, { key: input.key, value: input.value });
        // On lagging-replica read, we route past the store the primary
        // write just landed on and return the prior state (which is
        // `null` when the replica has literally no state). This models
        // a replica whose replication log has not yet applied the
        // primary write — the visible value is the prior write, not
        // the freshest one.
        //
        // Note: this simulation mode is intentionally strict. Real Deno
        // KV eventually-consistent replicas serve the prior value (never
        // silently the freshest); the mock mirrors that observable
        // outcome so callers can assert deterministically. The fidelity
        // harness records the axis event sequence which is the actual
        // comparison surface.
        const fromLagging = input.fromLaggingReplica ?? false;
        let readValue: string | null;
        if (fromLagging) {
          // Do NOT re-emit `kv.read` on the lagging path — the axis
          // history already captures the write, and a lagging replica
          // would not emit a primary read event either. The observable
          // return value is enough.
          readValue = priorStore;
        } else {
          const readStep = kvRead(kvSession, { key: input.key });
          if (readStep.neutralEvent === 'kv.cache-hit') {
            readValue = kvSession.cache.get(input.key) ?? null;
          } else if (readStep.neutralEvent === 'kv.read') {
            readValue = kvSession.store.get(input.key) ?? null;
          } else {
            readValue = null;
          }
        }
        const consistent = !fromLagging && readValue === input.value;
        const snapshot: ReadYourWritesSnapshot = {
          key: input.key,
          writtenValue: input.value,
          readValue,
          consistent,
          consistency: fromLagging ? 'eventual' : 'strong',
        };
        record('driveReadYourWrites', true, {
          detail: {
            key: input.key,
            consistent,
            consistency: snapshot.consistency,
          },
        });
        return snapshot;
      });
    },

    async driveCronSchedule(input): Promise<CronScheduleSnapshot> {
      return timed('driveCronSchedule', () => {
        metricsAgg.cronScheduleCount += 1;
        const { cronById } = ensure();
        if (cronById.has(input.id)) {
          record('driveCronSchedule', false, {
            errorKind: 'DENO_DEPLOY_CRON_ID_TAKEN',
            detail: { id: input.id },
          });
          throw new Error(
            `driveCronSchedule: cron id "${input.id}" already scheduled`,
          );
        }
        const spec = normalizeCronSpec(input.cronSpec);
        const session = scheduleCron({
          id: input.id,
          platform: 'deno',
          triggerType: input.triggerType ?? 'scheduled',
          cronSpec: spec,
          maxRetries: input.maxRetries ?? 3,
        });
        // A scheduled cron becomes runnable at its first tick — kick off
        // startCron so the axis history reflects the state transition.
        // Real Deno Deploy fires `Deno.cron` handlers on the scheduled
        // tick; the mock advances the state machine immediately so the
        // fidelity harness sees `cron.scheduled` + `cron.started` on the
        // same op boundary.
        startCron(session);
        cronById.set(input.id, session);
        const snapshot: CronScheduleSnapshot = {
          id: session.id,
          triggerType: session.triggerType,
          cronSpec: session.cronSpec,
          state: session.state,
        };
        record('driveCronSchedule', true, {
          detail: {
            id: session.id,
            triggerType: session.triggerType,
            state: session.state,
          },
        });
        return snapshot;
      });
    },

    async driveCronComplete(input): Promise<CronCompletionSnapshot | CronFailureSnapshot> {
      return timed('driveCronComplete', () => {
        metricsAgg.cronCompleteCount += 1;
        const { cronById } = ensure();
        const session = cronById.get(input.id);
        if (!session) {
          record('driveCronComplete', false, {
            errorKind: 'DENO_DEPLOY_CRON_NOT_FOUND',
            detail: { id: input.id },
          });
          throw new Error(
            `driveCronComplete: cron id "${input.id}" not scheduled`,
          );
        }
        if (input.outcome === 'success') {
          completeCron(session, { durationMs: input.durationMs });
          const snapshot: CronCompletionSnapshot = {
            id: session.id,
            finalState: 'completed',
            durationMs: input.durationMs,
            retryCount: session.retryCount,
          };
          record('driveCronComplete', true, {
            detail: {
              id: session.id,
              finalState: 'completed',
              durationMs: input.durationMs,
            },
          });
          return snapshot;
        }
        const preRetryCount = session.retryCount;
        failCron(session, { reason: input.reason ?? 'unspecified' });
        const willRetry = session.state === 'scheduled';
        const snapshot: CronFailureSnapshot = {
          id: session.id,
          reason: input.reason ?? 'unspecified',
          retryCount: session.retryCount,
          willRetry,
          nextState: session.state === 'scheduled' ? 'scheduled' : 'failed',
        };
        record('driveCronComplete', true, {
          detail: {
            id: session.id,
            finalState: session.state,
            retryCount: session.retryCount,
            willRetry,
            preRetryCount,
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
        kvWriteCount: metricsAgg.kvWriteCount,
        kvRangeQueryCount: metricsAgg.kvRangeQueryCount,
        readYourWritesCount: metricsAgg.readYourWritesCount,
        cronScheduleCount: metricsAgg.cronScheduleCount,
        cronCompleteCount: metricsAgg.cronCompleteCount,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.geoRouteCount = 0;
      metricsAgg.geoPrimaryWriteCount = 0;
      metricsAgg.geoReplicaSyncCount = 0;
      metricsAgg.kvWriteCount = 0;
      metricsAgg.kvRangeQueryCount = 0;
      metricsAgg.readYourWritesCount = 0;
      metricsAgg.cronScheduleCount = 0;
      metricsAgg.cronCompleteCount = 0;
      state = null;
    },
  };
}
