import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * Chaos engineering axis — fault injection + blast radius + auto-rollback +
 * game day recording state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: inject-fault → compute-blast-radius → trigger-rollback → record-game-day.
 * blast radius = affected instances / total、 rollback は SLO error rate 超過で trigger、
 * game day は participants + issues + minutes を記録して post-mortem に流す想定。
 */

export type ChaosState =
  | 'idle'
  | 'fault-injected'
  | 'blast-radius-computed'
  | 'rollback-triggered'
  | 'game-day-recorded';

export type ChaosFaultKind = 'network-latency' | 'network-partition' | 'pod-kill' | 'cpu-stress' | 'disk-fill';

export interface ChaosFault {
  kind: ChaosFaultKind;
  target: string;
  durationSec: number;
}

export interface ChaosGameDayLog {
  participants: number;
  issuesFound: number;
  durationMinutes: number;
}

export interface ChaosSession {
  target: ObservabilityTarget;
  experimentId: string;
  state: ChaosState;
  history: AxisStep<ChaosState>[];
  fault: ChaosFault | null;
  blastRadiusRatio: number;
  affectedInstances: number;
  rollbackTriggered: boolean;
  gameDayLog: ChaosGameDayLog | null;
}

export function startChaosSession(input: {
  target: ObservabilityTarget;
  experimentId: string;
}): ChaosSession {
  if (input.experimentId.length === 0) {
    throw new Error('startChaosSession: experimentId must not be empty');
  }
  return {
    target: input.target,
    experimentId: input.experimentId,
    state: 'idle',
    history: [],
    fault: null,
    blastRadiusRatio: 0,
    affectedInstances: 0,
    rollbackTriggered: false,
    gameDayLog: null,
  };
}

export function injectFault(
  session: ChaosSession,
  input: ChaosFault,
): AxisStep<ChaosState> {
  if (session.state !== 'idle') {
    throw new Error(`injectFault: session is ${session.state}, not idle`);
  }
  if (input.target.length === 0) {
    throw new Error('injectFault: target must not be empty');
  }
  if (input.durationSec <= 0) {
    throw new Error('injectFault: durationSec must be positive');
  }
  session.fault = { ...input };
  session.state = 'fault-injected';
  return emit(session, 'chaos.fault_injected', {
    kind: input.kind,
    target: input.target,
    durationSec: input.durationSec,
  });
}

export function computeBlastRadius(
  session: ChaosSession,
  input: { affectedInstances: number; totalInstances: number },
): AxisStep<ChaosState> {
  if (session.state !== 'fault-injected') {
    throw new Error(`computeBlastRadius: session is ${session.state}, not fault-injected`);
  }
  if (input.totalInstances <= 0) {
    throw new Error('computeBlastRadius: totalInstances must be positive');
  }
  if (input.affectedInstances < 0 || input.affectedInstances > input.totalInstances) {
    throw new Error('computeBlastRadius: affectedInstances must be within [0, totalInstances]');
  }
  session.affectedInstances = input.affectedInstances;
  session.blastRadiusRatio = input.affectedInstances / input.totalInstances;
  session.state = 'blast-radius-computed';
  return emit(session, 'chaos.blast_radius_computed', {
    affectedInstances: input.affectedInstances,
    totalInstances: input.totalInstances,
    blastRadiusRatio: session.blastRadiusRatio,
  });
}

export function triggerRollback(
  session: ChaosSession,
  input: { errorRate: number; threshold: number },
): AxisStep<ChaosState> {
  if (session.state !== 'blast-radius-computed') {
    throw new Error(`triggerRollback: session is ${session.state}, not blast-radius-computed`);
  }
  if (input.errorRate < 0 || input.errorRate > 1) {
    throw new Error('triggerRollback: errorRate must be within [0, 1]');
  }
  if (input.threshold < 0 || input.threshold > 1) {
    throw new Error('triggerRollback: threshold must be within [0, 1]');
  }
  session.rollbackTriggered = input.errorRate >= input.threshold;
  session.state = 'rollback-triggered';
  return emit(session, 'chaos.rollback_triggered', {
    triggered: session.rollbackTriggered,
    errorRate: input.errorRate,
    threshold: input.threshold,
  });
}

export function recordGameDay(
  session: ChaosSession,
  input: ChaosGameDayLog,
): AxisStep<ChaosState> {
  if (session.state !== 'rollback-triggered') {
    throw new Error(`recordGameDay: session is ${session.state}, not rollback-triggered`);
  }
  if (input.participants <= 0) {
    throw new Error('recordGameDay: participants must be positive');
  }
  if (input.issuesFound < 0) {
    throw new Error('recordGameDay: issuesFound must be non-negative');
  }
  if (input.durationMinutes <= 0) {
    throw new Error('recordGameDay: durationMinutes must be positive');
  }
  session.gameDayLog = { ...input };
  session.state = 'game-day-recorded';
  return emit(session, 'chaos.game_day_recorded', {
    participants: input.participants,
    issuesFound: input.issuesFound,
    durationMinutes: input.durationMinutes,
  });
}

function emit(
  session: ChaosSession,
  neutralEvent: AxisStep<ChaosState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ChaosState> {
  const step: AxisStep<ChaosState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, experimentId: session.experimentId, ...metadata },
  };
  session.history.push(step);
  return step;
}
