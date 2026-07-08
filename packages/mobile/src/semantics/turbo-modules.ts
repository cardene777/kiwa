import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.52 turbo-modules axis — React Native 0.76+ TurboModules (typed native module + JSI + spec generation)。
 */
export type TurboModulesState = 'idle' | 'spec-registered' | 'jsi-bound' | 'method-invoked' | 'unregistered';

export interface TurboModulesSession {
  target: MobileTarget;
  moduleName: string;
  state: TurboModulesState;
  registeredMethods: string[];
  methodInvocations: number;
  jsiBound: boolean;
  history: AxisStep<TurboModulesState>[];
}

function emit(
  session: TurboModulesSession,
  neutralEvent:
    | 'turbo-modules.spec_registered'
    | 'turbo-modules.jsi_bound'
    | 'turbo-modules.method_invoked'
    | 'turbo-modules.unregistered',
  metadata: Record<string, string | number | boolean>,
): AxisStep<TurboModulesState> {
  const step: AxisStep<TurboModulesState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { moduleName: session.moduleName, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initTurboModules(input: {
  target: MobileTarget;
  moduleName: string;
}): TurboModulesSession {
  if (input.moduleName.length === 0) throw new Error('initTurboModules: moduleName must not be empty');
  return {
    target: input.target,
    moduleName: input.moduleName,
    state: 'idle',
    registeredMethods: [],
    methodInvocations: 0,
    jsiBound: false,
    history: [],
  };
}

export function registerTurboSpec(
  session: TurboModulesSession,
  methods: string[],
): AxisStep<TurboModulesState> {
  if (methods.length === 0) throw new Error('registerTurboSpec: methods must not be empty');
  session.registeredMethods = [...methods];
  session.state = 'spec-registered';
  return emit(session, 'turbo-modules.spec_registered', {
    methodCount: methods.length,
    methods: methods.join(','),
  });
}

export function bindJsiRuntime(session: TurboModulesSession): AxisStep<TurboModulesState> {
  if (session.state !== 'spec-registered') {
    throw new Error(`bindJsiRuntime: session is ${session.state}`);
  }
  session.jsiBound = true;
  session.state = 'jsi-bound';
  return emit(session, 'turbo-modules.jsi_bound', { registeredMethods: session.registeredMethods.length });
}

export function invokeTurboMethod(
  session: TurboModulesSession,
  methodName: string,
): AxisStep<TurboModulesState> {
  if (session.state !== 'jsi-bound' && session.state !== 'method-invoked') {
    throw new Error(`invokeTurboMethod: session is ${session.state}, jsi not bound`);
  }
  if (!session.registeredMethods.includes(methodName)) {
    throw new Error(`invokeTurboMethod: ${methodName} not in registered methods`);
  }
  session.methodInvocations += 1;
  session.state = 'method-invoked';
  return emit(session, 'turbo-modules.method_invoked', {
    methodName,
    invocations: session.methodInvocations,
  });
}

export function unregisterTurboModule(session: TurboModulesSession): AxisStep<TurboModulesState> {
  session.state = 'unregistered';
  session.jsiBound = false;
  return emit(session, 'turbo-modules.unregistered', {
    totalInvocations: session.methodInvocations,
  });
}
