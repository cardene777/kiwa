/**
 * Real adapter — connects to a running MySQL 8 broker via `MYSQL_KEY`
 * (host:port or a full DSN). When the env var is missing, the adapter
 * reports every op as `MYSQL_ENV_MISSING` so the fidelity harness records
 * the gap.
 *
 * v1.32-3 scope: the connectivity aliveness probe + a
 * `REAL_ADAPTER_NOT_IMPLEMENTED` marker for higher-level ops. The point
 * of this milestone is v2 flow bring-up + testcontainers hand-off, not a
 * production `mysql2` + Prisma + group-replication client. The v1.32-6
 * publish milestone can extend `makeConnectedRealAdapter` with an actual
 * `mysql2` + Prisma-managed RLS policy install + MySQL Router R/W split
 * client once the harness is proved on mock.
 *
 * The testcontainers probe op is the only real op that returns a
 * populated observation when the env is set — it echoes the MySQL +
 * Router image tag pair so the fidelity harness can confirm the boot
 * path is wired before the higher-level clients arrive.
 */

import type {
  AdapterMetrics,
  AuditIntegrityObservation,
  BinlogAdvanceObservation,
  BypassAuditObservation,
  CrossTenantObservation,
  GroupReplicationObservation,
  MysqlRlsTenantAdapter,
  RouterSplitObservation,
  TenantInjectionObservation,
  TestcontainersProbeObservation,
  TraceEvent,
} from './interface.js';

export const MYSQL_IMAGE_DEFAULT = 'mysql:8.4';
export const ROUTER_IMAGE_DEFAULT = 'mysql/mysql-router:8.4';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
  readonly mysqlImage: string;
  readonly routerImage: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.MYSQL_KEY;
  if (!bootstrap) return null;
  const clientId = process.env.MYSQL_CLIENT_ID ?? 'dogfood-mysql-rls-tenant-app';
  const mysqlImage = process.env.MYSQL_IMAGE ?? MYSQL_IMAGE_DEFAULT;
  const routerImage = process.env.MYSQL_ROUTER_IMAGE ?? ROUTER_IMAGE_DEFAULT;
  return { bootstrap, clientId, mysqlImage, routerImage };
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
    groupReplicationSteps: 0,
    binlogAdvanceOps: 0,
    routerSplitOps: 0,
    testcontainersProbes: 0,
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
    // v2 ops — every skipped variant records a well-defined divergence so
    // the fidelity harness treats them uniformly with the v1 ops.
    driveGroupReplication: async () =>
      fail<GroupReplicationObservation>('driveGroupReplication'),
    driveBinlogAdvance: async () => fail<BinlogAdvanceObservation>('driveBinlogAdvance'),
    driveRouterSplit: async () => fail<RouterSplitObservation>('driveRouterSplit'),
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
 * `probe.ok` trace when the string looks valid (host:port or a MySQL
 * URL), then reports every higher-level op as `REAL_ADAPTER_NOT_IMPLEMENTED`
 * so the fidelity harness records a well-defined divergence.
 *
 * `driveTestcontainersProbe` is the exception: it returns a populated
 * observation echoing the bootstrap + image tags so v1.32-6 can wire the
 * higher-level clients against the same boot path without changing the
 * observation shape.
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
    throw new Error(`${op}: REAL_ADAPTER_NOT_IMPLEMENTED in v1.32-3 scope`);
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
    driveGroupReplication: async () =>
      notImplemented<GroupReplicationObservation>('driveGroupReplication'),
    driveBinlogAdvance: async () => notImplemented<BinlogAdvanceObservation>('driveBinlogAdvance'),
    driveRouterSplit: async () => notImplemented<RouterSplitObservation>('driveRouterSplit'),
    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      metrics.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        mysqlUrl: env.bootstrap,
        mysqlImage: env.mysqlImage,
        routerImage: env.routerImage,
        reachable: probeOk,
      };
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: probeOk,
        detail: {
          mysqlUrl: observation.mysqlUrl,
          mysqlImage: observation.mysqlImage,
          routerImage: observation.routerImage,
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
