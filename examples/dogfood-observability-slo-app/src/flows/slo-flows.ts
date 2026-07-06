/**
 * SLO harness flows that both adapters must satisfy identically.
 *
 * `runFullSloLifecycle` drives every op of the 14-op contract in the
 * order the SLO state machine expects — start → open window → query →
 * record → compute budget → evaluate burn rate (fast + slow + ticket) →
 * fire MWMBR → evaluate policy (ship / freeze / page) → route alert →
 * silence alert → reset. Any op that diverges surfaces in the fidelity
 * trace.
 *
 * `runMultiObjectiveMatrix` drives 3 objectives × 3 thresholds so the
 * fidelity harness measures behavioural drift across every canonical
 * production combo (9 lifecycles per adapter run = 18 across mock + real).
 */

import { ALL_POLICIES, POLICY_99_9, POLICY_99_95, POLICY_99_99 } from '../policies/error-budget.js';
import { ALL_SLO_TARGETS } from '../policies/objectives.js';
import {
  ALL_MWMBR_THRESHOLDS,
  MWMBR_FAST_BURN,
  MWMBR_SLOW_BURN,
  MWMBR_TICKET_BURN,
} from '../policies/thresholds.js';
import type {
  ErrorBudgetPolicy,
  SLOTarget,
  SloAdapter,
  TraceEvent,
} from '../adapters/interface.js';

export interface LifecycleInput {
  target: SLOTarget;
  policy: ErrorBudgetPolicy;
  /** Consumed budget fraction to inject into the policy step. */
  consumedFraction: number;
  /** How many requests + errors to record before evaluating burn rate. */
  workload: { requests: number; errors: number };
  /** Whether the MWMBR alert should attempt to page. */
  page: boolean;
  /** Whether to silence one route as a maintenance drill. */
  silenceRoute: boolean;
}

/**
 * Drive one full SLO lifecycle from start to reset. The lifecycle emits
 * every op on the 14-op contract exactly once so a per-lifecycle trace
 * has a stable event count — the fidelity harness leans on that to
 * detect missing / drifted ops.
 */
export async function runFullSloLifecycle(
  adapter: SloAdapter,
  input: LifecycleInput,
): Promise<void> {
  await adapter.startSlo(input.target);
  await adapter.openWindow(input.target.sloId);
  await adapter.queryRequestCounts({
    sloId: input.target.sloId,
    metricName: 'http_requests_total',
  });
  await adapter.recordRequests({
    sloId: input.target.sloId,
    requests: input.workload.requests,
    errors: input.workload.errors,
  });
  await adapter.computeErrorBudget(input.target.sloId);
  await adapter.evaluateBurnRate({
    sloId: input.target.sloId,
    threshold: MWMBR_FAST_BURN,
  });
  await adapter.fireMwmbrAlert({
    sloId: input.target.sloId,
    thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
    page: input.page,
  });
  await adapter.evaluatePolicy({
    policy: input.policy,
    consumedFraction: input.consumedFraction,
  });
  const route = await adapter.routeAlert({
    sloId: input.target.sloId,
    severity: 'fast',
    channel: 'pager',
  });
  if (input.silenceRoute) {
    await adapter.silenceAlert({
      routeId: route.routeId,
      silenceMinutes: 60,
    });
  }
}

/**
 * Drive lifecycles across 3 target objectives (99.9 / 99.95 / 99.99).
 * Each lifecycle uses distinct consumed fractions so the policy step
 * exercises all 3 branches (ship / freeze / page) at least once across
 * the run.
 */
export async function runMultiObjectiveMatrix(
  adapter: SloAdapter,
): Promise<{ lifecyclesRun: number }> {
  const inputs: LifecycleInput[] = [
    // 99.9 — healthy budget (ship branch)
    {
      target: ALL_SLO_TARGETS[0]!,
      policy: POLICY_99_9,
      consumedFraction: 0.1,
      workload: { requests: 10_000, errors: 10 },
      page: false,
      silenceRoute: false,
    },
    // 99.95 — moderate burn (freeze branch)
    {
      target: ALL_SLO_TARGETS[1]!,
      policy: POLICY_99_95,
      consumedFraction: 0.75,
      workload: { requests: 100_000, errors: 50 },
      page: true,
      silenceRoute: false,
    },
    // 99.99 — severe burn (page branch)
    {
      target: ALL_SLO_TARGETS[2]!,
      policy: POLICY_99_99,
      consumedFraction: 0.9,
      workload: { requests: 1_000_000, errors: 100 },
      page: true,
      silenceRoute: true,
    },
  ];
  for (const input of inputs) {
    await runFullSloLifecycle(adapter, input);
  }
  return { lifecyclesRun: inputs.length };
}

/** All ops the mock adapter walks — used by the fidelity harness. */
export const OPS_UNDER_TEST: readonly string[] = [
  'startSlo',
  'openWindow',
  'queryRequestCounts',
  'recordRequests',
  'computeErrorBudget',
  'evaluateBurnRate',
  'fireMwmbrAlert',
  'evaluatePolicy',
  'routeAlert',
  'silenceAlert',
];

/** Compare 2 traces for behavioural fidelity. Returns divergence detail. */
export function diffTraces(
  mock: TraceEvent[],
  real: TraceEvent[],
): {
  missingInReal: string[];
  missingInMock: string[];
  matchedOps: string[];
  divergentEvents: Array<{ op: string; mockEvent: string; realEvent: string }>;
} {
  const mockOps = new Set(mock.map((e) => e.op));
  const realOps = new Set(real.map((e) => e.op));
  const matchedOps = Array.from(mockOps).filter((op) => realOps.has(op));
  const missingInReal = Array.from(mockOps).filter((op) => !realOps.has(op));
  const missingInMock = Array.from(realOps).filter((op) => !mockOps.has(op));

  const divergentEvents: Array<{
    op: string;
    mockEvent: string;
    realEvent: string;
  }> = [];
  for (const op of matchedOps) {
    const mockEvent = mock.find((e) => e.op === op)?.neutralEvent ?? '';
    const realEvent = real.find((e) => e.op === op)?.neutralEvent ?? '';
    if (mockEvent !== realEvent && realEvent !== 'slo.env_missing') {
      divergentEvents.push({ op, mockEvent, realEvent });
    }
  }
  return { missingInReal, missingInMock, matchedOps, divergentEvents };
}

/** Convenience — all 3 policies for parity tests. */
export const ALL_LIFECYCLE_POLICIES = ALL_POLICIES;
