import { describe, expect, it } from 'vitest';
import { createRlsRegistry } from '../src/supabase-advanced/rls.js';
import type { RlsPolicyContext } from '../src/supabase-advanced/types.js';

const AUTH_CTX: RlsPolicyContext = {
  role: 'authenticated',
  userId: 'u1',
  appMetadata: {},
  userMetadata: {},
  jwt: {},
};

const ANON_CTX: RlsPolicyContext = {
  role: 'anon',
  userId: undefined,
  appMetadata: {},
  userMetadata: {},
  jwt: {},
};

describe('supabase-advanced/rls defensive branches', () => {
  it('list returns all policies when table is undefined', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'p1',
      table: 't1',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    registry.define({
      name: 'p2',
      table: 't2',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    expect(registry.list()).toHaveLength(2);
  });

  it('list filters by table when specified', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'p1',
      table: 't1',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    registry.define({
      name: 'p2',
      table: 't2',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    expect(registry.list('t1')).toHaveLength(1);
    expect(registry.list('t1')[0]?.name).toBe('p1');
  });

  it('check with roles=[] (public policy) applies to anon', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'public-read',
      table: 't1',
      command: 'select',
      roles: [], // empty = TO PUBLIC, applies to every role
      using: () => true,
    });
    const outcome = registry.check(
      { table: 't1', command: 'select', accessToken: 'x', row: { a: 1 } },
      ANON_CTX,
    );
    expect(outcome.allowed).toBe(true);
  });

  it('check with roles=[authenticated] rejects anon', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'auth-only',
      table: 't1',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    const outcome = registry.check(
      { table: 't1', command: 'select', accessToken: 'x', row: { a: 1 } },
      ANON_CTX,
    );
    expect(outcome.allowed).toBe(false);
    expect(outcome.reason).toContain('no RLS policy grants');
  });

  it('service_role bypasses RLS entirely', () => {
    const registry = createRlsRegistry();
    const outcome = registry.check(
      { table: 't1', command: 'select', accessToken: 'x', row: { a: 1 } },
      { role: 'service_role', userId: 'sys', appMetadata: {}, userMetadata: {}, jwt: {} },
    );
    expect(outcome.allowed).toBe(true);
    expect(outcome.matchedPolicy).toContain('service_role');
  });

  it('drop is a no-op when name is not found', () => {
    const registry = createRlsRegistry();
    expect(() => registry.drop('t1', 'nonexistent')).not.toThrow();
  });

  it('define replaces existing policy in place (CREATE OR REPLACE)', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'p1',
      table: 't1',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    registry.define({
      name: 'p1',
      table: 't1',
      command: 'update',
      roles: ['authenticated'],
      using: () => false,
    });
    expect(registry.list('t1')).toHaveLength(1);
    expect(registry.list('t1')[0]?.command).toBe('update');
  });
});
