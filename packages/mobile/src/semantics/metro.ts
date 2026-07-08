import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * Metro axis — bundle start + module resolve + HMR + bundle complete の
 * 4 step deterministic state machine。
 */
export type MetroState = 'idle' | 'bundling' | 'resolved' | 'hmr-applied' | 'completed';

export interface MetroSession {
  target: MobileTarget;
  bundleId: string;
  state: MetroState;
  resolvedModules: string[];
  hmrUpdateCount: number;
  history: AxisStep<MetroState>[];
}

function emit(
  session: MetroSession,
  neutralEvent:
    | 'metro.bundle_started'
    | 'metro.module_resolved'
    | 'metro.hmr_applied'
    | 'metro.bundle_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<MetroState> {
  const step: AxisStep<MetroState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { bundleId: session.bundleId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startMetroBundle(input: {
  target: MobileTarget;
  bundleId: string;
}): MetroSession {
  if (input.bundleId.length === 0) {
    throw new Error('startMetroBundle: bundleId must not be empty');
  }
  const session: MetroSession = {
    target: input.target,
    bundleId: input.bundleId,
    state: 'bundling',
    resolvedModules: [],
    hmrUpdateCount: 0,
    history: [],
  };
  emit(session, 'metro.bundle_started', { target: input.target });
  return session;
}

export function resolveMetroModule(
  session: MetroSession,
  modulePath: string,
): AxisStep<MetroState> {
  if (session.state === 'idle') {
    throw new Error('resolveMetroModule: bundle must be started first');
  }
  session.resolvedModules.push(modulePath);
  session.state = 'resolved';
  return emit(session, 'metro.module_resolved', {
    modulePath,
    resolvedCount: session.resolvedModules.length,
  });
}

export function applyMetroHmr(
  session: MetroSession,
  moduleId: string,
): AxisStep<MetroState> {
  if (session.state === 'idle') {
    throw new Error('applyMetroHmr: bundle must be started first');
  }
  session.hmrUpdateCount += 1;
  session.state = 'hmr-applied';
  return emit(session, 'metro.hmr_applied', {
    moduleId,
    hmrCount: session.hmrUpdateCount,
  });
}

export function completeMetroBundle(
  session: MetroSession,
): AxisStep<MetroState> {
  if (session.state === 'idle') {
    throw new Error('completeMetroBundle: bundle must be started first');
  }
  session.state = 'completed';
  return emit(session, 'metro.bundle_completed', {
    resolvedCount: session.resolvedModules.length,
    hmrCount: session.hmrUpdateCount,
  });
}
