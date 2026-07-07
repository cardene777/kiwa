/**
 * Mock adapter — drives `@kiwa-test/observability` v2.2 advanced III IaC
 * semantics (startIacSession / capturePlan / detectDrift / evaluatePolicy
 * / attributeCost) so the same app code exercises a deterministic
 * Terraform + OPA + cost ceremony without a real Terraform state / OPA
 * server / cloud cost API endpoint. Both mock and real adapters satisfy
 * {@link IacAdapter}, so the fidelity harness can diff them side-by-side.
 *
 * State model — one session per (sessionId) tuple across each surface;
 * each session is isolated so per-surface metrics stay separated. The
 * plan surface owns the `terraform plan` capture envelope; the drift
 * surface owns expected-vs-actual comparison; the policy surface owns
 * OPA rego evaluation + team cost attribution.
 *
 * The mock intentionally piggy-backs on the v2.2 IaC semantics
 * IacSession — every op appends the matching neutral event into the trace
 * so the fidelity harness can assert the mock and real adapters produce
 * identical event orderings. Because the v2.2 IacSession is a strict
 * 4-step state machine (idle → plan-captured → drift-detected →
 * policy-evaluated → cost-attributed), the mock adapter maintains a
 * separate session per surface so each surface can drive the semantics
 * lifecycle independently and the fidelity harness can point at the exact
 * op that diverged.
 */

import { semantics } from '@kiwa-test/observability';
import {
  type CostAttributeResult,
  type CostAttribution,
  type DriftDetectResult,
  type DriftSessionInput,
  type IacAdapter,
  type ObservabilityTarget,
  type PlanCaptureResult,
  type PlanSessionInput,
  type PolicyEvaluateResult,
  type PolicyResult,
  type PolicySessionInput,
  type ResourceChange,
  type TraceEvent,
} from './interface.js';

const {
  attributeCost: iacAttributeCost,
  capturePlan: iacCapturePlan,
  detectDrift: iacDetectDrift,
  evaluatePolicy: iacEvaluatePolicy,
  startIacSession,
} = semantics;

type IacSession = ReturnType<typeof startIacSession>;

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface PlanSessionState {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
  iac: IacSession;
  closed: boolean;
}

interface DriftSessionState {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
  iac: IacSession;
  /** whether capturePlan has been invoked on the semantics session. */
  planCaptured: boolean;
  closed: boolean;
}

