import { providerEventName, type AxisStep, type NextTarget } from './types.js';

export type InterceptionRoutesState = 'idle' | 'current' | 'parent' | 'root' | 'modal-open';
export type InterceptionMatcher = '(.)' | '(..)' | '(...)';

export interface InterceptionRoutesSession {
  target: NextTarget;
  routeId: string;
  state: InterceptionRoutesState;
  matches: Array<{ matcher: InterceptionMatcher; from: string; to: string }>;
  modalRoute: string | null;
  history: AxisStep<InterceptionRoutesState>[];
}

export function startInterceptionRoutes(input: {
  target: NextTarget;
  routeId: string;
}): InterceptionRoutesSession {
  if (input.routeId.length === 0) {
    throw new Error('startInterceptionRoutes: routeId must not be empty');
  }
  return {
    target: input.target,
    routeId: input.routeId,
    state: 'idle',
    matches: [],
    modalRoute: null,
    history: [],
  };
}

export function interceptCurrentSegment(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState> {
  return intercept(session, '(.)', 'current', 'intercept.current_segment', from, to);
}

export function interceptParentSegment(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState> {
  return intercept(session, '(..)', 'parent', 'intercept.parent_segment', from, to);
}

export function interceptRootCatchall(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState> {
  return intercept(session, '(...)', 'root', 'intercept.root_catchall', from, to);
}

export function openInterceptedModal(
  session: InterceptionRoutesSession,
  modalRoute: string,
): AxisStep<InterceptionRoutesState> {
  if (modalRoute.length === 0) {
    throw new Error('openInterceptedModal: modalRoute must not be empty');
  }
  if (session.matches.length === 0) {
    throw new Error('openInterceptedModal: an interception match is required first');
  }
  session.state = 'modal-open';
  session.modalRoute = modalRoute;
  return emit(session, 'intercept.modal_opened', {
    modalRoute,
    matchCount: session.matches.length,
  });
}

function intercept(
  session: InterceptionRoutesSession,
  matcher: InterceptionMatcher,
  state: InterceptionRoutesState,
  neutralEvent: AxisStep<InterceptionRoutesState>['neutralEvent'],
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState> {
  if (!from.startsWith('/') || !to.startsWith('/')) {
    throw new Error('intercept: from and to must start with /');
  }
  session.state = state;
  session.matches.push({ matcher, from, to });
  return emit(session, neutralEvent, { matcher, from, to });
}

function emit(
  session: InterceptionRoutesSession,
  neutralEvent: AxisStep<InterceptionRoutesState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<InterceptionRoutesState> {
  const step: AxisStep<InterceptionRoutesState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, routeId: session.routeId, ...metadata },
  };
  session.history.push(step);
  return step;
}
