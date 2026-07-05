import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Row-level security (RLS) — install a per-table policy, evaluate it on
 * every read/write to isolate tenants, allow a superuser / `bypass_rls` role
 * to skip it under audit, and record every access in an audit trail.
 * Postgres has first-class `CREATE POLICY`; MySQL / SQLite emulate with
 * filtered views. The mock exposes the same 4 neutral events for all 3
 * backends so tests can assert on tenant isolation regardless of backend.
 *
 * State transitions:
 *   created                  → 'no-policy'
 *   installPolicy            → 'policy-installed'
 *   filterTenant             → 'policy-installed'
 *   bypassRls                → 'bypassed'
 *   logAudit                 → (state unchanged, audit is passive)
 */
export type RlsState = 'no-policy' | 'policy-installed' | 'bypassed';

export interface RlsPolicy {
  name: string;
  table: string;
  tenantColumn: string;
}

export interface RlsAuditEntry {
  tenantId: string;
  operation: 'read' | 'write';
  allowed: boolean;
  reason: string;
}

export interface RlsSession {
  tableId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: RlsState;
  policy: RlsPolicy | null;
  auditLog: RlsAuditEntry[];
  history: AxisStep<RlsState>[];
}

function record(session: RlsSession, step: AxisStep<RlsState>): AxisStep<RlsState> {
  session.history.push(step);
  return step;
}

/**
 * Create an RLS session bound to a table. State starts at 'no-policy'; the
 * caller must call `installPolicy` before any filter / bypass step.
 */
export function createRlsSession(input: {
  tableId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): RlsSession {
  return {
    tableId: input.tableId,
    provider: input.provider,
    backend: input.backend,
    state: 'no-policy',
    policy: null,
    auditLog: [],
    history: [],
  };
}

/**
 * Install a policy over a table. Requires an unused tenant column name.
 * Emits `rls.policy-installed`.
 */
export function installPolicy(
  session: RlsSession,
  input: { name: string; tenantColumn: string },
): AxisStep<RlsState> {
  if (input.name.length === 0) {
    throw new Error('installPolicy: policy name required');
  }
  session.policy = {
    name: input.name,
    table: session.tableId,
    tenantColumn: input.tenantColumn,
  };
  session.state = 'policy-installed';
  return record(session, {
    neutralEvent: 'rls.policy-installed',
    backendEvent: backendEventName(session.backend, 'rls.policy-installed', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      name: input.name,
      tenantColumn: input.tenantColumn,
    },
  });
}

/**
 * Simulate a per-tenant filter application on a query. Requires a policy to
 * be installed and the session to be 'policy-installed' (not bypassed).
 * Emits `rls.tenant-isolated`. Metadata carries the tenant id and the
 * operation kind.
 */
export function filterTenant(
  session: RlsSession,
  input: { tenantId: string; operation: 'read' | 'write' },
): AxisStep<RlsState> {
  if (!session.policy || session.state !== 'policy-installed') {
    throw new Error(
      `filterTenant: requires policy-installed state (got ${session.state})`,
    );
  }
  return record(session, {
    neutralEvent: 'rls.tenant-isolated',
    backendEvent: backendEventName(session.backend, 'rls.tenant-isolated', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      tenantId: input.tenantId,
      operation: input.operation,
      policyName: session.policy.name,
    },
  });
}

/**
 * Simulate a `bypass_rls` role usage. Requires a policy to be installed —
 * a bypass without a policy is a bug. Marks the session 'bypassed' and
 * emits `rls.bypass-used`. Subsequent `filterTenant` calls will throw
 * until the caller re-installs / re-arms the policy.
 */
export function bypassRls(
  session: RlsSession,
  input: { roleId: string; reason: string },
): AxisStep<RlsState> {
  if (!session.policy) {
    throw new Error('bypassRls: requires an installed policy');
  }
  session.state = 'bypassed';
  return record(session, {
    neutralEvent: 'rls.bypass-used',
    backendEvent: backendEventName(session.backend, 'rls.bypass-used', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { roleId: input.roleId, reason: input.reason },
  });
}

/**
 * Append an audit log entry. Audit is passive; it does not change state.
 * Records the tenant, operation, whether the operation was allowed, and a
 * reason string. Emits `rls.audit-logged`.
 */
export function logAudit(
  session: RlsSession,
  input: RlsAuditEntry,
): AxisStep<RlsState> {
  session.auditLog.push(input);
  return record(session, {
    neutralEvent: 'rls.audit-logged',
    backendEvent: backendEventName(session.backend, 'rls.audit-logged', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      tenantId: input.tenantId,
      operation: input.operation,
      allowed: input.allowed,
      auditSize: session.auditLog.length,
    },
  });
}
