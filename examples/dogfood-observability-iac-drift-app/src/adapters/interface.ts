/**
 * Provider-neutral IaC observability surface for the drift-detection dogfood.
 *
 * The app talks to the plan + drift + policy + cost surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Terraform + OPA + cost API
 *    style IaC platform (KIWA_TERRAFORM_STATE_URL + KIWA_OPA_URL +
 *    KIWA_COST_API_URL) when `KIWA_MODE=real` +
 *    `IAC_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_IAC_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/observability` v2.2
 *    IaC semantics (capturePlan / detectDrift / evaluatePolicy /
 *    attributeCost).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.42-2
 * dogfoods —
 *  - plan (session start + plan capture + close)
 *  - drift (drift detection + resource diff + close)
 *  - policy-cost (policy eval + cost attribution + close)
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - plan-e2e (startPlan + capturePlan + closePlan)
 *  - drift-e2e (startDrift + detectDrift + closeDrift)
 *  - policy-e2e (startPolicy + evaluatePolicy + attributeCost + closePolicy)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

import type { semantics } from '@kiwa/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** A single Terraform resource change reported by `terraform plan`. */
export interface ResourceChange {
  address: string;
  action: 'create' | 'update' | 'delete' | 'no-op';
}

/** OPA policy evaluation result for a single rego policy. */
export interface PolicyResult {
  policyId: string;
  passed: boolean;
  violationCount: number;
}

/** Cost attribution result for a single team / cost-center. */
export interface CostAttribution {
  team: string;
  monthlyCostUsd: number;
}

/** Result of capturing a `terraform plan` snapshot. */
export interface PlanCaptureResult {
  sessionId: string;
  workspace: string;
  changeCount: number;
  additions: number;
  modifications: number;
  deletions: number;
  latencyMs: number;
}

/** Result of a drift detection sweep (expected vs actual resources). */
export interface DriftDetectResult {
  sessionId: string;
  workspace: string;
  driftCount: number;
  driftedResources: string[];
  hasDrift: boolean;
  latencyMs: number;
}

/** Result of evaluating a set of OPA policies against the plan. */
export interface PolicyEvaluateResult {
  sessionId: string;
  workspace: string;
  policyCount: number;
  passed: number;
  failed: number;
  totalViolations: number;
  latencyMs: number;
}

/** Result of attributing plan-time cost to teams / cost-centers. */
export interface CostAttributeResult {
  sessionId: string;
  workspace: string;
  teamCount: number;
  totalMonthlyCostUsd: number;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startPlan'
    | 'capturePlan'
    | 'closePlan'
    | 'startDrift'
    | 'detectDrift'
    | 'closeDrift'
    | 'startPolicy'
    | 'evaluatePolicy'
    | 'attributeCost'
    | 'closePolicy';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a plan-capture session. */
export interface PlanSessionInput {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
}

/** Input for opening a drift-detection session. */
export interface DriftSessionInput {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
}

/** Input for opening a policy + cost session. */
export interface PolicySessionInput {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
}

/** The IaC Adapter — 10 ops across 3 domain surfaces + 4 IaC lifecycle stages. */
export interface IacAdapter {
  readonly mode: 'real' | 'mock';

  // plan surface (plan-e2e axis: session + capture + close)
  startPlan(input: PlanSessionInput): Promise<void>;
  capturePlan(input: {
    sessionId: string;
    changes: ResourceChange[];
  }): Promise<PlanCaptureResult>;
  closePlan(input: { sessionId: string }): Promise<void>;

  // drift surface (drift-e2e axis: session + detect + close)
  startDrift(input: DriftSessionInput): Promise<void>;
  detectDrift(input: {
    sessionId: string;
    expected: string[];
    actual: string[];
  }): Promise<DriftDetectResult>;
  closeDrift(input: { sessionId: string }): Promise<void>;

  // policy surface (policy-e2e axis: session + evaluate + attribute + close)
  startPolicy(input: PolicySessionInput): Promise<void>;
  evaluatePolicy(input: {
    sessionId: string;
    results: PolicyResult[];
  }): Promise<PolicyEvaluateResult>;
  attributeCost(input: {
    sessionId: string;
    attributions: CostAttribution[];
  }): Promise<CostAttributeResult>;
  closePolicy(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_IAC_ENV_MISSING = 'KIWA_IAC_ENV_MISSING';

/**
 * The 10 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 */
export const IAC_HARNESS_OPS = [
  'startPlan',
  'capturePlan',
  'closePlan',
  'startDrift',
  'detectDrift',
  'closeDrift',
  'startPolicy',
  'evaluatePolicy',
  'attributeCost',
  'closePolicy',
] as const;

export type IacHarnessOp = (typeof IAC_HARNESS_OPS)[number];
