import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * IaC observability axis — Terraform + drift detection + OPA policy + cost attribution
 * state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: capture-plan → detect-drift → evaluate-policy → attribute-cost.
 * Deterministic mock で計算経路のみを検証、 実 provider 呼び出しは行わない。
 */

export type IacState =
  | 'idle'
  | 'plan-captured'
  | 'drift-detected'
  | 'policy-evaluated'
  | 'cost-attributed';

export interface IacResourceChange {
  address: string;
  action: 'create' | 'update' | 'delete' | 'no-op';
}

export interface IacPolicyResult {
  policyId: string;
  passed: boolean;
  violationCount: number;
}

export interface IacCostAttribution {
  team: string;
  monthlyCostUsd: number;
}

export interface IacSession {
  target: ObservabilityTarget;
  workspace: string;
  state: IacState;
  history: AxisStep<IacState>[];
  changes: IacResourceChange[];
  driftedResources: string[];
  policyResults: IacPolicyResult[];
  costAttributions: IacCostAttribution[];
}

export function startIacSession(input: {
  target: ObservabilityTarget;
  workspace: string;
}): IacSession {
  if (input.workspace.length === 0) {
    throw new Error('startIacSession: workspace must not be empty');
  }
  return {
    target: input.target,
    workspace: input.workspace,
    state: 'idle',
    history: [],
    changes: [],
    driftedResources: [],
    policyResults: [],
    costAttributions: [],
  };
}

export function capturePlan(
  session: IacSession,
  input: { changes: IacResourceChange[] },
): AxisStep<IacState> {
  if (session.state !== 'idle') {
    throw new Error(`capturePlan: session is ${session.state}, not idle`);
  }
  if (input.changes.length === 0) {
    throw new Error('capturePlan: changes must not be empty');
  }
  session.changes = [...input.changes];
  session.state = 'plan-captured';
  const additions = input.changes.filter((c) => c.action === 'create').length;
  const modifications = input.changes.filter((c) => c.action === 'update').length;
  const deletions = input.changes.filter((c) => c.action === 'delete').length;
  return emit(session, 'iac.plan_captured', {
    changeCount: input.changes.length,
    additions,
    modifications,
    deletions,
  });
}

export function detectDrift(
  session: IacSession,
  input: { expected: string[]; actual: string[] },
): AxisStep<IacState> {
  if (session.state !== 'plan-captured') {
    throw new Error(`detectDrift: session is ${session.state}, not plan-captured`);
  }
  const expectedSet = new Set(input.expected);
  const actualSet = new Set(input.actual);
  const drifted: string[] = [];
  for (const addr of expectedSet) {
    if (!actualSet.has(addr)) drifted.push(addr);
  }
  for (const addr of actualSet) {
    if (!expectedSet.has(addr)) drifted.push(addr);
  }
  session.driftedResources = drifted;
  session.state = 'drift-detected';
  return emit(session, 'iac.drift_detected', {
    driftCount: drifted.length,
    expectedCount: input.expected.length,
    actualCount: input.actual.length,
    hasDrift: drifted.length > 0,
  });
}

export function evaluatePolicy(
  session: IacSession,
  input: { results: IacPolicyResult[] },
): AxisStep<IacState> {
  if (session.state !== 'drift-detected') {
    throw new Error(`evaluatePolicy: session is ${session.state}, not drift-detected`);
  }
  if (input.results.length === 0) {
    throw new Error('evaluatePolicy: results must not be empty');
  }
  session.policyResults = [...input.results];
  const passed = input.results.filter((r) => r.passed).length;
  const failed = input.results.length - passed;
  const totalViolations = input.results.reduce((acc, r) => acc + r.violationCount, 0);
  session.state = 'policy-evaluated';
  return emit(session, 'iac.policy_evaluated', {
    policyCount: input.results.length,
    passed,
    failed,
    totalViolations,
  });
}

export function attributeCost(
  session: IacSession,
  input: { attributions: IacCostAttribution[] },
): AxisStep<IacState> {
  if (session.state !== 'policy-evaluated') {
    throw new Error(`attributeCost: session is ${session.state}, not policy-evaluated`);
  }
  if (input.attributions.length === 0) {
    throw new Error('attributeCost: attributions must not be empty');
  }
  for (const a of input.attributions) {
    if (a.monthlyCostUsd < 0) {
      throw new Error(`attributeCost: cost for ${a.team} must be non-negative`);
    }
  }
  session.costAttributions = [...input.attributions];
  const totalCost = input.attributions.reduce((acc, a) => acc + a.monthlyCostUsd, 0);
  session.state = 'cost-attributed';
  return emit(session, 'iac.cost_attributed', {
    teamCount: input.attributions.length,
    totalMonthlyCostUsd: totalCost,
  });
}

function emit(
  session: IacSession,
  neutralEvent: AxisStep<IacState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<IacState> {
  const step: AxisStep<IacState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, workspace: session.workspace, ...metadata },
  };
  session.history.push(step);
  return step;
}
