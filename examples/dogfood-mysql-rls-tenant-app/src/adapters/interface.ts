/**
 * Provider-neutral Nuxt 3 + Prisma + MySQL 8 multi-tenant RLS adapter
 * contract for the dogfood-mysql-rls-tenant-app dogfood.
 *
 * The dogfood talks to the multi-tenant SaaS only through this interface.
 * Two implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-lab/orm`'s RLS + MySQL cluster + binlog + pool advanced
 * semantics) and {@link makeRealAdapter} (probes a MySQL 8 broker via
 * `MYSQL_KEY` when set, else returns a skipped variant whose every method
 * records a `MYSQL_ENV_MISSING` trace).
 *
 * v1 (v1.26-3) covered 5 ops — driveTenantInjection / driveCrossTenantRefuse
 * / driveBypassAudit / driveAuditIntegrity / emitFidelity. v1.32-3 extends
 * the surface with 4 v2 ops that exercise the orm v0.10 advanced MySQL
 * semantics end-to-end:
 *
 *   - `driveGroupReplication`      — MySQL 8 group replication 4-state walk
 *                                    (empty → joined → primary-elected →
 *                                    conflict-detected → member-left).
 *                                    Reports the group name, primary id,
 *                                    peak member count, and conflict count.
 *   - `driveBinlogAdvance`         — MySQL binlog advance + GTID set update +
 *                                    ROW format negotiate + GTID gap detect.
 *                                    Reports the binlog file / position pair
 *                                    and the observed GTID count.
 *   - `driveRouterSplit`           — MySQL Router-style read/write splitter
 *                                    modeled through the pool advanced axis
 *                                    (cold → healthy → warmed-up → draining
 *                                    → metrics-exported) with route-shaped
 *                                    counters. Reports the read / write
 *                                    route hits + warmed connection count.
 *   - `driveTestcontainersProbe`   — MySQL 8 + MySQL Router container image
 *                                    probe. Under mock mode returns
 *                                    deterministic placeholders; under real
 *                                    mode returns the container-mapped
 *                                    host:port pair or a well-defined
 *                                    divergence when the env is absent.
 *
 * All 9 ops (5 v1 + 4 v2) satisfy the same "op → observation → trace"
 * shape so behavioural fidelity between real vs mock can be measured side-
 * by-side and fed to `@kiwa-lab/quality-metrics` release gate.
 */

import type { OrganizationRow } from '../tenant/index.js';

export interface TenantContext {
  readonly tenantId: string;
  readonly actorId: string;
}

/** Auto-injection step observation — writes gated by tenant_id. */
export interface TenantInjectionObservation {
  readonly writes: number;
  readonly injectedTenantIds: readonly string[];
  readonly policyInstalled: boolean;
}

/** Cross-tenant refuse observation — reads gated by RLS. */
export interface CrossTenantObservation {
  readonly ownReads: number;
  readonly refusals: number;
  readonly refusalKind: 'CROSS_TENANT_REFUSED' | 'NONE';
}

/** Bypass_rls audit observation — support role window. */
export interface BypassAuditObservation {
  readonly bypassOpened: boolean;
  readonly bypassOps: number;
  readonly auditEntriesAppended: number;
  readonly reArmedAfterBypass: boolean;
}

