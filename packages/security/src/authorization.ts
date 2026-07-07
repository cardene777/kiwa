/**
 * Axis 3 — Authorization policy engine。
 *
 * 4 sub-axis ...
 * - RBAC (Role-Based Access Control、 subject -> roles -> permissions)
 * - ABAC (Attribute-Based Access Control、 policy expression w/ subject/resource/action/environment attrs)
 * - role hierarchy (parent -> child role expansion、 permission inheritance)
 * - policy engine (rule combining、 evaluator、 default deny)
 */

import type { SecurityEvent } from './types.js';

export interface RbacRole {
  name: string;
  permissions: string[];
  /** parent roles — permissions を継承する上位 role 名。 */
  parents?: string[];
}

export interface RbacSubject {
  id: string;
  roles: string[];
}

export interface RbacPolicy {
  roles: Map<string, RbacRole>;
}

export function createRbacPolicy(roles: RbacRole[]): RbacPolicy {
  const map = new Map<string, RbacRole>();
  for (const role of roles) {
    map.set(role.name, role);
  }
  // Detect cycles (BFS) — cycle detected we still store but throw at expansion time.
  for (const role of roles) {
    detectCycle(role.name, map, new Set());
  }
  return { roles: map };
}

function detectCycle(name: string, roles: Map<string, RbacRole>, visited: Set<string>): void {
  if (visited.has(name)) {
    throw new Error(`rbac: role hierarchy cycle detected at "${name}"`);
  }
  visited.add(name);
  const role = roles.get(name);
  if (!role) return;
  for (const parent of role.parents ?? []) {
    detectCycle(parent, roles, new Set(visited));
  }
}

/**
 * Given a subject, expand its assigned roles through the parent hierarchy
 * and collect the transitive permission set. Used by the RBAC evaluator.
 */
export function expandRoles(policy: RbacPolicy, subject: RbacSubject): Set<string> {
  const perms = new Set<string>();
  const walk = (roleName: string, seen: Set<string>): void => {
    if (seen.has(roleName)) return;
    seen.add(roleName);
    const role = policy.roles.get(roleName);
    if (!role) return;
    for (const p of role.permissions) perms.add(p);
    for (const parent of role.parents ?? []) {
      walk(parent, seen);
    }
  };
  for (const r of subject.roles) {
    walk(r, new Set());
  }
  return perms;
}

export function rbacAllows(
  policy: RbacPolicy,
  subject: RbacSubject,
  permission: string,
): boolean {
  return expandRoles(policy, subject).has(permission);
}

/** ABAC — subject / resource / action / environment 4 属性 + expression evaluator。 */
export interface AbacAttributes {
  subject: Record<string, unknown>;
  resource: Record<string, unknown>;
  action: string;
  environment: Record<string, unknown>;
}

export type AbacRuleEffect = 'permit' | 'deny';

export interface AbacRule {
  id: string;
  effect: AbacRuleEffect;
  /** Predicate against the 4 attribute buckets. */
  condition: (attrs: AbacAttributes) => boolean;
}

/**
 * Rule combining algorithms follow XACML naming:
 * - deny-overrides: any DENY wins
 * - permit-overrides: any PERMIT wins
 * - first-applicable: return the first rule that matches (default deny after)
 */
export type AbacCombiningAlgo = 'deny-overrides' | 'permit-overrides' | 'first-applicable';

export interface AbacPolicy {
  rules: AbacRule[];
  algorithm: AbacCombiningAlgo;
}

export interface AbacDecision {
  effect: AbacRuleEffect;
  matchedRule: string | null;
  reason: string;
}

export function evaluateAbac(policy: AbacPolicy, attrs: AbacAttributes): AbacDecision {
  const matched: AbacRule[] = [];
  for (const rule of policy.rules) {
    if (rule.condition(attrs)) matched.push(rule);
  }
  if (matched.length === 0) {
    return { effect: 'deny', matchedRule: null, reason: 'abac: no rule matched (default deny)' };
  }
  switch (policy.algorithm) {
    case 'deny-overrides': {
      const deny = matched.find((r) => r.effect === 'deny');
      if (deny) return { effect: 'deny', matchedRule: deny.id, reason: `abac: deny-overrides matched ${deny.id}` };
      const permit = matched[0];
      if (!permit) return { effect: 'deny', matchedRule: null, reason: 'abac: no rule matched' };
      return { effect: 'permit', matchedRule: permit.id, reason: `abac: deny-overrides falls to permit ${permit.id}` };
    }
    case 'permit-overrides': {
      const permit = matched.find((r) => r.effect === 'permit');
      if (permit) return { effect: 'permit', matchedRule: permit.id, reason: `abac: permit-overrides matched ${permit.id}` };
      const deny = matched[0];
      if (!deny) return { effect: 'deny', matchedRule: null, reason: 'abac: no rule matched' };
      return { effect: 'deny', matchedRule: deny.id, reason: `abac: permit-overrides falls to deny ${deny.id}` };
    }
    case 'first-applicable': {
      const first = matched[0];
      if (!first) return { effect: 'deny', matchedRule: null, reason: 'abac: no rule matched' };
      return { effect: first.effect, matchedRule: first.id, reason: `abac: first-applicable ${first.id}` };
    }
  }
}

/**
 * Combined policy engine — RBAC decision と ABAC decision を組合せる。
 * RBAC PERMIT + ABAC PERMIT → PERMIT、 いずれか DENY → DENY、
 * RBAC 未定義 permission は ABAC のみで判定。
 */
export interface CombinedPolicyInput {
  rbac?: { policy: RbacPolicy; subject: RbacSubject; permission: string };
  abac?: { policy: AbacPolicy; attrs: AbacAttributes };
}

export function evaluateCombined(input: CombinedPolicyInput): AbacDecision {
  const rbacResult = input.rbac ? rbacAllows(input.rbac.policy, input.rbac.subject, input.rbac.permission) : null;
  const abacResult = input.abac ? evaluateAbac(input.abac.policy, input.abac.attrs) : null;

  if (rbacResult === false) {
    return { effect: 'deny', matchedRule: 'rbac', reason: 'combined: rbac denied' };
  }
  if (!abacResult) {
    if (rbacResult === true) {
      return { effect: 'permit', matchedRule: 'rbac', reason: 'combined: rbac permitted (no abac)' };
    }
    return { effect: 'deny', matchedRule: null, reason: 'combined: no rbac + no abac (default deny)' };
  }
  return abacResult;
}

export function toAuthorizationEvent(input: {
  provider: 'casbin' | 'coraza';
  decision: AbacDecision;
  subject: string;
  action: string;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'authorization',
    provider: input.provider,
    verdict: input.decision.effect === 'permit' ? 'allow' : 'deny',
    reason: input.decision.reason,
    payload: {
      subject: input.subject,
      action: input.action,
      matchedRule: input.decision.matchedRule,
    },
    timestamp: input.timestamp,
  };
}
