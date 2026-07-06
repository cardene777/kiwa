/**
 * Higher-level flows that compose the adapter ops. Both the mock-mode
 * tests and the fidelity harness drive these functions so the trace
 * comparison runs against identical call sequences.
 *
 * v1 (v1.26-3) — 5 flows: tenant injection / cross-tenant refuse /
 * bypass audit / audit integrity / fidelity emit.
 * v2 (v1.32-3) — 4 additional flows: group replication / binlog advance
 * / router split / testcontainers probe. Each returns the full
 * observation because the observation shapes are small enough that
 * callers routinely want every field.
 */

import type {
  BinlogAdvanceObservation,
  GroupReplicationObservation,
  MysqlRlsTenantAdapter,
  OrganizationRow,
  RouterSplitObservation,
  TenantContext,
  TestcontainersProbeObservation,
} from '../adapters/interface.js';

export async function driveTenantInjectionFlow(
  adapter: MysqlRlsTenantAdapter,
  orgs: readonly OrganizationRow[],
): Promise<{ writes: number; tenants: number; policyInstalled: boolean }> {
  const out = await adapter.driveTenantInjection({ orgs });
  return {
    writes: out.writes,
    tenants: new Set(out.injectedTenantIds).size,
    policyInstalled: out.policyInstalled,
  };
}

export async function driveCrossTenantRefuseFlow(
  adapter: MysqlRlsTenantAdapter,
  input: {
    context: TenantContext;
    orgs: readonly OrganizationRow[];
    intruderTenantId: string;
  },
): Promise<{ ownReads: number; refusals: number; refusalKind: string }> {
  const out = await adapter.driveCrossTenantRefuse(input);
  return {
    ownReads: out.ownReads,
    refusals: out.refusals,
    refusalKind: out.refusalKind,
  };
}

export async function driveBypassAuditFlow(
  adapter: MysqlRlsTenantAdapter,
  input: {
    supportRoleId: string;
    reason: string;
    ops: readonly { tenantId: string; operation: 'read' | 'write' }[];
  },
): Promise<{ bypassOps: number; auditAppended: number; reArmedAfterBypass: boolean }> {
  const out = await adapter.driveBypassAudit(input);
  return {
    bypassOps: out.bypassOps,
    auditAppended: out.auditEntriesAppended,
    reArmedAfterBypass: out.reArmedAfterBypass,
  };
}

export async function driveAuditIntegrityFlow(
  adapter: MysqlRlsTenantAdapter,
  input: { tamperAtIndex?: number } = {},
): Promise<{ totalRecords: number; chainOk: boolean; brokenAt: number }> {
  const out = await adapter.driveAuditIntegrity(input);
  return {
    totalRecords: out.totalRecords,
    chainOk: out.chainOk,
    brokenAt: out.brokenAt,
  };
}

export async function driveFidelityFlow(adapter: MysqlRlsTenantAdapter): Promise<void> {
  await adapter.emitFidelity();
}

// -----------------------------------------------------------------------------
// v2 (v1.32-3) flows — MySQL 8 group replication + binlog advance + router
// split + testcontainers probe. Each drives the sibling adapter op + returns
// the full observation because the observation shapes are small enough that
// callers routinely want every field.
// -----------------------------------------------------------------------------

export async function driveGroupReplicationFlow(
  adapter: MysqlRlsTenantAdapter,
): Promise<GroupReplicationObservation> {
  return adapter.driveGroupReplication();
}

export async function driveBinlogAdvanceFlow(
  adapter: MysqlRlsTenantAdapter,
): Promise<BinlogAdvanceObservation> {
  return adapter.driveBinlogAdvance();
}

export async function driveRouterSplitFlow(
  adapter: MysqlRlsTenantAdapter,
): Promise<RouterSplitObservation> {
  return adapter.driveRouterSplit();
}

export async function driveTestcontainersProbeFlow(
  adapter: MysqlRlsTenantAdapter,
): Promise<TestcontainersProbeObservation> {
  return adapter.driveTestcontainersProbe();
}
