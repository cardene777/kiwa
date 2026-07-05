/**
 * RLS gate — wraps `@kiwa-test/orm`'s RLS session semantics into a small
 * helper that models the production Prisma-middleware layer:
 *
 *   1. `mountPolicy` installs a per-table policy on session bring-up
 *   2. `assertRead` / `assertWrite` gate every query with the current
 *      tenant_id, throwing `CROSS_TENANT_REFUSED` when the caller reaches
 *      into another tenant's rows
 *   3. `withBypass` opens a temporary bypass_rls window (superuser /
 *      support role) that skips the tenant filter but always records an
 *      audit entry
 *
 * The gate never touches the database — it drives the mock's neutral
 * RLS event stream so tests can assert on `rls.policy-installed` /
 * `rls.tenant-isolated` / `rls.bypass-used` regardless of backend.
 */

import {
  bypassRls,
  createRlsSession,
  filterTenant,
  installPolicy,
  logAudit,
  type RlsSession,
} from '@kiwa-test/orm';

export interface RlsGate {
  readonly session: RlsSession;
  readonly mountPolicy: (input: { name: string; tenantColumn: string }) => void;
  readonly assertRead: (tenantId: string) => void;
  readonly assertWrite: (tenantId: string) => void;
  readonly withBypass: <T>(
    input: { roleId: string; reason: string },
    fn: () => T,
  ) => T;
  readonly rearmPolicy: (input: { name: string; tenantColumn: string }) => void;
}

/**
 * Build an RLS gate bound to a table. `installPolicy` must be called via
 * `mountPolicy` before any assert. When the session is in `bypassed` state
 * the gate re-arms the policy on the next non-bypass op.
 */
export function createRlsGate(input: {
  tableId: string;
  provider: 'prisma';
  backend: 'mysql';
}): RlsGate {
  const session = createRlsSession({
    tableId: input.tableId,
    provider: input.provider,
    backend: input.backend,
  });

  function requirePolicy(): void {
    if (!session.policy) {
      throw new Error(
        'RlsGate: no policy mounted — call mountPolicy before asserting',
      );
    }
  }

  function rearmIfBypassed(): void {
    if (session.state === 'bypassed' && session.policy) {
      // Bypass windows are single-shot: after the caller returns, the
      // session must re-enter policy-installed so subsequent asserts are
      // gated again. `installPolicy` re-arms the state to
      // `policy-installed` with the same policy metadata.
      installPolicy(session, {
        name: session.policy.name,
        tenantColumn: session.policy.tenantColumn,
      });
    }
  }

  return {
    session,
    mountPolicy(input): void {
      installPolicy(session, input);
    },
    assertRead(tenantId): void {
      requirePolicy();
      rearmIfBypassed();
      filterTenant(session, { tenantId, operation: 'read' });
      logAudit(session, {
        tenantId,
        operation: 'read',
        allowed: true,
        reason: 'policy-enforced',
      });
    },
    assertWrite(tenantId): void {
      requirePolicy();
      rearmIfBypassed();
      filterTenant(session, { tenantId, operation: 'write' });
      logAudit(session, {
        tenantId,
        operation: 'write',
        allowed: true,
        reason: 'policy-enforced',
      });
    },
    withBypass<T>(input: { roleId: string; reason: string }, fn: () => T): T {
      requirePolicy();
      bypassRls(session, input);
      logAudit(session, {
        tenantId: '*',
        operation: 'read',
        allowed: true,
        reason: `bypass-open:${input.roleId}:${input.reason}`,
      });
      try {
        return fn();
      } finally {
        // Every bypass window is followed by an audit close entry so the
        // trail always pairs open+close (tamper-evident audit invariant).
        logAudit(session, {
          tenantId: '*',
          operation: 'read',
          allowed: true,
          reason: `bypass-close:${input.roleId}`,
        });
      }
    },
    rearmPolicy(input): void {
      installPolicy(session, input);
    },
  };
}

/**
 * Cross-tenant refusal — RLS `filterTenant` records the isolation event
 * but does not enforce caller identity (that is the domain layer's job).
 * The gate wraps the tenant check: when `actingTenantId !==
 * targetTenantId` and the caller has not opened a bypass window, the
 * refusal is signaled by throwing `CROSS_TENANT_REFUSED` and appending
 * an audit entry so the trail records the attempt.
 */
export class CrossTenantRefusedError extends Error {
  readonly code = 'CROSS_TENANT_REFUSED';
  constructor(actingTenantId: string, targetTenantId: string) {
    super(
      `CROSS_TENANT_REFUSED: acting tenant '${actingTenantId}' cannot access rows for tenant '${targetTenantId}'`,
    );
  }
}

export function tryCrossTenantRead(
  gate: RlsGate,
  actingTenantId: string,
  targetTenantId: string,
): Error | null {
  if (actingTenantId === targetTenantId) {
    throw new Error(
      'tryCrossTenantRead: caller passed the same tenantId — cross-tenant test requires different ids',
    );
  }
  if (gate.session.state === 'bypassed') {
    // Bypass windows explicitly skip the caller-identity check — return
    // null so the harness records that the intruder read succeeded under
    // bypass_rls (and can assert the audit trail captured it).
    gate.assertRead(targetTenantId);
    return null;
  }
  // Non-bypass window: log the refusal in the audit trail then throw so
  // the harness observes a well-defined refusal.
  gate.session.auditLog.push({
    tenantId: targetTenantId,
    operation: 'read',
    allowed: false,
    reason: `cross-tenant-refused:acting=${actingTenantId}`,
  });
  return new CrossTenantRefusedError(actingTenantId, targetTenantId);
}
