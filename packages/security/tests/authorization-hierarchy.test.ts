import { describe, expect, it } from 'vitest';
import { createRbacPolicy, expandRoles, rbacAllows, evaluateAbac } from '../src/index.js';

describe('Authorization — Diamond hierarchy', () => {
  it('T-SEC-AZ-H-001 handles diamond parent hierarchy without duplication', () => {
    const policy = createRbacPolicy([
      { name: 'root', permissions: ['audit'] },
      { name: 'left', permissions: ['x'], parents: ['root'] },
      { name: 'right', permissions: ['y'], parents: ['root'] },
      { name: 'merged', permissions: ['z'], parents: ['left', 'right'] },
    ]);
    const perms = expandRoles(policy, { id: 'u1', roles: ['merged'] });
    expect(perms.has('audit')).toBe(true);
    expect(perms.has('x')).toBe(true);
    expect(perms.has('y')).toBe(true);
    expect(perms.has('z')).toBe(true);
  });

  it('T-SEC-AZ-H-002 orphaned subject role produces empty permissions', () => {
    const policy = createRbacPolicy([{ name: 'user', permissions: ['read'] }]);
    const perms = expandRoles(policy, { id: 'u1', roles: ['nonexistent'] });
    expect(perms.size).toBe(0);
  });

  it('T-SEC-AZ-H-003 nonexistent parent references are ignored', () => {
    const policy = createRbacPolicy([
      { name: 'user', permissions: ['read'], parents: ['nonexistent'] },
    ]);
    const perms = expandRoles(policy, { id: 'u1', roles: ['user'] });
    expect(perms.has('read')).toBe(true);
  });

  it('T-SEC-AZ-H-004 rbacAllows returns false for empty subject roles', () => {
    const policy = createRbacPolicy([{ name: 'admin', permissions: ['x'] }]);
    expect(rbacAllows(policy, { id: 'u1', roles: [] }, 'x')).toBe(false);
  });
});

describe('Authorization — ABAC combining algorithms', () => {
  it('T-SEC-AZ-C-001 deny-overrides with only permit matches returns permit', () => {
    const d = evaluateAbac(
      {
        rules: [
          { id: 'r1', effect: 'permit', condition: () => true },
          { id: 'r2', effect: 'permit', condition: () => true },
        ],
        algorithm: 'deny-overrides',
      },
      { subject: {}, resource: {}, action: '', environment: {} },
    );
    expect(d.effect).toBe('permit');
  });

  it('T-SEC-AZ-C-002 permit-overrides with only deny matches returns deny', () => {
    const d = evaluateAbac(
      {
        rules: [
          { id: 'r1', effect: 'deny', condition: () => true },
          { id: 'r2', effect: 'deny', condition: () => true },
        ],
        algorithm: 'permit-overrides',
      },
      { subject: {}, resource: {}, action: '', environment: {} },
    );
    expect(d.effect).toBe('deny');
  });

  it('T-SEC-AZ-C-003 first-applicable returns default deny when list empty', () => {
    const d = evaluateAbac(
      { rules: [], algorithm: 'first-applicable' },
      { subject: {}, resource: {}, action: '', environment: {} },
    );
    expect(d.effect).toBe('deny');
    expect(d.matchedRule).toBeNull();
  });

  it('T-SEC-AZ-C-004 environment attribute affects decision', () => {
    const d = evaluateAbac(
      {
        rules: [
          {
            id: 'r1',
            effect: 'permit',
            condition: (a) => (a.environment.hour as number) >= 9 && (a.environment.hour as number) <= 17,
          },
        ],
        algorithm: 'first-applicable',
      },
      { subject: {}, resource: {}, action: '', environment: { hour: 3 } },
    );
    expect(d.effect).toBe('deny');
  });

  it('T-SEC-AZ-C-005 resource attribute affects decision', () => {
    const d = evaluateAbac(
      {
        rules: [
          {
            id: 'r1',
            effect: 'permit',
            condition: (a) => a.resource.tier === 'public',
          },
        ],
        algorithm: 'first-applicable',
      },
      { subject: {}, resource: { tier: 'public' }, action: '', environment: {} },
    );
    expect(d.effect).toBe('permit');
  });
});
