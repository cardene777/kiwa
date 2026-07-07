import { describe, expect, it } from 'vitest';
import {
  createRbacPolicy,
  evaluateAbac,
  evaluateCombined,
  expandRoles,
  rbacAllows,
  toAuthorizationEvent,
} from '../src/index.js';
import type { AbacRule } from '../src/index.js';

describe('Authorization — RBAC', () => {
  it('T-SEC-AZ-001 rbacAllows returns true for a directly assigned permission', () => {
    const policy = createRbacPolicy([
      { name: 'admin', permissions: ['read', 'write'] },
    ]);
    const subject = { id: 'u1', roles: ['admin'] };
    expect(rbacAllows(policy, subject, 'read')).toBe(true);
  });

  it('T-SEC-AZ-002 rbacAllows returns false when the permission is missing', () => {
    const policy = createRbacPolicy([
      { name: 'reader', permissions: ['read'] },
    ]);
    const subject = { id: 'u2', roles: ['reader'] };
    expect(rbacAllows(policy, subject, 'delete')).toBe(false);
  });

  it('T-SEC-AZ-003 expandRoles walks parent hierarchy', () => {
    const policy = createRbacPolicy([
      { name: 'writer', permissions: ['write'], parents: ['reader'] },
      { name: 'reader', permissions: ['read'] },
    ]);
    const perms = expandRoles(policy, { id: 'u3', roles: ['writer'] });
    expect(perms.has('write')).toBe(true);
    expect(perms.has('read')).toBe(true);
  });

  it('T-SEC-AZ-004 expandRoles handles multi-level hierarchy', () => {
    const policy = createRbacPolicy([
      { name: 'super', permissions: ['sudo'], parents: ['writer'] },
      { name: 'writer', permissions: ['write'], parents: ['reader'] },
      { name: 'reader', permissions: ['read'] },
    ]);
    const perms = expandRoles(policy, { id: 'u4', roles: ['super'] });
    expect(perms.has('sudo')).toBe(true);
    expect(perms.has('write')).toBe(true);
    expect(perms.has('read')).toBe(true);
  });

  it('T-SEC-AZ-005 createRbacPolicy throws on cycle detection', () => {
    expect(() =>
      createRbacPolicy([
        { name: 'a', permissions: [], parents: ['b'] },
        { name: 'b', permissions: [], parents: ['a'] },
      ]),
    ).toThrow(/cycle/);
  });

  it('T-SEC-AZ-006 handles a subject with multiple roles', () => {
    const policy = createRbacPolicy([
      { name: 'billing', permissions: ['refund'] },
      { name: 'support', permissions: ['view-ticket'] },
    ]);
    const perms = expandRoles(policy, { id: 'u5', roles: ['billing', 'support'] });
    expect(perms.has('refund')).toBe(true);
    expect(perms.has('view-ticket')).toBe(true);
  });
});

