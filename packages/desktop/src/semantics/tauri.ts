import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Tauri axis — invoke_handler register + invoke command + emit event + window close。
 */
export type TauriState = 'idle' | 'command-registered' | 'command-invoked' | 'event-emitted' | 'window-closed';

export interface TauriSession {
  target: DesktopTarget;
  appName: string;
  state: TauriState;
  registeredCommands: string[];
  invocations: number;
  emittedEvents: number;
  history: AxisStep<TauriState>[];
}

function emit(
  session: TauriSession,
  neutralEvent:
    | 'tauri.command_registered'
    | 'tauri.command_invoked'
    | 'tauri.event_emitted'
    | 'tauri.window_closed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<TauriState> {
  const step: AxisStep<TauriState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { appName: session.appName, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startTauriApp(input: { target: DesktopTarget; appName: string }): TauriSession {
  if (input.appName.length === 0) throw new Error('startTauriApp: appName must not be empty');
  return {
    target: input.target,
    appName: input.appName,
    state: 'idle',
    registeredCommands: [],
    invocations: 0,
    emittedEvents: 0,
    history: [],
  };
}

export function registerTauriCommand(session: TauriSession, commandName: string): AxisStep<TauriState> {
  if (commandName.length === 0) throw new Error('registerTauriCommand: commandName must not be empty');
  session.registeredCommands.push(commandName);
  session.state = 'command-registered';
  return emit(session, 'tauri.command_registered', {
    commandName,
    total: session.registeredCommands.length,
  });
}

export function invokeTauriCommand(
  session: TauriSession,
  input: { commandName: string; payload: string },
): AxisStep<TauriState> {
  if (!session.registeredCommands.includes(input.commandName)) {
    throw new Error(`invokeTauriCommand: ${input.commandName} not registered`);
  }
  session.invocations += 1;
  session.state = 'command-invoked';
  return emit(session, 'tauri.command_invoked', {
    commandName: input.commandName,
    payloadSize: input.payload.length,
    count: session.invocations,
  });
}

export function emitTauriEvent(
  session: TauriSession,
  input: { eventName: string; payload: string },
): AxisStep<TauriState> {
  if (input.eventName.length === 0) throw new Error('emitTauriEvent: eventName must not be empty');
  session.emittedEvents += 1;
  session.state = 'event-emitted';
  return emit(session, 'tauri.event_emitted', {
    eventName: input.eventName,
    payloadSize: input.payload.length,
    count: session.emittedEvents,
  });
}

export function closeTauriWindow(session: TauriSession, windowLabel: string): AxisStep<TauriState> {
  if (windowLabel.length === 0) throw new Error('closeTauriWindow: windowLabel must not be empty');
  session.state = 'window-closed';
  return emit(session, 'tauri.window_closed', {
    windowLabel,
    invocations: session.invocations,
    events: session.emittedEvents,
  });
}
