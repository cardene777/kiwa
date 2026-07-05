/**
 * Real adapter — connects to a running Postgres 16 broker via
 * `POSTGRES_BOOTSTRAP` (host:port or a full DSN). When the env var is
 * missing, the adapter reports every op as `POSTGRES_ENV_MISSING` so the
 * fidelity harness records the gap.
 *
 * Even when `POSTGRES_BOOTSTRAP` is set, the v1.26-2 scope only wires the
 * connectivity aliveness probe + a `REAL_ADAPTER_NOT_IMPLEMENTED` marker
 * for higher-level ops. The point of this milestone is fidelity harness
 * bring-up + testcontainers hand-off, not a production wal2json client.
 * The v1.26-6 publish milestone can extend `makeConnectedRealAdapter` with
 * an actual `pg` + Debezium wire once the harness is proved on mock.
 */

import type {
  AdapterMetrics,
  AtLeastOnceObservation,
  CdcObservation,
  OrderRow,
  OutboxObservation,
  PostgresCdcOutboxAdapter,
  ReplicationObservation,
  TraceEvent,
} from './interface.js';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.POSTGRES_BOOTSTRAP;
  if (!bootstrap) return null;
  const clientId = process.env.POSTGRES_CLIENT_ID ?? 'dogfood-postgres-cdc-outbox-app';
  return { bootstrap, clientId };
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
    throw new Error(`${op}: REAL_ADAPTER_NOT_IMPLEMENTED in v1.26-2 scope`);
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
    metrics: () => ({ ...metrics, latencySamplesMs: [...metrics.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
    },
  };
}
