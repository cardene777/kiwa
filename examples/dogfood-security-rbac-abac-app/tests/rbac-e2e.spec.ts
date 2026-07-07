/**
 * RBAC end-to-end fidelity spec (rbac axis: role hierarchy + subject
 * expansion + permission check).
 *
 * Sub-Issue CAR-827 (v1.37-3) AC — the mock adapter drives a full RBAC
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. attachRole grows the policy's role set with the given permissions.
 *  2. attachRole supports parent role links so permissions inherit
 *     through the parent hierarchy.
 *  3. expandRoles walks the hierarchy transitively and returns the union
 *     of permissions.
 *  4. checkPermission returns true iff the transitive union contains the
 *     requested permission.
 *  5. attachRole detects cycles (a → b → a) at policy build time.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_AUTHZ_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleRbacRequest,
  validateRbacRequest,
} from '../src/app/rbac/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — RBAC role attach', () => {
  it('axis 1: attachRole records permissions on a fresh policy', async () => {
    await mock.startRbac({ policyId: 'p1' });
    await mock.attachRole({
      policyId: 'p1',
      name: 'viewer',
      permissions: ['post:read'],
    });
    const trace = mock.traces().find((t) => t.op === 'attachRole');
    expect(trace?.ok).toBe(true);
    expect((trace?.detail as { name?: string })?.name).toBe('viewer');
  });

  it('axis 1: attachRole with parents attaches inheritance chain', async () => {
    await mock.startRbac({ policyId: 'p2' });
    await mock.attachRole({
      policyId: 'p2',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.attachRole({
      policyId: 'p2',
      name: 'editor',
      permissions: ['post:write'],
      parents: ['viewer'],
    });
    const trace = mock
      .traces()
      .filter((t) => t.op === 'attachRole' && t.ok);
    expect(trace.length).toBe(2);
    const editorTrace = trace.find(
      (t) => (t.detail as { name?: string })?.name === 'editor',
    );
    expect(
      (editorTrace?.detail as { parents?: string[] })?.parents,
    ).toEqual(['viewer']);
  });

  it('axis 1: attachRole rejects duplicate role name', async () => {
    await mock.startRbac({ policyId: 'p3' });
    await mock.attachRole({
      policyId: 'p3',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await expect(
      mock.attachRole({
        policyId: 'p3',
        name: 'viewer',
        permissions: ['post:write'],
      }),
    ).rejects.toThrow(/rbac_role_duplicate/);
  });

  it('axis 1: attachRole without startRbac fails', async () => {
    await expect(
      mock.attachRole({
        policyId: 'missing',
        name: 'viewer',
        permissions: ['post:read'],
      }),
    ).rejects.toThrow(/rbac_session_missing/);
  });

  it('axis 1: attachRole after closeRbac fails', async () => {
    await mock.startRbac({ policyId: 'p4' });
    await mock.closeRbac({ policyId: 'p4' });
    await expect(
      mock.attachRole({
        policyId: 'p4',
        name: 'viewer',
        permissions: ['post:read'],
      }),
    ).rejects.toThrow(/rbac_session_closed/);
  });
});

describe('mock adapter — RBAC role hierarchy expansion', () => {
  it('axis 2: expandRoles returns union of directly-assigned permissions', async () => {
    await mock.startRbac({ policyId: 'e1' });
    await mock.attachRole({
      policyId: 'e1',
      name: 'viewer',
      permissions: ['post:read'],
    });
    const result = await mock.expandRoles({
      policyId: 'e1',
      subjectId: 'alice',
      roles: ['viewer'],
    });
    expect(result.permissions).toContain('post:read');
    expect(result.rolesVisited).toContain('viewer');
  });

  it('axis 2: expandRoles inherits permissions from parent role', async () => {
    await mock.startRbac({ policyId: 'e2' });
    await mock.attachRole({
      policyId: 'e2',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.attachRole({
      policyId: 'e2',
      name: 'editor',
      permissions: ['post:write'],
      parents: ['viewer'],
    });
    const result = await mock.expandRoles({
      policyId: 'e2',
      subjectId: 'bob',
      roles: ['editor'],
    });
    expect(result.permissions).toContain('post:read');
    expect(result.permissions).toContain('post:write');
    expect(result.rolesVisited).toEqual(
      expect.arrayContaining(['editor', 'viewer']),
    );
  });

  it('axis 2: expandRoles handles 3-level hierarchy (viewer → editor → admin)', async () => {
    await mock.startRbac({ policyId: 'e3' });
    await mock.attachRole({
      policyId: 'e3',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.attachRole({
      policyId: 'e3',
      name: 'editor',
      permissions: ['post:write'],
      parents: ['viewer'],
    });
    await mock.attachRole({
      policyId: 'e3',
      name: 'admin',
      permissions: ['post:delete'],
      parents: ['editor'],
    });
    const result = await mock.expandRoles({
      policyId: 'e3',
      subjectId: 'carol',
      roles: ['admin'],
    });
    expect(result.permissions).toContain('post:read');
    expect(result.permissions).toContain('post:write');
    expect(result.permissions).toContain('post:delete');
    expect(result.rolesVisited.length).toBe(3);
  });

  it('axis 2: expandRoles with multiple assigned roles unions their permissions', async () => {
    await mock.startRbac({ policyId: 'e4' });
    await mock.attachRole({
      policyId: 'e4',
      name: 'writer',
      permissions: ['post:write'],
    });
    await mock.attachRole({
      policyId: 'e4',
      name: 'reader',
      permissions: ['post:read'],
    });
    const result = await mock.expandRoles({
      policyId: 'e4',
      subjectId: 'dave',
      roles: ['writer', 'reader'],
    });
    expect(result.permissions).toContain('post:read');
    expect(result.permissions).toContain('post:write');
  });

  it('axis 2: expandRoles with an unknown role name returns empty', async () => {
    await mock.startRbac({ policyId: 'e5' });
    const result = await mock.expandRoles({
      policyId: 'e5',
      subjectId: 'eve',
      roles: ['ghost'],
    });
    expect(result.permissions).toHaveLength(0);
  });

  it('axis 2: expandRoles trace records subjectId and permission count', async () => {
    await mock.startRbac({ policyId: 'e6' });
    await mock.attachRole({
      policyId: 'e6',
      name: 'viewer',
      permissions: ['post:read', 'post:list'],
    });
    await mock.expandRoles({
      policyId: 'e6',
      subjectId: 'frank',
      roles: ['viewer'],
    });
    const trace = mock.traces().find((t) => t.op === 'expandRoles');
    expect(
      (trace?.detail as { subjectId?: string })?.subjectId,
    ).toBe('frank');
    expect(
      (trace?.detail as { permissionCount?: number })?.permissionCount,
    ).toBe(2);
  });
});

describe('mock adapter — RBAC permission check', () => {
  it('axis 3: checkPermission returns true for granted permission', async () => {
    await mock.startRbac({ policyId: 'c1' });
    await mock.attachRole({
      policyId: 'c1',
      name: 'viewer',
      permissions: ['post:read'],
    });
    const result = await mock.checkPermission({
      policyId: 'c1',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    expect(result.allowed).toBe(true);
  });

  it('axis 3: checkPermission returns false for missing permission', async () => {
    await mock.startRbac({ policyId: 'c2' });
    await mock.attachRole({
      policyId: 'c2',
      name: 'viewer',
      permissions: ['post:read'],
    });
    const result = await mock.checkPermission({
      policyId: 'c2',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:write',
    });
    expect(result.allowed).toBe(false);
  });

  it('axis 3: checkPermission inherits through parent role', async () => {
    await mock.startRbac({ policyId: 'c3' });
    await mock.attachRole({
      policyId: 'c3',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.attachRole({
      policyId: 'c3',
      name: 'editor',
      permissions: ['post:write'],
      parents: ['viewer'],
    });
    const result = await mock.checkPermission({
      policyId: 'c3',
      subjectId: 'bob',
      roles: ['editor'],
      permission: 'post:read',
    });
    expect(result.allowed).toBe(true);
  });

  it('axis 3: checkPermission on empty policy returns false', async () => {
    await mock.startRbac({ policyId: 'c4' });
    const result = await mock.checkPermission({
      policyId: 'c4',
      subjectId: 'nobody',
      roles: [],
      permission: 'anything',
    });
    expect(result.allowed).toBe(false);
  });

  it('axis 3: checkPermission trace records allowed verdict', async () => {
    await mock.startRbac({ policyId: 'c5' });
    await mock.attachRole({
      policyId: 'c5',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.checkPermission({
      policyId: 'c5',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    const trace = mock.traces().find((t) => t.op === 'checkPermission');
    expect((trace?.detail as { allowed?: boolean })?.allowed).toBe(true);
  });
});

describe('mock adapter — RBAC cycle detection + isolation', () => {
  it('axis 4: expandRoles detects cycle at policy build time', async () => {
    await mock.startRbac({ policyId: 'cy1' });
    await mock.attachRole({
      policyId: 'cy1',
      name: 'a',
      permissions: [],
      parents: ['b'],
    });
    await mock.attachRole({
      policyId: 'cy1',
      name: 'b',
      permissions: [],
      parents: ['a'],
    });
    await expect(
      mock.expandRoles({
        policyId: 'cy1',
        subjectId: 'x',
        roles: ['a'],
      }),
    ).rejects.toThrow(/cycle detected/);
  });

  it('axis 4: separate policyIds do not leak roles', async () => {
    await mock.startRbac({ policyId: 'A' });
    await mock.startRbac({ policyId: 'B' });
    await mock.attachRole({
      policyId: 'A',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.attachRole({
      policyId: 'B',
      name: 'admin',
      permissions: ['post:delete'],
    });
    const inA = await mock.checkPermission({
      policyId: 'A',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    const inB = await mock.checkPermission({
      policyId: 'B',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    expect(inA.allowed).toBe(true);
    expect(inB.allowed).toBe(false);
  });

  it('axis 4: trace order matches lifecycle (start → attach → check → close)', async () => {
    await mock.startRbac({ policyId: 'ord1' });
    await mock.attachRole({
      policyId: 'ord1',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.checkPermission({
      policyId: 'ord1',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    await mock.closeRbac({ policyId: 'ord1' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startRbac',
      'attachRole',
      'checkPermission',
      'closeRbac',
    ]);
  });
});

describe('RBAC route handler — validation', () => {
  it('validateRbacRequest requires policyId', () => {
    const res = validateRbacRequest({ kind: 'attach' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('policyId_required');
  });

  it('validateRbacRequest requires kind in {attach, expand, check}', () => {
    const res = validateRbacRequest({ kind: 'other', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errorKind).toBe('kind_must_be_attach_expand_or_check');
  });

  it('validateRbacRequest attach requires role object', () => {
    const res = validateRbacRequest({ kind: 'attach', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('role_required');
  });

  it('validateRbacRequest attach requires role.name', () => {
    const res = validateRbacRequest({
      kind: 'attach',
      policyId: 'p',
      role: { permissions: [] },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('role_name_required');
  });

  it('validateRbacRequest check requires permission', () => {
    const res = validateRbacRequest({
      kind: 'check',
      policyId: 'p',
      subjectId: 's',
      roles: ['viewer'],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('permission_required');
  });

  it('validateRbacRequest expand requires subjectId', () => {
    const res = validateRbacRequest({
      kind: 'expand',
      policyId: 'p',
      roles: ['viewer'],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('subjectId_required');
  });

  it('handleRbacRequest attach then check returns allowed=true', async () => {
    await mock.startRbac({ policyId: 'r1' });
    const attach = await handleRbacRequest(mock, {
      kind: 'attach',
      policyId: 'r1',
      role: { name: 'viewer', permissions: ['post:read'] },
    });
    expect(attach.ok).toBe(true);
    const check = await handleRbacRequest(mock, {
      kind: 'check',
      policyId: 'r1',
      subjectId: 'alice',
      roles: ['viewer'],
      permission: 'post:read',
    });
    expect(check.ok).toBe(true);
    expect(check.allowed).toBe(true);
  });

  it('handleRbacRequest reports errorKind on adapter throw', async () => {
    const result = await handleRbacRequest(mock, {
      kind: 'check',
      policyId: 'missing',
      subjectId: 's',
      roles: [],
      permission: 'x',
    });
    expect(result.ok).toBe(false);
    expect(result.errorKind).toBe('rbac_session_missing');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports KIWA_AUTHZ_ENV_MISSING by default', () => {
    const previousMode = process.env['KIWA_MODE'];
    const previousReady = process.env['AUTHZ_STORE_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['AUTHZ_STORE_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_AUTHZ_ENV_MISSING');
    } finally {
      if (previousMode !== undefined) process.env['KIWA_MODE'] = previousMode;
      if (previousReady !== undefined)
        process.env['AUTHZ_STORE_READY'] = previousReady;
    }
  });

  it('detectRealEnvMissing returns KIWA_POLICY_STORE_URL_MISSING when store URL absent', () => {
    const previousReady = process.env['AUTHZ_STORE_READY'];
    const previousUrl = process.env['KIWA_POLICY_STORE_URL'];
    process.env['AUTHZ_STORE_READY'] = '1';
    delete process.env['KIWA_POLICY_STORE_URL'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_POLICY_STORE_URL_MISSING');
    } finally {
      if (previousReady === undefined) {
        delete process.env['AUTHZ_STORE_READY'];
      } else {
        process.env['AUTHZ_STORE_READY'] = previousReady;
      }
      if (previousUrl !== undefined) {
        process.env['KIWA_POLICY_STORE_URL'] = previousUrl;
      }
    }
  });

  it('detectRealEnvMissing returns null when both keys are set', () => {
    const previousReady = process.env['AUTHZ_STORE_READY'];
    const previousUrl = process.env['KIWA_POLICY_STORE_URL'];
    process.env['AUTHZ_STORE_READY'] = '1';
    process.env['KIWA_POLICY_STORE_URL'] = 'postgres://policy';
    try {
      expect(detectRealEnvMissing()).toBeNull();
    } finally {
      if (previousReady === undefined) {
        delete process.env['AUTHZ_STORE_READY'];
      } else {
        process.env['AUTHZ_STORE_READY'] = previousReady;
      }
      if (previousUrl === undefined) {
        delete process.env['KIWA_POLICY_STORE_URL'];
      } else {
        process.env['KIWA_POLICY_STORE_URL'] = previousUrl;
      }
    }
  });

  it('real adapter refuses every op with KIWA_AUTHZ_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(real.startRbac({ policyId: 'p' })).rejects.toThrow(
      /KIWA_AUTHZ_ENV_MISSING/,
    );
    const trace = real.traces().find((t) => t.op === 'startRbac' && !t.ok);
    expect(trace?.errorKind).toBe('KIWA_AUTHZ_ENV_MISSING');
  });
});
