import { providerEventName, type AxisStep, type NextTarget } from './types.js';

/**
 * v1.49 turbopack-hmr axis — Next.js 15 Turbopack HMR + fast refresh を
 * target-neutral に扱う state machine。 pages-router では webpack HMR、
 * edge-runtime では esbuild HMR に mapping。
 */
export type TurbopackHmrState = 'idle' | 'updating' | 'boundary-found' | 'applied' | 'refresh-completed';

export interface TurbopackHmrSession {
  target: NextTarget;
  sessionId: string;
  updatedModuleIds: string[];
  boundaryModuleId: string | null;
  state: TurbopackHmrState;
  history: AxisStep<TurbopackHmrState>[];
}

function emit(
  session: TurbopackHmrSession,
  neutralEvent:
    | 'turbopack.module_updated'
    | 'turbopack.hmr_boundary_found'
    | 'turbopack.hmr_applied'
    | 'turbopack.fast_refresh_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<TurbopackHmrState> {
  const step: AxisStep<TurbopackHmrState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startTurbopackHmr(input: {
  target: NextTarget;
  sessionId: string;
}): TurbopackHmrSession {
  if (input.sessionId.length === 0) {
    throw new Error('startTurbopackHmr: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    updatedModuleIds: [],
    boundaryModuleId: null,
    state: 'idle',
    history: [],
  };
}

export function markModuleUpdated(
  session: TurbopackHmrSession,
  moduleId: string,
): AxisStep<TurbopackHmrState> {
  session.updatedModuleIds.push(moduleId);
  session.state = 'updating';
  return emit(session, 'turbopack.module_updated', {
    moduleId,
    updateCount: session.updatedModuleIds.length,
  });
}

export function findHmrBoundary(
  session: TurbopackHmrSession,
  boundaryModuleId: string,
): AxisStep<TurbopackHmrState> {
  if (session.state !== 'updating') {
    throw new Error(`findHmrBoundary: session is ${session.state}`);
  }
  session.boundaryModuleId = boundaryModuleId;
  session.state = 'boundary-found';
  return emit(session, 'turbopack.hmr_boundary_found', { boundaryModuleId });
}

export function applyHmrPatch(
  session: TurbopackHmrSession,
): AxisStep<TurbopackHmrState> {
  if (session.state !== 'boundary-found') {
    throw new Error(`applyHmrPatch: session is ${session.state}`);
  }
  session.state = 'applied';
  return emit(session, 'turbopack.hmr_applied', {
    updatedModuleCount: session.updatedModuleIds.length,
  });
}

export function completeFastRefresh(
  session: TurbopackHmrSession,
): AxisStep<TurbopackHmrState> {
  if (session.state !== 'applied') {
    throw new Error(`completeFastRefresh: session is ${session.state}`);
  }
  session.state = 'refresh-completed';
  return emit(session, 'turbopack.fast_refresh_completed', {
    updatedModuleCount: session.updatedModuleIds.length,
  });
}
