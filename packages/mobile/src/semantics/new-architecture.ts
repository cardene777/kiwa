import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.52 new-architecture axis — React Native 0.76+ New Architecture (async init + concurrent React + interop layer)。
 */
export type NewArchitectureState = 'idle' | 'initializing' | 'concurrent-enabled' | 'interop-bridged' | 'ready';

export interface NewArchitectureSession {
  target: MobileTarget;
  appName: string;
  state: NewArchitectureState;
  concurrentEnabled: boolean;
  bridgedLegacyModules: string[];
  history: AxisStep<NewArchitectureState>[];
}

function emit(
  session: NewArchitectureSession,
  neutralEvent:
    | 'new-architecture.init_started'
    | 'new-architecture.concurrent_enabled'
    | 'new-architecture.interop_bridged'
    | 'new-architecture.ready',
  metadata: Record<string, string | number | boolean>,
): AxisStep<NewArchitectureState> {
  const step: AxisStep<NewArchitectureState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { appName: session.appName, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initNewArchitecture(input: {
  target: MobileTarget;
  appName: string;
}): NewArchitectureSession {
  if (input.appName.length === 0) throw new Error('initNewArchitecture: appName must not be empty');
  return {
    target: input.target,
    appName: input.appName,
    state: 'idle',
    concurrentEnabled: false,
    bridgedLegacyModules: [],
    history: [],
  };
}

export function startNewArchInit(session: NewArchitectureSession): AxisStep<NewArchitectureState> {
  if (session.state !== 'idle') {
    throw new Error(`startNewArchInit: session is ${session.state}`);
  }
  session.state = 'initializing';
  return emit(session, 'new-architecture.init_started', { target: session.target });
}

export function enableConcurrentReact(
  session: NewArchitectureSession,
): AxisStep<NewArchitectureState> {
  if (session.state !== 'initializing') {
    throw new Error(`enableConcurrentReact: session is ${session.state}`);
  }
  session.concurrentEnabled = true;
  session.state = 'concurrent-enabled';
  return emit(session, 'new-architecture.concurrent_enabled', { concurrent: true });
}

export function bridgeLegacyModule(
  session: NewArchitectureSession,
  moduleName: string,
): AxisStep<NewArchitectureState> {
  if (session.state !== 'concurrent-enabled' && session.state !== 'interop-bridged') {
    throw new Error(`bridgeLegacyModule: session is ${session.state}`);
  }
  if (moduleName.length === 0) throw new Error('bridgeLegacyModule: moduleName must not be empty');
  session.bridgedLegacyModules.push(moduleName);
  session.state = 'interop-bridged';
  return emit(session, 'new-architecture.interop_bridged', {
    moduleName,
    bridgedCount: session.bridgedLegacyModules.length,
  });
}

export function markNewArchReady(
  session: NewArchitectureSession,
): AxisStep<NewArchitectureState> {
  if (session.state !== 'interop-bridged' && session.state !== 'concurrent-enabled') {
    throw new Error(`markNewArchReady: session is ${session.state}`);
  }
  session.state = 'ready';
  return emit(session, 'new-architecture.ready', {
    concurrentEnabled: session.concurrentEnabled,
    bridgedCount: session.bridgedLegacyModules.length,
  });
}
