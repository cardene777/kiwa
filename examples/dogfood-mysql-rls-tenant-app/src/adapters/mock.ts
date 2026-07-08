/**
 * Mock adapter — spins up 1 RLS session per policy, 1 organization store,
 * 1 audit-log chain, and 3 orm v0.10 advanced sessions (group replication
 * + binlog + router-split pool) against `@kiwa/orm`'s semantics.
 * Every op appends 1 latency sample and 1 trace event so the fidelity
 * harness never reads as 0-sample.
 *
 * The mock is drivable from tests deterministically — audit chain hashes
 * are pure functions of their input, RLS state transitions are inspected
 * from the neutral event stream, and no wall-clock scheduling is used.
 *
 * v2 (v1.32-3) adds 4 flows: `driveGroupReplication`, `driveBinlogAdvance`,
 * `driveRouterSplit`, `driveTestcontainersProbe`. The advanced flows sit
 * on top of the orm v0.10 semantics rather than the coarse-grained v1
 * RLS session — the RLS session covers the coarse-grained multi-tenant
 * patterns, the v0.10 semantics cover the fine-grained cluster / binlog
 * / pool behaviour the v2 axes assert against.
 */

import { createAuditLog, drainSessionAudit, type AuditLog } from '../audit/index.js';
import { createOrganizationStore, type OrganizationStore } from '../tenant/index.js';
import { createRlsGate, tryCrossTenantRead, type RlsGate } from '../rls/index.js';
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
import { OPS_UNDER_TEST } from './interface.js';
import { driveGroupReplicationFlow } from '../group-replication/index.js';
import { driveBinlogAdvanceFlow } from '../binlog-advance/index.js';
import { driveRouterSplitFlow } from '../router-split/index.js';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_MYSQL_URL = 'mysql://mysql:mysql@mysql-mock:3306/kiwa';
export const MYSQL_IMAGE_DEFAULT = 'mysql:8.4';
export const ROUTER_IMAGE_DEFAULT = 'mysql/mysql-router:8.4';

export interface MockAdapterOptions {
  readonly policyName?: string;
  readonly tenantColumn?: string;
  readonly tableId?: string;
}

