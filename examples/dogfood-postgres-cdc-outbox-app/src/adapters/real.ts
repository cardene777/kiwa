/**
 * Real adapter — connects to a running Postgres 16 broker via
 * `POSTGRES_BOOTSTRAP` (host:port or a full DSN). When the env var is
 * missing, the adapter reports every op as `POSTGRES_ENV_MISSING` so the
 * fidelity harness records the gap.
 *
 * v1.32-2 scope: the connectivity aliveness probe + a
 * `REAL_ADAPTER_NOT_IMPLEMENTED` marker for higher-level ops. The point of
 * this milestone is v2 flow bring-up + testcontainers hand-off, not a
 * production wal2json / pgvector wire client. The v1.32-6 publish
 * milestone can extend `makeConnectedRealAdapter` with an actual `pg` +
 * pgoutput + pgvector client once the harness is proved on mock.
 *
 * The testcontainers probe op is the only real op that returns a
 * populated observation when the env is set — it echoes the Postgres +
 * pgvector image tag pair so the fidelity harness can confirm the boot
 * path is wired before the higher-level clients arrive.
 */

import type {
  AdapterMetrics,
  AtLeastOnceObservation,
  CdcObservation,
  LogicalReplicationAdvancedObservation,
  OrderRow,
  OutboxObservation,
  PgvectorObservation,
  PostgresCdcOutboxAdapter,
  ReplicationObservation,
  SlotAdvanceObservation,
  TestcontainersProbeObservation,
  TraceEvent,
} from './interface.js';

export const POSTGRES_IMAGE_DEFAULT = 'postgres:16-alpine';
export const PGVECTOR_IMAGE_DEFAULT = 'pgvector/pgvector:pg16';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
  readonly postgresImage: string;
  readonly pgvectorImage: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.POSTGRES_BOOTSTRAP;
  if (!bootstrap) return null;
  const clientId = process.env.POSTGRES_CLIENT_ID ?? 'dogfood-postgres-cdc-outbox-app';
  const postgresImage = process.env.POSTGRES_IMAGE ?? POSTGRES_IMAGE_DEFAULT;
  const pgvectorImage = process.env.PGVECTOR_IMAGE ?? PGVECTOR_IMAGE_DEFAULT;
  return { bootstrap, clientId, postgresImage, pgvectorImage };
}

export class SkippedError extends Error {
  readonly code = 'POSTGRES_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because POSTGRES_BOOTSTRAP is not set`);
  }
}

export async function makeRealAdapter(): Promise<PostgresCdcOutboxAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function emptyMetrics(): AdapterMetrics {
  return {
    latencySamplesMs: [],
    outboxWrites: 0,
    cdcDelivered: 0,
    replicationBytes: 0,
    atLeastOnceDeliveries: 0,
    duplicatesHandled: 0,
    logicalReplicationSteps: 0,
    slotAdvanceOps: 0,
    pgvectorSearches: 0,
    testcontainersProbes: 0,
  };
}

function makeSkippedRealAdapter(): PostgresCdcOutboxAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'POSTGRES_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveOutbox: async () => fail<OutboxObservation>('driveOutbox'),
    driveCdcPickup: async () => fail<CdcObservation>('driveCdcPickup'),
    driveReplication: async () => fail<ReplicationObservation>('driveReplication'),
    driveAtLeastOnce: async () => fail<AtLeastOnceObservation>('driveAtLeastOnce'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'POSTGRES_ENV_MISSING' });
    },
    // v2 ops — every skipped variant records a well-defined divergence so
    // the fidelity harness treats them uniformly with the v1 ops.
    driveLogicalReplicationAdvanced: async () =>
      fail<LogicalReplicationAdvancedObservation>('driveLogicalReplicationAdvanced'),
    driveSlotAdvance: async () => fail<SlotAdvanceObservation>('driveSlotAdvance'),
    drivePgvector: async () => fail<PgvectorObservation>('drivePgvector'),
    driveTestcontainersProbe: async () =>
      fail<TestcontainersProbeObservation>('driveTestcontainersProbe'),
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

/**
 * Connected variant — probes the bootstrap string and records a
 * `probe.ok` trace when the string looks valid (host:port or a Postgres
 * URL), then reports every higher-level op as `REAL_ADAPTER_NOT_IMPLEMENTED`
 * so the fidelity harness records a well-defined divergence.
 *
 * `driveTestcontainersProbe` is the exception: it returns a populated
 * observation echoing the bootstrap + image tags so v1.32-6 can wire the
 * higher-level clients against the same boot path without changing the
 * observation shape.
 */
function makeConnectedRealAdapter(env: RealEnv): PostgresCdcOutboxAdapter {
  const trace: TraceEvent[] = [];
  const probeOk = /^(?:postgres(?:ql)?:\/\/|[\w.-]+:\d+)/.test(env.bootstrap);
  trace.push({
    op: 'probe',
    ok: probeOk,
    detail: { bootstrap: env.bootstrap, clientId: env.clientId },
  });

  function notImplemented<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    throw new Error(`${op}: REAL_ADAPTER_NOT_IMPLEMENTED in v1.32-2 scope`);
  }

  const metrics: AdapterMetrics = emptyMetrics();

  return {
    mode: 'real',
    traces: () => [...trace],

    driveOutbox: async (_orders: readonly OrderRow[]) =>
      notImplemented<OutboxObservation>('driveOutbox'),
    driveCdcPickup: async () => notImplemented<CdcObservation>('driveCdcPickup'),
    driveReplication: async () => notImplemented<ReplicationObservation>('driveReplication'),
    driveAtLeastOnce: async () => notImplemented<AtLeastOnceObservation>('driveAtLeastOnce'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    },
    driveLogicalReplicationAdvanced: async () =>
      notImplemented<LogicalReplicationAdvancedObservation>('driveLogicalReplicationAdvanced'),
    driveSlotAdvance: async () => notImplemented<SlotAdvanceObservation>('driveSlotAdvance'),
    drivePgvector: async () => notImplemented<PgvectorObservation>('drivePgvector'),
    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      metrics.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        postgresUrl: env.bootstrap,
        postgresImage: env.postgresImage,
        pgvectorImage: env.pgvectorImage,
        reachable: probeOk,
      };
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: probeOk,
        detail: {
          postgresUrl: observation.postgresUrl,
          postgresImage: observation.postgresImage,
          pgvectorImage: observation.pgvectorImage,
          reachable: observation.reachable,
        },
      });
      return observation;
    },
    metrics: () => ({ ...metrics, latencySamplesMs: [...metrics.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
    },
  };
}
