/**
 * Real adapter — connects to a running MySQL 8 broker via `MYSQL_KEY`
 * (host:port or a full DSN). When the env var is missing, the adapter
 * reports every op as `MYSQL_ENV_MISSING` so the fidelity harness records
 * the gap.
 *
 * Even when `MYSQL_KEY` is set, the v1.26-3 scope only wires the
 * connectivity aliveness probe + a `REAL_ADAPTER_NOT_IMPLEMENTED` marker
 * for higher-level ops. The point of this milestone is fidelity harness
 * bring-up + testcontainers hand-off, not a production Prisma + RLS
 * migration runner. A future v1.26-6 publish milestone can extend
 * `makeConnectedRealAdapter` with an actual `mysql2` + Prisma-managed RLS
 * policy install once the harness is proved on mock.
 */

import type {
  AdapterMetrics,
  AuditIntegrityObservation,
  BypassAuditObservation,
  CrossTenantObservation,
  MysqlRlsTenantAdapter,
  TenantInjectionObservation,
  TraceEvent,
} from './interface.js';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.MYSQL_KEY;
  if (!bootstrap) return null;
  const clientId = process.env.MYSQL_CLIENT_ID ?? 'dogfood-mysql-rls-tenant-app';
  return { bootstrap, clientId };
}

export class SkippedError extends Error {
  readonly code = 'MYSQL_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because MYSQL_KEY is not set`);
  }
}

export async function makeRealAdapter(): Promise<MysqlRlsTenantAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function emptyMetrics(): AdapterMetrics {
  return {
    latencySamplesMs: [],
    tenantWrites: 0,
    crossTenantRefusals: 0,
    bypassOps: 0,
    auditRecords: 0,
    policiesInstalled: 0,
  };
}

function makeSkippedRealAdapter(): MysqlRlsTenantAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'MYSQL_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveTenantInjection: async () => fail<TenantInjectionObservation>('driveTenantInjection'),
    driveCrossTenantRefuse: async () => fail<CrossTenantObservation>('driveCrossTenantRefuse'),
    driveBypassAudit: async () => fail<BypassAuditObservation>('driveBypassAudit'),
    driveAuditIntegrity: async () => fail<AuditIntegrityObservation>('driveAuditIntegrity'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'MYSQL_ENV_MISSING' });
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

/**
 * Connected variant — probes the bootstrap string and records a
 * `probe.ok` trace when the string looks valid (host:port or a MySQL
 * URL), then reports every higher-level op as `REAL_ADAPTER_NOT_IMPLEMENTED`
 * so the fidelity harness records a well-defined divergence.
 */
function makeConnectedRealAdapter(env: RealEnv): MysqlRlsTenantAdapter {
  const trace: TraceEvent[] = [];
  const probeOk = /^(?:mysql(?:x)?:\/\/|[\w.-]+:\d+)/.test(env.bootstrap);
  trace.push({
    op: 'probe',
    ok: probeOk,
    detail: { bootstrap: env.bootstrap, clientId: env.clientId },
  });

  function notImplemented<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    throw new Error(`${op}: REAL_ADAPTER_NOT_IMPLEMENTED in v1.26-3 scope`);
  }

  const metrics: AdapterMetrics = emptyMetrics();

  return {
    mode: 'real',
    traces: () => [...trace],

    driveTenantInjection: async () =>
      notImplemented<TenantInjectionObservation>('driveTenantInjection'),
    driveCrossTenantRefuse: async () =>
      notImplemented<CrossTenantObservation>('driveCrossTenantRefuse'),
    driveBypassAudit: async () => notImplemented<BypassAuditObservation>('driveBypassAudit'),
    driveAuditIntegrity: async () =>
      notImplemented<AuditIntegrityObservation>('driveAuditIntegrity'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    },
    metrics: () => ({ ...metrics, latencySamplesMs: [...metrics.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
    },
  };
}
