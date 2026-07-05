/**
 * Provider-neutral Nuxt 3 + Prisma + MySQL 8 multi-tenant RLS adapter
 * contract for the dogfood-mysql-rls-tenant-app dogfood (v1.26-3).
 *
 * The dogfood talks to the multi-tenant SaaS only through this interface.
 * Two implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/orm`'s RLS session semantics + an in-memory organization
 * store) and {@link makeRealAdapter} (probes a MySQL 8 broker via
 * `MYSQL_KEY` when set, else returns a skipped variant whose every method
 * records a `MYSQL_ENV_MISSING` trace).
 *
 * Both satisfy the same 5-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to `@kiwa-test/quality-metrics`
 * 7-axis release gate.
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
}

/**
 * Provider-neutral MySQL 8 RLS + multi-tenant SaaS driver. 5 ops map to
 * the AC in Issue #942 (tenant_id auto-injection on write / cross-tenant
 * read refuse under RLS policy / bypass_rls role guard with audit log /
 * tamper-evident audit log verification / fidelity report generation).
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
];

export type { OrganizationRow };
