import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Global-shortcut axis (v0.3) — register + trigger + unregister + all-clear の 4 step 遷移。
 * macOS Carbon RegisterEventHotKey + Windows User32.RegisterHotKey + Linux xdg-portal GlobalShortcuts を uniform 扱い。
 */
export type GlobalShortcutState =
  | 'idle'
  | 'registered'
  | 'triggered'
  | 'unregistered'
  | 'all-cleared';

export interface GlobalShortcutSession {
  target: DesktopTarget;
  namespace: string;
  state: GlobalShortcutState;
  registered: string[];
  triggerCounts: Record<string, number>;
  history: AxisStep<GlobalShortcutState>[];
}

function emit(
  session: GlobalShortcutSession,
  neutralEvent:
    | 'global-shortcut.registered'
    | 'global-shortcut.triggered'
    | 'global-shortcut.unregistered'
    | 'global-shortcut.all_cleared',
  metadata: Record<string, string | number | boolean>,
): AxisStep<GlobalShortcutState> {
  const step: AxisStep<GlobalShortcutState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { namespace: session.namespace, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function createGlobalShortcutSession(input: {
  target: DesktopTarget;
  namespace: string;
}): GlobalShortcutSession {
  if (input.namespace.length === 0) throw new Error('createGlobalShortcutSession: namespace must not be empty');
  return {
    target: input.target,
    namespace: input.namespace,
    state: 'idle',
    registered: [],
    triggerCounts: {},
    history: [],
  };
}

export function registerGlobalShortcut(
  session: GlobalShortcutSession,
  accelerator: string,
): AxisStep<GlobalShortcutState> {
  if (session.state === 'all-cleared') throw new Error('registerGlobalShortcut: session cleared');
  if (accelerator.length === 0) throw new Error('registerGlobalShortcut: accelerator must not be empty');
  if (session.registered.includes(accelerator)) {
    throw new Error(`registerGlobalShortcut: ${accelerator} already registered`);
  }
  session.registered.push(accelerator);
  session.triggerCounts[accelerator] = 0;
  session.state = 'registered';
  return emit(session, 'global-shortcut.registered', {
    accelerator,
    registeredCount: session.registered.length,
  });
}

export function triggerGlobalShortcut(
  session: GlobalShortcutSession,
  accelerator: string,
): AxisStep<GlobalShortcutState> {
  if (!session.registered.includes(accelerator)) {
    throw new Error(`triggerGlobalShortcut: ${accelerator} not registered`);
  }
  session.triggerCounts[accelerator] = (session.triggerCounts[accelerator] ?? 0) + 1;
  session.state = 'triggered';
  return emit(session, 'global-shortcut.triggered', {
    accelerator,
    triggerCount: session.triggerCounts[accelerator],
  });
}

export function unregisterGlobalShortcut(
  session: GlobalShortcutSession,
  accelerator: string,
): AxisStep<GlobalShortcutState> {
  if (!session.registered.includes(accelerator)) {
    throw new Error(`unregisterGlobalShortcut: ${accelerator} not registered`);
  }
  session.registered = session.registered.filter((a) => a !== accelerator);
  delete session.triggerCounts[accelerator];
  session.state = 'unregistered';
  return emit(session, 'global-shortcut.unregistered', {
    accelerator,
    remaining: session.registered.length,
  });
}

export function clearAllGlobalShortcuts(session: GlobalShortcutSession): AxisStep<GlobalShortcutState> {
  const removed = session.registered.length;
  session.registered = [];
  session.triggerCounts = {};
  session.state = 'all-cleared';
  return emit(session, 'global-shortcut.all_cleared', { removed });
}
