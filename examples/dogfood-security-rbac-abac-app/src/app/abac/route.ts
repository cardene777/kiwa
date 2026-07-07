/**
 * `/abac` HTTP handler — ABAC attribute matching + combining algorithm
 * ops the runtime exposes to the abac surface. Maps request bodies to
 * the neutral 4-attribute shape (subject / resource / action /
 * environment) the adapter drives.
 */

import type {
  AbacRuleInput,
  SecurityAdapter,
} from '../../adapters/interface.js';

export type AbacOpKind = 'attach' | 'evaluate' | 'combined';

export interface AbacRequest {
  kind: AbacOpKind;
  policyId: string;
  rule?: AbacRuleInput;
  attrs?: {
    subject: Record<string, unknown>;
    resource: Record<string, unknown>;
    action: string;
    environment: Record<string, unknown>;
  };
  rbac?: {
    subjectId: string;
    roles: string[];
    permission: string;
  };
}

export interface AbacResponse {
  ok: boolean;
  kind: AbacOpKind;
  policyId: string;
  effect?: 'permit' | 'deny';
  matchedRule?: string | null;
  reason?: string;
  errorKind?: string;
}

export function validateAbacRequest(
  body: unknown,
): { ok: true; value: AbacRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['policyId'] !== 'string' || !b['policyId']) {
    return { ok: false, errorKind: 'policyId_required' };
  }
  if (
    b['kind'] !== 'attach' &&
    b['kind'] !== 'evaluate' &&
    b['kind'] !== 'combined'
  ) {
    return { ok: false, errorKind: 'kind_must_be_attach_evaluate_or_combined' };
  }
  const value: AbacRequest = {
    kind: b['kind'],
    policyId: b['policyId'],
  };
  if (b['kind'] === 'attach') {
    if (!b['rule'] || typeof b['rule'] !== 'object') {
      return { ok: false, errorKind: 'rule_required' };
    }
    const r = b['rule'] as Record<string, unknown>;
    if (typeof r['id'] !== 'string' || !r['id']) {
      return { ok: false, errorKind: 'rule_id_required' };
    }
    if (r['effect'] !== 'permit' && r['effect'] !== 'deny') {
      return { ok: false, errorKind: 'rule_effect_must_be_permit_or_deny' };
    }
    if (!r['when'] || typeof r['when'] !== 'object') {
      return { ok: false, errorKind: 'rule_when_required' };
    }
    value.rule = {
      id: r['id'],
      effect: r['effect'],
      when: r['when'] as AbacRuleInput['when'],
    };
    return { ok: true, value };
  }
  if (b['kind'] === 'evaluate') {
    if (!b['attrs'] || typeof b['attrs'] !== 'object') {
      return { ok: false, errorKind: 'attrs_required' };
    }
    const a = b['attrs'] as Record<string, unknown>;
    if (typeof a['action'] !== 'string' || !a['action']) {
      return { ok: false, errorKind: 'attrs_action_required' };
    }
    value.attrs = {
      subject: (a['subject'] as Record<string, unknown>) ?? {},
      resource: (a['resource'] as Record<string, unknown>) ?? {},
      action: a['action'],
      environment: (a['environment'] as Record<string, unknown>) ?? {},
    };
    return { ok: true, value };
  }
  // combined
  if (b['attrs'] && typeof b['attrs'] === 'object') {
    const a = b['attrs'] as Record<string, unknown>;
    if (typeof a['action'] === 'string') {
      value.attrs = {
        subject: (a['subject'] as Record<string, unknown>) ?? {},
        resource: (a['resource'] as Record<string, unknown>) ?? {},
        action: a['action'],
        environment: (a['environment'] as Record<string, unknown>) ?? {},
      };
    }
  }
  if (b['rbac'] && typeof b['rbac'] === 'object') {
    const r = b['rbac'] as Record<string, unknown>;
    if (
      typeof r['subjectId'] === 'string' &&
      Array.isArray(r['roles']) &&
      typeof r['permission'] === 'string'
    ) {
      value.rbac = {
        subjectId: r['subjectId'],
        roles: (r['roles'] as unknown[]).filter(
          (x): x is string => typeof x === 'string',
        ),
        permission: r['permission'],
      };
    }
  }
  if (!value.attrs && !value.rbac) {
    return { ok: false, errorKind: 'combined_requires_attrs_or_rbac' };
  }
  return { ok: true, value };
}

export async function handleAbacRequest(
  adapter: SecurityAdapter,
  req: AbacRequest,
): Promise<AbacResponse> {
  try {
    if (req.kind === 'attach') {
      await adapter.attachRule({
        policyId: req.policyId,
        rule: req.rule!,
      });
      return { ok: true, kind: 'attach', policyId: req.policyId };
    }
    if (req.kind === 'evaluate') {
      const result = await adapter.evaluateAbac({
        policyId: req.policyId,
        subject: req.attrs!.subject,
        resource: req.attrs!.resource,
        action: req.attrs!.action,
        environment: req.attrs!.environment,
      });
      return {
        ok: true,
        kind: 'evaluate',
        policyId: result.policyId,
        effect: result.effect,
        matchedRule: result.matchedRule,
        reason: result.reason,
      };
    }
    const combinedInput: Parameters<SecurityAdapter['evaluateCombined']>[0] = {
      policyId: req.policyId,
    };
    if (req.rbac) {
      combinedInput.rbac = req.rbac;
    }
    if (req.attrs) {
      combinedInput.abac = {
        subject: req.attrs.subject,
        resource: req.attrs.resource,
        action: req.attrs.action,
        environment: req.attrs.environment,
      };
    }
    const result = await adapter.evaluateCombined(combinedInput);
    return {
      ok: true,
      kind: 'combined',
      policyId: result.policyId,
      effect: result.effect,
      matchedRule: result.matchedRule,
      reason: result.reason,
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
