/**
 * `/rbac` HTTP handler — RBAC role hierarchy + permission check ops the
 * runtime exposes to the rbac surface. The route is intentionally shape-
 * neutral — the fidelity harness feeds plain objects in and asserts on
 * plain objects out, so the same test can exercise mock and real without
 * spinning up a policy store.
 *
 * The rbac surface pairs the parent v1.37-1 `authorization` axis (RBAC +
 * role hierarchy + expansion + rbacAllows) with `@kiwa-lab/security`
 * v0.1 — every op has a neutral event counterpart the fidelity harness
 * can compare across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type RbacOpKind = 'attach' | 'expand' | 'check';

export interface RbacRequest {
  kind: RbacOpKind;
  policyId: string;
  subjectId?: string;
  roles?: string[];
  permission?: string;
  role?: {
    name: string;
    permissions: string[];
    parents?: string[];
  };
}

export interface RbacResponse {
  ok: boolean;
  kind: RbacOpKind;
  policyId: string;
  subjectId?: string;
  allowed?: boolean;
  permissions?: string[];
  rolesVisited?: string[];
  errorKind?: string;
}

export function validateRbacRequest(
  body: unknown,
): { ok: true; value: RbacRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['policyId'] !== 'string' || !b['policyId']) {
    return { ok: false, errorKind: 'policyId_required' };
  }
  if (b['kind'] !== 'attach' && b['kind'] !== 'expand' && b['kind'] !== 'check') {
    return { ok: false, errorKind: 'kind_must_be_attach_expand_or_check' };
  }
  const value: RbacRequest = {
    kind: b['kind'],
    policyId: b['policyId'],
  };
  if (b['kind'] === 'attach') {
    if (!b['role'] || typeof b['role'] !== 'object') {
      return { ok: false, errorKind: 'role_required' };
    }
    const r = b['role'] as Record<string, unknown>;
    if (typeof r['name'] !== 'string' || !r['name']) {
      return { ok: false, errorKind: 'role_name_required' };
    }
    if (!Array.isArray(r['permissions'])) {
      return { ok: false, errorKind: 'role_permissions_required' };
    }
    const permissions = (r['permissions'] as unknown[]).filter(
      (p): p is string => typeof p === 'string',
    );
    const role: NonNullable<RbacRequest['role']> = {
      name: r['name'],
      permissions,
    };
    if (Array.isArray(r['parents'])) {
      role.parents = (r['parents'] as unknown[]).filter(
        (p): p is string => typeof p === 'string',
      );
    }
    value.role = role;
    return { ok: true, value };
  }
  if (typeof b['subjectId'] !== 'string' || !b['subjectId']) {
    return { ok: false, errorKind: 'subjectId_required' };
  }
  if (!Array.isArray(b['roles'])) {
    return { ok: false, errorKind: 'roles_required' };
  }
  value.subjectId = b['subjectId'];
  value.roles = (b['roles'] as unknown[]).filter(
    (r): r is string => typeof r === 'string',
  );
  if (b['kind'] === 'check') {
    if (typeof b['permission'] !== 'string' || !b['permission']) {
      return { ok: false, errorKind: 'permission_required' };
    }
    value.permission = b['permission'];
  }
  return { ok: true, value };
}

export async function handleRbacRequest(
  adapter: SecurityAdapter,
  req: RbacRequest,
): Promise<RbacResponse> {
  try {
    if (req.kind === 'attach') {
      const roleInput: Parameters<SecurityAdapter['attachRole']>[0] = {
        policyId: req.policyId,
        name: req.role!.name,
        permissions: req.role!.permissions,
      };
      if (req.role!.parents !== undefined) {
        roleInput.parents = req.role!.parents;
      }
      await adapter.attachRole(roleInput);
      return { ok: true, kind: 'attach', policyId: req.policyId };
    }
    if (req.kind === 'expand') {
      const result = await adapter.expandRoles({
        policyId: req.policyId,
        subjectId: req.subjectId!,
        roles: req.roles!,
      });
      return {
        ok: true,
        kind: 'expand',
        policyId: result.policyId,
        subjectId: result.subjectId,
        permissions: result.permissions,
        rolesVisited: result.rolesVisited,
      };
    }
    const result = await adapter.checkPermission({
      policyId: req.policyId,
      subjectId: req.subjectId!,
      roles: req.roles!,
      permission: req.permission!,
    });
    return {
      ok: true,
      kind: 'check',
      policyId: result.policyId,
      subjectId: result.subjectId,
      allowed: result.allowed,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      policyId: req.policyId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
