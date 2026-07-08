import { providerEventName, type AxisStep, type NextTarget } from './types.js';

/**
 * v1.49 concurrent-transitions axis — React 18/19 concurrent features
 * (startTransition + useTransition + useDeferredValue) を target-neutral に
 * 扱う state machine。 interrupt-and-restart semantics も含む。
 */
export type ConcurrentTransitionState =
  | 'idle'
  | 'started'
  | 'pending'
  | 'interrupted'
  | 'committed';

export interface ConcurrentTransitionSession {
  target: NextTarget;
  transitionId: string;
  interruptions: number;
  pendingCount: number;
  state: ConcurrentTransitionState;
  committedValue: string | null;
  history: AxisStep<ConcurrentTransitionState>[];
}

function emit(
  session: ConcurrentTransitionSession,
  neutralEvent:
    | 'transition.started'
    | 'transition.pending'
    | 'transition.interrupted'
    | 'transition.committed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ConcurrentTransitionState> {
  const step: AxisStep<ConcurrentTransitionState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { transitionId: session.transitionId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startConcurrentTransition(input: {
  target: NextTarget;
  transitionId: string;
}): ConcurrentTransitionSession {
  if (input.transitionId.length === 0) {
    throw new Error('startConcurrentTransition: transitionId must not be empty');
  }
  const session: ConcurrentTransitionSession = {
    target: input.target,
    transitionId: input.transitionId,
    interruptions: 0,
    pendingCount: 0,
    state: 'started',
    committedValue: null,
    history: [],
  };
  emit(session, 'transition.started', { interruptions: 0 });
  return session;
}

export function markTransitionPending(
  session: ConcurrentTransitionSession,
): AxisStep<ConcurrentTransitionState> {
  if (session.state !== 'started' && session.state !== 'interrupted') {
    throw new Error(`markTransitionPending: session is ${session.state}`);
  }
  session.state = 'pending';
  session.pendingCount += 1;
  return emit(session, 'transition.pending', {
    pendingCount: session.pendingCount,
  });
}

export function interruptTransition(
  session: ConcurrentTransitionSession,
): AxisStep<ConcurrentTransitionState> {
  if (session.state !== 'pending') {
    throw new Error(`interruptTransition: session is ${session.state}`);
  }
  session.state = 'interrupted';
  session.interruptions += 1;
  return emit(session, 'transition.interrupted', {
    interruptions: session.interruptions,
  });
}

export function commitTransition(
  session: ConcurrentTransitionSession,
  committedValue: string,
): AxisStep<ConcurrentTransitionState> {
  if (session.state !== 'pending' && session.state !== 'started') {
    throw new Error(`commitTransition: session is ${session.state}`);
  }
  session.state = 'committed';
  session.committedValue = committedValue;
  return emit(session, 'transition.committed', {
    committedValue,
    totalInterruptions: session.interruptions,
    totalPending: session.pendingCount,
  });
}
