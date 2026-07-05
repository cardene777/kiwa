import { describe, expect, it } from 'vitest';
import { createOrganizationStore } from '../src/tenant/index.js';
import { createRlsGate, tryCrossTenantRead } from '../src/rls/index.js';

describe('tenant isolation — RLS policy + tenant_id auto-injection', () => {
  it('T-DMT-001 upsert requires a non-empty tenantId', () => {
    const store = createOrganizationStore();
    expect(() =>
      store.upsert({
        organizationId: 'org-1',
        tenantId: '',
        name: 'Zero-tenant',
        plan: 'free',
      }),
    ).toThrowError(/tenantId required/);
  });

  it('T-DMT-002 listByTenant returns only rows whose tenantId matches', () => {
    const store = createOrganizationStore();
    store.upsert({ organizationId: 'a', tenantId: 't-a', name: 'A', plan: 'pro' });
    store.upsert({ organizationId: 'b', tenantId: 't-b', name: 'B', plan: 'pro' });
    store.upsert({ organizationId: 'c', tenantId: 't-a', name: 'C', plan: 'enterprise' });
    const aRows = store.listByTenant('t-a');
    expect(aRows.map((r) => r.organizationId).sort()).toEqual(['a', 'c']);
    const bRows = store.listByTenant('t-b');
    expect(bRows.map((r) => r.organizationId)).toEqual(['b']);
  });

  it('T-DMT-003 findById refuses to return a row owned by another tenant', () => {
    const store = createOrganizationStore();
    store.upsert({ organizationId: 'a', tenantId: 't-a', name: 'A', plan: 'pro' });
    expect(store.findById('a', 't-a')).toBeDefined();
    expect(store.findById('a', 't-b')).toBeUndefined();
  });

  it('T-DMT-004 mountPolicy transitions the RLS session to policy-installed', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    expect(gate.session.state).toBe('no-policy');
    gate.mountPolicy({ name: 'org_tenant_policy', tenantColumn: 'tenant_id' });
    expect(gate.session.state).toBe('policy-installed');
    expect(gate.session.policy?.name).toBe('org_tenant_policy');
  });

  it('T-DMT-005 assertRead / assertWrite emit rls.tenant-isolated + rls.audit-logged', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    gate.assertWrite('t-a');
    gate.assertRead('t-a');
    const events = gate.session.history.map((h) => h.neutralEvent);
    expect(events).toContain('rls.tenant-isolated');
    expect(events).toContain('rls.audit-logged');
    expect(gate.session.auditLog).toHaveLength(2);
  });

  it('T-DMT-006 tryCrossTenantRead refuses to run with matching tenant ids', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    expect(() => tryCrossTenantRead(gate, 't-a', 't-a')).toThrowError(
      /same tenantId/,
    );
  });

  it('T-DMT-007 tryCrossTenantRead returns CROSS_TENANT_REFUSED when acting != target', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    const err = tryCrossTenantRead(gate, 't-a', 't-b');
    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toMatch(/CROSS_TENANT_REFUSED/);
    // The refusal audit entry should be present with allowed=false.
    const refusalEntry = gate.session.auditLog.find(
      (e) => e.reason.startsWith('cross-tenant-refused'),
    );
    expect(refusalEntry).toBeDefined();
    expect(refusalEntry?.allowed).toBe(false);
  });
});