/** Tamper-evident audit log observation — chain verify. */
export interface AuditIntegrityObservation {
  readonly totalRecords: number;
  readonly chainOk: boolean;
  readonly brokenAt: number;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface AdapterMetrics {
  latencySamplesMs: number[];
  tenantWrites: number;
  crossTenantRefusals: number;
  bypassOps: number;
  auditRecords: number;
  policiesInstalled: number;
  // v2 counters — the fidelity report surfaces these alongside the v1 ones.
  groupReplicationSteps: number;
  binlogAdvanceOps: number;
  routerSplitOps: number;
  testcontainersProbes: number;
}

// -----------------------------------------------------------------------------
// v2 (v1.32-3) — MySQL 8 group replication + binlog + router split +
// testcontainers probe observations.
// -----------------------------------------------------------------------------

/**
 * Group replication step observation — records the 4-state walk
 * (empty → joined → primary-elected → conflict-detected → member-left)
 * that mirrors MySQL 8 group_replication + performance_schema primitives.
 */
export interface GroupReplicationObservation {
  readonly groupName: string;
  /** Chosen single-primary member id after election. */
  readonly primaryId: string;
  /** Number of members that joined before any leaves. */
  readonly peakMemberCount: number;
  /** Number of write conflicts detected across the run. */
  readonly conflictCount: number;
  /** Final state reached by the session (`member-left` on success). */
  readonly finalState:
    | 'empty'
    | 'joined'
    | 'primary-elected'
    | 'conflict-detected'
    | 'member-left';
}

/**
 * Binlog advance step observation — records binlog file/position advance,
 * GTID set update, ROW format negotiate, and GTID gap detect.
 */
export interface BinlogAdvanceObservation {
  readonly serverId: string;
  readonly binlogFile: string;
  readonly binlogPosition: number;
  readonly format: 'ROW' | 'STATEMENT' | 'MIXED';
  readonly gtidCount: number;
  /** True when the terminal state is `gap-detected` after the 4 steps. */
  readonly gapDetected: boolean;
}

/**
 * Router split step observation — records the pool advanced 5-state walk
 * plus route-hit counters (reads sent to read replicas, writes sent to
 * the primary via the router), matching MySQL Router R/W split behaviour.
 */
export interface RouterSplitObservation {
  readonly poolId: string;
  /** Number of read route hits accounted to read-only replicas. */
  readonly readHits: number;
  /** Number of write route hits accounted to the primary. */
  readonly writeHits: number;
  /** Peak warmed connection count observed before drain. */
  readonly warmedConnections: number;
  /** Final state reached by the pool session (`metrics-exported` on success). */
  readonly finalState:
    | 'cold'
    | 'healthy'
    | 'warmed-up'
    | 'draining'
    | 'metrics-exported';
}

/**
 * Testcontainers probe observation — MySQL 8 + MySQL Router image lookup
 * + host:port pair.
 */
export interface TestcontainersProbeObservation {
  readonly mysqlUrl: string;
  readonly mysqlImage: string;
  readonly routerImage: string;
  readonly reachable: boolean;
}

/**
 * Provider-neutral MySQL 8 RLS + multi-tenant SaaS driver. 5 v1 ops + 4 v2
 * ops map to the AC in Issue #1024 (MySQL 8 group replication + Router
 * read/write split + InnoDB cluster testcontainers fidelity + Playwright
 * e2e + release gate 13 axis).
 *
 * v1 ops.
 *
 * 1. `driveTenantInjection`  — mount RLS policy, write N rows across
 *                              tenants, verify every row carries tenant_id
 * 2. `driveCrossTenantRefuse` — 2-tenant peer read, cross-tenant read
 *                              refused with `CROSS_TENANT_REFUSED`
 * 3. `driveBypassAudit`      — bypass_rls role opens a window, executes
 *                              N ops, closes the window, audit entries
 *                              recorded, session re-armed after bypass
 * 4. `driveAuditIntegrity`   — chain-verify the audit log, tamper
 *                              detection reports break index
 * 5. `emitFidelity`          — assemble a quality-report + release-gate
 *                              verdict, write to quality-report/
 *
 * v2 — 4 ops that exercise orm v0.10 advanced MySQL semantics.
 */
export interface MysqlRlsTenantAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveTenantInjection(input: {
    orgs: readonly OrganizationRow[];
  }): Promise<TenantInjectionObservation>;

  driveCrossTenantRefuse(input: {
    context: TenantContext;
    orgs: readonly OrganizationRow[];
    intruderTenantId: string;
  }): Promise<CrossTenantObservation>;

  driveBypassAudit(input: {
    supportRoleId: string;
    reason: string;
    ops: readonly { tenantId: string; operation: 'read' | 'write' }[];
  }): Promise<BypassAuditObservation>;

  driveAuditIntegrity(input: {
    tamperAtIndex?: number;
  }): Promise<AuditIntegrityObservation>;

  emitFidelity(): Promise<void>;

  // ---------------------------------------------------------------------------
  // v2 ops — MySQL 8 group replication + binlog + router split +
  // testcontainers probe. Each op is scope-boxed so the real driver can
  // report a well-defined divergence when the env is absent.
  // ---------------------------------------------------------------------------

  /**
   * v2 — walk the MySQL 8 group replication 4-state flow: join 2 members,
   * elect a single primary, detect 1 write conflict, and leave a member.
   * Reports the group name, primary id, peak member count, and conflict
   * count.
   */
  driveGroupReplication(): Promise<GroupReplicationObservation>;

  /**
   * v2 — advance a MySQL binlog session through position advance, GTID
   * set update, ROW format negotiate, and GTID gap detect. Reports the
   * binlog file / position pair and the observed GTID count.
   */
  driveBinlogAdvance(): Promise<BinlogAdvanceObservation>;

  /**
   * v2 — walk a MySQL Router-style read/write splitter through the pool
   * advanced 5-state flow (cold → healthy → warmed-up → draining →
   * metrics-exported) while counting read + write route hits. Reports
   * the route hit counters + peak warmed connection count.
   */
  driveRouterSplit(): Promise<RouterSplitObservation>;

  /**
   * v2 — probe the MySQL 8 + MySQL Router testcontainers boot path.
   * Under mock mode returns deterministic placeholders; under real mode
   * returns the container-mapped host:port pair or a well-defined
   * divergence when the env is absent.
   */
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;

  metrics(): AdapterMetrics;

  reset(): Promise<void>;
}

/** Convenience sample factory for tests + perf. */
export function sampleOrgRow(overrides: Partial<OrganizationRow> = {}): OrganizationRow {
  return {
    organizationId: overrides.organizationId ?? 'org-sample',
    tenantId: overrides.tenantId ?? 'tenant-a',
    name: overrides.name ?? 'Sample Org',
    plan: overrides.plan ?? 'pro',
  };
}

/** Neutral op names that fidelity harness diffs across mock vs real. */
export const OPS_UNDER_TEST: readonly string[] = [
  'driveTenantInjection',
  'driveCrossTenantRefuse',
  'driveBypassAudit',
  'driveAuditIntegrity',
  'emitFidelity',
  // v2 ops — advance the surface from 5 → 9 while keeping the v1 ops in place.
  'driveGroupReplication',
  'driveBinlogAdvance',
  'driveRouterSplit',
  'driveTestcontainersProbe',
];

export type { OrganizationRow };
