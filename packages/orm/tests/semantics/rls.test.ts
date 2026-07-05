import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  bypassRls,
  createRlsSession,
  filterTenant,
  installPolicy,
  logAudit,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('rls axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: install → filter → audit happy path',
    (provider, backend) => {
      const session = createRlsSession({ tableId: 'users', provider, backend });
      installPolicy(session, { name: 'tenant_isolation', tenantColumn: 'tenant_id' });
      expect(session.state).toBe('policy-installed');
      const filter = filterTenant(session, { tenantId: 't_1', operation: 'read' });
      expect(filter.neutralEvent).toBe('rls.tenant-isolated');
      const audit = logAudit(session, {
        tenantId: 't_1',
        operation: 'read',
        allowed: true,
        reason: 'policy match',
      });
      expect(audit.metadata.allowed).toBe(true);
      expect(session.auditLog.length).toBe(1);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect',
    (provider, backend) => {
      const session = createRlsSession({ tableId: 't', provider, backend });
      const step = installPolicy(session, { name: 'p1', tenantColumn: 'tid' });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'rls.policy-installed', provider),
      );
    },
  );

  it('installPolicy rejects empty name', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    expect(() => installPolicy(session, { name: '', tenantColumn: 'tid' })).toThrow(
      /name required/,
    );
  });

  it('filterTenant requires policy installed', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    expect(() =>
      filterTenant(session, { tenantId: 't_1', operation: 'read' }),
    ).toThrow(/policy-installed/);
  });

  it('filterTenant rejects after bypass', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    installPolicy(session, { name: 'p1', tenantColumn: 'tid' });
    bypassRls(session, { roleId: 'r_admin', reason: 'migration' });
    expect(() =>
      filterTenant(session, { tenantId: 't_1', operation: 'write' }),
    ).toThrow(/policy-installed/);
  });

  it('bypassRls requires installed policy', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    expect(() => bypassRls(session, { roleId: 'r', reason: 'x' })).toThrow(
      /installed policy/,
    );
  });

  it('bypassRls records reason + role', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    installPolicy(session, { name: 'p1', tenantColumn: 'tid' });
    const step = bypassRls(session, { roleId: 'r_admin', reason: 'migration' });
    expect(step.metadata.roleId).toBe('r_admin');
    expect(step.metadata.reason).toBe('migration');
    expect(session.state).toBe('bypassed');
  });

  it('logAudit is passive (does not change state)', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    installPolicy(session, { name: 'p1', tenantColumn: 'tid' });
    const before = session.state;
    logAudit(session, {
      tenantId: 't_1',
      operation: 'read',
      allowed: false,
      reason: 'tenant mismatch',
    });
    expect(session.state).toBe(before);
    expect(session.auditLog[0]?.allowed).toBe(false);
  });

  it('filterTenant metadata carries policyName and tenantId', () => {
    const session = createRlsSession({ tableId: 't', provider: 'drizzle', backend: 'postgres' });
    installPolicy(session, { name: 'tenant_scope', tenantColumn: 'tid' });
    const step = filterTenant(session, { tenantId: 't_42', operation: 'write' });
    expect(step.metadata.policyName).toBe('tenant_scope');
    expect(step.metadata.tenantId).toBe('t_42');
    expect(step.metadata.operation).toBe('write');
  });
});
