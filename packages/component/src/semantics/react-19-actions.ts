import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

/**
 * v1.49 react-19-actions axis — useActionState + useOptimistic + useFormStatus
 * を統合した React 19 Actions API の deterministic state machine。
 */
export type ReactActionsState =
  | 'idle'
  | 'transition-pending'
  | 'optimistic-committed'
  | 'resolved';

export interface ReactActionsSession {
  target: ComponentTarget;
  actionId: string;
  state: ReactActionsState;
  pendingCount: number;
  optimisticValues: string[];
  resolvedValue: string | null;
  history: AxisStep<ReactActionsState>[];
}

function emit(
  session: ReactActionsSession,
  neutralEvent:
    | 'action.state_initialized'
    | 'action.transition_pending'
    | 'action.optimistic_committed'
    | 'action.resolved',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ReactActionsState> {
  const step: AxisStep<ReactActionsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { actionId: session.actionId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initializeReactActions(input: {
  target: ComponentTarget;
  actionId: string;
}): ReactActionsSession {
  if (input.actionId.length === 0) {
    throw new Error('initializeReactActions: actionId must not be empty');
  }
  const session: ReactActionsSession = {
    target: input.target,
    actionId: input.actionId,
    state: 'idle',
    pendingCount: 0,
    optimisticValues: [],
    resolvedValue: null,
    history: [],
  };
  emit(session, 'action.state_initialized', { pendingCount: 0 });
  return session;
}

export function beginActionTransition(
  session: ReactActionsSession,
): AxisStep<ReactActionsState> {
  if (session.state !== 'idle' && session.state !== 'resolved') {
    throw new Error(`beginActionTransition: session is ${session.state}`);
  }
  session.state = 'transition-pending';
  session.pendingCount += 1;
  return emit(session, 'action.transition_pending', {
    pendingCount: session.pendingCount,
  });
}

export function applyOptimisticUpdate(
  session: ReactActionsSession,
  optimisticValue: string,
): AxisStep<ReactActionsState> {
  if (session.state !== 'transition-pending') {
    throw new Error(`applyOptimisticUpdate: session is ${session.state}`);
  }
  session.state = 'optimistic-committed';
  session.optimisticValues.push(optimisticValue);
  return emit(session, 'action.optimistic_committed', { optimisticValue });
}

export function resolveAction(
  session: ReactActionsSession,
  resolvedValue: string,
): AxisStep<ReactActionsState> {
  if (session.state !== 'transition-pending' && session.state !== 'optimistic-committed') {
    throw new Error(`resolveAction: session is ${session.state}`);
  }
  session.state = 'resolved';
  session.resolvedValue = resolvedValue;
  session.pendingCount = Math.max(0, session.pendingCount - 1);
  return emit(session, 'action.resolved', {
    resolvedValue,
    pendingCount: session.pendingCount,
    optimisticCount: session.optimisticValues.length,
  });
}
