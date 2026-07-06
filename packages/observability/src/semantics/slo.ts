import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type SLOState =
  | 'idle'
  | 'window-open'
  | 'budget-computed'
  | 'burn-evaluated'
  | 'alert-fired';

export interface SLOSession {
  target: ObservabilityTarget;
  sloId: string;
  targetObjective: number;
  windowDays: number;
  totalRequests: number;
  totalErrors: number;
  errorBudgetSeconds: number;
  burnRate: number;
  state: SLOState;
  history: AxisStep<SLOState>[];
}

export interface BurnRateThreshold {
  shortWindowMinutes: number;
  longWindowMinutes: number;
  burnRate: number;
}

export function startSLO(input: {
  target: ObservabilityTarget;
  sloId: string;
  targetObjective: number;
  windowDays: number;
}): SLOSession {
  if (input.sloId.length === 0) {
    throw new Error('startSLO: sloId must not be empty');
  }
  if (input.targetObjective <= 0 || input.targetObjective >= 1) {
    throw new Error('startSLO: targetObjective must be 0 < objective < 1');
  }
  if (input.windowDays <= 0) {
    throw new Error('startSLO: windowDays must be positive');
  }
  return {
    target: input.target,
    sloId: input.sloId,
    targetObjective: input.targetObjective,
    windowDays: input.windowDays,
    totalRequests: 0,
    totalErrors: 0,
    errorBudgetSeconds: 0,
    burnRate: 0,
    state: 'idle',
    history: [],
  };
}

export function openSLOWindow(session: SLOSession): AxisStep<SLOState> {
  if (session.state !== 'idle') {
    throw new Error(`openSLOWindow: session is ${session.state}, not idle`);
  }
  session.state = 'window-open';
  return emit(session, 'slo.window_opened', {
    windowDays: session.windowDays,
    targetObjective: session.targetObjective,
  });
}

export function recordRequests(
  session: SLOSession,
  input: { requests: number; errors: number },
): void {
  if (session.state === 'idle') {
    throw new Error('recordRequests: window must be opened first');
  }
  if (input.requests < 0 || input.errors < 0) {
    throw new Error('recordRequests: counts must be non-negative');
  }
  if (input.errors > input.requests) {
    throw new Error('recordRequests: errors must not exceed requests');
  }
  session.totalRequests += input.requests;
  session.totalErrors += input.errors;
}

export function computeErrorBudget(session: SLOSession): AxisStep<SLOState> {
  if (session.state !== 'window-open') {
    throw new Error(`computeErrorBudget: session is ${session.state}, not window-open`);
  }
  const allowedErrorRate = 1 - session.targetObjective;
  const windowSeconds = session.windowDays * 86_400;
  session.errorBudgetSeconds = allowedErrorRate * windowSeconds;
  session.state = 'budget-computed';
  return emit(session, 'slo.error_budget_computed', {
    allowedErrorRate,
    windowSeconds,
    errorBudgetSeconds: session.errorBudgetSeconds,
  });
}

export function evaluateBurnRate(
  session: SLOSession,
  threshold: BurnRateThreshold,
): AxisStep<SLOState> {
  if (session.state !== 'budget-computed') {
    throw new Error(`evaluateBurnRate: session is ${session.state}, not budget-computed`);
  }
  const actualErrorRate = session.totalRequests === 0 ? 0 : session.totalErrors / session.totalRequests;
  const allowedErrorRate = 1 - session.targetObjective;
  session.burnRate = allowedErrorRate === 0 ? 0 : actualErrorRate / allowedErrorRate;
  session.state = 'burn-evaluated';
  return emit(session, 'slo.burn_rate_evaluated', {
    burnRate: session.burnRate,
    thresholdShortMin: threshold.shortWindowMinutes,
    thresholdLongMin: threshold.longWindowMinutes,
    thresholdRate: threshold.burnRate,
  });
}

export function fireMultiWindowMultiBurnRateAlert(
  session: SLOSession,
  input: { thresholds: BurnRateThreshold[]; page: boolean },
): AxisStep<SLOState> {
  if (session.state !== 'burn-evaluated') {
    throw new Error(`fireMultiWindowMultiBurnRateAlert: session is ${session.state}, not burn-evaluated`);
  }
  if (input.thresholds.length === 0) {
    throw new Error('fireMultiWindowMultiBurnRateAlert: thresholds must not be empty');
  }
  const matched = input.thresholds.some((t) => session.burnRate >= t.burnRate);
  session.state = 'alert-fired';
  return emit(session, 'slo.multi_window_alert_fired', {
    fired: matched,
    burnRate: session.burnRate,
    pagerEnabled: input.page,
    thresholdCount: input.thresholds.length,
  });
}

function emit(
  session: SLOSession,
  neutralEvent: AxisStep<SLOState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<SLOState> {
  const step: AxisStep<SLOState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sloId: session.sloId, ...metadata },
  };
  session.history.push(step);
  return step;
}