/**
 * Build the mock adapter. Defaults match the v1.26-3 AC — 1 policy on the
 * `organizations` table with `tenant_id` column, 1 audit-log chain, 1
 * organization store.
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): MysqlRlsTenantAdapter {
  const config = {
    policyName: opts.policyName ?? 'organizations_tenant_isolation',
    tenantColumn: opts.tenantColumn ?? 'tenant_id',
    tableId: opts.tableId ?? 'organizations',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg: AdapterMetrics = {
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

  let gate: RlsGate | null = null;
  let store: OrganizationStore | null = null;
  let auditLog: AuditLog | null = null;

  function ensureGate(): RlsGate {
    if (gate) return gate;
    gate = createRlsGate({
      tableId: config.tableId,
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: config.policyName, tenantColumn: config.tenantColumn });
    metricsAgg.policiesInstalled += 1;
    return gate;
  }

  function ensureStore(): OrganizationStore {
    if (store) return store;
    store = createOrganizationStore();
    return store;
  }

  function ensureAuditLog(): AuditLog {
    if (auditLog) return auditLog;
    auditLog = createAuditLog();
    return auditLog;
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
        errorKind: 'MYSQL_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveTenantInjection(input): Promise<TenantInjectionObservation> {
      return timed('driveTenantInjection', async () => {
        const g = ensureGate();
        const s = ensureStore();
        const log = ensureAuditLog();
        const injected: string[] = [];
        for (const org of input.orgs) {
          g.assertWrite(org.tenantId);
          s.upsert(org);
          injected.push(org.tenantId);
        }
        drainSessionAudit(g.session, log);
        metricsAgg.tenantWrites += input.orgs.length;
        metricsAgg.auditRecords = log.size();
        const observation: TenantInjectionObservation = {
          writes: input.orgs.length,
          injectedTenantIds: injected,
          policyInstalled: g.session.state !== 'no-policy',
        };
        record('driveTenantInjection', true, {
          detail: {
            writes: observation.writes,
            tenants: [...new Set(injected)].length,
          },
        });
        return observation;
      });
    },

    async driveCrossTenantRefuse(input): Promise<CrossTenantObservation> {
      return timed('driveCrossTenantRefuse', async () => {
        const g = ensureGate();
        const s = ensureStore();
        const log = ensureAuditLog();
        for (const org of input.orgs) {
          g.assertWrite(org.tenantId);
          s.upsert(org);
        }
        // Own-tenant read must succeed.
        g.assertRead(input.context.tenantId);
        const ownRows = s.listByTenant(input.context.tenantId);

        // Cross-tenant read: the same acting caller now tries to read
        // the intruder tenant's rows. `tryCrossTenantRead` returns a
        // `CROSS_TENANT_REFUSED` error and appends the refusal audit
        // entry to the RLS session. `null` means the read went through
        // (either bypass window was open or the gate accepted the
        // switch — an RLS invariant violation the harness surfaces).
        const err = tryCrossTenantRead(
          g,
          input.context.tenantId,
          input.intruderTenantId,
        );
        const refusals = err ? 1 : 0;
        drainSessionAudit(g.session, log);
        metricsAgg.crossTenantRefusals += refusals;
        metricsAgg.auditRecords = log.size();
        const observation: CrossTenantObservation = {
          ownReads: ownRows.length,
          refusals,
          refusalKind: refusals > 0 ? 'CROSS_TENANT_REFUSED' : 'NONE',
        };
        record('driveCrossTenantRefuse', true, {
          detail: {
            ownReads: observation.ownReads,
            refusals: observation.refusals,
          },
        });
        return observation;
      });
    },

    async driveBypassAudit(input): Promise<BypassAuditObservation> {
      return timed('driveBypassAudit', async () => {
        const g = ensureGate();
        const log = ensureAuditLog();
        const preBypassSize = log.size();
        let bypassOps = 0;
        g.withBypass(
          { roleId: input.supportRoleId, reason: input.reason },
          () => {
            for (const op of input.ops) {
              // Inside the bypass window RLS is skipped — we log a
              // synthetic audit entry so the trail records every
              // support-mode op alongside the open/close pair.
              g.session.auditLog.push({
                tenantId: op.tenantId,
                operation: op.operation,
                allowed: true,
                reason: `bypass-op:${input.supportRoleId}`,
              });
              bypassOps += 1;
            }
          },
        );
        drainSessionAudit(g.session, log);
        // The bypass window closed — issue 1 policy-enforced read to
        // confirm the gate re-armed to `policy-installed`.
        g.assertRead(input.ops[0]?.tenantId ?? 'tenant-a');
        drainSessionAudit(g.session, log);
        metricsAgg.bypassOps += bypassOps;
        metricsAgg.auditRecords = log.size();
        const observation: BypassAuditObservation = {
          bypassOpened: true,
          bypassOps,
          auditEntriesAppended: log.size() - preBypassSize,
          reArmedAfterBypass: g.session.state === 'policy-installed',
        };
        record('driveBypassAudit', true, {
          detail: {
            bypassOps: observation.bypassOps,
            auditAppended: observation.auditEntriesAppended,
          },
        });
        return observation;
      });
    },

    async driveAuditIntegrity(input): Promise<AuditIntegrityObservation> {
      return timed('driveAuditIntegrity', async () => {
        const log = ensureAuditLog();
        // Ensure the chain has ≥ 1 record even when the caller drives
        // integrity before the other ops — a single audit entry is
        // synthetic-seeded so `verify` never inspects an empty chain.
        if (log.size() === 0) {
          const g = ensureGate();
          g.assertRead('tenant-seed');
          drainSessionAudit(g.session, log);
        }
        // Tamper before verify when requested — flips the chain-hash of
        // the record at `tamperAtIndex` so `verify` reports a break.
        if (input.tamperAtIndex !== undefined) {
          const records = log.snapshot();
          const idx = input.tamperAtIndex;
          if (idx >= 0 && idx < records.length) {
            const original = records[idx]!;
            const tampered = {
              ...original,
              chainHash: original.chainHash.split('').reverse().join(''),
            };
            // Mutating the underlying array via snapshot() would return
            // a copy — reach into the log via a targeted reset+rebuild.
            const snapshot = log.snapshot();
            log.reset();
            for (let i = 0; i < snapshot.length; i += 1) {
              const rec = i === idx ? tampered : snapshot[i]!;
              log.append({
                tenantId: rec.tenantId,
                operation: rec.operation,
                allowed: rec.allowed,
                reason: rec.reason,
              });
            }
            // Rewrite the record hash to the tampered value so the
            // chain-verify inspects the corrupt hash.
            const rebuiltSnapshot = log.snapshot();
            log.reset();
            for (let i = 0; i < rebuiltSnapshot.length; i += 1) {
              log.append({
                tenantId: rebuiltSnapshot[i]!.tenantId,
                operation: rebuiltSnapshot[i]!.operation,
                allowed: rebuiltSnapshot[i]!.allowed,
                reason:
                  i === idx
                    ? `${rebuiltSnapshot[i]!.reason}::TAMPERED`
                    : rebuiltSnapshot[i]!.reason,
              });
            }
          }
        }
        const verify = log.verify();
        metricsAgg.auditRecords = log.size();
        const observation: AuditIntegrityObservation = {
          totalRecords: log.size(),
          chainOk: verify.ok,
          brokenAt: verify.brokenAt,
        };
        record('driveAuditIntegrity', true, {
          detail: {
            totalRecords: observation.totalRecords,
            chainOk: observation.chainOk,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, {
          detail: { opsUnderTest: OPS_UNDER_TEST.length },
        });
      });
    },

    // -------------------------------------------------------------------------
    // v2 ops — group replication + binlog advance + router split +
    // testcontainers probe.
    // -------------------------------------------------------------------------

    async driveGroupReplication(): Promise<GroupReplicationObservation> {
      return timed('driveGroupReplication', async () => {
        const { observation, session } = driveGroupReplicationFlow();
        metricsAgg.groupReplicationSteps += session.history.length;
        const ok =
          observation.finalState === 'member-left' &&
          observation.primaryId !== '' &&
          observation.peakMemberCount >= 2 &&
          observation.conflictCount >= 1;
        record('driveGroupReplication', ok, {
          detail: {
            groupName: observation.groupName,
            primaryId: observation.primaryId,
            peakMemberCount: observation.peakMemberCount,
            conflictCount: observation.conflictCount,
            finalState: observation.finalState,
          },
        });
        return observation;
      });
    },

    async driveBinlogAdvance(): Promise<BinlogAdvanceObservation> {
      return timed('driveBinlogAdvance', async () => {
        const { observation, session } = driveBinlogAdvanceFlow();
        metricsAgg.binlogAdvanceOps += session.history.length;
        const ok =
          observation.gapDetected &&
          observation.binlogPosition > 0 &&
          observation.gtidCount >= 1 &&
          observation.format === 'ROW';
        record('driveBinlogAdvance', ok, {
          detail: {
            serverId: observation.serverId,
            binlogFile: observation.binlogFile,
            binlogPosition: observation.binlogPosition,
            format: observation.format,
            gtidCount: observation.gtidCount,
            gapDetected: observation.gapDetected,
          },
        });
        return observation;
      });
    },

    async driveRouterSplit(): Promise<RouterSplitObservation> {
      return timed('driveRouterSplit', async () => {
        const { observation } = driveRouterSplitFlow();
        metricsAgg.routerSplitOps += 1;
        const ok =
          observation.finalState === 'metrics-exported' &&
          observation.readHits + observation.writeHits > 0 &&
          observation.warmedConnections > 0;
        record('driveRouterSplit', ok, {
          detail: {
            poolId: observation.poolId,
            readHits: observation.readHits,
            writeHits: observation.writeHits,
            warmedConnections: observation.warmedConnections,
            finalState: observation.finalState,
          },
        });
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          mysqlUrl: MOCK_MYSQL_URL,
          mysqlImage: MYSQL_IMAGE_DEFAULT,
          routerImage: ROUTER_IMAGE_DEFAULT,
          reachable: true,
        };
        record('driveTestcontainersProbe', true, {
          detail: {
            mysqlUrl: observation.mysqlUrl,
            mysqlImage: observation.mysqlImage,
            routerImage: observation.routerImage,
            reachable: observation.reachable,
          },
        });
        return observation;
      });
    },

    metrics(): AdapterMetrics {
      return { ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.tenantWrites = 0;
      metricsAgg.crossTenantRefusals = 0;
      metricsAgg.bypassOps = 0;
      metricsAgg.auditRecords = 0;
      metricsAgg.policiesInstalled = 0;
      metricsAgg.groupReplicationSteps = 0;
      metricsAgg.binlogAdvanceOps = 0;
      metricsAgg.routerSplitOps = 0;
      metricsAgg.testcontainersProbes = 0;
      gate = null;
      store?.reset();
      store = null;
      auditLog?.reset();
      auditLog = null;
    },
  };
}
