import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.51 reanimated axis — Reanimated 3 shared value + worklet + animation。
 */
export type ReanimatedState = 'idle' | 'value-updated' | 'worklet-run' | 'animating' | 'completed';

export interface ReanimatedSession {
  target: MobileTarget;
  animationId: string;
  state: ReanimatedState;
  sharedValueUpdates: number;
  workletExecutions: number;
  history: AxisStep<ReanimatedState>[];
}

function emit(
  session: ReanimatedSession,
  neutralEvent:
    | 'reanimated.shared_value_updated'
    | 'reanimated.worklet_executed'
    | 'reanimated.animation_started'
    | 'reanimated.animation_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ReanimatedState> {
  const step: AxisStep<ReanimatedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { animationId: session.animationId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initReanimated(input: { target: MobileTarget; animationId: string }): ReanimatedSession {
  if (input.animationId.length === 0) throw new Error('initReanimated: animationId must not be empty');
  return {
    target: input.target,
    animationId: input.animationId,
    state: 'idle',
    sharedValueUpdates: 0,
    workletExecutions: 0,
    history: [],
  };
}

export function updateSharedValue(
  session: ReanimatedSession,
  input: { name: string; value: number },
): AxisStep<ReanimatedState> {
  session.sharedValueUpdates += 1;
  session.state = 'value-updated';
  return emit(session, 'reanimated.shared_value_updated', {
    name: input.name,
    value: input.value,
    updates: session.sharedValueUpdates,
  });
}

export function executeWorklet(session: ReanimatedSession, workletName: string): AxisStep<ReanimatedState> {
  if (workletName.length === 0) throw new Error('executeWorklet: workletName must not be empty');
  session.workletExecutions += 1;
  session.state = 'worklet-run';
  return emit(session, 'reanimated.worklet_executed', {
    workletName,
    executions: session.workletExecutions,
  });
}

export function startReanimatedAnimation(
  session: ReanimatedSession,
  input: { durationMs: number; easing: 'linear' | 'ease' | 'spring' },
): AxisStep<ReanimatedState> {
  if (input.durationMs < 0) throw new Error('startReanimatedAnimation: durationMs must be >= 0');
  session.state = 'animating';
  return emit(session, 'reanimated.animation_started', {
    durationMs: input.durationMs,
    easing: input.easing,
  });
}

export function completeReanimatedAnimation(session: ReanimatedSession): AxisStep<ReanimatedState> {
  if (session.state !== 'animating') {
    throw new Error(`completeReanimatedAnimation: session is ${session.state}`);
  }
  session.state = 'completed';
  return emit(session, 'reanimated.animation_completed', {
    sharedValueUpdates: session.sharedValueUpdates,
    workletExecutions: session.workletExecutions,
  });
}
