import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

export type ViewTransitionState =
  | 'idle'
  | 'element-transitioning'
  | 'document-transitioning'
  | 'asserted'
  | 'finished';

export interface ViewTransitionSession {
  target: ComponentTarget;
  transitionId: string;
  state: ViewTransitionState;
  activeElements: Set<string>;
  documentTransition: string | null;
  assertions: string[];
  history: AxisStep<ViewTransitionState>[];
}

export function startViewTransitionSession(input: {
  target: ComponentTarget;
  transitionId: string;
}): ViewTransitionSession {
  if (input.transitionId.length === 0) {
    throw new Error('startViewTransitionSession: transitionId must not be empty');
  }
  return {
    target: input.target,
    transitionId: input.transitionId,
    state: 'idle',
    activeElements: new Set(),
    documentTransition: null,
    assertions: [],
    history: [],
  };
}

export function startElementTransition(
  session: ViewTransitionSession,
  input: { elementId: string; from: string; to: string },
): AxisStep<ViewTransitionState> {
  if (input.elementId.length === 0) {
    throw new Error('startElementTransition: elementId must not be empty');
  }
  session.state = 'element-transitioning';
  session.activeElements.add(input.elementId);
  return emit(session, 'transition.element_started', input);
}

export function finishElementTransition(
  session: ViewTransitionSession,
  elementId: string,
): AxisStep<ViewTransitionState> {
  if (!session.activeElements.has(elementId)) {
    throw new Error(`finishElementTransition: ${elementId} is not active`);
  }
  session.activeElements.delete(elementId);
  session.state = session.activeElements.size === 0 ? 'finished' : 'element-transitioning';
  return emit(session, 'transition.element_finished', {
    elementId,
    remaining: session.activeElements.size,
  });
}

export function startDocumentTransition(
  session: ViewTransitionSession,
  input: { name: string; fromUrl: string; toUrl: string },
): AxisStep<ViewTransitionState> {
  if (input.name.length === 0) {
    throw new Error('startDocumentTransition: name must not be empty');
  }
  session.state = 'document-transitioning';
  session.documentTransition = input.name;
  return emit(session, 'transition.document_started', input);
}

export function assertAnimation(
  session: ViewTransitionSession,
  input: { assertionId: string; durationMs: number; easing?: string },
): AxisStep<ViewTransitionState> {
  if (input.durationMs < 0) {
    throw new Error('assertAnimation: durationMs must be >= 0');
  }
  session.state = 'asserted';
  session.assertions.push(input.assertionId);
  return emit(session, 'transition.animation_asserted', {
    assertionId: input.assertionId,
    durationMs: input.durationMs,
    easing: input.easing ?? 'linear',
  });
}

function emit(
  session: ViewTransitionSession,
  neutralEvent: AxisStep<ViewTransitionState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ViewTransitionState> {
  const step: AxisStep<ViewTransitionState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, transitionId: session.transitionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