describe('Authorization — ABAC', () => {
  const rules: AbacRule[] = [
    {
      id: 'r-owner',
      effect: 'permit',
      condition: (attrs) => attrs.subject.id === attrs.resource.ownerId,
    },
    {
      id: 'r-locked',
      effect: 'deny',
      condition: (attrs) => attrs.resource.locked === true,
    },
    {
      id: 'r-hours',
      effect: 'deny',
      condition: (attrs) => attrs.environment.hour === 3,
    },
  ];

  it('T-SEC-AZ-007 evaluateAbac permits when the owner rule matches', () => {
    const d = evaluateAbac(
      { rules, algorithm: 'first-applicable' },
      {
        subject: { id: 'u1' },
        resource: { ownerId: 'u1', locked: false },
        action: 'edit',
        environment: { hour: 10 },
      },
    );
    expect(d.effect).toBe('permit');
    expect(d.matchedRule).toBe('r-owner');
  });

  it('T-SEC-AZ-008 evaluateAbac denies with deny-overrides when both permit and deny match', () => {
    const d = evaluateAbac(
      { rules, algorithm: 'deny-overrides' },
      {
        subject: { id: 'u1' },
        resource: { ownerId: 'u1', locked: true },
        action: 'edit',
        environment: { hour: 10 },
      },
    );
    expect(d.effect).toBe('deny');
    expect(d.matchedRule).toBe('r-locked');
  });

  it('T-SEC-AZ-009 evaluateAbac permits with permit-overrides when both permit and deny match', () => {
    const d = evaluateAbac(
      { rules, algorithm: 'permit-overrides' },
      {
        subject: { id: 'u1' },
        resource: { ownerId: 'u1', locked: true },
        action: 'edit',
        environment: { hour: 10 },
      },
    );
    expect(d.effect).toBe('permit');
    expect(d.matchedRule).toBe('r-owner');
  });

  it('T-SEC-AZ-010 evaluateAbac defaults to deny when no rule matches', () => {
    const d = evaluateAbac(
      { rules: [{ id: 'r-x', effect: 'permit', condition: () => false }], algorithm: 'first-applicable' },
      {
        subject: { id: 'u1' },
        resource: {},
        action: 'edit',
        environment: {},
      },
    );
    expect(d.effect).toBe('deny');
    expect(d.matchedRule).toBeNull();
  });

  it('T-SEC-AZ-011 evaluateAbac returns first-applicable in rule order', () => {
    const localRules: AbacRule[] = [
      { id: 'r1', effect: 'permit', condition: () => true },
      { id: 'r2', effect: 'deny', condition: () => true },
    ];
    const d = evaluateAbac(
      { rules: localRules, algorithm: 'first-applicable' },
      { subject: {}, resource: {}, action: '', environment: {} },
    );
    expect(d.effect).toBe('permit');
    expect(d.matchedRule).toBe('r1');
  });
});

describe('Authorization — Combined', () => {
  it('T-SEC-AZ-012 combined denies when rbac denies', () => {
    const rbac = createRbacPolicy([{ name: 'reader', permissions: ['read'] }]);
    const d = evaluateCombined({
      rbac: { policy: rbac, subject: { id: 'u1', roles: ['reader'] }, permission: 'write' },
    });
    expect(d.effect).toBe('deny');
    expect(d.matchedRule).toBe('rbac');
  });

  it('T-SEC-AZ-013 combined permits when rbac permits and no abac configured', () => {
    const rbac = createRbacPolicy([{ name: 'admin', permissions: ['write'] }]);
    const d = evaluateCombined({
      rbac: { policy: rbac, subject: { id: 'u1', roles: ['admin'] }, permission: 'write' },
    });
    expect(d.effect).toBe('permit');
  });

  it('T-SEC-AZ-014 combined uses abac when only abac configured', () => {
    const d = evaluateCombined({
      abac: {
        policy: {
          rules: [{ id: 'r1', effect: 'permit', condition: () => true }],
          algorithm: 'first-applicable',
        },
        attrs: { subject: {}, resource: {}, action: '', environment: {} },
      },
    });
    expect(d.effect).toBe('permit');
  });

  it('T-SEC-AZ-015 combined defaults to deny when neither configured', () => {
    const d = evaluateCombined({});
    expect(d.effect).toBe('deny');
  });
});

describe('Authorization — toAuthorizationEvent', () => {
  it('T-SEC-AZ-016 emits an allow event for a permit decision', () => {
    const ev = toAuthorizationEvent({
      provider: 'casbin',
      decision: { effect: 'permit', matchedRule: 'r1', reason: 'ok' },
      subject: 'u1',
      action: 'read',
      timestamp: 42,
    });
    expect(ev.axis).toBe('authorization');
    expect(ev.verdict).toBe('allow');
    expect(ev.timestamp).toBe(42);
  });

  it('T-SEC-AZ-017 emits a deny event for a deny decision', () => {
    const ev = toAuthorizationEvent({
      provider: 'casbin',
      decision: { effect: 'deny', matchedRule: null, reason: 'blocked' },
      subject: 'u2',
      action: 'delete',
      timestamp: 43,
    });
    expect(ev.verdict).toBe('deny');
  });
});
