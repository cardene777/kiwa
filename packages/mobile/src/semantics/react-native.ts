import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * React Native axis — component mount + native module invocation + gesture
 * recognition + unmount の 4 step deterministic state machine。
 */
export type ReactNativeState = 'idle' | 'mounted' | 'native-invoked' | 'gesture-recognized' | 'unmounted';

export interface ReactNativeSession {
  target: MobileTarget;
  componentId: string;
  state: ReactNativeState;
  nativeModuleInvocations: number;
  gesturesRecognized: string[];
  history: AxisStep<ReactNativeState>[];
}

function emit(
  session: ReactNativeSession,
  neutralEvent:
    | 'rn.component_mounted'
    | 'rn.native_module_invoked'
    | 'rn.gesture_recognized'
    | 'rn.component_unmounted',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ReactNativeState> {
  const step: AxisStep<ReactNativeState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { componentId: session.componentId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function mountReactNativeComponent(input: {
  target: MobileTarget;
  componentId: string;
}): ReactNativeSession {
  if (input.componentId.length === 0) {
    throw new Error('mountReactNativeComponent: componentId must not be empty');
  }
  const session: ReactNativeSession = {
    target: input.target,
    componentId: input.componentId,
    state: 'mounted',
    nativeModuleInvocations: 0,
    gesturesRecognized: [],
    history: [],
  };
  emit(session, 'rn.component_mounted', { target: input.target });
  return session;
}

export function invokeNativeModule(
  session: ReactNativeSession,
  moduleName: string,
): AxisStep<ReactNativeState> {
  if (session.state === 'unmounted') {
    throw new Error('invokeNativeModule: component is unmounted');
  }
  session.state = 'native-invoked';
  session.nativeModuleInvocations += 1;
  return emit(session, 'rn.native_module_invoked', {
    moduleName,
    invocations: session.nativeModuleInvocations,
  });
}

export function recognizeGesture(
  session: ReactNativeSession,
  gesture: 'tap' | 'pan' | 'pinch' | 'rotation' | 'swipe',
): AxisStep<ReactNativeState> {
  if (session.state === 'unmounted') {
    throw new Error('recognizeGesture: component is unmounted');
  }
  session.state = 'gesture-recognized';
  session.gesturesRecognized.push(gesture);
  return emit(session, 'rn.gesture_recognized', {
    gesture,
    count: session.gesturesRecognized.length,
  });
}

export function unmountReactNativeComponent(
  session: ReactNativeSession,
): AxisStep<ReactNativeState> {
  if (session.state === 'unmounted') {
    throw new Error('unmountReactNativeComponent: already unmounted');
  }
  session.state = 'unmounted';
  return emit(session, 'rn.component_unmounted', {
    nativeModuleInvocations: session.nativeModuleInvocations,
    gestureCount: session.gesturesRecognized.length,
  });
}
