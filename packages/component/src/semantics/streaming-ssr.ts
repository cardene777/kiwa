import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

export type StreamingSsrState =
  | 'idle'
  | 'suspense-pending'
  | 'error-captured'
  | 'progressive-hydrating'
  | 'selective-hydrated';

export interface StreamingSsrSession {
  target: ComponentTarget;
  routeId: string;
  state: StreamingSsrState;
  pendingBoundaries: Set<string>;
  hydratedBoundaries: Set<string>;
  errors: Array<{ boundaryId: string; message: string }>;
  history: AxisStep<StreamingSsrState>[];
}

export function startStreamingSsr(input: {
  target: ComponentTarget;
  routeId: string;
}): StreamingSsrSession {
  if (input.routeId.length === 0) {
    throw new Error('startStreamingSsr: routeId must not be empty');
  }
  return {
    target: input.target,
    routeId: input.routeId,
    state: 'idle',
    pendingBoundaries: new Set(),
    hydratedBoundaries: new Set(),
    errors: [],
    history: [],
  };
}

export function markSuspensePending(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState> {
  assertBoundaryId(boundaryId);
  session.state = 'suspense-pending';
  session.pendingBoundaries.add(boundaryId);
  return emit(session, 'ssr.suspense_pending', { boundaryId, pendingCount: session.pendingBoundaries.size });
}

export function captureErrorBoundary(
  session: StreamingSsrSession,
  input: { boundaryId: string; error: Error | string; recoverable?: boolean },
): AxisStep<StreamingSsrState> {
  assertBoundaryId(input.boundaryId);
  const message = typeof input.error === 'string' ? input.error : input.error.message;
  session.state = 'error-captured';
  session.errors.push({ boundaryId: input.boundaryId, message });
  if (input.recoverable === false) {
    session.pendingBoundaries.delete(input.boundaryId);
  }
  return emit(session, 'ssr.error_boundary_captured', {
    boundaryId: input.boundaryId,
    message,
    recoverable: input.recoverable ?? true,
  });
}

export function startProgressiveHydration(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState> {
  assertBoundaryId(boundaryId);
  if (!session.pendingBoundaries.has(boundaryId)) {
    throw new Error(`startProgressiveHydration: ${boundaryId} is not pending`);
  }
  session.state = 'progressive-hydrating';
  return emit(session, 'ssr.progressive_hydration_started', { boundaryId });
}

export function completeSelectiveHydration(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState> {
  assertBoundaryId(boundaryId);
  if (!session.pendingBoundaries.has(boundaryId)) {
    throw new Error(`completeSelectiveHydration: ${boundaryId} is not pending`);
  }
  session.pendingBoundaries.delete(boundaryId);
  session.hydratedBoundaries.add(boundaryId);
  session.state = 'selective-hydrated';
  return emit(session, 'ssr.selective_hydration_completed', {
    boundaryId,
    hydratedCount: session.hydratedBoundaries.size,
    remainingPending: session.pendingBoundaries.size,
  });
}

function assertBoundaryId(boundaryId: string): void {
  if (boundaryId.length === 0) {
    throw new Error('boundaryId must not be empty');
  }
}

function emit(
  session: StreamingSsrSession,
  neutralEvent: AxisStep<StreamingSsrState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<StreamingSsrState> {
  const step: AxisStep<StreamingSsrState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, routeId: session.routeId, ...metadata },
  };
  session.history.push(step);
  return step;
}
