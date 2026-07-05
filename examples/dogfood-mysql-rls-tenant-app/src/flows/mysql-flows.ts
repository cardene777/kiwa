/**
 * Higher-level flows that compose the adapter ops. Both the mock-mode
 * tests and the fidelity harness drive these functions so the trace
 * comparison runs against identical call sequences.
 */

import type {
  MysqlRlsTenantAdapter,
  OrganizationRow,
  TenantContext,
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