interface PolicySessionState {
  sessionId: string;
  workspace: string;
  target: ObservabilityTarget;
  iac: IacSession;
  /** whether the drift-detection step has been driven yet. */
  driftDetected: boolean;
  /** whether the policy-evaluation step has been driven yet. */
  policyEvaluated: boolean;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): IacAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const plans = new Map<string, PlanSessionState>();
  const drifts = new Map<string, DriftSessionState>();
  const policies = new Map<string, PolicySessionState>();

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

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startPlan(input) {
      if (plans.has(input.sessionId)) {
        record('startPlan', false, { errorKind: 'plan_session_exists' });
        throw new Error('plan_session_exists');
      }
      const iac = startIacSession({
        target: input.target,
        workspace: input.workspace,
      });
      plans.set(input.sessionId, {
        sessionId: input.sessionId,
        workspace: input.workspace,
        target: input.target,
        iac,
        closed: false,
      });
      record('startPlan', true, {
        detail: {
          sessionId: input.sessionId,
          workspace: input.workspace,
          target: input.target,
        },
      });
    },

    async capturePlan(input) {
      const session = plans.get(input.sessionId);
      if (!session) {
        record('capturePlan', false, { errorKind: 'plan_session_not_found' });
        throw new Error('plan_session_not_found');
      }
      if (session.closed) {
        record('capturePlan', false, { errorKind: 'plan_session_closed' });
        throw new Error('plan_session_closed');
      }
      if (input.changes.length === 0) {
        record('capturePlan', false, { errorKind: 'changes_must_not_be_empty' });
        throw new Error('changes_must_not_be_empty');
      }
      try {
        const step = iacCapturePlan(session.iac, { changes: input.changes });
        const result: PlanCaptureResult = {
          sessionId: input.sessionId,
          workspace: session.workspace,
          changeCount: Number(step.metadata.changeCount),
          additions: Number(step.metadata.additions),
          modifications: Number(step.metadata.modifications),
          deletions: Number(step.metadata.deletions),
          latencyMs,
        };
        record('capturePlan', true, { detail: result });
        return result;
      } catch (err) {
        record('capturePlan', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closePlan(input) {
      const session = plans.get(input.sessionId);
      if (!session) {
        record('closePlan', false, { errorKind: 'plan_session_not_found' });
        throw new Error('plan_session_not_found');
      }
      session.closed = true;
      plans.delete(input.sessionId);
      record('closePlan', true, { detail: { sessionId: input.sessionId } });
    },

    async startDrift(input) {
      if (drifts.has(input.sessionId)) {
        record('startDrift', false, { errorKind: 'drift_session_exists' });
        throw new Error('drift_session_exists');
      }
      const iac = startIacSession({
        target: input.target,
        workspace: input.workspace,
      });
      drifts.set(input.sessionId, {
        sessionId: input.sessionId,
        workspace: input.workspace,
        target: input.target,
        iac,
        planCaptured: false,
        closed: false,
      });
      record('startDrift', true, {
        detail: {
          sessionId: input.sessionId,
          workspace: input.workspace,
          target: input.target,
        },
      });
    },

    async detectDrift(input) {
      const session = drifts.get(input.sessionId);
      if (!session) {
        record('detectDrift', false, { errorKind: 'drift_session_not_found' });
        throw new Error('drift_session_not_found');
      }
      if (session.closed) {
        record('detectDrift', false, { errorKind: 'drift_session_closed' });
        throw new Error('drift_session_closed');
      }
      try {
        // The v2.2 IaC state machine requires a plan-captured state before
        // drift can be detected. The drift surface bootstraps that state
        // with a synthetic single-resource plan so the semantics remain the
        // source of truth for state-transition ordering.
        if (!session.planCaptured) {
          iacCapturePlan(session.iac, {
            changes: [
              { address: `${session.workspace}.drift-bootstrap`, action: 'no-op' },
            ],
          });
          session.planCaptured = true;
        }
        const step = iacDetectDrift(session.iac, {
          expected: input.expected,
          actual: input.actual,
        });
        const result: DriftDetectResult = {
          sessionId: input.sessionId,
          workspace: session.workspace,
          driftCount: Number(step.metadata.driftCount),
          driftedResources: [...session.iac.driftedResources],
          hasDrift: Boolean(step.metadata.hasDrift),
          latencyMs,
        };
        record('detectDrift', true, { detail: result });
        return result;
      } catch (err) {
        record('detectDrift', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeDrift(input) {
      const session = drifts.get(input.sessionId);
      if (!session) {
        record('closeDrift', false, { errorKind: 'drift_session_not_found' });
        throw new Error('drift_session_not_found');
      }
      session.closed = true;
      drifts.delete(input.sessionId);
      record('closeDrift', true, { detail: { sessionId: input.sessionId } });
    },

    async startPolicy(input) {
      if (policies.has(input.sessionId)) {
        record('startPolicy', false, { errorKind: 'policy_session_exists' });
        throw new Error('policy_session_exists');
      }
      const iac = startIacSession({
        target: input.target,
        workspace: input.workspace,
      });
      policies.set(input.sessionId, {
        sessionId: input.sessionId,
        workspace: input.workspace,
        target: input.target,
        iac,
        driftDetected: false,
        policyEvaluated: false,
        closed: false,
      });
      record('startPolicy', true, {
        detail: {
          sessionId: input.sessionId,
          workspace: input.workspace,
          target: input.target,
        },
      });
    },

    async evaluatePolicy(input) {
      const session = policies.get(input.sessionId);
      if (!session) {
        record('evaluatePolicy', false, { errorKind: 'policy_session_not_found' });
        throw new Error('policy_session_not_found');
      }
      if (session.closed) {
        record('evaluatePolicy', false, { errorKind: 'policy_session_closed' });
        throw new Error('policy_session_closed');
      }
      if (input.results.length === 0) {
        record('evaluatePolicy', false, { errorKind: 'results_must_not_be_empty' });
        throw new Error('results_must_not_be_empty');
      }
      try {
        // The v2.2 IaC state machine requires plan-captured + drift-detected
        // states before policy evaluation. Bootstrap both with synthetic
        // inputs so the semantics remain the source of truth for state
        // transitions.
        if (!session.driftDetected) {
          iacCapturePlan(session.iac, {
            changes: [
              { address: `${session.workspace}.policy-bootstrap`, action: 'no-op' },
            ],
          });
          iacDetectDrift(session.iac, { expected: [], actual: [] });
          session.driftDetected = true;
        }
        const step = iacEvaluatePolicy(session.iac, { results: input.results });
        session.policyEvaluated = true;
        const result: PolicyEvaluateResult = {
          sessionId: input.sessionId,
          workspace: session.workspace,
          policyCount: Number(step.metadata.policyCount),
          passed: Number(step.metadata.passed),
          failed: Number(step.metadata.failed),
          totalViolations: Number(step.metadata.totalViolations),
          latencyMs,
        };
        record('evaluatePolicy', true, { detail: result });
        return result;
      } catch (err) {
        record('evaluatePolicy', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async attributeCost(input) {
      const session = policies.get(input.sessionId);
      if (!session) {
        record('attributeCost', false, { errorKind: 'policy_session_not_found' });
        throw new Error('policy_session_not_found');
      }
      if (session.closed) {
        record('attributeCost', false, { errorKind: 'policy_session_closed' });
        throw new Error('policy_session_closed');
      }
      if (input.attributions.length === 0) {
        record('attributeCost', false, { errorKind: 'attributions_must_not_be_empty' });
        throw new Error('attributions_must_not_be_empty');
      }
      for (const a of input.attributions) {
        if (a.monthlyCostUsd < 0) {
          record('attributeCost', false, { errorKind: 'monthly_cost_must_be_non_negative' });
          throw new Error('monthly_cost_must_be_non_negative');
        }
      }
      try {
        // attributeCost is the final step in the semantics lifecycle and
        // requires policy-evaluated state. Bootstrap all prior steps with
        // synthetic inputs if the caller has not driven them explicitly.
        if (!session.policyEvaluated) {
          if (!session.driftDetected) {
            iacCapturePlan(session.iac, {
              changes: [
                { address: `${session.workspace}.cost-bootstrap`, action: 'no-op' },
              ],
            });
            iacDetectDrift(session.iac, { expected: [], actual: [] });
            session.driftDetected = true;
          }
          iacEvaluatePolicy(session.iac, {
            results: [{ policyId: 'bootstrap', passed: true, violationCount: 0 }],
          });
          session.policyEvaluated = true;
        }
        const step = iacAttributeCost(session.iac, {
          attributions: input.attributions,
        });
        const result: CostAttributeResult = {
          sessionId: input.sessionId,
          workspace: session.workspace,
          teamCount: Number(step.metadata.teamCount),
          totalMonthlyCostUsd: Number(step.metadata.totalMonthlyCostUsd),
          latencyMs,
        };
        record('attributeCost', true, { detail: result });
        return result;
      } catch (err) {
        record('attributeCost', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closePolicy(input) {
      const session = policies.get(input.sessionId);
      if (!session) {
        record('closePolicy', false, { errorKind: 'policy_session_not_found' });
        throw new Error('policy_session_not_found');
      }
      session.closed = true;
      policies.delete(input.sessionId);
      record('closePolicy', true, { detail: { sessionId: input.sessionId } });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      plans.clear();
      drifts.clear();
      policies.clear();
    },
  };
}

/** Re-export for convenience — types cross to route + fidelity modules. */
export type {
  CostAttribution,
  DriftDetectResult,
  DriftSessionInput,
  PlanCaptureResult,
  PlanSessionInput,
  PolicyEvaluateResult,
  PolicyResult,
  PolicySessionInput,
  ResourceChange,
} from './interface.js';
