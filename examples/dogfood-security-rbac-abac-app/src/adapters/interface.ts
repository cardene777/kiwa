/**
 * Provider-neutral Security Adapter surface for the RBAC + ABAC dogfood.
 *
 * The app talks to the RBAC + ABAC + policy-store surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Casbin-style policy store
 *    (KIWA_POLICY_STORE_URL) when `KIWA_MODE=real` +
 *    `AUTHZ_STORE_READY=1` are set; otherwise every op reports
 *    `KIWA_AUTHZ_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/security` v0.1
 *    authorization semantics (createRbacPolicy / rbacAllows /
 *    evaluateAbac / evaluateCombined).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.37-3
 * dogfoods —
 *  - RBAC (role hierarchy + subject-role-permission expansion)
 *  - ABAC (attribute matching + rule combining algorithms)
 *  - policy-store (versioning + rollback + attach + activation)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - rbac-e2e (role hierarchy + subject expansion + permission check)
 *  - abac-e2e (attribute matching + combining algo + combined engine)
 *  - policy-store-e2e (versioning + rollback + activation)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of expanding a subject's transitive permissions through the hierarchy. */
export interface RbacExpandResult {
  subjectId: string;
  policyId: string;
  permissions: string[];
  rolesVisited: string[];
  latencyMs: number;
}

/** Result of checking whether a subject can perform a permission. */
export interface RbacCheckResult {
  subjectId: string;
  policyId: string;
  permission: string;
  allowed: boolean;
  latencyMs: number;
}

/** Result of evaluating an ABAC policy against a set of attributes. */
export interface AbacEvaluateResult {
  policyId: string;
  effect: 'permit' | 'deny';
  matchedRule: string | null;
  reason: string;
  latencyMs: number;
}

/** Result of evaluating the combined RBAC + ABAC decision. */
export interface CombinedEvaluateResult {
  policyId: string;
  effect: 'permit' | 'deny';
  matchedRule: string | null;
  reason: string;
  latencyMs: number;
}

/** Result of publishing a new policy version to the store. */
export interface PolicyPublishResult {
  policyId: string;
  version: number;
  activeVersion: number;
  latencyMs: number;
}

/** Result of activating a stored version. */
export interface PolicyActivateResult {
  policyId: string;
  version: number;
  activeVersion: number;
  latencyMs: number;
}

/** Result of rolling a policy back to a prior active version. */
export interface PolicyRollbackResult {
  policyId: string;
  rolledBackFrom: number;
  rolledBackTo: number;
  activeVersion: number;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startRbac'
    | 'attachRole'
    | 'expandRoles'
    | 'checkPermission'
    | 'closeRbac'
    | 'startAbac'
    | 'attachRule'
    | 'evaluateAbac'
    | 'evaluateCombined'
    | 'closeAbac'
    | 'startPolicyStore'
    | 'publishPolicy'
    | 'activatePolicy'
    | 'rollbackPolicy'
    | 'closePolicyStore';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Rule for an ABAC policy — id + effect + predicate. */
export interface AbacRuleInput {
  id: string;
  effect: 'permit' | 'deny';
  /**
   * Attribute predicate expressed as a plain object matcher — the app
   * translates this to the underlying `AbacRule.condition` closure without
   * exposing the closure identity across the interface (which would break
   * the fidelity harness serialization).
   */
  when: {
    subject?: Record<string, unknown>;
    resource?: Record<string, unknown>;
    action?: string;
    environment?: Record<string, unknown>;
  };
}

/** The Security Adapter — 15 ops across 3 domain surfaces + 3 axes. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // rbac surface (rbac-e2e axis: role hierarchy + subject expansion)
  startRbac(input: { policyId: string }): Promise<void>;
  attachRole(input: {
    policyId: string;
    name: string;
    permissions: string[];
    parents?: string[];
  }): Promise<void>;
  expandRoles(input: {
    policyId: string;
    subjectId: string;
    roles: string[];
  }): Promise<RbacExpandResult>;
  checkPermission(input: {
    policyId: string;
    subjectId: string;
    roles: string[];
    permission: string;
  }): Promise<RbacCheckResult>;
  closeRbac(input: { policyId: string }): Promise<void>;

  // abac surface (abac-e2e axis: attribute matching + combining algo)
  startAbac(input: {
    policyId: string;
    algorithm: 'deny-overrides' | 'permit-overrides' | 'first-applicable';
  }): Promise<void>;
  attachRule(input: {
    policyId: string;
    rule: AbacRuleInput;
  }): Promise<void>;
  evaluateAbac(input: {
    policyId: string;
    subject: Record<string, unknown>;
    resource: Record<string, unknown>;
    action: string;
    environment: Record<string, unknown>;
  }): Promise<AbacEvaluateResult>;
  evaluateCombined(input: {
    policyId: string;
    rbac?: {
      subjectId: string;
      roles: string[];
      permission: string;
    };
    abac?: {
      subject: Record<string, unknown>;
      resource: Record<string, unknown>;
      action: string;
      environment: Record<string, unknown>;
    };
  }): Promise<CombinedEvaluateResult>;
  closeAbac(input: { policyId: string }): Promise<void>;

  // policy-store surface (policy-store-e2e axis: versioning + rollback)
  startPolicyStore(input: { policyId: string }): Promise<void>;
  publishPolicy(input: {
    policyId: string;
    body: string;
    activateOnPublish: boolean;
  }): Promise<PolicyPublishResult>;
  activatePolicy(input: {
    policyId: string;
    version: number;
  }): Promise<PolicyActivateResult>;
  rollbackPolicy(input: {
    policyId: string;
    toVersion: number;
  }): Promise<PolicyRollbackResult>;
  closePolicyStore(input: { policyId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
