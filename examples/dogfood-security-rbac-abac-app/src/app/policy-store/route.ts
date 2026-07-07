/**
 * `/policy-store` HTTP handler — policy versioning + activation +
 * rollback ops the runtime exposes to the policy-store surface. Maps
 * request bodies to the version-oriented adapter contract so the same
 * spec exercises mock and real without embedding store-specific SQL.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type PolicyStoreOpKind = 'publish' | 'activate' | 'rollback';

export interface PolicyStoreRequest {
  kind: PolicyStoreOpKind;
  policyId: string;
  body?: string;
  activateOnPublish?: boolean;
  version?: number;
  toVersion?: number;
}

export interface PolicyStoreResponse {
  ok: boolean;
  kind: PolicyStoreOpKind;
  policyId: string;
  version?: number;
  activeVersion?: number;
  rolledBackFrom?: number;
  rolledBackTo?: number;
  errorKind?: string;
}

export function validatePolicyStoreRequest(
  body: unknown,
):
  | { ok: true; value: PolicyStoreRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['policyId'] !== 'string' || !b['policyId']) {
    return { ok: false, errorKind: 'policyId_required' };
  }
  if (
    b['kind'] !== 'publish' &&
    b['kind'] !== 'activate' &&
    b['kind'] !== 'rollback'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_publish_activate_or_rollback',
    };
  }
  const value: PolicyStoreRequest = {
    kind: b['kind'],
    policyId: b['policyId'],
  };
  if (b['kind'] === 'publish') {
    if (typeof b['body'] !== 'string' || !b['body']) {
      return { ok: false, errorKind: 'body_required' };
    }
    value.body = b['body'];
    value.activateOnPublish = b['activateOnPublish'] === true;
    return { ok: true, value };
  }
  if (b['kind'] === 'activate') {
    if (typeof b['version'] !== 'number' || !Number.isInteger(b['version'])) {
      return { ok: false, errorKind: 'version_required' };
    }
    value.version = b['version'];
    return { ok: true, value };
  }
  if (
    typeof b['toVersion'] !== 'number' ||
    !Number.isInteger(b['toVersion'])
  ) {
    return { ok: false, errorKind: 'toVersion_required' };
  }
  value.toVersion = b['toVersion'];
  return { ok: true, value };
}

export async function handlePolicyStoreRequest(
  adapter: SecurityAdapter,
  req: PolicyStoreRequest,
): Promise<PolicyStoreResponse> {
  try {
    if (req.kind === 'publish') {
      const result = await adapter.publishPolicy({
        policyId: req.policyId,
        body: req.body!,
        activateOnPublish: req.activateOnPublish ?? false,
      });
      return {
        ok: true,
        kind: 'publish',
        policyId: result.policyId,
        version: result.version,
        activeVersion: result.activeVersion,
      };
    }
    if (req.kind === 'activate') {
      const result = await adapter.activatePolicy({
        policyId: req.policyId,
        version: req.version!,
      });
      return {
        ok: true,
        kind: 'activate',
        policyId: result.policyId,
        version: result.version,
        activeVersion: result.activeVersion,
      };
    }
    const result = await adapter.rollbackPolicy({
      policyId: req.policyId,
      toVersion: req.toVersion!,
    });
    return {
      ok: true,
      kind: 'rollback',
      policyId: result.policyId,
      rolledBackFrom: result.rolledBackFrom,
      rolledBackTo: result.rolledBackTo,
      activeVersion: result.activeVersion,
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
