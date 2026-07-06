import { providerEventName, type AxisStep, type NextTarget } from './types.js';

export type ParallelRoutesAdvancedState =
  | 'idle'
  | 'default-rendered'
  | 'loading-rendered'
  | 'error-captured'
  | 'slot-navigated';

export interface ParallelRoutesAdvancedSession {
  target: NextTarget;
  layoutId: string;
  state: ParallelRoutesAdvancedState;
  slots: Map<string, string>;
  loadingSlots: Set<string>;
  errors: Array<{ slot: string; message: string }>;
  history: AxisStep<ParallelRoutesAdvancedState>[];
}

export function startParallelRoutesAdvanced(input: {
  target: NextTarget;
  layoutId: string;
}): ParallelRoutesAdvancedSession {
  if (input.layoutId.length === 0) {
    throw new Error('startParallelRoutesAdvanced: layoutId must not be empty');
  }
  return {
    target: input.target,
    layoutId: input.layoutId,
    state: 'idle',
    slots: new Map(),
    loadingSlots: new Set(),
    errors: [],
    history: [],
  };
}

export function renderDefaultSlot(
  session: ParallelRoutesAdvancedSession,
  slot: string,
  html: string,
): AxisStep<ParallelRoutesAdvancedState> {
  assertSlot(slot);
  session.state = 'default-rendered';
  session.slots.set(slot, html);
  return emit(session, 'parallel.default_rendered', { slot, html });
}

export function renderLoadingState(
  session: ParallelRoutesAdvancedSession,
  slot: string,
): AxisStep<ParallelRoutesAdvancedState> {
  assertSlot(slot);
  session.state = 'loading-rendered';
  session.loadingSlots.add(slot);
  return emit(session, 'parallel.loading_rendered', {
    slot,
    loadingCount: session.loadingSlots.size,
  });
}

export function captureParallelError(
  session: ParallelRoutesAdvancedSession,
  input: { slot: string; error: Error | string },
): AxisStep<ParallelRoutesAdvancedState> {
  assertSlot(input.slot);
  const message = typeof input.error === 'string' ? input.error : input.error.message;
  session.state = 'error-captured';
  session.errors.push({ slot: input.slot, message });
  return emit(session, 'parallel.error_boundary_captured', {
    slot: input.slot,
    message,
    errorCount: session.errors.length,
  });
}

export function navigateSlot(
  session: ParallelRoutesAdvancedSession,
  input: { slot: string; from: string; to: string },
): AxisStep<ParallelRoutesAdvancedState> {
  assertSlot(input.slot);
  if (!input.from.startsWith('/') || !input.to.startsWith('/')) {
    throw new Error('navigateSlot: from and to must start with /');
  }
  session.state = 'slot-navigated';
  session.loadingSlots.delete(input.slot);
  return emit(session, 'parallel.slot_navigated', input);
}

function assertSlot(slot: string): void {
  if (slot.length === 0) {
    throw new Error('slot must not be empty');
  }
}

function emit(
  session: ParallelRoutesAdvancedSession,
  neutralEvent: AxisStep<ParallelRoutesAdvancedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ParallelRoutesAdvancedState> {
  const step: AxisStep<ParallelRoutesAdvancedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, layoutId: session.layoutId, ...metadata },
  };
  session.history.push(step);
  return step;
}
