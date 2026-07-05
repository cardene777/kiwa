import { describe, expect, it } from 'vitest';
import { createRlsGate, tryCrossTenantRead } from '../src/rls/index.js';
import { createAuditLog, drainSessionAudit } from '../src/audit/index.js';

describe('bypass_rls role — support-mode window + audit trail', () => {
  it('T-DMB-001 withBypass toggles session to bypassed then re-arms after callback', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    expect(gate.session.state).toBe('policy-installed');
    let insideState: string | null = null;
    gate.withBypass({ roleId: 'support-1', reason: 'incident-42' }, () => {
      insideState = gate.session.state;
    });
    expect(insideState).toBe('bypassed');
    // After the callback, the next read on the gate re-arms the policy.
    gate.assertRead('tenant-a');
    expect(gate.session.state).toBe('policy-installed');
  });

  it('T-DMB-002 withBypass pairs open + close audit entries in the trail', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    gate.withBypass({ roleId: 'support-1', reason: 'incident-42' }, () => {
      // no-op
    });
    const reasons = gate.session.auditLog.map((e) => e.reason);
    expect(reasons.some((r) => r.startsWith('bypass-open:support-1'))).toBe(true);
    expect(reasons.some((r) => r.startsWith('bypass-close:support-1'))).toBe(true);
  });

  it('T-DMB-003 tryCrossTenantRead inside a bypass window returns null (bypass skip)', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    let result: Error | null = new Error('sentinel');
    gate.withBypass({ roleId: 'support-1', reason: 'incident-42' }, () => {
      result = tryCrossTenantRead(gate, 'tenant-a', 'tenant-b');
    });
    expect(result).toBeNull();
    // Bypass window consumed the read event so the neutral event log carries it.
    const readIsolationEvents = gate.session.history.filter(
      (h) => h.neutralEvent === 'rls.tenant-isolated',
    );
    expect(readIsolationEvents.length).toBeGreaterThan(0);
  });

  it('T-DMB-004 audit log drain preserves bypass entries into the tamper chain', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    gate.mountPolicy({ name: 'p', tenantColumn: 'tenant_id' });
    const log = createAuditLog();
    gate.withBypass({ roleId: 'support-x', reason: 'q1-audit' }, () => {
      gate.session.auditLog.push({
        tenantId: 'tenant-a',
        operation: 'write',
        allowed: true,
        reason: 'bypass-op:support-x',
      });
    });
    drainSessionAudit(gate.session, log);
    const snapshot = log.snapshot();
    // open + inner op + close = 3 records minimum.
    expect(snapshot.length).toBeGreaterThanOrEqual(3);
    const reasons = snapshot.map((r) => r.reason);
    expect(reasons.some((r) => r.startsWith('bypass-open:support-x'))).toBe(true);
    expect(reasons.some((r) => r.startsWith('bypass-op:support-x'))).toBe(true);
    expect(reasons.some((r) => r.startsWith('bypass-close:support-x'))).toBe(true);
  });

  it('T-DMB-005 mountPolicy is required before withBypass', () => {
    const gate = createRlsGate({
      tableId: 'organizations',
      provider: 'prisma',
      backend: 'mysql',
    });
    expect(() =>
      gate.withBypass({ roleId: 'support-1', reason: 'no-mount' }, () => undefined),
    ).toThrowError(/no policy mounted/);
  });
});
