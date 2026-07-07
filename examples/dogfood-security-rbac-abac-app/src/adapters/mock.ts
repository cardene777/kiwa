/**
 * Mock adapter — drives `@kiwa-test/security` v0.1 authorization semantics
 * (createRbacPolicy / rbacAllows / expandRoles / evaluateAbac /
 * evaluateCombined) so the same app code exercises a deterministic RBAC +
 * ABAC + policy-store ceremony without a real Casbin policy store. Both
 * mock and real adapters satisfy {@link SecurityAdapter}, so the fidelity
 * harness can diff them side-by-side.
 *
 * State model — one session per (policyId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. Policy
 * store keeps an ordered version list per policyId with a single active
 * version pointer so rollback simply moves the pointer.
 *
 * The mock intentionally piggy-backs on the same neutral event vocabulary
 * that the parent v1.37-1 semantics packages emit — every op appends the
 * matching neutral event into the trace so the fidelity harness can
 * assert the mock and real adapters produce identical event orderings.
 */

import {
  createRbacPolicy,
  evaluateAbac,
  evaluateCombined,
  expandRoles,
  rbacAllows,
  toAuthorizationEvent,
  type AbacAttributes,
  type AbacCombiningAlgo,
  type AbacRule,
  type AbacRuleEffect,
  type RbacRole,
} from '@kiwa-test/security';
import type {
  AbacEvaluateResult,
  AbacRuleInput,
  CombinedEvaluateResult,
  PolicyActivateResult,
  PolicyPublishResult,
  PolicyRollbackResult,
  RbacCheckResult,
  RbacExpandResult,
  SecurityAdapter,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface RbacSession {
  policyId: string;
  roles: RbacRole[];
  closed: boolean;
}

interface AbacSession {
  policyId: string;
  algorithm: AbacCombiningAlgo;
  rules: AbacRule[];
  closed: boolean;
}

interface PolicyStoreSession {
  policyId: string;
  versions: { version: number; body: string }[];
  activeVersion: number;
  closed: boolean;
}

/**
 * Translate an interface-level rule (plain object matcher) into the
 * closure-based {@link AbacRule} that the semantics package consumes. The
 * predicate is a shallow deep-equal on the specified attribute buckets.
 */
function toAbacRule(input: AbacRuleInput): AbacRule {
  const when = input.when;
  return {
    id: input.id,
    effect: input.effect satisfies AbacRuleEffect,
    condition: (attrs: AbacAttributes) => {
      if (when.action !== undefined && attrs.action !== when.action) return false;
      if (when.subject) {
        for (const [key, val] of Object.entries(when.subject)) {
          if (attrs.subject[key] !== val) return false;
        }
      }
      if (when.resource) {
        for (const [key, val] of Object.entries(when.resource)) {
          if (attrs.resource[key] !== val) return false;
        }
      }
      if (when.environment) {
        for (const [key, val] of Object.entries(when.environment)) {
          if (attrs.environment[key] !== val) return false;
        }
      }
      return true;
    },
  };
}

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): SecurityAdapter {
  const trace: TraceEvent[] = [];
  const latency = Math.max(opts.latencyMs ?? 1, 0);

  const rbacSessions = new Map<string, RbacSession>();
  const abacSessions = new Map<string, AbacSession>();
  const storeSessions = new Map<string, PolicyStoreSession>();

  let rolesAttached = 0;
  let rolesExpanded = 0;
  let permissionsChecked = 0;
  let abacRulesAttached = 0;
  let abacEvaluations = 0;
  let combinedEvaluations = 0;
  let policiesPublished = 0;
  let policiesActivated = 0;
  let policiesRolledBack = 0;
  let requests = 0;

  const rbacLatencySamplesMs: number[] = [];
  const abacLatencySamplesMs: number[] = [];
  const storeLatencySamplesMs: number[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function delay(): Promise<number> {
    const start = Date.now();
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }
    return Date.now() - start;
  }

  return {
    mode: 'mock',

    async startRbac(input) {
      requests += 1;
      rbacSessions.set(input.policyId, {
        policyId: input.policyId,
        roles: [],
        closed: false,
      });
      record('startRbac', true, { detail: { policyId: input.policyId } });
    },

    async attachRole(input) {
      requests += 1;
      const session = rbacSessions.get(input.policyId);
      if (!session) {
        record('attachRole', false, { errorKind: 'rbac_session_missing' });
        throw new Error('rbac_session_missing');
      }
      if (session.closed) {
        record('attachRole', false, { errorKind: 'rbac_session_closed' });
        throw new Error('rbac_session_closed');
      }
      if (session.roles.some((r) => r.name === input.name)) {
        record('attachRole', false, { errorKind: 'rbac_role_duplicate' });
        throw new Error('rbac_role_duplicate');
      }
      const role: RbacRole = {
        name: input.name,
        permissions: [...input.permissions],
      };
      if (input.parents !== undefined) {
        role.parents = [...input.parents];
      }
      session.roles.push(role);
      rolesAttached += 1;
      record('attachRole', true, {
        detail: {
          policyId: input.policyId,
          name: input.name,
          permissions: input.permissions,
          parents: input.parents ?? [],
        },
      });
    },

    async expandRoles(input): Promise<RbacExpandResult> {
      requests += 1;
      const session = rbacSessions.get(input.policyId);
      if (!session) {
        record('expandRoles', false, { errorKind: 'rbac_session_missing' });
        throw new Error('rbac_session_missing');
      }
      const latencyMs = await delay();
      rbacLatencySamplesMs.push(latencyMs);
      const policy = createRbacPolicy(session.roles);
      const perms = expandRoles(policy, {
        id: input.subjectId,
        roles: input.roles,
      });
      const rolesVisited = new Set<string>();
      const walk = (roleName: string): void => {
        if (rolesVisited.has(roleName)) return;
        rolesVisited.add(roleName);
        const role = policy.roles.get(roleName);
        if (!role) return;
        for (const parent of role.parents ?? []) walk(parent);
      };
      for (const r of input.roles) walk(r);
      rolesExpanded += 1;
      const result: RbacExpandResult = {
        subjectId: input.subjectId,
        policyId: input.policyId,
        permissions: [...perms],
        rolesVisited: [...rolesVisited],
        latencyMs,
      };
      record('expandRoles', true, {
        detail: {
          subjectId: input.subjectId,
          permissionCount: result.permissions.length,
          rolesVisitedCount: result.rolesVisited.length,
        },
      });
      return result;
    },

    async checkPermission(input): Promise<RbacCheckResult> {
      requests += 1;
      const session = rbacSessions.get(input.policyId);
      if (!session) {
        record('checkPermission', false, { errorKind: 'rbac_session_missing' });
        throw new Error('rbac_session_missing');
      }
      const latencyMs = await delay();
      rbacLatencySamplesMs.push(latencyMs);
      const policy = createRbacPolicy(session.roles);
      const allowed = rbacAllows(
        policy,
        { id: input.subjectId, roles: input.roles },
        input.permission,
      );
      toAuthorizationEvent({
        provider: 'casbin',
        decision: {
          effect: allowed ? 'permit' : 'deny',
          matchedRule: allowed ? 'rbac' : null,
          reason: allowed ? 'mock_rbac_permit' : 'mock_rbac_deny',
        },
        subject: input.subjectId,
        action: input.permission,
        timestamp: Date.now(),
      });
      permissionsChecked += 1;
      const result: RbacCheckResult = {
        subjectId: input.subjectId,
        policyId: input.policyId,
        permission: input.permission,
        allowed,
        latencyMs,
      };
      record('checkPermission', true, {
        detail: {
          subjectId: input.subjectId,
          permission: input.permission,
          allowed,
        },
      });
      return result;
    },

    async closeRbac(input) {
      requests += 1;
      const session = rbacSessions.get(input.policyId);
      if (!session) {
        record('closeRbac', false, { errorKind: 'rbac_session_missing' });
        throw new Error('rbac_session_missing');
      }
      session.closed = true;
      record('closeRbac', true, {
        detail: {
          policyId: input.policyId,
          roleCount: session.roles.length,
        },
      });
    },

    async startAbac(input) {
      requests += 1;
      abacSessions.set(input.policyId, {
        policyId: input.policyId,
        algorithm: input.algorithm,
        rules: [],
        closed: false,
      });
      record('startAbac', true, {
        detail: { policyId: input.policyId, algorithm: input.algorithm },
      });
    },

    async attachRule(input) {
      requests += 1;
      const session = abacSessions.get(input.policyId);
      if (!session) {
        record('attachRule', false, { errorKind: 'abac_session_missing' });
        throw new Error('abac_session_missing');
      }
      if (session.closed) {
        record('attachRule', false, { errorKind: 'abac_session_closed' });
        throw new Error('abac_session_closed');
      }
      if (session.rules.some((r) => r.id === input.rule.id)) {
        record('attachRule', false, { errorKind: 'abac_rule_duplicate' });
        throw new Error('abac_rule_duplicate');
      }
      session.rules.push(toAbacRule(input.rule));
      abacRulesAttached += 1;
      record('attachRule', true, {
        detail: {
          policyId: input.policyId,
          ruleId: input.rule.id,
          effect: input.rule.effect,
        },
      });
    },

    async evaluateAbac(input): Promise<AbacEvaluateResult> {
      requests += 1;
      const session = abacSessions.get(input.policyId);
      if (!session) {
        record('evaluateAbac', false, { errorKind: 'abac_session_missing' });
        throw new Error('abac_session_missing');
      }
      const latencyMs = await delay();
      abacLatencySamplesMs.push(latencyMs);
      const decision = evaluateAbac(
        { rules: session.rules, algorithm: session.algorithm },
        {
          subject: input.subject,
          resource: input.resource,
          action: input.action,
          environment: input.environment,
        },
      );
      toAuthorizationEvent({
        provider: 'casbin',
        decision,
        subject: JSON.stringify(input.subject),
        action: input.action,
        timestamp: Date.now(),
      });
      abacEvaluations += 1;
      const result: AbacEvaluateResult = {
        policyId: input.policyId,
        effect: decision.effect,
        matchedRule: decision.matchedRule,
        reason: decision.reason,
        latencyMs,
      };
      record('evaluateAbac', true, {
        detail: {
          policyId: input.policyId,
          effect: decision.effect,
          matchedRule: decision.matchedRule,
        },
      });
      return result;
    },

    async evaluateCombined(input): Promise<CombinedEvaluateResult> {
      requests += 1;
      const abacSession = abacSessions.get(input.policyId);
      const rbacSession = rbacSessions.get(input.policyId);
      const latencyMs = await delay();
      abacLatencySamplesMs.push(latencyMs);
      const combinedInput: Parameters<typeof evaluateCombined>[0] = {};
      if (input.rbac && rbacSession) {
        combinedInput.rbac = {
          policy: createRbacPolicy(rbacSession.roles),
          subject: { id: input.rbac.subjectId, roles: input.rbac.roles },
          permission: input.rbac.permission,
        };
      }
      if (input.abac && abacSession) {
        combinedInput.abac = {
          policy: { rules: abacSession.rules, algorithm: abacSession.algorithm },
          attrs: {
            subject: input.abac.subject,
            resource: input.abac.resource,
            action: input.abac.action,
            environment: input.abac.environment,
          },
        };
      }
      const decision = evaluateCombined(combinedInput);
      combinedEvaluations += 1;
      const result: CombinedEvaluateResult = {
        policyId: input.policyId,
        effect: decision.effect,
        matchedRule: decision.matchedRule,
        reason: decision.reason,
        latencyMs,
      };
      record('evaluateCombined', true, {
        detail: {
          policyId: input.policyId,
          effect: decision.effect,
          reason: decision.reason,
        },
      });
      return result;
    },

    async closeAbac(input) {
      requests += 1;
      const session = abacSessions.get(input.policyId);
      if (!session) {
        record('closeAbac', false, { errorKind: 'abac_session_missing' });
        throw new Error('abac_session_missing');
      }
      session.closed = true;
      record('closeAbac', true, {
        detail: { policyId: input.policyId, ruleCount: session.rules.length },
      });
    },

    async startPolicyStore(input) {
      requests += 1;
      storeSessions.set(input.policyId, {
        policyId: input.policyId,
        versions: [],
        activeVersion: 0,
        closed: false,
      });
      record('startPolicyStore', true, { detail: { policyId: input.policyId } });
    },

    async publishPolicy(input): Promise<PolicyPublishResult> {
      requests += 1;
      const session = storeSessions.get(input.policyId);
      if (!session) {
        record('publishPolicy', false, { errorKind: 'store_session_missing' });
        throw new Error('store_session_missing');
      }
      if (session.closed) {
        record('publishPolicy', false, { errorKind: 'store_session_closed' });
        throw new Error('store_session_closed');
      }
      const latencyMs = await delay();
      storeLatencySamplesMs.push(latencyMs);
      const nextVersion = session.versions.length + 1;
      session.versions.push({ version: nextVersion, body: input.body });
      if (input.activateOnPublish) {
        session.activeVersion = nextVersion;
      }
      policiesPublished += 1;
      const result: PolicyPublishResult = {
        policyId: input.policyId,
        version: nextVersion,
        activeVersion: session.activeVersion,
        latencyMs,
      };
      record('publishPolicy', true, {
        detail: {
          policyId: input.policyId,
          version: nextVersion,
          activeVersion: session.activeVersion,
        },
      });
      return result;
    },

    async activatePolicy(input): Promise<PolicyActivateResult> {
      requests += 1;
      const session = storeSessions.get(input.policyId);
      if (!session) {
        record('activatePolicy', false, { errorKind: 'store_session_missing' });
        throw new Error('store_session_missing');
      }
      if (!session.versions.some((v) => v.version === input.version)) {
        record('activatePolicy', false, { errorKind: 'store_version_missing' });
        throw new Error('store_version_missing');
      }
      const latencyMs = await delay();
      storeLatencySamplesMs.push(latencyMs);
      session.activeVersion = input.version;
      policiesActivated += 1;
      const result: PolicyActivateResult = {
        policyId: input.policyId,
        version: input.version,
        activeVersion: session.activeVersion,
        latencyMs,
      };
      record('activatePolicy', true, {
        detail: {
          policyId: input.policyId,
          version: input.version,
          activeVersion: session.activeVersion,
        },
      });
      return result;
    },

    async rollbackPolicy(input): Promise<PolicyRollbackResult> {
      requests += 1;
      const session = storeSessions.get(input.policyId);
      if (!session) {
        record('rollbackPolicy', false, { errorKind: 'store_session_missing' });
        throw new Error('store_session_missing');
      }
      if (!session.versions.some((v) => v.version === input.toVersion)) {
        record('rollbackPolicy', false, { errorKind: 'store_version_missing' });
        throw new Error('store_version_missing');
      }
      if (input.toVersion >= session.activeVersion) {
        record('rollbackPolicy', false, {
          errorKind: 'store_rollback_not_backwards',
        });
        throw new Error('store_rollback_not_backwards');
      }
      const latencyMs = await delay();
      storeLatencySamplesMs.push(latencyMs);
      const previous = session.activeVersion;
      session.activeVersion = input.toVersion;
      policiesRolledBack += 1;
      const result: PolicyRollbackResult = {
        policyId: input.policyId,
        rolledBackFrom: previous,
        rolledBackTo: input.toVersion,
        activeVersion: session.activeVersion,
        latencyMs,
      };
      record('rollbackPolicy', true, {
        detail: {
          policyId: input.policyId,
          from: previous,
          to: input.toVersion,
        },
      });
      return result;
    },

    async closePolicyStore(input) {
      requests += 1;
      const session = storeSessions.get(input.policyId);
      if (!session) {
        record('closePolicyStore', false, {
          errorKind: 'store_session_missing',
        });
        throw new Error('store_session_missing');
      }
      session.closed = true;
      record('closePolicyStore', true, {
        detail: {
          policyId: input.policyId,
          versionCount: session.versions.length,
          activeVersion: session.activeVersion,
        },
      });
    },

    traces() {
      return trace;
    },

    async reset() {
      rbacSessions.clear();
      abacSessions.clear();
      storeSessions.clear();
      trace.length = 0;
      rolesAttached = 0;
      rolesExpanded = 0;
      permissionsChecked = 0;
      abacRulesAttached = 0;
      abacEvaluations = 0;
      combinedEvaluations = 0;
      policiesPublished = 0;
      policiesActivated = 0;
      policiesRolledBack = 0;
      requests = 0;
      rbacLatencySamplesMs.length = 0;
      abacLatencySamplesMs.length = 0;
      storeLatencySamplesMs.length = 0;
    },
  };
}

/** Exported so downstream tests can peek without depending on `.traces()` shape. */
export interface MockAdapterCounters {
  rolesAttached: number;
  rolesExpanded: number;
  permissionsChecked: number;
  abacRulesAttached: number;
  abacEvaluations: number;
  combinedEvaluations: number;
  policiesPublished: number;
  policiesActivated: number;
  policiesRolledBack: number;
  requests: number;
}
